import React from 'react';
import {
  HelpCircle,
  X,
  Shield,
  FolderOpen,
  Wifi,
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
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          border: '1px solid var(--border-medium)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
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
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
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
            className="btn btn-ghost"
            style={{ padding: '6px', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}
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
          gap: '20px'
        }}>
          {/* Section: Welcome to SyncSafe */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Shield size={18} color="#60a5fa" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#93c5fd' }}>
                Welcome to SyncSafe (PS-13)
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              SyncSafe is a multi-device file synchronization system designed to prevent silent data loss when the same document is edited from different devices.
            </p>
            <div style={{
              marginTop: '10px',
              padding: '6px 12px',
              background: 'rgba(59, 130, 246, 0.15)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#bfdbfe',
              display: 'inline-block'
            }}>
              Core Principle: "Never silently discard a user's change."
            </div>
          </div>

          {/* Section 1: My Drive */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FolderOpen size={16} color="#60a5fa" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                1. My Drive
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              My Drive contains your synchronized Markdown documents.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem' }}>1</span>
                <span>Click <strong>+ New</strong> in the sidebar or drive header</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem' }}>2</span>
                <span>Fill in name, title, status, description, and Markdown content</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem' }}>3</span>
                <span>Open the document in the workspace</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem' }}>4</span>
                <span>Edit fields and click <strong>Save & Sync</strong> to publish Version 2</span>
              </div>
            </div>
          </div>

          {/* Section 2: Sync Status */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Wifi size={16} color="#34d399" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                2. Real Sync Status Indicators
              </h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>🟢 Synced:</span>
                <span style={{ color: 'var(--text-secondary)' }}>The server has durably acknowledged and committed the change.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>🟡 Saved locally:</span>
                <span style={{ color: 'var(--text-secondary)' }}>Change is safely stored in local IndexedDB waiting for upload.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>🔵 Syncing:</span>
                <span style={{ color: 'var(--text-secondary)' }}>The client is actively transmitting mutations to the backend.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ color: '#f43f5e', fontWeight: 700 }}>🔴 Conflict Detected:</span>
                <span style={{ color: 'var(--text-secondary)' }}>Two devices edited the same field concurrently. Safe preservation active.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>⚪ Offline:</span>
                <span style={{ color: 'var(--text-secondary)' }}>Device is offline. Local edits continue seamlessly into IndexedDB.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Offline Editing */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Database size={16} color="#f59e0b" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                3. Offline Editing & Durable Queue
              </h4>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Changes made while offline are safely persisted in the browser's IndexedDB queue and survive page reloads or device restarts.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: 'var(--text-primary)',
              fontWeight: 600
            }}>
              <span>Edit</span>
              <ArrowRight size={13} color="var(--text-muted)" />
              <span>Save Locally</span>
              <ArrowRight size={13} color="var(--text-muted)" />
              <span>Pending Queue</span>
              <ArrowRight size={13} color="var(--text-muted)" />
              <span>Reconnect</span>
              <ArrowRight size={13} color="var(--text-muted)" />
              <span style={{ color: '#34d399' }}>Sync</span>
            </div>
          </div>

          {/* Section 4 & 5: Auto-Merge & Conflict */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Auto Merge */}
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <GitMerge size={16} color="#34d399" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  4. Auto-Merge
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                If two devices edit <strong>different fields</strong> (e.g. Laptop edits Description, Phone edits Status), SyncSafe automatically combines them into an <code>auto_merged</code> version without human effort.
              </p>
            </div>

            {/* Conflict */}
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <AlertTriangle size={16} color="#f43f5e" />
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  5. Conflict Resolver
                </h4>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                If two devices edit the <strong>same field</strong> differently, SyncSafe preserves Base, Server, and Incoming states. Choose <em>Keep Server</em>, <em>Keep Mine</em>, or <em>Custom Merge</em>.
              </p>
            </div>
          </div>

          {/* Section 6: Sync Lab */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="#c084fc" />
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f3e8ff' }}>
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
            <p style={{ fontSize: '0.8rem', color: 'rgba(233, 213, 255, 0.85)', lineHeight: 1.4 }}>
              Sync Lab is the technical demonstration area simulating two physical devices (MacBook Pro & Pixel 8 Pro). Test online/offline toggling, artificial network latency/drops, queue inspection, and 3-way conflict resolution live.
            </p>
          </div>

          {/* Section 7: 2-Minute Hackathon Demo Script */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Clock size={16} color="#60a5fa" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                7. 2-Minute Hackathon Demo Script
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#93c5fd' }}>1.</strong> Click <em>Reset Demo to V1</em> in Sync Lab
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#93c5fd' }}>2.</strong> Laptop edits title $\rightarrow$ Save & Sync (V2)
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#93c5fd' }}>3.</strong> Set Pixel 8 Pro <strong>OFFLINE</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#93c5fd' }}>4.</strong> Phone edits status $\rightarrow$ Save locally (Queue: 1)
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#93c5fd' }}>5.</strong> Laptop edits description $\rightarrow$ Save & Sync (V3)
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#93c5fd' }}>6.</strong> Set Pixel 8 Pro <strong>ONLINE</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#34d399' }}>7.</strong> Show <strong>Auto-Merge</strong> (V4: non-overlapping)
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#93c5fd' }}>8.</strong> Laptop & offline Phone edit <em>content</em>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#f43f5e' }}>9.</strong> Phone reconnects $\rightarrow$ <strong>Conflict Detected</strong>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#93c5fd' }}>10.</strong> Click <em>Review Conflict</em> (3-way view)
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#c084fc' }}>11.</strong> Select <em>Custom Merge</em> and Commit (V5)
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)' }}>
                <strong style={{ color: '#34d399' }}>12.</strong> Open <em>Version History</em> to show full lineage
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          background: 'rgba(15, 23, 42, 0.9)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            PS-13 Prototype · Zero Silent Data Loss
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
