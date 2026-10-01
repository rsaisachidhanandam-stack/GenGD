import { useState, useEffect } from 'react';
import {
  Laptop,
  Smartphone,
  Wifi,
  WifiOff,
  Layers,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Send,
  Sliders,
  RefreshCw,
  FileEdit
} from 'lucide-react';
import { ClientSyncCoordinator, type SyncStatusState } from '../services/clientSyncCoordinator';
import { type CachedDocument, type PendingQueueItem } from '../services/indexedDbStorage';

interface DeviceSimulatorProps {
  coordinator: ClientSyncCoordinator;
  deviceType: 'laptop' | 'mobile';
  initialDocument: CachedDocument | null;
  onOpenHistory: (deviceId: string) => void;
  onOpenQueue: (deviceId: string) => void;
  onOpenConflict: (deviceId: string) => void;
  hasOpenConflict: boolean;
  versionCount: number;
}

export const DeviceSimulator: React.FC<DeviceSimulatorProps> = ({
  coordinator,
  deviceType,
  initialDocument,
  onOpenHistory,
  onOpenQueue,
  onOpenConflict,
  hasOpenConflict,
  versionCount
}) => {
  const [doc, setDoc] = useState<CachedDocument | null>(initialDocument);
  const [title, setTitle] = useState(initialDocument?.title || '');
  const [status, setStatus] = useState<any>(initialDocument?.status || 'draft');
  const [description, setDescription] = useState(initialDocument?.description || '');
  const [content, setContent] = useState(initialDocument?.content || '');

  const [isOnline, setIsOnline] = useState(coordinator.isOnline);
  const [syncState, setSyncState] = useState<SyncStatusState>({
    status: 'synced',
    message: 'Synced with server',
    pendingCount: 0,
    lastSyncedVersion: initialDocument?.current_version || 1
  });

  const [pendingQueue, setPendingQueue] = useState<PendingQueueItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showNetworkSettings, setShowNetworkSettings] = useState(false);
  const [simLatency, setSimLatency] = useState(coordinator.simulateLatencyMs);
  const [simFailure, setSimFailure] = useState(coordinator.simulateFailureRate > 0);

  // Sync state subscription
  useEffect(() => {
    const unsubscribe = coordinator.subscribeStatus(async (state) => {
      setSyncState(state);
      const queue = await coordinator.storage.getPendingQueue();
      setPendingQueue(queue);

      // Refresh cached document
      if (doc?.id) {
        const cached = await coordinator.storage.getDocument(doc.id);
        if (cached) {
          setDoc(cached);
          setTitle(cached.title);
          setStatus(cached.status);
          setDescription(cached.description);
          setContent(cached.content);
        }
      }
    });

    // Initial queue load
    coordinator.storage.getPendingQueue().then(setPendingQueue);

    return unsubscribe;
  }, [coordinator, doc?.id]);

  // Update fields when initial document changes externally
  useEffect(() => {
    if (initialDocument) {
      setDoc(initialDocument);
      setTitle(initialDocument.title);
      setStatus(initialDocument.status);
      setDescription(initialDocument.description);
      setContent(initialDocument.content);
    }
  }, [initialDocument]);

  const handleToggleOnline = (online: boolean) => {
    setIsOnline(online);
    coordinator.setOnlineStatus(online);
  };

  const handleSaveAndQueue = async () => {
    if (!doc) return;
    setIsSaving(true);
    try {
      const changedFields: any = {};
      if (title !== doc.title) changedFields.title = title;
      if (status !== doc.status) changedFields.status = status;
      if (description !== doc.description) changedFields.description = description;
      if (content !== doc.content) changedFields.content = content;

      if (Object.keys(changedFields).length === 0) {
        // Nothing changed
        setIsSaving(false);
        return;
      }

      await coordinator.saveAndQueueEdit(doc, changedFields);
      const queue = await coordinator.storage.getPendingQueue();
      setPendingQueue(queue);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateRestart = async () => {
    // TC10: Close and reload from IndexedDB
    if (!doc) return;
    const cached = await coordinator.storage.getDocument(doc.id);
    const queue = await coordinator.storage.getPendingQueue();
    if (cached) {
      setDoc(cached);
      setTitle(cached.title);
      setStatus(cached.status);
      setDescription(cached.description);
      setContent(cached.content);
    }
    setPendingQueue(queue);
    // If online, resume processing
    if (coordinator.isOnline) {
      coordinator.processPendingQueue();
    }
  };

  const isLocallyModified =
    doc && (title !== doc.title || status !== doc.status || description !== doc.description || content !== doc.content);

  return (
    <div className={`device-card ${deviceType === 'laptop' ? 'laptop-mode' : 'phone-mode'}`}>
      {/* Device Top Bar */}
      <div className="device-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: deviceType === 'laptop' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: deviceType === 'laptop' ? '#60a5fa' : '#c084fc'
          }}>
            {deviceType === 'laptop' ? <Laptop size={16} /> : <Smartphone size={16} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {coordinator.deviceName}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ({coordinator.deviceId})
              </span>
            </div>
          </div>
        </div>

        {/* Network Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn btn-sm ${isOnline ? 'btn-success' : 'btn-danger'}`}
            style={{ fontSize: '0.72rem', padding: '3px 8px' }}
            onClick={() => handleToggleOnline(!isOnline)}
            title="Toggle device offline/online state to test offline persistence and reconnect"
          >
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          <button
            className="btn btn-outline btn-sm"
            style={{ padding: '4px 6px' }}
            onClick={() => setShowNetworkSettings(!showNetworkSettings)}
            title="Simulate network conditions (latency, upload drop/timeout)"
          >
            <Sliders size={13} />
          </button>
        </div>
      </div>

      {/* Network Simulator Drawer */}
      {showNetworkSettings && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '8px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Network Latency Simulation: <strong>{simLatency}ms</strong></span>
            <input
              type="range"
              min="0"
              max="2000"
              step="200"
              value={simLatency}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setSimLatency(val);
                coordinator.simulateLatencyMs = val;
              }}
              style={{ width: '120px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Simulate Network Timeout on Upload (TC08):</span>
            <input
              type="checkbox"
              checked={simFailure}
              onChange={(e) => {
                const checked = e.target.checked;
                setSimFailure(checked);
                coordinator.simulateFailureRate = checked ? 1.0 : 0;
              }}
            />
          </div>
        </div>
      )}

      {/* Sync State Banner (Blueprint §12 Truth-in-UI) */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(0, 0, 0, 0.25)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {syncState.status === 'synced' && (
            <span className="badge badge-synced">
              <CheckCircle2 size={12} /> Synced (V{doc?.current_version || 1})
            </span>
          )}
          {syncState.status === 'pending' && (
            <span className="badge badge-pending">
              <Clock size={12} /> Saved locally — pending sync ({pendingQueue.length})
            </span>
          )}
          {syncState.status === 'syncing' && (
            <span className="badge badge-syncing">
              <RefreshCw size={12} className="animate-spin" /> Syncing with server...
            </span>
          )}
          {syncState.status === 'conflict' && (
            <span className="badge badge-conflict">
              <AlertTriangle size={12} /> Conflict Detected
            </span>
          )}
          {syncState.status === 'offline' && (
            <span className="badge badge-offline">
              <WifiOff size={12} /> Offline ({pendingQueue.length} queued)
            </span>
          )}
          {syncState.status === 'retry' && (
            <span className="badge badge-pending">
              <RotateCcw size={12} /> Retry required ({pendingQueue.length})
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {hasOpenConflict && (
            <button
              className="btn btn-sm btn-danger"
              style={{ fontSize: '0.7rem', padding: '2px 8px' }}
              onClick={() => onOpenConflict(coordinator.deviceId)}
            >
              <AlertTriangle size={12} /> Review Conflict
            </button>
          )}

          <button
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.7rem', padding: '2px 8px' }}
            onClick={() => onOpenQueue(coordinator.deviceId)}
            title="Inspect durable IndexedDB queue"
          >
            <Layers size={12} /> Queue ({pendingQueue.length})
          </button>

          <button
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.7rem', padding: '2px 8px' }}
            onClick={() => onOpenHistory(coordinator.deviceId)}
            title="Inspect immutable version snapshots"
          >
            <History size={12} /> History ({versionCount})
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="device-body">
        {/* Title & Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              DOCUMENT TITLE
            </label>
            <input
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document Title"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              WORKFLOW STATUS
            </label>
            <select
              className="form-select"
              value={status}
              onChange={(e: any) => setStatus(e.target.value)}
            >
              <option value="draft">draft</option>
              <option value="in_review">in_review</option>
              <option value="approved">approved</option>
              <option value="archived">archived</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            DESCRIPTION (STRUCTURED FIELD)
          </label>
          <input
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief document description"
          />
        </div>

        {/* Content Markdown */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            CONTENT (MARKDOWN / TEXT)
          </label>
          <textarea
            className="form-textarea code-mode"
            style={{ flex: 1, minHeight: '160px' }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type content here..."
          />
        </div>
      </div>

      {/* Device Action Bar */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg-surface-elevated)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleSimulateRestart}
            title="Simulate closing and restarting app (tests TC10: offline queue restart persistence)"
          >
            <RotateCcw size={12} /> Restart App
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {isLocallyModified && (
            <span style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileEdit size={13} /> Unsaved edits
            </span>
          )}

          <button
            className="btn btn-primary btn-sm"
            onClick={handleSaveAndQueue}
            disabled={isSaving || !isLocallyModified}
          >
            <Send size={13} />
            {isOnline ? 'Save & Sync' : 'Save Locally (Queue)'}
          </button>
        </div>
      </div>
    </div>
  );
};
