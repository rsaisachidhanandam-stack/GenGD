import React, { useState } from 'react';
import { AlertTriangle, GitMerge, CheckCircle2 } from 'lucide-react';

interface ConflictRecord {
  id: string;
  document_id: string;
  incoming_change_id: string;
  base_version: number;
  server_version: number;
  conflicting_fields: string[];
  server_state: {
    title: string;
    status: 'draft' | 'in_review' | 'approved' | 'archived';
    description: string;
    content: string;
  };
  incoming_state: {
    title: string;
    status: 'draft' | 'in_review' | 'approved' | 'archived';
    description: string;
    content: string;
  };
  base_state: {
    title: string;
    status: 'draft' | 'in_review' | 'approved' | 'archived';
    description: string;
    content: string;
  };
}

interface ConflictResolverModalProps {
  conflict: ConflictRecord;
  onClose: () => void;
  onResolve: (resolvedFields: any) => Promise<void>;
  resolving: boolean;
}

export const ConflictResolverModal: React.FC<ConflictResolverModalProps> = ({
  conflict,
  onClose,
  onResolve,
  resolving
}) => {
  // Mode: 'server' | 'incoming' | 'custom'
  const [resolutionMode, setResolutionMode] = useState<'server' | 'incoming' | 'custom'>('custom');

  // Working state for custom merge
  const [customTitle, setCustomTitle] = useState(conflict.incoming_state.title);
  const [customStatus, setCustomStatus] = useState(conflict.incoming_state.status);
  const [customDesc, setCustomDesc] = useState(conflict.incoming_state.description);
  const [customContent, setCustomContent] = useState(
    `# ${conflict.incoming_state.title}\n\n[Merged Content]:\n\n--- SERVER EDIT (V${conflict.server_version}) ---\n${conflict.server_state.content}\n\n--- INCOMING EDIT ---\n${conflict.incoming_state.content}`
  );

  const handleApplyResolution = async () => {
    let resolvedFields;
    if (resolutionMode === 'server') {
      resolvedFields = conflict.server_state;
    } else if (resolutionMode === 'incoming') {
      resolvedFields = conflict.incoming_state;
    } else {
      resolvedFields = {
        title: customTitle,
        status: customStatus,
        description: customDesc,
        content: customContent
      };
    }
    await onResolve(resolvedFields);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in" style={{ maxWidth: '980px', maxHeight: '92vh' }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          background: 'rgba(244, 63, 94, 0.1)',
          borderBottom: '1px solid rgba(244, 63, 94, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb7185'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                Conflict Detected: Stale Base Version Modified Concurrently
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#fda4af' }}>
                Incoming edit was based on Version {conflict.base_version}, but Server has already advanced to Version {conflict.server_version}.
              </p>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Conflicting Fields Alert */}
        <div style={{
          padding: '10px 24px',
          background: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Conflicting Field(s):
          </span>
          {conflict.conflicting_fields.map((f) => (
            <span key={f} style={{
              background: 'rgba(244, 63, 94, 0.2)',
              color: '#fda4af',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(244, 63, 94, 0.4)'
            }}>
              {f.toUpperCase()}
            </span>
          ))}
        </div>

        {/* 3-Way Diff Comparison Columns */}
        <div style={{
          padding: '16px 24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            {/* Column 1: Base Version (V1) */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  ORIGINAL BASE (V{conflict.base_version})
                </span>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Title:</div>
                <div style={{ fontWeight: 600 }}>{conflict.base_state.title}</div>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Status:</div>
                <div><span className="badge badge-offline">{conflict.base_state.status}</span></div>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Content:</div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}>
                  {conflict.base_state.content}
                </div>
              </div>
            </div>

            {/* Column 2: Server Version (V2) */}
            <div style={{
              background: resolutionMode === 'server' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(15, 23, 42, 0.6)',
              border: resolutionMode === 'server' ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa' }}>
                  SERVER CURRENT (V{conflict.server_version})
                </span>
                <button
                  className={`btn btn-sm ${resolutionMode === 'server' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  onClick={() => setResolutionMode('server')}
                >
                  {resolutionMode === 'server' ? '✓ Selected' : 'Choose Server'}
                </button>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Title:</div>
                <div style={{ fontWeight: 600, color: conflict.conflicting_fields.includes('title') ? '#93c5fd' : 'inherit' }}>
                  {conflict.server_state.title}
                </div>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Status:</div>
                <div><span className="badge badge-synced">{conflict.server_state.status}</span></div>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Content:</div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  border: conflict.conflicting_fields.includes('content') ? '1px solid rgba(59, 130, 246, 0.4)' : 'none'
                }}>
                  {conflict.server_state.content}
                </div>
              </div>
            </div>

            {/* Column 3: Incoming Device Edit */}
            <div style={{
              background: resolutionMode === 'incoming' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(15, 23, 42, 0.6)',
              border: resolutionMode === 'incoming' ? '1px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc' }}>
                  MY OFFLINE CHANGE
                </span>
                <button
                  className={`btn btn-sm ${resolutionMode === 'incoming' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                  onClick={() => setResolutionMode('incoming')}
                >
                  {resolutionMode === 'incoming' ? '✓ Selected' : 'Choose Mine'}
                </button>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Title:</div>
                <div style={{ fontWeight: 600, color: conflict.conflicting_fields.includes('title') ? '#d8b4fe' : 'inherit' }}>
                  {conflict.incoming_state.title}
                </div>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Status:</div>
                <div><span className="badge badge-pending">{conflict.incoming_state.status}</span></div>
              </div>
              <div style={{ fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Content:</div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  border: conflict.conflicting_fields.includes('content') ? '1px solid rgba(139, 92, 246, 0.4)' : 'none'
                }}>
                  {conflict.incoming_state.content}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Resolution Editor */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitMerge size={16} color="var(--accent-emerald)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                  Resolution Preview & Custom Merge (Becomes Version {conflict.server_version + 1})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`btn btn-sm ${resolutionMode === 'server' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setResolutionMode('server')}
                >
                  Use Server
                </button>
                <button
                  className={`btn btn-sm ${resolutionMode === 'incoming' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setResolutionMode('incoming')}
                >
                  Use Mine
                </button>
                <button
                  className={`btn btn-sm ${resolutionMode === 'custom' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setResolutionMode('custom')}
                >
                  Custom Merge
                </button>
              </div>
            </div>

            {resolutionMode === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolved Title:</label>
                    <input
                      className="form-input"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolved Status:</label>
                    <select
                      className="form-select"
                      value={customStatus}
                      onChange={(e: any) => setCustomStatus(e.target.value)}
                    >
                      <option value="draft">draft</option>
                      <option value="in_review">in_review</option>
                      <option value="approved">approved</option>
                      <option value="archived">archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolved Description:</label>
                  <input
                    className="form-input"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resolved Content:</label>
                  <textarea
                    className="form-textarea code-mode"
                    rows={5}
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
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
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Resolution creates an immutable Version {conflict.server_version + 1} and converges both devices.
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" onClick={onClose} disabled={resolving}>
              Cancel
            </button>
            <button
              className="btn btn-success"
              onClick={handleApplyResolution}
              disabled={resolving}
            >
              <CheckCircle2 size={16} />
              {resolving ? 'Applying Resolution...' : `Commit Resolution (Create V${conflict.server_version + 1})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
