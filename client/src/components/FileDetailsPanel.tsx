import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Cpu,
  User,
  X,
  ExternalLink,
  Trash2,
  RotateCcw,
  Star
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
  ownerName?: string;
  deviceNames?: string[];
  onDeleteDoc?: (docId: string) => Promise<void>;
  onRestoreDoc?: (docId: string) => Promise<void>;
  onToggleStar?: (docId: string) => Promise<void>;
  isTrash?: boolean;
}

export const FileDetailsPanel: React.FC<FileDetailsPanelProps> = ({
  document,
  onClose,
  onOpenDoc,
  onOpenHistory,
  onOpenSyncLab,
  hasConflict,
  versionCount,
  ownerName = 'Alex Rivera',
  deviceNames = ['MacBook Pro', 'Pixel 8 Pro'],
  onDeleteDoc,
  onRestoreDoc,
  onToggleStar,
  isTrash = false
}) => {
  if (!document) {
    return (
      <div className="details-panel" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(241, 245, 249, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px'
        }}>
          <FileText size={28} color="var(--text-muted)" style={{ opacity: 0.6 }} />
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
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
          <FileText size={18} color="#2563eb" />
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            File Details
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* File Overview Preview Card */}
      <div style={{
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.3 }}>
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

      {/* Primary Action Button: Open in Editor */}
      <button
        className="btn btn-primary"
        onClick={() => onOpenDoc(document)}
        style={{ width: '100%', gap: '8px', padding: '10px' }}
      >
        <ExternalLink size={15} />
        <span>Open in Editor</span>
      </button>

      {/* Properties Metadata Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)' }}>
          Properties
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontSize: '0.82rem',
          background: '#ffffff',
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* File Name */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '7px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>File Name</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {document.name || 'Untitled.md'}
            </span>
          </div>

          {/* Sync Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '7px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Sync Status</span>
            <span style={{ fontWeight: 600, color: hasConflict ? '#dc2626' : document.isLocallyModified ? '#d97706' : '#059669' }}>
              {hasConflict ? 'Conflict' : document.isLocallyModified ? 'Pending' : 'Synced'}
            </span>
          </div>

          {/* File Type */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '7px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>File Type</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
              {document.name && document.name.toLowerCase().endsWith('.txt') ? 'Text Document (.txt)' : 'Markdown (.md)'}
            </span>
          </div>

          {/* Current Version */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '7px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Current Version</span>
            <span style={{ color: '#2563eb', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              Version V{document.current_version || 1}
            </span>
          </div>

          {/* Status Tag */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '7px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Status</span>
            <span style={{
              padding: '2px 7px',
              borderRadius: '4px',
              background: document.status === 'approved' ? 'rgba(16, 185, 129, 0.12)' :
                          document.status === 'in_review' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(100, 116, 139, 0.12)',
              color: document.status === 'approved' ? '#059669' :
                     document.status === 'in_review' ? '#d97706' : '#475569',
              textTransform: 'uppercase',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              {document.status || 'draft'}
            </span>
          </div>

          {/* Owner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '7px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Owner</span>
            <span style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
              <User size={13} color="var(--accent-blue)" />
              <span>{ownerName}</span>
            </span>
          </div>

          {/* Synchronized Devices */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '7px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Synchronized Devices</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 500 }}>
              {deviceNames.length > 0 ? deviceNames.join(', ') : 'MacBook Pro, Pixel 8 Pro'}
            </span>
          </div>

          {/* Last Modified */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '7px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Last Modified</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}>
              {formatTimestamp(document.updated_at)}
            </span>
          </div>

          {/* Document ID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Document ID</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
              {document.id}
            </span>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        {/* Star / Unstar Button */}
        {onToggleStar && !isTrash && !document.deleted_at && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onToggleStar(document.id)}
            style={{
              width: '100%',
              justifyContent: 'flex-start',
              gap: '8px',
              color: document.is_starred ? '#d97706' : 'var(--text-secondary)',
              borderColor: document.is_starred ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'
            }}
          >
            <Star size={14} fill={document.is_starred ? '#f59e0b' : 'none'} color={document.is_starred ? '#f59e0b' : 'currentColor'} />
            <span>{document.is_starred ? 'Starred' : 'Add to Starred'}</span>
          </button>
        )}

        {/* Version History Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenHistory}
          style={{ width: '100%', justifyContent: 'flex-start', gap: '8px' }}
        >
          <History size={14} color="#2563eb" />
          <span>Version History · V{document.current_version || 1}{versionCount > 0 ? ` (${versionCount} revs)` : ''}</span>
        </button>

        {/* Sync Lab Button */}
        <button
          className="btn btn-outline btn-sm"
          onClick={onOpenSyncLab}
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            gap: '8px',
            borderColor: 'rgba(124, 58, 237, 0.3)',
            color: '#7c3aed'
          }}
        >
          <Cpu size={14} />
          <span>Inspect in Sync Lab</span>
        </button>

        {/* Move to Trash OR Restore File Button */}
        {isTrash || document.deleted_at ? (
          onRestoreDoc && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onRestoreDoc(document.id)}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                gap: '8px',
                background: '#059669',
                borderColor: '#059669'
              }}
            >
              <RotateCcw size={14} />
              <span>Restore from Trash</span>
            </button>
          )
        ) : (
          onDeleteDoc && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onDeleteDoc(document.id)}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                gap: '8px',
                color: '#dc2626',
                borderColor: 'rgba(239, 68, 68, 0.3)'
              }}
            >
              <Trash2 size={14} />
              <span>Move to Trash</span>
            </button>
          )
        )}
      </div>
    </aside>
  );
};
