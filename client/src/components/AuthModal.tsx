import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  Sparkles
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

  const modalBody = (
    <div
      className="modal-content"
      style={{
        maxWidth: '440px',
        width: '100%',
        padding: '0',
        boxShadow: '0 20px 50px -10px rgba(15, 23, 42, 0.16), 0 10px 20px -5px rgba(15, 23, 42, 0.08)',
        border: '1px solid rgba(226, 232, 240, 0.95)',
        borderRadius: 'var(--radius-xl)',
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        overflow: 'hidden'
      }}
    >
      {/* Modal Header */}
      <div style={{
        padding: '28px 28px 20px',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(124, 58, 237, 0.04) 100%)',
        borderBottom: '1px solid var(--border-subtle)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 6px 20px rgba(37, 99, 235, 0.3)'
        }}>
          <Shield size={28} color="#ffffff" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Secure Multi-Device Sync
        </h2>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.45 }}>
          Keep your work synchronized without silently losing changes.
        </p>
      </div>

      {/* Modal Body */}
      <div style={{ padding: '24px 28px' }}>
        {/* Error Banner */}
        {errorMessage && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#dc2626',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary CTA: Continue as Demo */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleQuickDemoLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '16px',
            gap: '8px',
            fontSize: '0.92rem',
            fontWeight: 700
          }}
        >
          <Sparkles size={16} />
          <span>Continue as Demo</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '14px 0',
          color: 'var(--text-muted)',
          fontSize: '0.75rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>
            or sign in with email
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  style={{ paddingLeft: '36px' }}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@syncsafe.io"
                style={{ paddingLeft: '36px' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: '36px' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-secondary"
            disabled={loading}
            style={{ width: '100%', padding: '10px', marginTop: '6px', gap: '8px', fontWeight: 700 }}
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => setIsRegister(false)}
                style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need an account?{' '}
              <button
                onClick={() => setIsRegister(true)}
                style={{ background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}
              >
                Create one
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (isRootScreen) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'var(--bg-app)',
        backgroundImage: 'radial-gradient(circle at 15% 15%, rgba(37, 99, 235, 0.08) 0%, transparent 45%), radial-gradient(circle at 85% 20%, rgba(124, 58, 237, 0.07) 0%, transparent 50%)'
      }}>
        {modalBody}
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      {modalBody}
    </div>
  );
};
