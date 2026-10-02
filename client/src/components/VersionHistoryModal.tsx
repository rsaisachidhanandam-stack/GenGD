import React, { useState } from 'react';
import { History, RotateCcw, Clock, Laptop, Smartphone, ArrowDown, X } from 'lucide-react';

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
      <div className="modal-content fade-in" style={{ maxWidth: '980px', height: '82vh' }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          background: 'rgba(248, 250, 252, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'rgba(37, 99, 235, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}>
              <History size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Immutable Version History
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Every change creates an immutable traceable snapshot with parent pointers.
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content: Left timeline, Right snapshot preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', flex: 1, overflow: 'hidden' }}>
          {/* Vertical Timeline List */}
          <div style={{
            borderRight: '1px solid var(--border-subtle)',
            background: 'rgba(248, 250, 252, 0.65)',
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Version Lineage ({versions.length} Total)
            </div>

            {versions.slice().reverse().map((v, idx) => {
              const isSelected = selectedVersion?.version_number === v.version_number;
              const isCurrent = v.version_number === currentVersionNumber;

              const label = v.version_number === 1 ? 'Initial Version' :
                v.merge_type === 'auto_merged' ? 'Auto-Merge' :
                v.merge_type === 'manual_resolution' ? 'Manual Resolution' : 'Direct Edit';

              return (
                <React.Fragment key={v.version_number}>
                  <div
                    onClick={() => setSelectedVersion(v)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(37, 99, 235, 0.08)' : '#ffffff',
                      border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                      boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          color: isSelected ? '#2563eb' : 'var(--text-primary)',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          V{v.version_number}
                        </span>
                        {isCurrent && (
                          <span className="badge badge-synced" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                            Current
                          </span>
                        )}
                      </div>

                      {/* Merge Type Badge */}
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: v.merge_type === 'auto_merged' ? 'rgba(16, 185, 129, 0.12)' :
                                    v.merge_type === 'manual_resolution' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(241, 245, 249, 0.9)',
                        color: v.merge_type === 'auto_merged' ? '#059669' :
                               v.merge_type === 'manual_resolution' ? '#7c3aed' : 'var(--text-secondary)'
                      }}>
                        {label}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                      <Clock size={12} color="var(--text-muted)" />
                      {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {v.device_id.includes('mobile') || v.device_id.includes('phone') ? (
                        <Smartphone size={12} color="#7c3aed" />
                      ) : (
                        <Laptop size={12} color="#2563eb" />
                      )}
                      <span>{v.device_id}</span>
                    </div>
                  </div>

                  {idx < versions.length - 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
                      <ArrowDown size={14} color="var(--border-medium)" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Snapshot Viewer */}
          <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: '#ffffff' }}>
            {selectedVersion ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Version {selectedVersion.version_number} Snapshot
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'rgba(248, 250, 252, 0.85)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Title:</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{selectedVersion.title}</div>
                  </div>
                  <div style={{ background: 'rgba(248, 250, 252, 0.85)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Status:</div>
                    <div style={{ marginTop: '2px' }}><span className="badge badge-synced">{selectedVersion.status}</span></div>
                  </div>
                </div>

                <div style={{ background: 'rgba(248, 250, 252, 0.85)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Description:</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedVersion.description || '(Empty)'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>Content:</div>
                  <pre style={{
                    background: 'rgba(248, 250, 252, 0.95)',
                    color: 'var(--text-primary)',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-medium)'
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
