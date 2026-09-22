import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Mail, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Zap, 
  Shield, 
  Settings,
  Server,
  X,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { api, getApiBaseUrl, getCustomApiUrl, setCustomApiUrl } from '../services/api';
import { User } from '../types';

interface AuthViewProps {
  onSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('analyst');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState(getCustomApiUrl() || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isRegister) {
        if (!fullName.trim()) {
          throw new Error('Please provide your full analyst name.');
        }
        const res = await api.register(email, password, fullName, role);
        onSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onSuccess(res.user);
      }
    } catch (err: any) {
      console.warn('Authentication error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials or backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantAccess = () => {
    const demoUser = api.loginAsDemo();
    onSuccess(demoUser);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'radial-gradient(ellipse at 50% 20%, rgba(0, 229, 255, 0.08) 0%, rgba(5, 7, 12, 1) 70%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Decorative Grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Main Container */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'rgba(0, 229, 255, 0.1)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: 'var(--cyan-glow)',
          }}>
            <ShieldAlert size={30} color="var(--cyan)" />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(255, 46, 91, 0.1)',
            border: '1px solid rgba(255, 46, 91, 0.3)',
            color: 'var(--crimson)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            marginBottom: '10px',
          }}>
            <Shield size={12} />
            RESTRICTED ACCESS PORTAL
          </div>

          <h1 style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
          }}>
            DEEPSHIELD<span style={{ color: 'var(--cyan)' }}>.AI</span>
          </h1>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginTop: '4px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
          }}>
            MULTIMODAL DEEPFAKE & VOICE CLONING DEFENSE
          </p>
        </div>

        {/* Auth Glass Panel */}
        <div className="glass-panel" style={{
          padding: '28px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          background: 'rgba(11, 14, 21, 0.88)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        }}>
          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            borderRadius: '6px',
            background: 'rgba(5, 7, 12, 0.6)',
            padding: '3px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '22px',
          }}>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '4px',
                border: 'none',
                background: !isRegister ? 'var(--cyan)' : 'transparent',
                color: !isRegister ? '#0A0D14' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setErrorMsg(''); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '4px',
                border: 'none',
                background: isRegister ? 'var(--cyan)' : 'transparent',
                color: isRegister ? '#0A0D14' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Register Analyst
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '6px',
              background: 'rgba(255, 46, 91, 0.1)',
              border: '1px solid rgba(255, 46, 91, 0.35)',
              color: 'var(--crimson)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              marginBottom: '18px',
              lineHeight: '1.4',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  ANALYST FULL NAME
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Alex Vance"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: '6px',
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid var(--border-subtle)',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
                SECURITY EMAIL IDENTIFIER
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="email"
                  required
                  placeholder="analyst@deepshield.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid var(--border-subtle)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
                ENCRYPTED PASSCODE
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 38px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid var(--border-subtle)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  OPERATIONAL CLEARANCE ROLE
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.65)',
                    border: '1px solid var(--border-subtle)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="analyst">Forensic Analyst (Level 2)</option>
                  <option value="responder">Incident Response Lead (Level 3)</option>
                  <option value="auditor">Biometric Compliance Auditor</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                fontSize: '13px',
                marginTop: '6px',
              }}
            >
              {loading ? (
                <span>Authenticating with Cryptographic Gateway...</span>
              ) : (
                <>
                  <span>{isRegister ? 'Authorize Analyst Account' : 'Authenticate & Enter HUD'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '22px 0 16px 0',
            color: 'var(--text-muted)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span>OR QUICK EVALUATION ACCESS</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          {/* Instant Access Button */}
          <button
            type="button"
            onClick={handleInstantAccess}
            className="btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '11px',
              fontSize: '12px',
              border: '1px dashed rgba(0, 229, 255, 0.35)',
              background: 'rgba(0, 229, 255, 0.05)',
              color: 'var(--cyan)',
            }}
          >
            <Zap size={14} color="var(--cyan)" />
            <span>Instant Analyst Access (Demo Session)</span>
          </button>
        </div>

        {/* Footer Endpoint Information */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '6px',
          background: 'rgba(11, 14, 21, 0.6)',
          border: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={13} color="var(--cyan)" />
            <span>GATEWAY: {getApiBaseUrl()}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
            }}
            title="Configure Backend Target Server"
          >
            <Settings size={12} />
            <span>Config</span>
          </button>
        </div>
      </div>

      {/* Backend Settings Modal */}
      {isConfigOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 7, 12, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            background: 'rgba(15, 20, 32, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={18} color="var(--cyan)" />
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>
                  Backend Server Configuration
                </h3>
              </div>
              <button
                onClick={() => setIsConfigOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Specify the target FastAPI backend URL (e.g. <code style={{ color: 'var(--cyan)' }}>http://127.0.0.1:8000</code> or your public cloud deployment). Leave empty for relative origin.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                TARGET BACKEND URL
              </label>
              <input
                type="text"
                placeholder="http://127.0.0.1:8000"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid var(--border-subtle)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
            </div>

            {saveSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald)', fontSize: '12px' }}>
                <Check size={14} />
                <span>Endpoint updated successfully.</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setCustomApiUrl(null);
                  setTargetUrl('');
                  setSaveSuccess(true);
                  setTimeout(() => {
                    setSaveSuccess(false);
                    setIsConfigOpen(false);
                  }, 600);
                }}
                className="btn-secondary"
                style={{ fontSize: '12px' }}
              >
                Reset Default
              </button>
              <button
                onClick={() => {
                  setCustomApiUrl(targetUrl);
                  setSaveSuccess(true);
                  setTimeout(() => {
                    setSaveSuccess(false);
                    setIsConfigOpen(false);
                  }, 600);
                }}
                className="btn-primary"
                style={{ fontSize: '12px' }}
              >
                Save Endpoint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
