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
    <div style={{ padding: '28px 36px', maxWidth: '960px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Settings & Diagnostics
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Inspect active distributed synchronization state, device pairings, and IndexedDB local stores.
        </p>
      </div>

      {/* 1. Backend & Consensus Engine */}
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <Server size={18} color="#2563eb" />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Backend & Consensus Engine
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Service Endpoint</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 500 }}>http://localhost:5000</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Backend Status</span>
            <span style={{ color: serverOnline ? '#059669' : '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: serverOnline ? '#10b981' : '#ef4444' }} />
              {serverOnline ? 'Online (SQLite WAL Active)' : 'Offline / Unreachable'}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Merge Engine</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>3-Way Semantic Field-Level Auto-Merge</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Conflict Strategy</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Full Conflict Preservation (Zero Silent Data Loss)</span>
          </div>
        </div>
      </div>

      {/* 2. Paired Client Devices */}
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <Cpu size={18} color="#7c3aed" />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Paired Client Devices & Durable Local Stores
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Laptop */}
          <div style={{
            background: 'rgba(248, 250, 252, 0.9)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: 700, fontSize: '0.9rem' }}>
              <Laptop size={18} />
              <span>{laptopCoordinator.deviceName}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              ID: {laptopCoordinator.deviceId}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Local Store: <code style={{ color: '#2563eb', fontWeight: 600 }}>syncsafe_db_device-laptop-001</code>
            </div>
            <div style={{ fontSize: '0.75rem', color: laptopCoordinator.isOnline ? '#059669' : '#d97706', fontWeight: 600 }}>
              Connection: {laptopCoordinator.isOnline ? 'Online (Direct HTTP)' : 'Offline (Durable Queue Active)'}
            </div>
          </div>

          {/* Mobile */}
          <div style={{
            background: 'rgba(248, 250, 252, 0.9)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7c3aed', fontWeight: 700, fontSize: '0.9rem' }}>
              <Smartphone size={18} />
              <span>{mobileCoordinator.deviceName}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              ID: {mobileCoordinator.deviceId}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Local Store: <code style={{ color: '#7c3aed', fontWeight: 600 }}>syncsafe_db_device-mobile-002</code>
            </div>
            <div style={{ fontSize: '0.75rem', color: mobileCoordinator.isOnline ? '#059669' : '#d97706', fontWeight: 600 }}>
              Connection: {mobileCoordinator.isOnline ? 'Online (Direct HTTP)' : 'Offline (Durable Queue Active)'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Authentication & Security Context */}
      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <KeyRound size={18} color="#059669" />
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Authentication & Security Context
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Authenticated User</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.name} ({user?.email})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Security Scope</span>
            <span style={{ color: '#059669', fontWeight: 600 }}>Isolated Tenant · Zero Cross-User Leakage (SEC01-04 Verified)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem' }}>Active JWT Signature Token:</span>
            <code style={{
              background: 'rgba(241, 245, 249, 0.9)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              wordBreak: 'break-all',
              border: '1px solid var(--border-subtle)'
            }}>
              {token ? `${token.substring(0, 48)}...[truncated]` : 'No active token'}
            </code>
          </div>
        </div>
      </div>

      {/* 4. Demo Environment */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 24px',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(239, 68, 68, 0.04)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#dc2626' }}>
            Demo Environment (PS-13 State)
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Resets backend database and clears local IndexedDB queues back to pristine Version 1.
          </div>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={onResetDemo}
          disabled={isResetting}
          style={{ color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.3)', gap: '6px', fontWeight: 600 }}
        >
          <RotateCcw size={14} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo'}</span>
        </button>
      </div>
    </div>
  );
};
