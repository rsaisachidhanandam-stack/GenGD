import React from 'react';
import { Layers, RefreshCw, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { type PendingQueueItem } from '../services/indexedDbStorage';

interface PendingQueueModalProps {
  queue: PendingQueueItem[];
  deviceName: string;
  onClose: () => void;
  onSyncNow: () => void;
  onClearQueue: () => void;
}

export const PendingQueueModal: React.FC<PendingQueueModalProps> = ({
  queue,
  deviceName,
  onClose,
  onSyncNow,
  onClearQueue
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in" style={{ maxWidth: '820px', maxHeight: '80vh' }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24'
            }}>
              <Layers size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Durable Local Queue ({deviceName})
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                IndexedDB-backed queue. Changes survive tab close and restart until server acknowledges durable acceptance.
              </p>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Queue Items */}
        <div style={{ padding: '18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {queue.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              background: 'rgba(0,0,0,0.15)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-subtle)'
            }}>
              <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Queue is Empty</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                All local edits on this device have been durably acknowledged by the server.
              </p>
            </div>
          ) : (
            queue.map((item, idx) => (
              <div
                key={item.changeId}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)'
                    }}>
                      #{idx + 1}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {item.changeId.slice(0, 13)}...
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Base: <strong style={{ color: '#93c5fd' }}>V{item.baseVersion}</strong>
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${
                      item.status === 'pending' ? 'badge-pending' :
                      item.status === 'in_flight' ? 'badge-syncing' :
                      item.status === 'conflict' ? 'badge-conflict' : 'badge-synced'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                    {item.retryCount > 0 && (
                      <span style={{ fontSize: '0.7rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Retries: {item.retryCount}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}>
                  {JSON.stringify(item.payload, null, 2)}
                </div>

                {item.lastError && (
                  <div style={{ fontSize: '0.75rem', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} />
                    <span>{item.lastError}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            className="btn btn-danger btn-sm"
            onClick={onClearQueue}
            disabled={queue.length === 0}
          >
            <Trash2 size={14} /> Discard Local Queue
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline btn-sm" onClick={onClose}>
              Close
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={onSyncNow}
              disabled={queue.length === 0}
            >
              <RefreshCw size={14} /> Drain & Sync Queue Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
