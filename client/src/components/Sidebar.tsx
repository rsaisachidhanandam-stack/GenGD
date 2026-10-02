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
  ChevronRight,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  conflictCount: number;
  onOpenNewDocument: () => void;
  onOpenQuickGuide?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigateTab,
  conflictCount,
  onOpenNewDocument,
  onOpenQuickGuide
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
              padding: '11px 18px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontSize: '0.92rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)'
            }}
          >
            <Plus size={19} strokeWidth={2.5} />
            <span>New</span>
          </button>

          {/* New Menu Dropdown */}
          {showNewMenu && (
            <div
              style={{
                position: 'absolute',
                top: '52px',
                left: '0',
                width: '100%',
                background: '#ffffff',
                border: '1px solid var(--border-subtle)',
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
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'none'
                }}
              >
                <FilePlus size={16} color="#2563eb" />
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
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div
            className={`sidebar-nav-item ${activeTab === 'drive' ? 'active' : ''}`}
            onClick={() => onNavigateTab('drive')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FolderClosed size={17} color={activeTab === 'drive' ? '#2563eb' : 'var(--text-secondary)'} />
              <span style={{ color: activeTab === 'drive' ? '#2563eb' : 'var(--text-primary)' }}>My Drive</span>
            </div>
            {activeTab === 'drive' && <ChevronRight size={14} color="#2563eb" />}
          </div>

          <div
            className={`sidebar-nav-item ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => onNavigateTab('recent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={17} color={activeTab === 'recent' ? '#2563eb' : 'var(--text-secondary)'} />
              <span style={{ color: activeTab === 'recent' ? '#2563eb' : 'var(--text-primary)' }}>Recent</span>
            </div>
            {activeTab === 'recent' && <ChevronRight size={14} color="#2563eb" />}
          </div>

          <div
            className={`sidebar-nav-item ${activeTab === 'starred' ? 'active' : ''}`}
            onClick={() => onNavigateTab('starred')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Star size={17} color={activeTab === 'starred' ? '#f59e0b' : 'var(--text-secondary)'} />
              <span style={{ color: activeTab === 'starred' ? '#f59e0b' : 'var(--text-primary)' }}>Starred</span>
            </div>
            {activeTab === 'starred' && <ChevronRight size={14} color="#f59e0b" />}
          </div>

          <div
            className={`sidebar-nav-item ${activeTab === 'conflicts' ? 'active' : ''}`}
            onClick={() => onNavigateTab('conflicts')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={17} color={conflictCount > 0 ? '#ef4444' : 'var(--text-secondary)'} />
              <span style={{ color: activeTab === 'conflicts' ? '#ef4444' : 'var(--text-primary)' }}>Conflicts</span>
            </div>
            {conflictCount > 0 ? (
              <span
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.35)'
                }}
              >
                {conflictCount}
              </span>
            ) : (
              activeTab === 'conflicts' && <ChevronRight size={14} color="#ef4444" />
            )}
          </div>

          <div
            className={`sidebar-nav-item ${activeTab === 'trash' ? 'active' : ''}`}
            onClick={() => onNavigateTab('trash')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trash2 size={17} color={activeTab === 'trash' ? '#2563eb' : 'var(--text-secondary)'} />
              <span style={{ color: activeTab === 'trash' ? '#2563eb' : 'var(--text-primary)' }}>Trash</span>
            </div>
            {activeTab === 'trash' && <ChevronRight size={14} color="#2563eb" />}
          </div>
        </nav>

        {/* Sync Lab Feature Box (Hackathon Technical Demo) */}
        <div style={{ marginTop: '10px' }}>
          <div
            className={`sync-lab-btn ${activeTab === 'sync-lab' ? 'active' : ''}`}
            onClick={() => onNavigateTab('sync-lab')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={17} color="#7c3aed" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#6d28d9' }}>
                  Sync Lab
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  background: 'rgba(124, 58, 237, 0.12)',
                  color: '#7c3aed',
                  padding: '2px 5px',
                  borderRadius: '4px'
                }}
              >
                PS-13
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
              Dual-device simulator, 3-way merge & network chaos
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
        {/* Storage Usage Widget */}
        <div style={{ padding: '6px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <HardDrive size={14} color="var(--text-secondary)" />
              <span style={{ fontWeight: 600 }}>Storage</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1.2 GB / 15 GB</span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'rgba(226, 232, 240, 0.9)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: '8%',
                height: '100%',
                background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
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
          style={{ padding: '7px 10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} color={activeTab === 'settings' ? '#2563eb' : 'var(--text-secondary)'} />
            <span style={{ color: activeTab === 'settings' ? '#2563eb' : 'var(--text-primary)' }}>Settings & Diagnostics</span>
          </div>
        </div>

        {/* Quick Guide Item */}
        {onOpenQuickGuide && (
          <div
            className="sidebar-nav-item"
            onClick={onOpenQuickGuide}
            style={{ padding: '7px 10px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={16} color="#2563eb" />
              <span style={{ color: 'var(--text-primary)' }}>Help & Quick Guide</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
