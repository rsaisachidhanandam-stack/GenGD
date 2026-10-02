import React, { useState } from 'react';
import {
  Shield,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  WifiOff,
  Bell,
  Cpu,
  RotateCcw,
  BookOpen,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { type SyncStatusState } from '../services/clientSyncCoordinator';

interface TopNavbarProps {
  user: { id: string; name: string; email: string } | null;
  serverOnline: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  globalSyncState: SyncStatusState;
  conflictCount: number;
  onNavigateTab: (tab: string) => void;
  onOpenSyncLab: () => void;
  onResetDemo: () => void;
  isResetting: boolean;
  onOpenDemoScript: () => void;
  onSignOut?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  user,
  serverOnline,
  searchQuery,
  onSearchChange,
  globalSyncState,
  conflictCount,
  onNavigateTab,
  onOpenSyncLab,
  onResetDemo,
  isResetting,
  onOpenDemoScript,
  onSignOut
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Derive sync status indicator visuals
  const renderSyncPill = () => {
    switch (globalSyncState.status) {
      case 'synced':
        return (
          <div className="badge badge-synced" title="Authoritative server state confirmed">
            <CheckCircle2 size={13} />
            <span>Synced {globalSyncState.lastSyncedVersion ? `· V${globalSyncState.lastSyncedVersion}` : ''}</span>
          </div>
        );
      case 'pending':
        return (
          <div className="badge badge-pending" title="Locally saved in IndexedDB, pending upload">
            <Clock size={13} />
            <span>Saved locally · {globalSyncState.pendingCount} pending</span>
          </div>
        );
      case 'syncing':
        return (
          <div className="badge badge-syncing" title="Transmitting changes via HTTP">
            <RefreshCw size={13} className="animate-spin" />
            <span>Syncing...</span>
          </div>
        );
      case 'conflict':
        return (
          <div className="badge badge-conflict" title="Conflict detected: stale base version modified concurrently">
            <AlertTriangle size={13} />
            <span>Conflict Detected</span>
          </div>
        );
      case 'offline':
        return (
          <div className="badge badge-offline" title="Device offline, durable queue active">
            <WifiOff size={13} />
            <span>Offline</span>
          </div>
        );
      case 'retry':
        return (
          <div className="badge badge-pending" title="Network issue encountered; will retry">
            <RotateCcw size={13} />
            <span>Retry Required</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header style={{
      height: '64px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 100,
      position: 'relative'
    }}>
      {/* Left: Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
        <div
          onClick={() => onNavigateTab('drive')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                SyncSafe
              </span>
              <span style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                padding: '2px 5px',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}>
                Drive
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Secure Multi-Device Sync
            </div>
          </div>
        </div>
      </div>

      {/* Center: Search Files */}
      <div style={{ flex: 1, maxWidth: '520px', margin: '0 24px' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%'
        }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
          <input
            type="text"
            placeholder="Search files, documents..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 16px 9px 40px',
              borderRadius: '9999px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.95)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-medium)';
              e.currentTarget.style.background = 'rgba(30, 41, 59, 0.7)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Backend Connectivity Status Dot */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: serverOnline ? '#10b981' : '#f43f5e',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          background: serverOnline ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)'
        }} title={serverOnline ? 'Backend service online (http://localhost:5000)' : 'Backend unreachable'}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: serverOnline ? '#10b981' : '#f43f5e',
            boxShadow: serverOnline ? '0 0 8px #10b981' : '0 0 8px #f43f5e'
          }} />
          <span>{serverOnline ? 'Server Live' : 'Server Down'}</span>
        </div>

        {/* Global Sync Status Pill */}
        {renderSyncPill()}

        {/* Sync Lab Quick Trigger (for Judges) */}
        <button
          className="btn btn-sm"
          onClick={onOpenSyncLab}
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            color: '#c084fc',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700
          }}
          title="Open Dual-Device Sync Lab Simulator (PS-13 Demonstration)"
        >
          <Cpu size={14} />
          <span>Sync Lab</span>
        </button>

        {/* Notifications Icon (Conflict Alerts) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'transparent',
              border: 'none',
              color: conflictCount > 0 ? '#fb7185' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
            title={conflictCount > 0 ? `${conflictCount} active conflict(s) requiring review` : 'No conflicts'}
          >
            <Bell size={18} />
            {conflictCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#f43f5e',
                boxShadow: '0 0 6px #f43f5e'
              }} />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '40px',
              right: '0',
              width: '280px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: '14px',
              zIndex: 1000
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Notifications</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {conflictCount} Alert{conflictCount === 1 ? '' : 's'}
                </span>
              </div>
              {conflictCount > 0 ? (
                <div
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigateTab('conflicts');
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fb7185', fontWeight: 600, fontSize: '0.8rem' }}>
                    <AlertTriangle size={14} />
                    <span>Concurrent Conflict Detected</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Content divergence between MacBook Pro and Pixel 8 Pro. Click to review.
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                  <CheckCircle2 size={24} color="#10b981" style={{ margin: '0 auto 6px', display: 'block' }} />
                  Zero conflicts. All files synchronized safely.
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 'var(--radius-md)',
              transition: 'background 0.2s'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'AR'}
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              top: '44px',
              right: '0',
              width: '240px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: '14px',
              zIndex: 1000
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {user?.name || 'Alex Rivera'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {user?.email || 'demo@syncsafe.io'}
              </div>

              <div style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0, 0, 0, 0.25)',
                marginBottom: '12px',
                fontSize: '0.75rem'
              }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Connected Devices:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#60a5fa' }}>• MacBook Pro 16"</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c084fc' }}>• Pixel 8 Pro</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenDemoScript();
                  }}
                >
                  <BookOpen size={13} />
                  <span>Guided Demo Script</span>
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', color: '#fb7185' }}
                  onClick={() => {
                    setShowProfileMenu(false);
                    onResetDemo();
                  }}
                  disabled={isResetting}
                >
                  <RotateCcw size={13} />
                  <span>{isResetting ? 'Resetting...' : 'Reset Demo to V1'}</span>
                </button>
                {onSignOut && (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-muted)' }}
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSignOut();
                    }}
                  >
                    <LogOut size={13} />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
