import React, { useState } from 'react';
import { AlertTriangle, GitMerge, CheckCircle2, ShieldCheck, X } from 'lucide-react';

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
      <div className="modal-content fade-in" style={{ maxWidth: '1000px', maxHeight: '92vh' }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(245, 158, 11, 0.06) 100%)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
              border: '1px solid rgba(239, 68, 68, 0.25)'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  Concurrent Conflict Detected · Both Changes Preserved Safely
                </h2>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#059669',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <ShieldCheck size={12} />
                  Zero Data Loss
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                We did NOT overwrite either change. Incoming edit was based on Version {conflict.base_version}, but Server had already reached Version {conflict.server_version}.
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Conflicting Fields Strip */}
        <div style={{
          padding: '10px 24px',
          background: 'rgba(248, 250, 252, 0.95)',
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
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(239, 68, 68, 0.25)'
            }}>
              {f.toUpperCase()}
            </span>
          ))}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Non-conflicting fields have already been merged automatically.
          </span>
        </div>

        {/* 3-Way Diff Comparison Columns */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            {/* Column 1: BASE (V1) */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                  BASE (V{conflict.base_version})
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Common Ancestor</span>
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>Title:</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{conflict.base_state.title}</div>
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>Status:</div>
                <div style={{ marginTop: '2px' }}><span className="badge badge-offline">{conflict.base_state.status}</span></div>
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, marginBottom: '4px' }}>Content:</div>
                <div style={{
                  background: 'rgba(241, 245, 249, 0.85)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.76rem',
                  color: 'var(--text-primary)',
                  maxHeight: '130px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {conflict.base_state.content}
                </div>
              </div>
            </div>

            {/* Column 2: SERVER (V2) */}
            <div style={{
              background: resolutionMode === 'server' ? 'rgba(37, 99, 235, 0.04)' : '#ffffff',
              border: resolutionMode === 'server' ? '2px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: resolutionMode === 'server' ? '0 4px 14px rgba(37, 99, 235, 0.15)' : 'var(--shadow-sm)',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.04em' }}>
                  SERVER (V{conflict.server_version})
                </span>
                <button
                  className={`btn btn-sm ${resolutionMode === 'server' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.72rem', padding: '3px 9px' }}
                  onClick={() => setResolutionMode('server')}
                >
                  {resolutionMode === 'server' ? '✓ Selected' : 'Keep Server'}
                </button>
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>Title:</div>
                <div style={{ fontWeight: 600, color: conflict.conflicting_fields.includes('title') ? '#2563eb' : 'var(--text-primary)' }}>
                  {conflict.server_state.title}
                </div>
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>Status:</div>
                <div style={{ marginTop: '2px' }}><span className="badge badge-synced">{conflict.server_state.status}</span></div>
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, marginBottom: '4px' }}>Content:</div>
                <div style={{
                  background: 'rgba(241, 245, 249, 0.85)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.76rem',
                  color: 'var(--text-primary)',
                  maxHeight: '130px',
                  overflowY: 'auto',
                  border: conflict.conflicting_fields.includes('content') ? '1px solid rgba(37, 99, 235, 0.4)' : '1px solid var(--border-subtle)'
                }}>
                  {conflict.server_state.content}
                </div>
              </div>
            </div>

            {/* Column 3: INCOMING */}
            <div style={{
              background: resolutionMode === 'incoming' ? 'rgba(124, 58, 237, 0.04)' : '#ffffff',
              border: resolutionMode === 'incoming' ? '2px solid var(--accent-purple)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: resolutionMode === 'incoming' ? '0 4px 14px rgba(124, 58, 237, 0.15)' : 'var(--shadow-sm)',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7c3aed', letterSpacing: '0.04em' }}>
                  INCOMING (MY EDIT)
                </span>
                <button
                  className={`btn btn-sm ${resolutionMode === 'incoming' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.72rem', padding: '3px 9px', background: resolutionMode === 'incoming' ? '#7c3aed' : undefined }}
                  onClick={() => setResolutionMode('incoming')}
                >
                  {resolutionMode === 'incoming' ? '✓ Selected' : 'Keep Mine'}
                </button>
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>Title:</div>
                <div style={{ fontWeight: 600, color: conflict.conflicting_fields.includes('title') ? '#7c3aed' : 'var(--text-primary)' }}>
                  {conflict.incoming_state.title}
                </div>
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600 }}>Status:</div>
                <div style={{ marginTop: '2px' }}><span className="badge badge-pending">{conflict.incoming_state.status}</span></div>
              </div>
              <div style={{ fontSize: '0.82rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, marginBottom: '4px' }}>Content:</div>
                <div style={{
                  background: 'rgba(241, 245, 249, 0.85)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.76rem',
                  color: 'var(--text-primary)',
                  maxHeight: '130px',
                  overflowY: 'auto',
                  border: conflict.conflicting_fields.includes('content') ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid var(--border-subtle)'
                }}>
                  {conflict.incoming_state.content}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Resolution Editor */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitMerge size={17} color="#059669" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Resolution Preview & Merge Mode (Will create Version {conflict.server_version + 1})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className={`btn btn-sm ${resolutionMode === 'server' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setResolutionMode('server')}
                >
                  Keep Server
                </button>
                <button
                  className={`btn btn-sm ${resolutionMode === 'incoming' ? 'btn-primary' : 'btn-outline'}`}
                  style={resolutionMode === 'incoming' ? { background: '#7c3aed' } : undefined}
                  onClick={() => setResolutionMode('incoming')}
                >
                  Keep Mine
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Resolved Title:
                    </label>
                    <input
                      className="form-input"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Resolved Status:
                    </label>
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
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Resolved Description:
                  </label>
                  <input
                    className="form-input"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Resolved Content (Combined Markdown):
                  </label>
                  <textarea
                    className="form-textarea code-mode"
                    rows={6}
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    style={{ background: '#ffffff', color: 'var(--text-primary)', border: '1px solid var(--border-medium)' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          background: 'rgba(248, 250, 252, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Resolution commits an immutable Version {conflict.server_version + 1} and converges both paired devices safely.
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" onClick={onClose} disabled={resolving}>
              Cancel
            </button>
            <button
              className="btn btn-success"
              onClick={handleApplyResolution}
              disabled={resolving}
              style={{ fontWeight: 700 }}
            >
              <CheckCircle2 size={16} />
              <span>{resolving ? 'Applying Resolution...' : `Commit Resolution (Create V${conflict.server_version + 1})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
