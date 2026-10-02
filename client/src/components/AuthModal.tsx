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
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onLoginSuccess,
  initialError,
  apiBaseUrl
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('demo@syncsafe.io');
  const [password, setPassword] = useState('demo1234');
  const [name, setName] = useState('Alex Rivera');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);

  if (!isOpen) return null;

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

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '440px',
          padding: '0',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          border: '1px solid var(--border-medium)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '24px 28px 18px',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)'
          }}>
            <Shield size={26} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {isRegister ? 'Create SyncSafe Account' : 'Sign in to SyncSafe'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Secure multi-device file synchronization & conflict safety
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px' }}>
          {/* Error Banner */}
          {errorMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              color: '#fda4af',
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

          {/* Quick Demo Sign In Button */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              marginBottom: '16px',
              gap: '8px',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              fontWeight: 700
            }}
          >
            <Sparkles size={16} />
            <span>1-Click Demo Sign In (Alex Rivera)</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '14px 0',
            color: 'var(--text-muted)',
            fontSize: '0.75rem'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              or continue with email
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
              style={{ width: '100%', padding: '10px', marginTop: '6px', gap: '8px', fontWeight: 600 }}
            >
              <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isRegister ? (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => setIsRegister(false)}
                  style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: 600 }}
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                Need an account?{' '}
                <button
                  onClick={() => setIsRegister(true)}
                  style={{ background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: 600 }}
                >
                  Create one
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
