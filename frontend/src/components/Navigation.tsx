import React from 'react';
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
  Award
} from 'lucide-react';
import { User, SystemHealth } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  health: SystemHealth | null;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onLogout,
  health,
}) => {
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
      <div style={{
        padding: '16px',
        margin: '12px',
        borderRadius: '6px',
        background: 'rgba(15, 20, 32, 0.6)',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ENGINE STATUS</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: health?.status === 'healthy' ? 'var(--emerald)' : 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
            <span className={health?.status === 'healthy' ? 'status-led status-led-emerald' : 'status-led status-led-amber'} />
            {health?.status === 'healthy' ? 'ONLINE' : 'DEGRADED'}
          </span>
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          DB: {health?.database || 'CONNECTED'}
        </div>
      </div>

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
    </aside>
  );
};
