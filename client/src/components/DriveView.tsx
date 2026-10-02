import React, { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Activity,
  GitMerge,
  FolderOpen
} from 'lucide-react';
import { type CachedDocument } from '../services/indexedDbStorage';

interface DriveViewProps {
  documents: CachedDocument[];
  selectedDocId: string | null;
  onSelectDoc: (doc: CachedDocument) => void;
  onOpenDoc: (doc: CachedDocument) => void;
  onOpenNewDocument: () => void;
  searchQuery: string;
  versions: any[];
  conflicts: any[];
}

export const DriveView: React.FC<DriveViewProps> = ({
  documents,
  selectedDocId,
  onSelectDoc,
  onOpenDoc,
  onOpenNewDocument,
  searchQuery,
  versions,
  conflicts
}) => {
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'version'>('date');

  // Filter documents by search query
  const filteredDocs = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (doc.name && doc.name.toLowerCase().includes(q)) ||
      (doc.title && doc.title.toLowerCase().includes(q)) ||
      (doc.description && doc.description.toLowerCase().includes(q))
    );
  });

  // Sort documents
  const sortedDocs = [...filteredDocs].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.name || a.title || '').localeCompare(b.name || b.title || '');
    }
    if (sortBy === 'version') {
      return (b.current_version || 1) - (a.current_version || 1);
    }
    // Default by updated_at date
    return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
  });

  // Derive real recent activity from existing versions and conflicts
  const recentActivities = React.useMemo(() => {
    const list: { id: string; text: string; time: string; type: 'sync' | 'merge' | 'conflict' }[] = [];

    if (conflicts && conflicts.length > 0) {
      list.push({
        id: 'conf-1',
        text: 'Concurrent conflict detected on Content field (preserved safely)',
        time: 'Just now',
        type: 'conflict'
      });
    }

    if (versions && versions.length > 0) {
      // Latest version
      const latestVer = versions[versions.length - 1];
      if (latestVer) {
        let desc = `Version ${latestVer.version_number} saved and synchronized`;
        if (latestVer.merge_type === 'auto_merged') {
          desc = `Auto-merge completed: Non-overlapping fields combined into V${latestVer.version_number}`;
        } else if (latestVer.merge_type === 'manual_resolution') {
          desc = `Conflict resolved: Clean 3-way resolution committed into V${latestVer.version_number}`;
        }

        list.push({
          id: `ver-${latestVer.id || latestVer.version_number}`,
          text: desc,
          time: new Date(latestVer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: latestVer.merge_type === 'auto_merged' ? 'merge' : 'sync'
        });
      }

      // Second latest version if available
      if (versions.length > 1) {
        const prevVer = versions[versions.length - 2];
        let prevDesc = `Version ${prevVer.version_number} created`;
        if (prevVer.merge_type === 'auto_merged') {
          prevDesc = `Auto-merged version V${prevVer.version_number}`;
        } else if (prevVer.merge_type === 'manual_resolution') {
          prevDesc = `Conflict resolved into V${prevVer.version_number}`;
        }
        list.push({
          id: `ver-${prevVer.id || prevVer.version_number}`,
          text: prevDesc,
          time: new Date(prevVer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: prevVer.merge_type === 'auto_merged' ? 'merge' : 'sync'
        });
      }
    }

    return list;
  }, [versions, conflicts]);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 min ago';
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours === 1) return '1 hr ago';
      if (diffHours < 24) return `${diffHours} hrs ago`;
      return new Date(isoString).toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            My Drive
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Your files, synchronized safely across devices.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* New Document Button */}
          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenNewDocument}
            style={{ padding: '7px 14px', borderRadius: 'var(--radius-md)' }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Document</span>
          </button>

          {/* Sort Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '6px 28px 6px 12px',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                cursor: 'pointer'
              }}
            >
              <option value="date">Sort by Last Modified</option>
              <option value="name">Sort by Name</option>
              <option value="version">Sort by Version</option>
            </select>
          </div>

          {/* Grid / List Toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-surface-elevated)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)'
          }}>
            <button
              onClick={() => setViewLayout('grid')}
              style={{
                background: viewLayout === 'grid' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: viewLayout === 'grid' ? '#60a5fa' : 'var(--text-muted)',
                border: 'none',
                padding: '5px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewLayout('list')}
              style={{
                background: viewLayout === 'list' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: viewLayout === 'list' ? '#60a5fa' : 'var(--text-muted)',
                border: 'none',
                padding: '5px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="List View"
            >
              <ListIcon size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Real Sync Activity Bar */}
      {recentActivities.length > 0 && (
        <div style={{
          background: 'rgba(22, 32, 54, 0.5)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          overflowX: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
            <Activity size={15} />
            <span>Recent Sync Activity:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {recentActivities.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: act.type === 'conflict' ? 'rgba(244, 63, 94, 0.15)' :
                              act.type === 'merge' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)',
                  border: act.type === 'conflict' ? '1px solid rgba(244, 63, 94, 0.3)' :
                          act.type === 'merge' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(59, 130, 246, 0.25)',
                  color: act.type === 'conflict' ? '#fb7185' :
                         act.type === 'merge' ? '#c084fc' : '#93c5fd',
                  flexShrink: 0
                }}
              >
                {act.type === 'conflict' ? <AlertTriangle size={12} /> :
                 act.type === 'merge' ? <GitMerge size={12} /> : <CheckCircle2 size={12} />}
                <span>{act.text}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({act.time})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Files Area */}
      {sortedDocs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--border-medium)'
        }}>
          <FolderOpen size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            No documents found
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '360px', margin: '4px auto 16px' }}>
            {searchQuery ? `No files matching "${searchQuery}"` : 'Create your first synchronized Markdown document to get started.'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={onOpenNewDocument}>
            <Plus size={14} />
            <span>Create Document</span>
          </button>
        </div>
      ) : viewLayout === 'grid' ? (
        /* Grid Layout */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {sortedDocs.map((doc) => {
            const isSelected = selectedDocId === doc.id;
            const hasConflict = conflicts.some(c => c.document_id === doc.id);

            return (
              <div
                key={doc.id}
                className={`file-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectDoc(doc)}
                onDoubleClick={() => onOpenDoc(doc)}
              >
                {/* Card Top: Icon & Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa'
                  }}>
                    <FileText size={20} />
                  </div>

                  {/* Sync Status Badge */}
                  {hasConflict ? (
                    <span className="badge badge-conflict">
                      <AlertTriangle size={11} />
                      <span>Conflict</span>
                    </span>
                  ) : doc.isLocallyModified ? (
                    <span className="badge badge-pending">
                      <Clock size={11} />
                      <span>Pending Sync</span>
                    </span>
                  ) : (
                    <span className="badge badge-synced">
                      <CheckCircle2 size={11} />
                      <span>Synced · V{doc.current_version || 1}</span>
                    </span>
                  )}
                </div>

                {/* Card Middle: File Name & Title */}
                <div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                    wordBreak: 'break-word'
                  }}>
                    {doc.name || doc.title || 'Untitled Document.md'}
                  </div>
                  {doc.title && doc.title !== doc.name && (
                    <div style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {doc.title}
                    </div>
                  )}
                </div>

                {/* Structured Metadata Row */}
                <div style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0, 0, 0, 0.2)',
                  fontSize: '0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: doc.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' :
                                doc.status === 'in_review' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                    color: doc.status === 'approved' ? '#6ee7b7' :
                           doc.status === 'in_review' ? '#fcd34d' : '#cbd5e1',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.68rem'
                  }}>
                    {doc.status || 'draft'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Markdown (.md)
                  </span>
                </div>

                {/* Card Footer: Last modified & Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '10px'
                }}>
                  <span>Modified {formatRelativeTime(doc.updated_at)}</span>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDoc(doc);
                    }}
                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Layout */
        <div style={{
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{
                background: 'var(--bg-surface-elevated)',
                borderBottom: '1px solid var(--border-medium)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '12px 18px' }}>File Name</th>
                <th style={{ padding: '12px 18px' }}>Status</th>
                <th style={{ padding: '12px 18px' }}>Version</th>
                <th style={{ padding: '12px 18px' }}>Sync State</th>
                <th style={{ padding: '12px 18px' }}>Last Modified</th>
                <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDocs.map((doc) => {
                const isSelected = selectedDocId === doc.id;
                const hasConflict = conflicts.some(c => c.document_id === doc.id);

                return (
                  <tr
                    key={doc.id}
                    onClick={() => onSelectDoc(doc)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <td style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} color="#60a5fa" />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {doc.name || doc.title || 'Untitled Document.md'}
                        </div>
                        {doc.title && doc.title !== doc.name && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {doc.title}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {doc.status || 'draft'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#93c5fd' }}>
                      V{doc.current_version || 1}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      {hasConflict ? (
                        <span className="badge badge-conflict">Conflict</span>
                      ) : doc.isLocallyModified ? (
                        <span className="badge badge-pending">Pending Sync</span>
                      ) : (
                        <span className="badge badge-synced">Synced</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 18px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {formatRelativeTime(doc.updated_at)}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDoc(doc);
                        }}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
