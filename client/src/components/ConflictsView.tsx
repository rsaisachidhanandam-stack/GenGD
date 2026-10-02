import React from 'react';
import {
  AlertTriangle,
  GitMerge,
  Laptop,
  Smartphone,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { type CachedDocument } from '../services/indexedDbStorage';

interface ConflictsViewProps {
  conflicts: any[];
  documents: CachedDocument[];
  onReviewConflict: (conflict: any) => void;
  onOpenSyncLab: () => void;
}

export const ConflictsView: React.FC<ConflictsViewProps> = ({
  conflicts,
  documents,
  onReviewConflict,
  onOpenSyncLab
}) => {
  return (
    <div style={{ padding: '28px 36px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Conflict Management
          </h1>
          {conflicts.length > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.35)'
              }}
            >
              {conflicts.length} Active
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          SyncSafe preserves conflicting concurrent revisions safely without silent data loss.
        </p>
      </div>

      {/* Main Content */}
      {conflicts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <ShieldCheck size={32} color="#059669" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            No conflicts detected
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '420px', margin: '6px auto 20px' }}>
            All your files are synchronized safely across all connected devices. Non-overlapping edits merge automatically.
          </p>
          <button
            className="btn btn-outline btn-sm"
            onClick={onOpenSyncLab}
            style={{ borderColor: 'rgba(124, 58, 237, 0.3)', color: '#7c3aed', gap: '6px' }}
          >
            <Cpu size={14} />
            <span>Simulate Conflict in Sync Lab</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {conflicts.map((conflict) => {
            const relatedDoc = documents.find(d => d.id === conflict.document_id);
            const conflictingFields = Array.isArray(conflict.conflicting_fields)
              ? conflict.conflicting_fields.join(', ')
              : typeof conflict.conflicting_fields === 'string'
              ? conflict.conflicting_fields
              : 'content';

            return (
              <div
                key={conflict.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  boxShadow: '0 8px 24px -4px rgba(239, 68, 68, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Red highlight top accent bar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #ef4444, #f87171)'
                }} />

                {/* Card Top */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#dc2626'
                    }}>
                      <AlertTriangle size={22} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          {relatedDoc?.name || relatedDoc?.title || 'SyncSafe Document'}
                        </span>
                        <span className="badge badge-conflict">Action Required</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Diverged at Base Version <strong>V{conflict.base_version || 1}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Review Action Button */}
                  <button
                    className="btn btn-primary"
                    onClick={() => onReviewConflict(conflict)}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                      gap: '8px'
                    }}
                  >
                    <GitMerge size={16} />
                    <span>Review Conflict</span>
                  </button>
                </div>

                {/* Metadata Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  background: 'rgba(248, 250, 252, 0.95)',
                  border: '1px solid var(--border-subtle)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                      Modified on Devices:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Laptop size={14} color="#2563eb" />
                        <span>MacBook Pro</span>
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>&</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Smartphone size={14} color="#7c3aed" />
                        <span>Pixel 8 Pro</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                      Conflicting Field:
                    </span>
                    <span style={{
                      fontWeight: 700,
                      color: '#dc2626',
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                      {conflictingFields}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontWeight: 600 }}>
                      Detected At:
                    </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {new Date(conflict.created_at || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Technical Note */}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  SyncSafe uses an immutable 3-way differential engine. Review allows choosing <strong>Server Version</strong>, <strong>Incoming Device Version</strong>, or crafting a <strong>Custom 3-Way Merge</strong>.
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
