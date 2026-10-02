import React from 'react';
import {
  HelpCircle,
  X,
  Shield,
  FolderOpen,
  GitMerge,
  AlertTriangle,
  Cpu,
  Clock,
  ArrowRight,
  Database
} from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSyncLab: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenSyncLab
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2100 }} onClick={onClose}>
      <div
        className="modal-content fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          width: '100%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.18)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(124, 58, 237, 0.04) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}>
              <HelpCircle size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Quick Guide & Demo Manual
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                SyncSafe architecture, navigation & hackathon presentation guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px' }}
            title="Close Guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Guide Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          background: '#ffffff'
        }}>
          {/* Section 1: What is SyncSafe? */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(124, 58, 237, 0.06) 100%)',
            border: '1px solid rgba(37, 99, 235, 0.18)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Shield size={18} color="#2563eb" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                1. What is SyncSafe?
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              SyncSafe is an enterprise-grade multi-device file synchronization system solving <strong>Problem Statement PS-13: Same File, Multiple Devices</strong>. It provides transparent durability, semantic auto-merge, and zero silent data loss.
            </p>
            <div style={{
              marginTop: '10px',
              padding: '6px 12px',
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.18)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#2563eb',
              display: 'inline-block'
            }}>
              Core Rule: "Never silently discard a user's change."
            </div>
          </div>

          {/* Section 2: My Drive */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FolderOpen size={16} color="#2563eb" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                2. My Drive
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              My Drive organizes your synchronized Markdown documents and shows real-time revision lineage.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem' }}>1</span>
                <span>Click <strong>+ New</strong> to create a new synchronized Markdown document.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem' }}>2</span>
                <span>Double-click any card to open in the full editor.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem' }}>3</span>
                <span>Use <strong>Save Locally</strong> for offline drafts, or <strong>Save & Sync</strong> to publish.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Offline Sync */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Database size={16} color="#f59e0b" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                3. Offline Sync & Durable Queue
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Changes made while offline are safely persisted in the browser's IndexedDB queue and survive page reloads or device restarts.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(241, 245, 249, 0.9)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: 'var(--text-primary)',
              fontWeight: 600,
              border: '1px solid var(--border-subtle)'
            }}>
              <span>Edit</span>
              <ArrowRight size={13} color="var(--text-muted)" />
              <span>Save Locally</span>
              <ArrowRight size={13} color="var(--text-muted)" />
              <span>Pending Queue</span>
              <ArrowRight size={13} color="var(--text-muted)" />
              <span>Reconnect</span>
              <ArrowRight size={13} color="var(--text-muted)" />
              <span style={{ color: '#059669' }}>Sync</span>
            </div>
          </div>

          {/* Section 4 & 5: Auto-Merge & Conflict Resolution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Auto Merge */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <GitMerge size={16} color="#059669" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  4. Auto-Merge
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                If two devices edit <strong>different fields</strong> (e.g. Laptop edits Description, Phone edits Status), SyncSafe automatically merges them into an <code>auto_merged</code> version without human effort.
              </p>
            </div>

            {/* Conflict Resolution */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <AlertTriangle size={16} color="#dc2626" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  5. Conflict Resolution
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                If two devices edit the <strong>same field</strong> concurrently, SyncSafe halts overwrites and preserves Base, Server, and Incoming edits. Choose <em>Keep Server</em>, <em>Keep Mine</em>, or <em>Custom Merge</em>.
              </p>
            </div>
          </div>

          {/* Section 6: Sync Lab */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(37, 99, 235, 0.06) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="#7c3aed" />
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#6d28d9' }}>
                  6. Sync Lab (Judge Demonstration Simulator)
                </h4>
              </div>
              <button
                className="btn btn-sm"
                onClick={() => {
                  onClose();
                  onOpenSyncLab();
                }}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  gap: '6px'
                }}
              >
                <span>Open Sync Lab</span>
                <ArrowRight size={13} />
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Sync Lab is the technical demonstration area simulating two physical devices (MacBook Pro & Pixel 8 Pro). Test online/offline toggling, artificial network latency/drops, queue inspection, and 3-way conflict resolution live.
            </p>
          </div>

          {/* Section 7: 2-Minute Demo */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Clock size={16} color="#2563eb" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                7. 2-Minute Demo Cheat Sheet
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              <div style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#2563eb' }}>1.</strong> Click <em>Reset Demo (V1)</em>
              </div>
              <div style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#2563eb' }}>2.</strong> Laptop edits title → Save & Sync (V2)
              </div>
              <div style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#2563eb' }}>3.</strong> Set Pixel 8 Pro <strong>OFFLINE</strong>
              </div>
              <div style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#2563eb' }}>4.</strong> Phone edits status → Save locally (Queue: 1)
              </div>
              <div style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#2563eb' }}>5.</strong> Laptop edits description → Save & Sync (V3)
              </div>
              <div style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#2563eb' }}>6.</strong> Set Pixel 8 Pro <strong>ONLINE</strong>
              </div>
              <div style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#059669' }}>7.</strong> Show <strong>Auto-Merge</strong> (V4: non-overlapping)
              </div>
              <div style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#2563eb' }}>8.</strong> Laptop & offline Phone edit <em>content</em>
              </div>
              <div style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#dc2626' }}>9.</strong> Phone reconnects → <strong>Conflict Detected</strong>
              </div>
              <div style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#2563eb' }}>10.</strong> Click <em>Review Conflict</em> (3-way view)
              </div>
              <div style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#7c3aed' }}>11.</strong> Select <em>Custom Merge</em> & Commit (V5)
              </div>
              <div style={{ background: 'rgba(241, 245, 249, 0.8)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#059669' }}>12.</strong> Open <em>Version History</em> to show full lineage
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          background: 'rgba(248, 250, 252, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            SyncSafe PS-13 · Zero Silent Data Loss
          </div>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
