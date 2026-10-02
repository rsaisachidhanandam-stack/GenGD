import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { SyncEngine } from '../services/syncEngine';

const router = Router();

const StructuredFieldsSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['draft', 'in_review', 'approved', 'archived']).optional(),
  description: z.string().max(2000).optional(),
  content: z.string().max(100000).optional()
});

const CreateDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  deviceId: z.string().min(1),
  fields: StructuredFieldsSchema.optional()
});

const SubmitChangeSchema = z.object({
  changeId: z.string().min(1),
  deviceId: z.string().min(1),
  baseVersion: z.number().int().nonnegative(),
  payload: StructuredFieldsSchema
});

const ResolveConflictSchema = z.object({
  conflictId: z.string().min(1),
  deviceId: z.string().min(1),
  resolvedFields: z.object({
    title: z.string().min(1).max(200),
    status: z.enum(['draft', 'in_review', 'approved', 'archived']),
    description: z.string().max(2000),
    content: z.string().max(100000)
  })
});

// GET /api/documents - List documents for current user (supports trash=true, starred=true)
router.get('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.query.trash === 'true') {
    const documents = SyncEngine.listTrashDocuments(req.user!.id);
    res.json({ documents });
    return;
  }
  if (req.query.starred === 'true') {
    const documents = SyncEngine.listStarredDocuments(req.user!.id);
    res.json({ documents });
    return;
  }
  const documents = SyncEngine.listDocuments(req.user!.id);
  res.json({ documents });
});

// DELETE /api/documents/:id - Soft-delete document (moves to Trash preserving version history)
router.delete('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const docId = String(req.params.id);
  try {
    const result = SyncEngine.deleteDocument(req.user!.id, docId);
    res.json(result);
  } catch (err: any) {
    res.status(404).json({ error: 'Document not found or access denied' });
  }
});

// POST /api/documents/:id/restore - Restore soft-deleted document from Trash
router.post('/:id/restore', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const docId = String(req.params.id);
  try {
    const document = SyncEngine.restoreDocument(req.user!.id, docId);
    res.json({ document });
  } catch (err: any) {
    res.status(404).json({ error: 'Document not found or access denied' });
  }
});

// POST /api/documents/:id/star - Toggle starred status
router.post('/:id/star', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const docId = String(req.params.id);
  try {
    const document = SyncEngine.toggleStar(req.user!.id, docId);
    res.json({ document });
  } catch (err: any) {
    res.status(404).json({ error: 'Document not found or access denied' });
  }
});

// POST /api/documents - Create new document
router.post('/', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const parseResult = CreateDocumentSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
    return;
  }

  const { name, deviceId, fields = {} } = parseResult.data;
  const doc = SyncEngine.createDocument(req.user!.id, name, fields, deviceId);
  res.status(201).json({ document: doc });
});

// GET /api/documents/:id - Fetch authorized document
router.get('/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const docId = String(req.params.id);
  const includeDeleted = req.query.include_deleted === 'true' || req.query.trash === 'true';
  const doc = SyncEngine.getDocumentById(docId, req.user!.id, includeDeleted);
  if (!doc) {
    // Return 404 with no metadata leakage (SEC01)
    res.status(404).json({ error: 'Document not found or access denied' });
    return;
  }
  res.json({ document: doc });
});

// POST /api/documents/:id/changes - Submit change with changeId, baseVersion, and payload
router.post('/:id/changes', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const docId = String(req.params.id);
  const parseResult = SubmitChangeSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
    return;
  }

  const doc = SyncEngine.getDocumentById(docId, req.user!.id);
  if (!doc) {
    res.status(404).json({ error: 'Document not found or access denied' });
    return;
  }

  try {
    const outcome = SyncEngine.submitChange(req.user!.id, docId, parseResult.data);
    res.json(outcome);
  } catch (err: any) {
    if (err.message === 'INVALID_FUTURE_BASE_VERSION') {
      res.status(400).json({ error: 'Invalid future base version specified' });
    } else if (err.message === 'BASE_VERSION_NOT_FOUND') {
      res.status(400).json({ error: 'Base version snapshot not found on server' });
    } else {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
});

// GET /api/documents/:id/versions - List version history
router.get('/:id/versions', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const docId = String(req.params.id);
  try {
    const versions = SyncEngine.getVersionHistory(docId, req.user!.id);
    res.json({ versions });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// GET /api/documents/:id/versions/:versionNumber - Get specific historical version snapshot
router.get('/:id/versions/:versionNumber', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const docId = String(req.params.id);
  const versionNum = parseInt(String(req.params.versionNumber), 10);
  if (isNaN(versionNum)) {
    res.status(400).json({ error: 'Invalid version number' });
    return;
  }

  try {
    const version = SyncEngine.getVersionSnapshot(docId, versionNum, req.user!.id);
    if (!version) {
      res.status(404).json({ error: 'Version not found' });
      return;
    }
    res.json({ version });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// GET /api/documents/:id/conflicts - List open conflicts
router.get('/:id/conflicts', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const docId = String(req.params.id);
  try {
    const conflicts = SyncEngine.getConflicts(docId, req.user!.id);
    res.json({ conflicts });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/documents/:id/resolve - Resolve conflict explicitly
router.post('/:id/resolve', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const docId = String(req.params.id);
  const parseResult = ResolveConflictSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
    return;
  }

  const { conflictId, resolvedFields, deviceId } = parseResult.data;

  try {
    const result = SyncEngine.resolveConflict(req.user!.id, docId, conflictId, resolvedFields, deviceId);
    res.json({
      status: 'resolved',
      version: result.version,
      document: result.document
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/sync/batch - Process a batch of pending client changes with per-change outcomes
const BatchSyncSchema = z.object({
  changes: z.array(z.object({
    documentId: z.string().min(1),
    changeId: z.string().min(1),
    deviceId: z.string().min(1),
    baseVersion: z.number().int().nonnegative(),
    payload: StructuredFieldsSchema
  }))
});

router.post('/sync/batch', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const parseResult = BatchSyncSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Validation failed', details: parseResult.error.issues });
    return;
  }

  const results = [];
  for (const item of parseResult.data.changes) {
    try {
      const outcome = SyncEngine.submitChange(req.user!.id, item.documentId, {
        changeId: item.changeId,
        deviceId: item.deviceId,
        baseVersion: item.baseVersion,
        payload: item.payload
      });
      results.push({ changeId: item.changeId, success: true, outcome });
    } catch (err: any) {
      results.push({ changeId: item.changeId, success: false, error: err.message });
    }
  }

  res.json({ results });
});

export default router;
