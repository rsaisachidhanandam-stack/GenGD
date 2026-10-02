import React from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Cpu,
  User,
  X,
  ExternalLink
} from 'lucide-react';
import { type CachedDocument } from '../services/indexedDbStorage';

interface FileDetailsPanelProps {
  document: CachedDocument | null;
  onClose: () => void;
  onOpenDoc: (doc: CachedDocument) => void;
  onOpenHistory: () => void;
  onOpenSyncLab: () => void;
  hasConflict: boolean;
  versionCount: number;
}

export const FileDetailsPanel: React.FC<FileDetailsPanelProps> = ({
  document,
  onClose,
  onOpenDoc,
  onOpenHistory,
  onOpenSyncLab,
  hasConflict,
  versionCount
}) => {
  if (!document) {
    return (
      <div className="details-panel" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <FileText size={36} color="var(--text-muted)" style={{ opacity: 0.5 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Select a file to inspect metadata, version lineage, and sync activity.
        </div>
      </div>
    );
  }

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'Unknown';
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return isoString;
    }
  };

  return (
    <aside className="details-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#60a5fa" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            File Details
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* File Overview Preview */}
      <div style={{
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
          {document.name || document.title}
        </div>
        {document.title && document.title !== document.name && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {document.title}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          {hasConflict ? (
            <span className="badge badge-conflict">
              <AlertTriangle size={12} />
              <span>Conflict Detected</span>
            </span>
          ) : document.isLocallyModified ? (
            <span className="badge badge-pending">
              <Clock size={12} />
              <span>Pending Sync</span>
            </span>
          ) : (
            <span className="badge badge-synced">
              <CheckCircle2 size={12} />
              <span>Synced · V{document.current_version || 1}</span>
            </span>
          )}
        </div>
      </div>

      {/* Quick Action Button */}
      <button
        className="btn btn-primary"
        onClick={() => onOpenDoc(document)}
        style={{ width: '100%', gap: '8px' }}
      >
        <ExternalLink size={15} />
        <span>Open in Editor</span>
      </button>

      {/* Metadata Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
          Properties
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>File Type</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Markdown Document (.md)</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Current Version</span>
            <span style={{ color: '#93c5fd', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              Version {document.current_version || 1}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Status Tag</span>
            <span style={{
              padding: '1px 6px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              textTransform: 'uppercase',
              fontSize: '0.72rem',
              fontWeight: 600
            }}>
              {document.status || 'draft'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Owner</span>
            <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={13} color="var(--accent-blue)" />
              <span>Alex Rivera</span>
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Synchronized Devices</span>
            <span style={{ color: 'var(--text-primary)' }}>MacBook Pro, Pixel 8 Pro</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Last Modified</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              {formatTimestamp(document.updated_at)}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Document ID</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
              {document.id}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Lab & Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenHistory}
          style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}
        >
          <History size={14} color="#60a5fa" />
          <span>Version History ({versionCount} revisions)</span>
        </button>

        <button
          className="btn btn-outline btn-sm"
          onClick={onOpenSyncLab}
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            gap: '8px',
            borderColor: 'rgba(139, 92, 246, 0.4)',
            color: '#c084fc'
          }}
        >
          <Cpu size={14} />
          <span>Inspect in Sync Lab</span>
        </button>
      </div>
    </aside>
  );
};
