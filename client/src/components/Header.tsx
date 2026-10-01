import React from 'react';
import { ShieldCheck, RefreshCw, Smartphone, Laptop, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  user: { name: string; email: string } | null;
  serverOnline: boolean;
  viewMode: 'dual' | 'laptop' | 'mobile';
  setViewMode: (mode: 'dual' | 'laptop' | 'mobile') => void;
  onResetDemo: () => void;
  isResetting: boolean;
  onOpenDemoScript: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  serverOnline,
  viewMode,
  setViewMode,
  onResetDemo,
  isResetting,
  onOpenDemoScript
}) => {
  return (
    <header style={{
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
        }}>
          <ShieldCheck size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              SyncSafe
            </h1>
            <span style={{ fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              PS-13 Prototype
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Multi-Device Sync • Durable Offline Queue • Field-Level 3-Way Merge
          </p>
        </div>
      </div>

      {/* View Switcher & Demo Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Device View Mode */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            className={`btn btn-sm ${viewMode === 'dual' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', padding: '4px 10px' }}
            onClick={() => setViewMode('dual')}
          >
            <Laptop size={14} /> + <Smartphone size={14} /> Dual View
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'laptop' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', padding: '4px 10px' }}
            onClick={() => setViewMode('laptop')}
          >
            <Laptop size={14} /> Laptop Only
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'mobile' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', padding: '4px 10px' }}
            onClick={() => setViewMode('mobile')}
          >
            <Smartphone size={14} /> Mobile Only
          </button>
        </div>

        {/* Guided Demo Walkthrough Trigger */}
        <button
          className="btn btn-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            color: '#c084fc'
          }}
          onClick={onOpenDemoScript}
        >
          <Sparkles size={14} /> Guided Demo Script
        </button>

        {/* Reset Demo Data Button */}
        <button
          className="btn btn-sm btn-secondary"
          onClick={onResetDemo}
          disabled={isResetting}
          title="Resets database to clean Version 1 seed state"
        >
          <RefreshCw size={14} className={isResetting ? 'animate-spin' : ''} />
          {isResetting ? 'Resetting...' : 'Reset Demo (V1)'}
        </button>

        {/* Server & User Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.75rem',
            color: serverOnline ? '#34d399' : '#f87171'
          }}>
            {serverOnline ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{serverOnline ? 'Backend Online' : 'Backend Offline'}</span>
          </div>

          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-surface-elevated)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              border: '1px solid var(--border-subtle)'
            }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10b981'
              }} />
              <span style={{ fontWeight: 600 }}>{user.name}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
