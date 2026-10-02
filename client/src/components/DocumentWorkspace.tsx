import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  History,
  Cpu,
  Laptop,
  Smartphone,
  Eye,
  Edit3
} from 'lucide-react';
import { ClientSyncCoordinator, type SyncStatusState } from '../services/clientSyncCoordinator';
import { type CachedDocument } from '../services/indexedDbStorage';

interface DocumentWorkspaceProps {
  document: CachedDocument;
  laptopCoordinator: ClientSyncCoordinator;
  mobileCoordinator: ClientSyncCoordinator;
  onBackToDrive: () => void;
  onOpenHistory: () => void;
  onOpenSyncLab: () => void;
  onDocumentUpdated: (doc: CachedDocument) => void;
  hasConflict: boolean;
  onOpenConflict: () => void;
  versionCount: number;
}

export const DocumentWorkspace: React.FC<DocumentWorkspaceProps> = ({
  document: initialDoc,
  laptopCoordinator,
  mobileCoordinator,
  onBackToDrive,
  onOpenHistory,
  onOpenSyncLab,
  onDocumentUpdated,
  hasConflict,
  onOpenConflict,
  versionCount
}) => {
  const [doc, setDoc] = useState<CachedDocument>(initialDoc);
  const [title, setTitle] = useState(initialDoc.title || initialDoc.name || '');
  const [status, setStatus] = useState<any>(initialDoc.status || 'draft');
  const [description, setDescription] = useState(initialDoc.description || '');
  const [content, setContent] = useState(initialDoc.content || '');

  // Select which device identity to save through
  const [activeDeviceId, setActiveDeviceId] = useState<'device-laptop-001' | 'device-mobile-002'>('device-laptop-001');
  const activeCoordinator = activeDeviceId === 'device-laptop-001' ? laptopCoordinator : mobileCoordinator;

  const [syncState, setSyncState] = useState<SyncStatusState>({
    status: hasConflict ? 'conflict' : initialDoc.isLocallyModified ? 'pending' : 'synced',
    message: hasConflict ? 'Conflict detected' : 'Synced with server',
    pendingCount: 0,
    lastSyncedVersion: initialDoc.current_version
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Sync state subscription
  useEffect(() => {
    const unsubscribe = activeCoordinator.subscribeStatus(async (state) => {
      setSyncState(state);
      const cached = await activeCoordinator.storage.getDocument(doc.id);
      if (cached) {
        setDoc(cached);
        onDocumentUpdated(cached);
      }
    });

    return unsubscribe;
  }, [activeCoordinator, doc.id, onDocumentUpdated]);

  // Keep state updated when initial document updates
  useEffect(() => {
    setDoc(initialDoc);
    setTitle(initialDoc.title || initialDoc.name || '');
    setStatus(initialDoc.status || 'draft');
    setDescription(initialDoc.description || '');
    setContent(initialDoc.content || '');
  }, [initialDoc]);

  const hasUnsavedChanges =
    title !== (doc.title || doc.name) ||
    status !== doc.status ||
    description !== doc.description ||
    content !== doc.content;

  // Save and queue for sync (reusing existing coordinator logic!)
  const handleSaveAndSync = async () => {
    setIsSaving(true);
    try {
      const changedFields: Partial<CachedDocument> = {};
      if (title !== doc.title) changedFields.title = title;
      if (status !== doc.status) changedFields.status = status;
      if (description !== doc.description) changedFields.description = description;
      if (content !== doc.content) changedFields.content = content;

      if (Object.keys(changedFields).length === 0) {
        setIsSaving(false);
        return;
      }

      const outcome = await activeCoordinator.saveAndQueueEdit(doc, changedFields);
      setDoc(outcome.locallySavedDoc);
      onDocumentUpdated(outcome.locallySavedDoc);
    } finally {
      setIsSaving(false);
    }
  };

  // Save locally in IndexedDB only (offline change)
  const handleSaveLocally = async () => {
    setIsSaving(true);
    try {
      const changedFields: Partial<CachedDocument> = {};
      if (title !== doc.title) changedFields.title = title;
      if (status !== doc.status) changedFields.status = status;
      if (description !== doc.description) changedFields.description = description;
      if (content !== doc.content) changedFields.content = content;

      // Temporarily mark offline to preserve locally in durable queue without instant network trigger
      const wasOnline = activeCoordinator.isOnline;
      activeCoordinator.setOnlineStatus(false);
      const outcome = await activeCoordinator.saveAndQueueEdit(doc, changedFields);
      if (wasOnline) {
        // Restore online state flag without triggering instant sync so change remains queued locally
        activeCoordinator.isOnline = true;
      }
      setDoc(outcome.locallySavedDoc);
      onDocumentUpdated(outcome.locallySavedDoc);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-app)',
      overflowY: 'auto'
    }}>
      {/* Top Workspace Header */}
      <div style={{
        padding: '14px 28px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Back Button: ← My Drive */}
          <button
            className="btn btn-outline btn-sm"
            onClick={onBackToDrive}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={15} />
            <span>My Drive</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {doc.name || 'Document.md'}
            </span>

            {/* Sync Status Badge: Synced · V1 */}
            {hasConflict ? (
              <button
                className="badge badge-conflict"
                onClick={onOpenConflict}
                style={{ cursor: 'pointer', border: 'none' }}
                title="Click to resolve conflict"
              >
                <AlertTriangle size={12} />
                <span>Conflict Detected (Review)</span>
              </button>
            ) : syncState.status === 'synced' ? (
              <span className="badge badge-synced">
                <CheckCircle2 size={12} />
                <span>Synced · V{doc.current_version || 1}</span>
              </span>
            ) : syncState.status === 'pending' ? (
              <span className="badge badge-pending">
                <Clock size={12} />
                <span>Saved locally · Pending sync</span>
              </span>
            ) : syncState.status === 'syncing' ? (
              <span className="badge badge-syncing">
                <RefreshCw size={12} className="animate-spin" />
                <span>Syncing...</span>
              </span>
            ) : (
              <span className="badge badge-offline">
                <span>Offline queue</span>
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Current Device Context Switcher (MacBook / Pixel 8 context) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#ffffff',
            padding: '2px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)',
            fontSize: '0.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <button
              onClick={() => setActiveDeviceId('device-laptop-001')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeDeviceId === 'device-laptop-001' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                color: activeDeviceId === 'device-laptop-001' ? '#2563eb' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600
              }}
              title="Save edits as MacBook Pro"
            >
              <Laptop size={13} />
              <span>MacBook</span>
            </button>
            <button
              onClick={() => setActiveDeviceId('device-mobile-002')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeDeviceId === 'device-mobile-002' ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                color: activeDeviceId === 'device-mobile-002' ? '#7c3aed' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600
              }}
              title="Save edits as Pixel 8 Pro"
            >
              <Smartphone size={13} />
              <span>Pixel 8</span>
            </button>
          </div>

          {/* History Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenHistory}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <History size={14} color="#2563eb" />
            <span>History (V{doc.current_version || 1} · {versionCount} revs)</span>
          </button>

          {/* Sync Lab Button */}
          <button
            className="btn btn-outline btn-sm"
            onClick={onOpenSyncLab}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7c3aed', borderColor: 'rgba(124, 58, 237, 0.3)' }}
          >
            <Cpu size={14} />
            <span>Sync Lab</span>
          </button>

          {/* Save Locally (Offline) */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSaveLocally}
            disabled={isSaving || !hasUnsavedChanges}
            title="Saves into IndexedDB without uploading to server immediately"
          >
            <Clock size={14} />
            <span>Save Locally</span>
          </button>

          {/* Save & Sync (Primary CTA) */}
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSaveAndSync}
            disabled={isSaving || !hasUnsavedChanges}
            style={{ minWidth: '115px' }}
          >
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isSaving ? 'Syncing...' : 'Save & Sync'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div style={{
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Title, Status & Description Form Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '16px',
          background: '#ffffff',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Document Title
            </label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. SyncSafe Architectural Blueprint"
              style={{ fontSize: '0.98rem', fontWeight: 600 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Workflow Status
            </label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              style={{ fontSize: '0.88rem', fontWeight: 500 }}
            >
              <option value="draft">draft</option>
              <option value="in_review">in_review</option>
              <option value="approved">approved</option>
              <option value="archived">archived</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of document purpose..."
              style={{ minHeight: '60px' }}
            />
          </div>
        </div>

        {/* Content Markdown Editor Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          {/* Content Header */}
          <div style={{
            padding: '12px 20px',
            background: 'rgba(248, 250, 252, 0.95)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Markdown Content
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                (Supports 3-way concurrent merge and conflict preservation)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                {isPreviewMode ? <Edit3 size={13} /> : <Eye size={13} />}
                <span>{isPreviewMode ? 'Raw Editor' : 'Preview'}</span>
              </button>
            </div>
          </div>

          {/* Content View / Edit */}
          {isPreviewMode ? (
            <div style={{
              padding: '24px',
              minHeight: '340px',
              color: 'var(--text-primary)',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.92rem'
            }}>
              {content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No content provided.</span>}
            </div>
          ) : (
            <textarea
              className="form-textarea code-mode"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Write Markdown here..."
              style={{
                width: '100%',
                minHeight: '340px',
                border: 'none',
                background: '#ffffff',
                color: 'var(--text-primary)',
                padding: '20px',
                fontSize: '0.875rem',
                lineHeight: 1.65,
                outline: 'none',
                fontFamily: 'var(--font-mono)'
              }}
            />
          )}
        </div>

        {/* Bottom Bar: Status Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          padding: '4px 8px'
        }}>
          <div>
            Synchronizing via <strong style={{ color: 'var(--text-secondary)' }}>{activeCoordinator.deviceName}</strong> ({activeCoordinator.deviceId})
          </div>
          <div>
            Base Version: <strong style={{ color: 'var(--text-secondary)' }}>V{doc.current_version || 1}</strong> · Durable SQLite Storage
          </div>
        </div>
      </div>
    </div>
  );
};
