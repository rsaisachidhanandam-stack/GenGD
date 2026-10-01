import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { getDatabase, closeDatabase } from '../src/db/database';
import { AuthService } from '../src/services/authService';
import { SyncEngine } from '../src/services/syncEngine';
import { v4 as uuidv4 } from 'uuid';

describe('SyncSafe Multi-Device Synchronization & Security Test Suite', () => {
  let app: any;
  let userA: { user: any; token: string };
  let userB: { user: any; token: string };
  let laptopDeviceId = 'laptop-test-01';
  let phoneDeviceId = 'phone-test-02';

  beforeEach(() => {
    // Reset database to a clean in-memory state or fresh file state
    const db = getDatabase(':memory:');
    app = createApp();

    userA = AuthService.register('usera@syncsafe.io', 'password123', 'User A');
    userB = AuthService.register('userb@syncsafe.io', 'password123', 'User B');

    AuthService.registerDevice(userA.user.id, laptopDeviceId, 'Laptop Chrome', 'web-laptop');
    AuthService.registerDevice(userA.user.id, phoneDeviceId, 'Phone Mobile', 'mobile-pwa');
  });

  afterAll(() => {
    closeDatabase();
  });

  // -------------------------------------------------------------
  // TC01: One device edits online -> Change accepted and a new version is created
  // -------------------------------------------------------------
  it('TC01: One device edits online -> Change accepted and new version created', async () => {
    const doc = SyncEngine.createDocument(userA.user.id, 'Specs.md', {
      title: 'Initial Title',
      status: 'draft',
      description: 'Initial Desc',
      content: 'Initial Content'
    }, laptopDeviceId);

    expect(doc.current_version).toBe(1);

    const changeId = uuidv4();
    const res = await request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId,
        deviceId: laptopDeviceId,
        baseVersion: 1,
        payload: { title: 'Updated Title V2' }
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
    expect(res.body.version).toBe(2);
    expect(res.body.document.title).toBe('Updated Title V2');
    expect(res.body.document.current_version).toBe(2);

    // Verify version history shows 2 versions
    const histRes = await request(app)
      .get(`/api/documents/${doc.id}/versions`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(histRes.body.versions).toHaveLength(2);
    expect(histRes.body.versions[1].version_number).toBe(2);
  });

  // -------------------------------------------------------------
  // TC02: Second device has an older cached version -> Receives or fetches newer authoritative version
  // -------------------------------------------------------------
  it('TC02: Second device fetches latest authoritative version', async () => {
    const doc = SyncEngine.createDocument(userA.user.id, 'Specs.md', {
      title: 'Version 1 Title',
      content: 'Content V1'
    }, laptopDeviceId);

    // Laptop updates to V2
    SyncEngine.submitChange(userA.user.id, doc.id, {
      changeId: uuidv4(),
      deviceId: laptopDeviceId,
      baseVersion: 1,
      payload: { content: 'Content V2 from Laptop' }
    });

    // Phone fetches document
    const res = await request(app)
      .get(`/api/documents/${doc.id}`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.document.current_version).toBe(2);
    expect(res.body.document.content).toBe('Content V2 from Laptop');
  });

  // -------------------------------------------------------------
  // TC04: Offline device reconnects; server has not changed -> Change accepted once
  // -------------------------------------------------------------
  it('TC04: Offline device reconnects when server unchanged -> Change accepted cleanly', async () => {
    const doc = SyncEngine.createDocument(userA.user.id, 'Doc.md', {
      title: 'V1 Title',
      content: 'V1 Content'
    }, laptopDeviceId);

    // Phone queued edit offline with baseVersion: 1
    const phoneChangeId = uuidv4();
    const res = await request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: phoneChangeId,
        deviceId: phoneDeviceId,
        baseVersion: 1,
        payload: { content: 'Phone Offline Work Reconnected' }
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('accepted');
    expect(res.body.version).toBe(2);
    expect(res.body.document.content).toBe('Phone Offline Work Reconnected');
  });

  // -------------------------------------------------------------
  // TC05 & TC06: Offline device reconnects after server changed -> Automatic merge for non-overlapping fields
  // -------------------------------------------------------------
  it('TC05 & TC06: Non-overlapping field edits merge automatically', async () => {
    const doc = SyncEngine.createDocument(userA.user.id, 'Doc.md', {
      title: 'Original Title',
      status: 'draft',
      description: 'Original Description',
      content: 'Original Content'
    }, laptopDeviceId);

    // 1. Laptop edits title while online -> Server creates V2
    const laptopRes = await request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: uuidv4(),
        deviceId: laptopDeviceId,
        baseVersion: 1,
        payload: { title: 'Laptop New Title' }
      });

    expect(laptopRes.body.version).toBe(2);

    // 2. Phone was offline based on V1, changed 'status' to 'in_review'
    // Phone reconnects and submits change with baseVersion: 1
    const phoneRes = await request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: uuidv4(),
        deviceId: phoneDeviceId,
        baseVersion: 1,
        payload: { status: 'in_review' }
      });

    expect(phoneRes.status).toBe(200);
    expect(phoneRes.body.status).toBe('accepted');
    expect(phoneRes.body.merged).toBe(true);
    expect(phoneRes.body.version).toBe(3);

    // Verify document contains BOTH Laptop's title and Phone's status!
    expect(phoneRes.body.document.title).toBe('Laptop New Title');
    expect(phoneRes.body.document.status).toBe('in_review');
    expect(phoneRes.body.document.content).toBe('Original Content');
  });

  // -------------------------------------------------------------
  // TC07: Same field changed differently -> Preserved; conflict record created
  // -------------------------------------------------------------
  it('TC07: Overlapping changes to the same field trigger conflict and preserve both edits', async () => {
    const doc = SyncEngine.createDocument(userA.user.id, 'Doc.md', {
      title: 'V1 Title',
      content: 'Original Base Content'
    }, laptopDeviceId);

    // 1. Laptop updates content to V2
    await request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: uuidv4(),
        deviceId: laptopDeviceId,
        baseVersion: 1,
        payload: { content: 'Laptop Content V2' }
      });

    // 2. Phone submits different content based on V1
    const conflictRes = await request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: uuidv4(),
        deviceId: phoneDeviceId,
        baseVersion: 1,
        payload: { content: 'Phone Conflicting Content' }
      });

    expect(conflictRes.status).toBe(200);
    expect(conflictRes.body.status).toBe('conflict');
    expect(conflictRes.body.conflict).toBeDefined();
    expect(conflictRes.body.conflict.conflicting_fields).toContain('content');
    expect(conflictRes.body.conflict.server_state.content).toBe('Laptop Content V2');
    expect(conflictRes.body.conflict.incoming_state.content).toBe('Phone Conflicting Content');
    expect(conflictRes.body.conflict.base_state.content).toBe('Original Base Content');

    // Server document MUST NOT have been silently overwritten!
    const checkDoc = await request(app)
      .get(`/api/documents/${doc.id}`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(checkDoc.body.document.content).toBe('Laptop Content V2');
    expect(checkDoc.body.document.current_version).toBe(2);
  });

  // -------------------------------------------------------------
  // TC08 & TC09: Idempotency -> Submitting same changeId twice does not duplicate version
  // -------------------------------------------------------------
  it('TC08 & TC09: Idempotent retries return prior outcome without duplicate versions', async () => {
    const doc = SyncEngine.createDocument(userA.user.id, 'Doc.md', { title: 'V1' }, laptopDeviceId);
    const stableChangeId = uuidv4();

    // First attempt
    const res1 = await request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: stableChangeId,
        deviceId: laptopDeviceId,
        baseVersion: 1,
        payload: { title: 'V2 Title' }
      });

    expect(res1.body.status).toBe('accepted');
    expect(res1.body.version).toBe(2);

    // Duplicate retry with same changeId (simulating network timeout retry)
    const res2 = await request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: stableChangeId,
        deviceId: laptopDeviceId,
        baseVersion: 1,
        payload: { title: 'V2 Title' }
      });

    expect(res2.status).toBe(200);
    expect(res2.body.status).toBe('already_processed');
    expect(res2.body.version).toBe(2);

    // Verify database only has 2 versions total, NOT 3
    const versionsRes = await request(app)
      .get(`/api/documents/${doc.id}/versions`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(versionsRes.body.versions).toHaveLength(2);
  });

  // -------------------------------------------------------------
  // TC11: Very old base version considers intervening changes
  // -------------------------------------------------------------
  it('TC11: Very old base version is compared against all intervening versions', async () => {
    const doc = SyncEngine.createDocument(userA.user.id, 'Doc.md', {
      title: 'Title V1',
      status: 'draft',
      description: 'Desc V1',
      content: 'Content V1'
    }, laptopDeviceId);

    // Create intermediate versions V2, V3, V4 on laptop
    SyncEngine.submitChange(userA.user.id, doc.id, {
      changeId: uuidv4(),
      deviceId: laptopDeviceId,
      baseVersion: 1,
      payload: { title: 'Title V2' }
    });
    SyncEngine.submitChange(userA.user.id, doc.id, {
      changeId: uuidv4(),
      deviceId: laptopDeviceId,
      baseVersion: 2,
      payload: { description: 'Desc V3' }
    });
    SyncEngine.submitChange(userA.user.id, doc.id, {
      changeId: uuidv4(),
      deviceId: laptopDeviceId,
      baseVersion: 3,
      payload: { content: 'Content V4' }
    });

    // Offline device comes back with baseVersion: 1 and edits 'title'
    const res = await request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: uuidv4(),
        deviceId: phoneDeviceId,
        baseVersion: 1,
        payload: { title: 'Phone Stale Title' }
      });

    // Since title was modified in V2, it detects conflict with current V4
    expect(res.body.status).toBe('conflict');
    expect(res.body.conflict.conflicting_fields).toContain('title');
  });

  // -------------------------------------------------------------
  // TC12: Resolution completes -> All devices converge to the same resolved version
  // -------------------------------------------------------------
  it('TC12: Explicit conflict resolution creates new version and converges', async () => {
    const doc = SyncEngine.createDocument(userA.user.id, 'Doc.md', {
      title: 'Initial',
      content: 'Base Content'
    }, laptopDeviceId);

    // Laptop creates V2
    SyncEngine.submitChange(userA.user.id, doc.id, {
      changeId: uuidv4(),
      deviceId: laptopDeviceId,
      baseVersion: 1,
      payload: { content: 'Laptop Content V2' }
    });

    // Phone creates conflict
    const conflictRes = SyncEngine.submitChange(userA.user.id, doc.id, {
      changeId: uuidv4(),
      deviceId: phoneDeviceId,
      baseVersion: 1,
      payload: { content: 'Phone Content V2' }
    });

    const conflictId = conflictRes.conflict!.id;

    // Explicit resolution (e.g. Merged Choice)
    const resolveRes = await request(app)
      .post(`/api/documents/${doc.id}/resolve`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        conflictId,
        deviceId: laptopDeviceId,
        resolvedFields: {
          title: 'Initial',
          status: 'draft',
          description: '',
          content: 'Manually Merged: Laptop V2 + Phone V2 unified'
        }
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.status).toBe('resolved');
    expect(resolveRes.body.version).toBe(3);
    expect(resolveRes.body.document.content).toBe('Manually Merged: Laptop V2 + Phone V2 unified');

    // Open conflicts should now be 0
    const conflictsList = await request(app)
      .get(`/api/documents/${doc.id}/conflicts`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(conflictsList.body.conflicts).toHaveLength(0);
  });

  // -------------------------------------------------------------
  // SEC01: User A requests User B's document -> Request is rejected; no content/metadata leakage
  // -------------------------------------------------------------
  it('SEC01: Cross-user document access is strictly blocked with 404/403 and zero data leakage', async () => {
    const docA = SyncEngine.createDocument(userA.user.id, 'UserA_Secret.md', {
      title: 'Confidential A',
      content: 'Secret A content'
    }, laptopDeviceId);

    // User B attempts to read User A's document
    const readRes = await request(app)
      .get(`/api/documents/${docA.id}`)
      .set('Authorization', `Bearer ${userB.token}`);

    expect(readRes.status).toBe(404);
    expect(readRes.body.document).toBeUndefined();

    // User B attempts to modify User A's document
    const writeRes = await request(app)
      .post(`/api/documents/${docA.id}/changes`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({
        changeId: uuidv4(),
        deviceId: 'user-b-device',
        baseVersion: 1,
        payload: { title: 'Hacked Title' }
      });

    expect(writeRes.status).toBe(404);

    // User B attempts to view version history
    const histRes = await request(app)
      .get(`/api/documents/${docA.id}/versions`)
      .set('Authorization', `Bearer ${userB.token}`);

    expect(histRes.status).toBe(404);
  });

  // -------------------------------------------------------------
  // SEC02: Client tampers with userId/documentId -> Server uses authenticated identity and verifies ownership
  // -------------------------------------------------------------
  it('SEC02: Server strictly verifies authenticated JWT identity, ignoring body userId injection', async () => {
    // Attempting to send user_id in body does not bypass document ownership
    const docA = SyncEngine.createDocument(userA.user.id, 'UserA_Doc.md', {
      title: 'Doc A'
    }, laptopDeviceId);

    const res = await request(app)
      .post(`/api/documents/${docA.id}/changes`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({
        changeId: uuidv4(),
        deviceId: laptopDeviceId,
        baseVersion: 1,
        userId: userA.user.id, // spoof attempt in body
        payload: { title: 'Spoofed Title' }
      });

    expect(res.status).toBe(404);
  });

  // -------------------------------------------------------------
  // SEC03: Concurrency protection -> Serialized transactional updates against same base version
  // -------------------------------------------------------------
  it('SEC03: Two simultaneous writes race against the same base version; only valid serial outcomes occur', async () => {
    const doc = SyncEngine.createDocument(userA.user.id, 'RaceDoc.md', {
      title: 'Original Title',
      status: 'draft',
      description: 'Original Desc',
      content: 'Original Content'
    }, laptopDeviceId);

    // Submit two requests in parallel starting with baseVersion: 1
    // Request 1: Laptop modifies description
    // Request 2: Phone modifies status
    const p1 = request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: uuidv4(),
        deviceId: laptopDeviceId,
        baseVersion: 1,
        payload: { description: 'Laptop Description' }
      });

    const p2 = request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: uuidv4(),
        deviceId: phoneDeviceId,
        baseVersion: 1,
        payload: { status: 'approved' }
      });

    const [r1, r2] = await Promise.all([p1, p2]);

    // Both requests must succeed (one via direct V2 increment, the second via auto-merge to V3)
    expect([r1.status, r2.status]).toEqual([200, 200]);

    const finalDoc = await request(app)
      .get(`/api/documents/${doc.id}`)
      .set('Authorization', `Bearer ${userA.token}`);

    expect(finalDoc.body.document.current_version).toBe(3);
    expect(finalDoc.body.document.description).toBe('Laptop Description');
    expect(finalDoc.body.document.status).toBe('approved');
  });

  // -------------------------------------------------------------
  // SEC04: Malformed/oversized payload -> Server rejects safely; client data recoverable
  // -------------------------------------------------------------
  it('SEC04: Server rejects malformed or oversized payloads safely', async () => {
    const doc = SyncEngine.createDocument(userA.user.id, 'Doc.md', { title: 'Doc' }, laptopDeviceId);

    // 1. Invalid status enum
    const malformedRes = await request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: uuidv4(),
        deviceId: laptopDeviceId,
        baseVersion: 1,
        payload: { status: 'invalid_status_value' as any }
      });

    expect(malformedRes.status).toBe(400);
    expect(malformedRes.body.error).toBe('Validation failed');

    // 2. Negative base version
    const invalidVerRes = await request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: uuidv4(),
        deviceId: laptopDeviceId,
        baseVersion: -5,
        payload: { title: 'Test' }
      });

    expect(invalidVerRes.status).toBe(400);

    // 3. Huge payload exceeding size limit (500kb+)
    const hugeContent = 'A'.repeat(600 * 1024);
    const hugeRes = await request(app)
      .post(`/api/documents/${doc.id}/changes`)
      .set('Authorization', `Bearer ${userA.token}`)
      .send({
        changeId: uuidv4(),
        deviceId: laptopDeviceId,
        baseVersion: 1,
        payload: { content: hugeContent }
      });

    expect([413, 400]).toContain(hugeRes.status);
  });
});
