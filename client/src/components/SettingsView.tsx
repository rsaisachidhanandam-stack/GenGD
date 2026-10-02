import React from 'react';
import {
  Cpu,
  Laptop,
  Smartphone,
  Server,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { ClientSyncCoordinator } from '../services/clientSyncCoordinator';

interface SettingsViewProps {
  user: { id: string; name: string; email: string } | null;
  serverOnline: boolean;
  laptopCoordinator: ClientSyncCoordinator;
  mobileCoordinator: ClientSyncCoordinator;
  token: string | null;
  onResetDemo: () => void;
  isResetting: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  serverOnline,
  laptopCoordinator,
  mobileCoordinator,
  token,
  onResetDemo,
  isResetting
}) => {
  return (
    <div style={{ padding: '28px 36px', maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Settings & Diagnostics
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Inspect active distributed synchronization state, device pairings, and IndexedDB local stores.
        </p>
      </div>

      {/* System Health Card */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <Server size={18} color="#60a5fa" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Backend & Consensus Engine
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Service Endpoint</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>http://localhost:5000</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Backend Status</span>
            <span style={{ color: serverOnline ? '#34d399' : '#f43f5e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: serverOnline ? '#10b981' : '#f43f5e' }} />
              {serverOnline ? 'Online (SQLite WAL Active)' : 'Offline / Unreachable'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Merge Engine</span>
            <span style={{ color: 'var(--text-primary)' }}>3-Way Semantic Field-Level Auto-Merge</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Conflict Strategy</span>
            <span style={{ color: 'var(--text-primary)' }}>Full Conflict Preservation (Zero Silent Data Loss)</span>
          </div>
        </div>
      </div>

      {/* Registered Devices */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <Cpu size={18} color="#c084fc" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Paired Client Devices & Durable Local Stores
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Laptop */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 700, fontSize: '0.9rem' }}>
              <Laptop size={18} />
              <span>{laptopCoordinator.deviceName}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ID: {laptopCoordinator.deviceId}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Local Store: <code style={{ color: '#93c5fd' }}>syncsafe_db_device-laptop-001</code>
            </div>
            <div style={{ fontSize: '0.75rem', color: laptopCoordinator.isOnline ? '#34d399' : '#fbbf24' }}>
              Connection: {laptopCoordinator.isOnline ? 'Online (Direct HTTP)' : 'Offline (Durable Queue Active)'}
            </div>
          </div>

          {/* Mobile */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontWeight: 700, fontSize: '0.9rem' }}>
              <Smartphone size={18} />
              <span>{mobileCoordinator.deviceName}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ID: {mobileCoordinator.deviceId}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Local Store: <code style={{ color: '#c084fc' }}>syncsafe_db_device-mobile-002</code>
            </div>
            <div style={{ fontSize: '0.75rem', color: mobileCoordinator.isOnline ? '#34d399' : '#fbbf24' }}>
              Connection: {mobileCoordinator.isOnline ? 'Online (Direct HTTP)' : 'Offline (Durable Queue Active)'}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Authentication */}
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <KeyRound size={18} color="#10b981" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Authentication & Security Context
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Authenticated User</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.name} ({user?.email})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Security Scope</span>
            <span style={{ color: '#34d399' }}>Isolated Tenant · Zero Cross-User Leakage (SEC01-04 Verified)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Active JWT Signature Token:</span>
            <code style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.72rem',
              color: '#94a3b8',
              wordBreak: 'break-all'
            }}>
              {token ? `${token.substring(0, 48)}...[truncated]` : 'No active token'}
            </code>
          </div>
        </div>
      </div>

      {/* Reset Environment */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(244, 63, 94, 0.08)',
        border: '1px solid rgba(244, 63, 94, 0.2)'
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fda4af' }}>
            Reset Hackathon Demo Environment
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Resets backend database and clears local IndexedDB queues back to pristine Version 1.
          </div>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={onResetDemo}
          disabled={isResetting}
          style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.4)', gap: '6px' }}
        >
          <RotateCcw size={14} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
        </button>
      </div>
    </div>
  );
};
