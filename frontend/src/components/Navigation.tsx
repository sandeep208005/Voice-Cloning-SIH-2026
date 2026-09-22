import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  UploadCloud, 
  Radio, 
  CheckCircle2, 
  Database, 
  Cpu, 
  User as UserIcon, 
  LogOut,
  Award,
  Settings,
  X,
  Check,
  RefreshCw,
  Server
} from 'lucide-react';
import { User, SystemHealth } from '../types';
import { getCustomApiUrl, setCustomApiUrl, getApiBaseUrl } from '../services/api';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  health: SystemHealth | null;
  onRefreshHealth?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onLogout,
  health,
  onRefreshHealth,
}) => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState(getCustomApiUrl() || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const navItems = [
    { id: 'dashboard', label: 'Dashboard HUD', icon: Activity },
    { id: 'outputs', label: 'Project Outputs', icon: Award },
    { id: 'lab', label: 'Forensic Lab', icon: UploadCloud },
    { id: 'realtime', label: 'Live Radar', icon: Radio },
    { id: 'challenge', label: 'Challenge Studio', icon: CheckCircle2 },
    { id: 'history', label: 'Forensic Logs', icon: Database },
    { id: 'models', label: 'Model Registry', icon: Cpu },
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'rgba(11, 14, 21, 0.95)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          background: 'rgba(0, 229, 255, 0.1)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--cyan-glow)',
        }}>
          <ShieldAlert size={22} color="var(--cyan)" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            DEEPSHIELD<span style={{ color: 'var(--cyan)' }}>.AI</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            MULTIMODAL DEFENSE v1.0
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '6px',
                border: isActive ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid transparent',
                background: isActive ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
                color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={18} color={isActive ? 'var(--cyan)' : 'var(--text-muted)'} />
              <span>{item.label}</span>
              {isActive && (
                <div style={{ marginLeft: 'auto', width: '4px', height: '14px', background: 'var(--cyan)', borderRadius: '2px' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* System Telemetry Indicator */}
      {(() => {
        const isHealthy = health?.status === 'healthy';
        const isDegraded = health?.status === 'degraded';
        const statusLabel = isHealthy ? 'ONLINE' : isDegraded ? 'DEGRADED' : 'OFFLINE';
        const statusColor = isHealthy ? 'var(--emerald)' : isDegraded ? 'var(--amber)' : '#94A3B8';
        const ledClass = isHealthy ? 'status-led status-led-emerald' : isDegraded ? 'status-led status-led-amber' : 'status-led status-led-gray';
        const dbLabel = isHealthy 
          ? (health.database === 'healthy' ? 'CONNECTED' : health.database) 
          : isDegraded 
          ? (health.database || 'DEGRADED') 
          : 'DISCONNECTED';

        return (
          <div style={{
            padding: '14px 16px',
            margin: '12px',
            borderRadius: '6px',
            background: 'rgba(15, 20, 32, 0.6)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ENGINE STATUS</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: statusColor, fontFamily: 'var(--font-mono)' }}>
                  <span className={ledClass} />
                  {statusLabel}
                </span>
                <button
                  onClick={() => {
                    setTargetUrl(getCustomApiUrl() || '');
                    setIsConfigOpen(true);
                  }}
                  title="Configure Backend Server Endpoint"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Settings size={12} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>DB: {dbLabel}</span>
              {!isHealthy && onRefreshHealth && (
                <button
                  onClick={onRefreshHealth}
                  title="Ping Backend"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--cyan)',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  RECONNECT
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* User / Auth Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(0, 229, 255, 0.15)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cyan)',
              fontSize: '12px',
              fontWeight: 700,
            }}>
              {user.full_name[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {user.role.toUpperCase()}
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <UserIcon size={14} />
            <span>Analyst Login</span>
          </button>
        )}
      </div>

      {/* Backend Connection Modal */}
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
            maxWidth: '460px',
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
              Configure the DeepShield AI FastAPI backend endpoint. Leave blank to use the relative origin (<code style={{ color: 'var(--cyan)' }}>/api/v1</code>).
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                ACTIVE ENDPOINT
              </label>
              <div style={{
                padding: '8px 12px',
                borderRadius: '4px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-subtle)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--cyan)',
              }}>
                {getApiBaseUrl()}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                CUSTOM BACKEND URL (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="e.g. http://127.0.0.1:8000 or https://api.yourdomain.com"
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
                <span>Configuration saved successfully! Pinging server...</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setCustomApiUrl(null);
                  setTargetUrl('');
                  setSaveSuccess(true);
                  onRefreshHealth?.();
                  setTimeout(() => {
                    setSaveSuccess(false);
                    setIsConfigOpen(false);
                  }, 800);
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
                  onRefreshHealth?.();
                  setTimeout(() => {
                    setSaveSuccess(false);
                    setIsConfigOpen(false);
                  }, 800);
                }}
                className="btn-primary"
                style={{ fontSize: '12px' }}
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
