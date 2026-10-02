import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/database';
import {
  DocumentRecord,
  DocumentVersion,
  DocumentStructuredFields,
  ConflictRecord,
  SubmitChangeRequest,
  SubmitChangeResponse
} from '../types';

export class SyncEngine {
  /**
   * Create a new document with initial version 1
   */
  static createDocument(
    userId: string,
    name: string,
    fields: Partial<DocumentStructuredFields>,
    deviceId: string
  ): DocumentRecord {
    const db = getDatabase();
    const docId = uuidv4();
    const changeId = uuidv4();
    const now = new Date().toISOString();

    const title = fields.title || name;
    const status = fields.status || 'draft';
    const description = fields.description || '';
    const content = fields.content || '';

    const createTx = db.transaction(() => {
      // 1. Insert document
      db.prepare(`
        INSERT INTO documents (id, owner_id, name, current_version, title, status, description, content, created_at, updated_at)
        VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
      `).run(docId, userId, name, title, status, description, content, now, now);

      // 2. Insert initial Version 1
      db.prepare(`
        INSERT INTO versions (id, document_id, version_number, parent_version, title, status, description, content, device_id, change_id, created_by, merge_type, created_at)
        VALUES (?, ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, 'direct', ?)
      `).run(uuidv4(), docId, title, status, description, content, deviceId, changeId, userId, now);

      // 3. Insert change record
      db.prepare(`
        INSERT INTO changes (change_id, document_id, device_id, base_version, payload_json, status, result_version, processed_at)
        VALUES (?, ?, ?, 0, ?, 'accepted', 1, ?)
      `).run(changeId, docId, deviceId, JSON.stringify({ title, status, description, content }), now);
    });

    createTx();

    return this.getDocumentById(docId, userId)!;
  }

  /**
   * Fetch document by ID verifying ownership
   */
  static getDocumentById(documentId: string, userId: string, includeDeleted = false): DocumentRecord | null {
    const db = getDatabase();
    const query = includeDeleted
      ? `SELECT * FROM documents WHERE id = ? AND owner_id = ?`
      : `SELECT * FROM documents WHERE id = ? AND owner_id = ? AND deleted_at IS NULL`;

    const doc = db.prepare(query).get(documentId, userId) as DocumentRecord | undefined;
    return doc || null;
  }

  /**
   * List all active documents for user (excluding trash)
   */
  static listDocuments(userId: string): DocumentRecord[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM documents WHERE owner_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC
    `).all(userId) as DocumentRecord[];
  }

  /**
   * List all soft-deleted documents in Trash for user
   */
  static listTrashDocuments(userId: string): DocumentRecord[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM documents WHERE owner_id = ? AND deleted_at IS NOT NULL ORDER BY updated_at DESC
    `).all(userId) as DocumentRecord[];
  }

  /**
   * List all starred documents for user
   */
  static listStarredDocuments(userId: string): DocumentRecord[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM documents WHERE owner_id = ? AND deleted_at IS NULL AND is_starred = 1 ORDER BY updated_at DESC
    `).all(userId) as DocumentRecord[];
  }

  /**
   * Soft-delete document (move to Trash) without destroying version history
   */
  static deleteDocument(userId: string, documentId: string): { success: boolean; id: string } {
    const db = getDatabase();
    const doc = this.getDocumentById(documentId, userId);
    if (!doc) throw new Error('DOCUMENT_NOT_FOUND');

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE documents SET deleted_at = ?, updated_at = ? WHERE id = ? AND owner_id = ?
    `).run(now, now, documentId, userId);

    return { success: true, id: documentId };
  }

  /**
   * Restore document from Trash
   */
  static restoreDocument(userId: string, documentId: string): DocumentRecord {
    const db = getDatabase();
    const doc = this.getDocumentById(documentId, userId, true);
    if (!doc) throw new Error('DOCUMENT_NOT_FOUND');

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE documents SET deleted_at = NULL, updated_at = ? WHERE id = ? AND owner_id = ?
    `).run(now, documentId, userId);

    return this.getDocumentById(documentId, userId)!;
  }

  /**
   * Toggle document starred status
   */
  static toggleStar(userId: string, documentId: string): DocumentRecord {
    const db = getDatabase();
    const doc = this.getDocumentById(documentId, userId);
    if (!doc) throw new Error('DOCUMENT_NOT_FOUND');

    const newStarred = doc.is_starred ? 0 : 1;
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE documents SET is_starred = ?, updated_at = ? WHERE id = ? AND owner_id = ?
    `).run(newStarred, now, documentId, userId);

    return this.getDocumentById(documentId, userId)!;
  }

  /**
   * Get version history for document
   */
  static getVersionHistory(documentId: string, userId: string): DocumentVersion[] {
    const db = getDatabase();
    // Verify ownership
    const doc = this.getDocumentById(documentId, userId);
    if (!doc) throw new Error('Document not found or access denied');

    return db.prepare(`
      SELECT * FROM versions WHERE document_id = ? ORDER BY version_number ASC
    `).all(documentId) as DocumentVersion[];
  }

  /**
   * Get specific version snapshot
   */
  static getVersionSnapshot(documentId: string, versionNumber: number, userId: string): DocumentVersion | null {
    const db = getDatabase();
    const doc = this.getDocumentById(documentId, userId);
    if (!doc) throw new Error('Document not found or access denied');

    const version = db.prepare(`
      SELECT * FROM versions WHERE document_id = ? AND version_number = ?
    `).get(documentId, versionNumber) as DocumentVersion | undefined;

    return version || null;
  }

  /**
   * Get open conflicts for document
   */
  static getConflicts(documentId: string, userId: string): ConflictRecord[] {
    const db = getDatabase();
    const doc = this.getDocumentById(documentId, userId);
    if (!doc) throw new Error('Document not found or access denied');

    const rows = db.prepare(`
      SELECT * FROM conflicts WHERE document_id = ? AND status = 'open' ORDER BY created_at DESC
    `).all(documentId) as any[];

    return rows.map(r => ({
      id: r.id,
      document_id: r.document_id,
      incoming_change_id: r.incoming_change_id,
      base_version: r.base_version,
      server_version: r.server_version,
      conflicting_fields: JSON.parse(r.conflicting_fields_json),
      server_state: JSON.parse(r.server_state_json),
      incoming_state: JSON.parse(r.incoming_state_json),
      base_state: JSON.parse(r.base_state_json),
      status: r.status,
      resolution_version: r.resolution_version,
      created_at: r.created_at
    }));
  }

  /**
   * Core Sync Logic: Submit Change
   * Handles idempotency, version checking, automatic 3-way merge, and conflict detection
   */
  static submitChange(
    userId: string,
    documentId: string,
    req: SubmitChangeRequest
  ): SubmitChangeResponse {
    const db = getDatabase();
    const { changeId, deviceId, baseVersion, payload } = req;

    // Concurrency protection: wrap everything in an exclusive transaction
    const processChangeTx = db.transaction(() => {
      // 1. Verify Document Ownership
      const doc = db.prepare(`
        SELECT * FROM documents WHERE id = ? AND owner_id = ?
      `).get(documentId, userId) as DocumentRecord | undefined;

      if (!doc) {
        throw new Error('DOCUMENT_NOT_FOUND');
      }

      // 2. Check Idempotency: Has this changeId already been processed?
      const existingChange = db.prepare(`
        SELECT * FROM changes WHERE change_id = ?
      `).get(changeId) as any | undefined;

      if (existingChange) {
        if (existingChange.status === 'accepted') {
          return {
            status: 'already_processed' as const,
            documentId,
            version: existingChange.result_version,
            document: doc,
            message: 'Change already applied previously'
          };
        } else if (existingChange.status === 'conflict') {
          const conflict = db.prepare(`
            SELECT * FROM conflicts WHERE incoming_change_id = ?
          `).get(changeId) as any;

          return {
            status: 'conflict' as const,
            documentId,
            conflict: conflict ? {
              id: conflict.id,
              document_id: conflict.document_id,
              incoming_change_id: conflict.incoming_change_id,
              base_version: conflict.base_version,
              server_version: conflict.server_version,
              conflicting_fields: JSON.parse(conflict.conflicting_fields_json),
              server_state: JSON.parse(conflict.server_state_json),
              incoming_state: JSON.parse(conflict.incoming_state_json),
              base_state: JSON.parse(conflict.base_state_json),
              status: conflict.status,
              created_at: conflict.created_at
            } : undefined,
            document: doc,
            message: 'Change previously flagged as conflict'
          };
        }
      }

      const now = new Date().toISOString();
      const currentVersion = doc.current_version;

      if (baseVersion > currentVersion) {
        throw new Error('INVALID_FUTURE_BASE_VERSION');
      }

      // CASE 1: Fast-Path: baseVersion equals current_version
      if (baseVersion === currentVersion) {
        const newVersionNumber = currentVersion + 1;
        const newTitle = payload.title !== undefined ? payload.title : doc.title;
        const newStatus = payload.status !== undefined ? payload.status : doc.status;
        const newDescription = payload.description !== undefined ? payload.description : doc.description;
        const newContent = payload.content !== undefined ? payload.content : doc.content;

        // Record Change
        db.prepare(`
          INSERT INTO changes (change_id, document_id, device_id, base_version, payload_json, status, result_version, processed_at)
          VALUES (?, ?, ?, ?, ?, 'accepted', ?, ?)
        `).run(changeId, documentId, deviceId, baseVersion, JSON.stringify(payload), newVersionNumber, now);

        // Update Document
        db.prepare(`
          UPDATE documents
          SET current_version = ?, title = ?, status = ?, description = ?, content = ?, updated_at = ?
          WHERE id = ?
        `).run(newVersionNumber, newTitle, newStatus, newDescription, newContent, now, documentId);

        // Record Version Snapshot
        db.prepare(`
          INSERT INTO versions (id, document_id, version_number, parent_version, title, status, description, content, device_id, change_id, created_by, merge_type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'direct', ?)
        `).run(uuidv4(), documentId, newVersionNumber, baseVersion, newTitle, newStatus, newDescription, newContent, deviceId, changeId, userId, now);

        const updatedDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId) as DocumentRecord;

        return {
          status: 'accepted' as const,
          documentId,
          version: newVersionNumber,
          merged: false,
          document: updatedDoc
        };
      }

      // CASE 2: Stale Base (baseVersion < currentVersion)
      // Retrieve base version snapshot
      const baseVersionRow = db.prepare(`
        SELECT * FROM versions WHERE document_id = ? AND version_number = ?
      `).get(documentId, baseVersion) as DocumentVersion | undefined;

      if (!baseVersionRow) {
        throw new Error('BASE_VERSION_NOT_FOUND');
      }

      const structuredKeys: (keyof DocumentStructuredFields)[] = ['title', 'status', 'description', 'content'];

      const baseState: DocumentStructuredFields = {
        title: baseVersionRow.title,
        status: baseVersionRow.status,
        description: baseVersionRow.description,
        content: baseVersionRow.content
      };

      const serverState: DocumentStructuredFields = {
        title: doc.title,
        status: doc.status,
        description: doc.description,
        content: doc.content
      };

      // Construct incoming state by applying payload onto baseState
      const incomingState: DocumentStructuredFields = {
        title: payload.title !== undefined ? payload.title : baseState.title,
        status: payload.status !== undefined ? payload.status : baseState.status,
        description: payload.description !== undefined ? payload.description : baseState.description,
        content: payload.content !== undefined ? payload.content : baseState.content
      };

      // Calculate Client Delta (fields the client changed compared to baseState)
      const clientChangedFields = structuredKeys.filter(
        key => payload[key] !== undefined && payload[key] !== baseState[key]
      );

      // Calculate Server Delta (fields the server changed compared to baseState)
      const serverChangedFields = structuredKeys.filter(
        key => serverState[key] !== baseState[key]
      );

      // Conflicting fields: fields changed by both client and server, where their values differ
      const conflictingFields = clientChangedFields.filter(
        key => serverChangedFields.includes(key) && incomingState[key] !== serverState[key]
      );

      // 3-Way Merge Check:
      if (conflictingFields.length === 0) {
        // Automatic Clean Merge!
        // Combine: Server state + Client changed fields
        const mergedFields: DocumentStructuredFields = { ...serverState };
        for (const field of clientChangedFields) {
          (mergedFields as any)[field] = (incomingState as any)[field];
        }

        const newVersionNumber = currentVersion + 1;

        // Record Change as accepted
        db.prepare(`
          INSERT INTO changes (change_id, document_id, device_id, base_version, payload_json, status, result_version, processed_at)
          VALUES (?, ?, ?, ?, ?, 'accepted', ?, ?)
        `).run(changeId, documentId, deviceId, baseVersion, JSON.stringify(payload), newVersionNumber, now);

        // Update Document
        db.prepare(`
          UPDATE documents
          SET current_version = ?, title = ?, status = ?, description = ?, content = ?, updated_at = ?
          WHERE id = ?
        `).run(newVersionNumber, mergedFields.title, mergedFields.status, mergedFields.description, mergedFields.content, now, documentId);

        // Record Immutable Version Snapshot with merge_type: auto_merged
        db.prepare(`
          INSERT INTO versions (id, document_id, version_number, parent_version, title, status, description, content, device_id, change_id, created_by, merge_type, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'auto_merged', ?)
        `).run(uuidv4(), documentId, newVersionNumber, currentVersion, mergedFields.title, mergedFields.status, mergedFields.description, mergedFields.content, deviceId, changeId, userId, now);

        const updatedDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId) as DocumentRecord;

        return {
          status: 'accepted' as const,
          documentId,
          version: newVersionNumber,
          merged: true,
          document: updatedDoc
        };
      } else {
        // Overlapping Conflicting Fields: Preserve incoming change and create Conflict Record
        const conflictId = uuidv4();

        // Record Change as conflict
        db.prepare(`
          INSERT INTO changes (change_id, document_id, device_id, base_version, payload_json, status, processed_at)
          VALUES (?, ?, ?, ?, ?, 'conflict', ?)
        `).run(changeId, documentId, deviceId, baseVersion, JSON.stringify(payload), now);

        // Record Conflict
        db.prepare(`
          INSERT INTO conflicts (id, document_id, incoming_change_id, base_version, server_version, conflicting_fields_json, server_state_json, incoming_state_json, base_state_json, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)
        `).run(
          conflictId,
          documentId,
          changeId,
          baseVersion,
          currentVersion,
          JSON.stringify(conflictingFields),
          JSON.stringify(serverState),
          JSON.stringify(incomingState),
          JSON.stringify(baseState),
          now
        );

        const conflictRecord: ConflictRecord = {
          id: conflictId,
          document_id: documentId,
          incoming_change_id: changeId,
          base_version: baseVersion,
          server_version: currentVersion,
          conflicting_fields: conflictingFields,
          server_state: serverState,
          incoming_state: incomingState,
          base_state: baseState,
          status: 'open',
          created_at: now
        };

        return {
          status: 'conflict' as const,
          documentId,
          conflict: conflictRecord,
          document: doc,
          message: `Conflict detected on field(s): ${conflictingFields.join(', ')}`
        };
      }
    });

    return processChangeTx();
  }

  /**
   * Resolve an open conflict explicitly
   * Creates a new version reflecting user resolution
   */
  static resolveConflict(
    userId: string,
    documentId: string,
    conflictId: string,
    resolvedFields: DocumentStructuredFields,
    deviceId: string
  ): { document: DocumentRecord; version: number } {
    const db = getDatabase();

    const resolveTx = db.transaction(() => {
      // 1. Verify Document Ownership
      const doc = db.prepare(`
        SELECT * FROM documents WHERE id = ? AND owner_id = ?
      `).get(documentId, userId) as DocumentRecord | undefined;

      if (!doc) throw new Error('DOCUMENT_NOT_FOUND');

      // 2. Fetch Conflict
      const conflict = db.prepare(`
        SELECT * FROM conflicts WHERE id = ? AND document_id = ? AND status = 'open'
      `).get(conflictId, documentId) as any | undefined;

      if (!conflict) throw new Error('CONFLICT_NOT_FOUND_OR_RESOLVED');

      const now = new Date().toISOString();
      const newVersion = doc.current_version + 1;
      const resolutionChangeId = `resolution-${uuidv4()}`;

      // 3. Update Conflict to resolved
      db.prepare(`
        UPDATE conflicts SET status = 'resolved', resolution_version = ? WHERE id = ?
      `).run(newVersion, conflictId);

      // 4. Update Document
      db.prepare(`
        UPDATE documents
        SET current_version = ?, title = ?, status = ?, description = ?, content = ?, updated_at = ?
        WHERE id = ?
      `).run(newVersion, resolvedFields.title, resolvedFields.status, resolvedFields.description, resolvedFields.content, now, documentId);

      // 5. Insert new Version with merge_type: manual_resolution
      db.prepare(`
        INSERT INTO versions (id, document_id, version_number, parent_version, title, status, description, content, device_id, change_id, created_by, merge_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual_resolution', ?)
      `).run(
        uuidv4(),
        documentId,
        newVersion,
        doc.current_version,
        resolvedFields.title,
        resolvedFields.status,
        resolvedFields.description,
        resolvedFields.content,
        deviceId,
        resolutionChangeId,
        userId,
        now
      );

      // 6. Record change log for resolution
      db.prepare(`
        INSERT INTO changes (change_id, document_id, device_id, base_version, payload_json, status, result_version, processed_at)
        VALUES (?, ?, ?, ?, ?, 'accepted', ?, ?)
      `).run(resolutionChangeId, documentId, deviceId, doc.current_version, JSON.stringify(resolvedFields), newVersion, now);

      const updatedDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(documentId) as DocumentRecord;
      return { document: updatedDoc, version: newVersion };
    });

    return resolveTx();
  }

  /**
   * Reset database with clean test/demo seed data
   */
  static resetDemoData(): { user: any; token: string; document: DocumentRecord; device1: any; device2: any } {
    const db = getDatabase();
    // Reset demo document state and history while preserving user account
    db.exec(`
      DELETE FROM conflicts;
      DELETE FROM changes;
      DELETE FROM versions;
      DELETE FROM documents;
    `);

    // Ensure demo user exists (preserving existing ID and account)
    const { AuthService } = require('./authService');
    const { user, token } = AuthService.ensureUser('demo@syncsafe.io', 'demo1234', 'Alex Rivera');

    // Register two demo devices
    const device1 = AuthService.registerDevice(user.id, 'device-laptop-001', 'MacBook Pro 16"', 'web-laptop');
    const device2 = AuthService.registerDevice(user.id, 'device-mobile-002', 'Pixel 8 Pro', 'mobile-pwa');

    // Create base initial document
    const doc = this.createDocument(
      user.id,
      'Product Specification PS-13.md',
      {
        title: 'SyncSafe Architectural Blueprint',
        status: 'draft',
        description: 'Multi-device synchronization prototype with reliable offline sync and conflict safety.',
        content: '# SyncSafe System Architecture\n\nSyncSafe ensures zero silent data loss across devices.\n\n## Core Principles\n1. Server-authoritative state.\n2. Durable client queue.\n3. Automatic non-overlapping field merge.\n4. Transparent conflict resolution.'
      },
      device1.id
    );

    return { user, token, document: doc, device1, device2 };
  }
}
