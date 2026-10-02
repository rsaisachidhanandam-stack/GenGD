import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Laptop,
  Cloud,
  Smartphone,
  HardDrive,
  RefreshCw,
  GitMerge,
  Eye,
  EyeOff
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onLoginSuccess: (token: string, user: { id: string; name: string; email: string }) => void;
  initialError?: string | null;
  apiBaseUrl: string;
  isRootScreen?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onLoginSuccess,
  initialError,
  apiBaseUrl,
  isRootScreen = false
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('demo@syncsafe.io');
  const [password, setPassword] = useState('demo1234');
  const [name, setName] = useState('Alex Rivera');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);

  React.useEffect(() => {
    if (initialError) {
      setErrorMessage(initialError);
    }
  }, [initialError]);

  if (!isOpen && !isRootScreen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { email, password, name } : { email, password };

    try {
      const res = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Try logging in as demo user
      const loginRes = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@syncsafe.io', password: 'demo1234' })
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        onLoginSuccess(data.token, data.user);
        return;
      }

      // 2. If user doesn't exist, call demo reset to seed pristine demo user
      const resetRes = await fetch(`${apiBaseUrl}/api/demo/reset`, { method: 'POST' });
      if (resetRes.ok) {
        const rData = await resetRes.json();
        onLoginSuccess(rData.seed.token, rData.seed.user);
        return;
      }

      throw new Error('Could not authenticate demo user. Ensure backend is running.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick demo login failed');
    } finally {
      setLoading(false);
    }
  };

  // Right-hand authentication card
  const renderAuthCard = () => (
    <div className="auth-glass-card">
      {/* Card Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: '6px' }}>
          {isRegister ? 'Create an account' : 'Welcome back'}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
          {isRegister ? 'Sign up to start synchronizing with zero silent data loss' : 'Sign in to continue to SyncSafe'}
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div style={{
          padding: '12px 14px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Authentication Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isRegister && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Full Name
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="text"
                className="auth-input-dark"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
            Email Address
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="email"
              className="auth-input-dark"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@syncsafe.io"
              required
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
            Password
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              className="auth-input-dark"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ paddingRight: '40px' }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Primary Action Button: Sign In / Create Account */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '11px',
            marginTop: '6px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            border: 'none',
            borderRadius: '10px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
            transition: 'all 0.2s ease',
            opacity: loading ? 0.7 : 1
          }}
        >
          <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
          <ArrowRight size={16} />
        </button>
      </form>

      {/* Divider: OR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        margin: '20px 0',
        color: '#64748b',
        fontSize: '0.72rem'
      }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
        <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700 }}>
          OR
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
      </div>

      {/* Secondary/Demo Action Button: Continue as Demo */}
      <button
        type="button"
        onClick={handleQuickDemoLogin}
        disabled={loading}
        style={{
          width: '100%',
          padding: '11px',
          background: 'rgba(37, 99, 235, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '10px',
          color: '#93c5fd',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease'
        }}
      >
        <Sparkles size={16} color="#60a5fa" />
        <span>Continue as Demo</span>
      </button>

      {/* Demo helper info */}
      <p style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', marginTop: '8px' }}>
        Pre-configured demo with Alex Rivera & dual-device simulation
      </p>

      {/* Toggle between Sign In and Registration */}
      <div style={{ textAlign: 'center', marginTop: '22px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.82rem', color: '#94a3b8' }}>
        {isRegister ? (
          <span>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: 700, marginLeft: '4px' }}
            >
              Sign In
            </button>
          </span>
        ) : (
          <span>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: 700, marginLeft: '4px' }}
            >
              Create one
            </button>
          </span>
        )}
      </div>
    </div>
  );

  // Left-hand product introduction
  const renderProductIntro = () => (
    <div className="auth-intro-side">
      {/* Brand & Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <Shield size={24} color="#ffffff" strokeWidth={2.2} />
        </div>
        <div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            SyncSafe
          </div>
          <span className="auth-brand-badge" style={{ marginTop: '3px' }}>
            PS-13 · Multi-Device Sync
          </span>
        </div>
      </div>

      {/* Hero Heading */}
      <div>
        <h1 className="auth-hero-title">
          YOUR FILES.<br />
          EVERY DEVICE.<br />
          ALWAYS CONSISTENT.
        </h1>
        <p className="auth-hero-subtitle" style={{ marginTop: '12px' }}>
          Work offline. Sync safely. Resolve conflicts without silently losing changes.
        </p>
      </div>

      {/* Core Architecture Diagram: Laptop → SyncSafe Cloud → Phone */}
      <div className="auth-arch-card">
        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#64748b', marginBottom: '14px' }}>
          Core System Architecture
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          {/* Node 1: Laptop */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', flex: 1 }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(37, 99, 235, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa'
            }}>
              <Laptop size={20} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
              Laptop
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Local IndexedDB
            </div>
          </div>

          {/* Flow Indicator 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ height: '2px', width: '28px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
            <span style={{ fontSize: '0.62rem', color: '#38bdf8', fontWeight: 700 }}>sync</span>
          </div>

          {/* Node 2: SyncSafe Cloud */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', flex: 1.1 }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(124, 58, 237, 0.25) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
              boxShadow: '0 0 20px rgba(124, 58, 237, 0.2)'
            }}>
              <Cloud size={24} />
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
              SyncSafe Cloud
            </div>
            <div style={{ fontSize: '0.68rem', color: '#a78bfa' }}>
              Authoritative SQLite
            </div>
          </div>

          {/* Flow Indicator 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ height: '2px', width: '28px', background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)' }} />
            <span style={{ fontSize: '0.62rem', color: '#22d3ee', fontWeight: 700 }}>sync</span>
          </div>

          {/* Node 3: Phone */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '6px', flex: 1 }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22d3ee'
            }}>
              <Smartphone size={20} />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
              Phone
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              Offline PWA
            </div>
          </div>
        </div>
      </div>

      {/* Three Compact Feature Highlights */}
      <div className="auth-features-list">
        {/* Highlight 1: Offline First */}
        <div className="auth-feature-item">
          <div className="auth-feature-icon-box" style={{ background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.25)', color: '#22d3ee' }}>
            <HardDrive size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
              1. Offline First
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
              Continue working even without an internet connection.
            </div>
          </div>
        </div>

        {/* Highlight 2: Smart Synchronization */}
        <div className="auth-feature-item">
          <div className="auth-feature-icon-box" style={{ background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#60a5fa' }}>
            <RefreshCw size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
              2. Smart Synchronization
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
              Safely synchronize changes across multiple devices.
            </div>
          </div>
        </div>

        {/* Highlight 3: Conflict Protection */}
        <div className="auth-feature-item">
          <div className="auth-feature-icon-box" style={{ background: 'rgba(124, 58, 237, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)', color: '#c084fc' }}>
            <GitMerge size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
              3. Conflict Protection
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
              Preserve conflicting changes instead of silently overwriting them.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // If rendered as the root entry screen (user not yet authenticated)
  if (isRootScreen) {
    return (
      <div className="auth-root-wrapper">
        <div className="auth-container">
          {renderProductIntro()}
          <div className="auth-card-side">
            {renderAuthCard()}
          </div>
        </div>
      </div>
    );
  }

  // If rendered as an in-app overlay modal (e.g. session expiry re-auth)
  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        {renderAuthCard()}
      </div>
    </div>
  );
};
