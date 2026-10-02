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
  LogOut,
  HelpCircle
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
  onOpenQuickGuide?: () => void;
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
  onSignOut,
  onOpenQuickGuide
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
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 100,
      position: 'relative',
      boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)'
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
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.28)',
            border: '1px solid rgba(255, 255, 255, 0.4)'
          }}>
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)'
              }}>
                SYNC SAFE
              </span>
              <span style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}>
                DRIVE
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Secure Multi-Device Sync
            </div>
          </div>
        </div>
      </div>

      {/* Center: Large Rounded Search Bar */}
      <div style={{ flex: 1, maxWidth: '520px', margin: '0 24px' }}>
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%'
        }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
          <input
            type="text"
            placeholder="Search files, documents..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 18px 10px 42px',
              borderRadius: '9999px',
              background: 'rgba(241, 245, 249, 0.85)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.02)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background = 'rgba(241, 245, 249, 0.85)';
              e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(15, 23, 42, 0.02)';
            }}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Backend Connectivity Status Dot */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: serverOnline ? '#059669' : '#dc2626',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          background: serverOnline ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          border: serverOnline ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
        }} title={serverOnline ? 'Backend service online (http://localhost:5000)' : 'Backend unreachable'}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: serverOnline ? '#10b981' : '#ef4444',
            boxShadow: serverOnline ? '0 0 6px rgba(16, 185, 129, 0.4)' : '0 0 6px rgba(239, 68, 68, 0.4)'
          }} />
          <span style={{ fontWeight: 600 }}>{serverOnline ? 'Server Live' : 'Server Down'}</span>
        </div>

        {/* Global Sync Status Pill */}
        {renderSyncPill()}

        {/* Quick Guide Trigger */}
        {onOpenQuickGuide && (
          <button
            className="btn btn-sm btn-outline"
            onClick={onOpenQuickGuide}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 11px',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
            title="Open Quick Guide & Demo Cheat Sheet"
          >
            <HelpCircle size={15} color="#2563eb" />
            <span>Guide</span>
          </button>
        )}

        {/* Sync Lab Quick Trigger (for Judges) */}
        <button
          className="btn btn-sm"
          onClick={onOpenSyncLab}
          style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(37, 99, 235, 0.08) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            color: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
            boxShadow: 'var(--shadow-sm)'
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
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              color: conflictCount > 0 ? '#dc2626' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '7px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: 'var(--shadow-sm)'
            }}
            title={conflictCount > 0 ? `${conflictCount} active conflict(s) requiring review` : 'No conflicts'}
          >
            <Bell size={17} />
            {conflictCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 6px #ef4444'
              }} />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '44px',
              right: '0',
              width: '300px',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: '16px',
              zIndex: 1000
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
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
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 600, fontSize: '0.82rem' }}>
                    <AlertTriangle size={14} />
                    <span>Concurrent Conflict Detected</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                    Content divergence between MacBook Pro and Pixel 8 Pro. Click to review.
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
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
              border: '1px solid var(--border-subtle)',
              background: '#ffffff',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.78rem',
              color: '#ffffff'
            }}>
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'AR'}
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: '0',
              width: '250px',
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: '16px',
              zIndex: 1000
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {user?.name || 'Alex Rivera'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {user?.email || 'demo@syncsafe.io'}
              </div>

              <div style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(241, 245, 249, 0.8)',
                marginBottom: '12px',
                fontSize: '0.75rem',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Connected Devices:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563eb' }}>• MacBook Pro 16"</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#7c3aed' }}>• Pixel 8 Pro</div>
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
                  <BookOpen size={13} color="#2563eb" />
                  <span>Guided Demo Script</span>
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', color: '#dc2626' }}
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
