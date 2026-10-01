import React, { useState } from 'react';
import { History, RotateCcw, Clock, Laptop, Smartphone } from 'lucide-react';

interface Version {
  id: string;
  document_id: string;
  version_number: number;
  parent_version: number;
  title: string;
  status: 'draft' | 'in_review' | 'approved' | 'archived';
  description: string;
  content: string;
  device_id: string;
  change_id: string;
  created_by: string;
  merge_type?: 'direct' | 'auto_merged' | 'manual_resolution';
  created_at: string;
}

interface VersionHistoryModalProps {
  versions: Version[];
  currentVersionNumber: number;
  onClose: () => void;
  onRestoreVersion?: (version: Version) => Promise<void>;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  versions,
  currentVersionNumber,
  onClose,
  onRestoreVersion
}) => {
  const [selectedVersion, setSelectedVersion] = useState<Version>(
    versions[versions.length - 1] || null
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content fade-in" style={{ maxWidth: '960px', height: '80vh' }}>
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
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa'
            }}>
              <History size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Immutable Version History</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Every change creates an immutable traceable snapshot with parent pointers.
              </p>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Content: Left timeline, Right snapshot preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Timeline List */}
          <div style={{
            borderRight: '1px solid var(--border-subtle)',
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {versions.slice().reverse().map((v) => {
              const isSelected = selectedVersion?.version_number === v.version_number;
              const isCurrent = v.version_number === currentVersionNumber;

              return (
                <div
                  key={v.version_number}
                  onClick={() => setSelectedVersion(v)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: isSelected ? '#93c5fd' : '#f8fafc'
                      }}>
                        Version {v.version_number}
                      </span>
                      {isCurrent && (
                        <span className="badge badge-synced" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                          Current
                        </span>
                      )}
                    </div>
                    {/* Merge Badge */}
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: v.merge_type === 'auto_merged' ? 'rgba(16, 185, 129, 0.2)' :
                                  v.merge_type === 'manual_resolution' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: v.merge_type === 'auto_merged' ? '#34d399' :
                             v.merge_type === 'manual_resolution' ? '#c084fc' : 'var(--text-secondary)'
                    }}>
                      {v.merge_type || 'direct'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <Clock size={12} />
                    {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {v.device_id.includes('mobile') || v.device_id.includes('phone') ? <Smartphone size={12} /> : <Laptop size={12} />}
                    {v.device_id}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Snapshot Viewer */}
          <div style={{ padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {selectedVersion ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                      Version {selectedVersion.version_number} Snapshot
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Parent: Version {selectedVersion.parent_version} • Change ID: {selectedVersion.change_id.slice(0, 8)}...
                    </p>
                  </div>
                  {onRestoreVersion && selectedVersion.version_number !== currentVersionNumber && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onRestoreVersion(selectedVersion)}
                    >
                      <RotateCcw size={14} /> Restore as New Version
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Title:</div>
                    <div style={{ fontWeight: 600 }}>{selectedVersion.title}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status:</div>
                    <div><span className="badge badge-synced">{selectedVersion.status}</span></div>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Description:</div>
                  <div style={{ fontSize: '0.85rem' }}>{selectedVersion.description || '(Empty)'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Content:</div>
                  <pre style={{
                    background: 'rgba(0,0,0,0.4)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {selectedVersion.content}
                  </pre>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Select a version from the left timeline to view its contents.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
