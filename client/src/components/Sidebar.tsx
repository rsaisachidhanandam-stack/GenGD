import React, { useState } from 'react';
import {
  FolderClosed,
  Clock,
  Star,
  AlertTriangle,
  Trash2,
  Cpu,
  Settings,
  HardDrive,
  Plus,
  FilePlus,
  FolderPlus,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  conflictCount: number;
  onOpenNewDocument: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigateTab,
  conflictCount,
  onOpenNewDocument
}) => {
  const [showNewMenu, setShowNewMenu] = useState(false);

  return (
    <aside className="sidebar">
      {/* Top Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* + New Button */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowNewMenu(!showNewMenu)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '0.9rem',
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>New</span>
          </button>

          {/* New Menu Dropdown */}
          {showNewMenu && (
            <div
              style={{
                position: 'absolute',
                top: '48px',
                left: '0',
                width: '100%',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setShowNewMenu(false);
                  onOpenNewDocument();
                }}
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  border: 'none',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <FilePlus size={16} color="#3b82f6" />
                <span>New Document (.md)</span>
              </button>

              <div
                title="Folder grouping is planned for v2; documents are synchronized individually"
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}
              >
                <FolderPlus size={16} />
                <span>New Folder (v2)</span>
              </div>
            </div>
          )}
        </div>

        {/* Primary Navigation List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            className={`sidebar-nav-item ${activeTab === 'drive' ? 'active' : ''}`}
            onClick={() => onNavigateTab('drive')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FolderClosed size={17} color={activeTab === 'drive' ? '#60a5fa' : 'var(--text-muted)'} />
              <span>My Drive</span>
            </div>
            {activeTab === 'drive' && <ChevronRight size={14} />}
          </div>

          <div
            className={`sidebar-nav-item ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => onNavigateTab('recent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={17} color={activeTab === 'recent' ? '#60a5fa' : 'var(--text-muted)'} />
              <span>Recent</span>
            </div>
            {activeTab === 'recent' && <ChevronRight size={14} />}
          </div>

          <div
            className={`sidebar-nav-item ${activeTab === 'starred' ? 'active' : ''}`}
            onClick={() => onNavigateTab('starred')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Star size={17} color={activeTab === 'starred' ? '#fbbf24' : 'var(--text-muted)'} />
              <span>Starred</span>
            </div>
            {activeTab === 'starred' && <ChevronRight size={14} />}
          </div>

          <div
            className={`sidebar-nav-item ${activeTab === 'conflicts' ? 'active' : ''}`}
            onClick={() => onNavigateTab('conflicts')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={17} color={conflictCount > 0 ? '#fb7185' : 'var(--text-muted)'} />
              <span>Conflicts</span>
            </div>
            {conflictCount > 0 && (
              <span
                style={{
                  background: '#f43f5e',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  boxShadow: '0 0 8px rgba(244, 63, 94, 0.4)'
                }}
              >
                {conflictCount}
              </span>
            )}
          </div>

          <div
            className={`sidebar-nav-item ${activeTab === 'trash' ? 'active' : ''}`}
            onClick={() => onNavigateTab('trash')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trash2 size={17} color={activeTab === 'trash' ? '#60a5fa' : 'var(--text-muted)'} />
              <span>Trash</span>
            </div>
          </div>
        </nav>

        {/* Sync Lab Feature Box (Hackathon Technical Demo) */}
        <div style={{ marginTop: '12px' }}>
          <div
            className={`sync-lab-btn ${activeTab === 'sync-lab' ? 'active' : ''}`}
            onClick={() => onNavigateTab('sync-lab')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="#c084fc" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f3e8ff' }}>
                  Sync Lab
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  background: 'rgba(192, 132, 252, 0.25)',
                  color: '#e9d5ff',
                  padding: '2px 5px',
                  borderRadius: '4px'
                }}
              >
                PS-13
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(233, 213, 255, 0.7)', lineHeight: 1.3 }}>
              Dual-device simulator, 3-way merge & network chaos
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        {/* Storage Usage Widget */}
        <div style={{ padding: '8px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <HardDrive size={14} />
              <span>Storage</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1.2 GB / 15 GB</span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: '8%',
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                borderRadius: '9999px'
              }}
            />
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            8% used · SQLite WAL sync storage
          </div>
        </div>

        {/* Settings Item */}
        <div
          className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigateTab('settings')}
          style={{ padding: '7px 8px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} color="var(--text-muted)" />
            <span>Settings & Diagnostics</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
