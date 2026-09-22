import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Mic, 
  Image as ImageIcon, 
  Video, 
  Activity, 
  ArrowUpRight, 
  Clock, 
  FileSearch,
  Radar,
  Award,
  RefreshCw,
  WifiOff,
  Server
} from 'lucide-react';
import { DashboardStatistics, RecentAnalysisItem } from '../types';

interface DashboardViewProps {
  stats: DashboardStatistics | null;
  recent: RecentAnalysisItem[];
  loading: boolean;
  error?: string | null;
  isOfflineSnapshot?: boolean;
  onRetry?: () => void;
  onLoadSnapshot?: () => void;
  onNavigateToLab: () => void;
  onSelectAnalysis: (id: string) => void;
  onNavigateToOutputs?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recent,
  loading,
  error,
  isOfflineSnapshot,
  onRetry,
  onLoadSnapshot,
  onNavigateToLab,
  onSelectAnalysis,
  onNavigateToOutputs,
}) => {
  if (loading) {
    return (
      <div style={{ padding: '48px 32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'inline-block', width: '36px', height: '36px', border: '3px solid var(--border-subtle)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'radar-sweep 1s linear infinite' }} />
        <p style={{ marginTop: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.05em' }}>QUERYING DATABASE TELEMETRY...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
        <div className="glass-panel" style={{
          padding: '32px',
          border: '1px solid rgba(255, 46, 91, 0.3)',
          background: 'rgba(255, 46, 91, 0.04)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'rgba(255, 46, 91, 0.12)',
              border: '1px solid rgba(255, 46, 91, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <WifiOff size={24} color="var(--crimson)" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Backend Telemetry Disconnected
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                STATUS: UNREACHABLE · TARGET: {window.location.host}
              </p>
            </div>
          </div>

          <div style={{
            padding: '14px 16px',
            background: 'rgba(11, 14, 21, 0.8)',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
          }}>
            {error || 'Unable to query live PostgreSQL/SQLite database telemetry from the FastAPI backend.'}
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              If testing locally, start the backend via <code style={{ color: 'var(--cyan)' }}>start.bat</code> or run <code style={{ color: 'var(--cyan)' }}>cd backend && python main.py</code>.
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            {onRetry && (
              <button onClick={onRetry} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={15} />
                <span>Retry Connection</span>
              </button>
            )}
            {onLoadSnapshot && (
              <button onClick={onLoadSnapshot} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={15} color="var(--cyan)" />
                <span>Load Audited Telemetry Snapshot</span>
              </button>
            )}
            {onNavigateToOutputs && (
              <button onClick={onNavigateToOutputs} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={15} color="#818CF8" />
                <span>View Audited Project Outputs</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isZeroData = stats.total_analyses === 0;

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Offline Snapshot Notice Banner */}
      {isOfflineSnapshot && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '6px',
          background: 'rgba(255, 170, 0, 0.08)',
          border: '1px solid rgba(255, 170, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={18} color="var(--amber)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--amber)' }}>OFFLINE AUDITED SNAPSHOT:</strong> Live database connection is inactive. Showing verified held-out evaluation telemetry.
            </span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-secondary"
              style={{ padding: '4px 12px', fontSize: '11px', height: '28px' }}
            >
              <RefreshCw size={12} />
              <span>Connect Live</span>
            </button>
          )}
        </div>
      )}

      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Forensic Telemetry & Operations HUD
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: isOfflineSnapshot ? 'rgba(255, 170, 0, 0.1)' : 'rgba(0, 229, 255, 0.1)', color: isOfflineSnapshot ? 'var(--amber)' : 'var(--cyan)', border: isOfflineSnapshot ? '1px solid rgba(255, 170, 0, 0.25)' : '1px solid rgba(0, 229, 255, 0.25)', fontFamily: 'var(--font-mono)' }}>
              {isOfflineSnapshot ? 'AUDITED SNAPSHOT' : 'LIVE DEFENSE'}
            </span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Real-time biometric integrity monitoring across multimodal audio, visual, and video channels.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {onNavigateToOutputs && (
            <button onClick={onNavigateToOutputs} className="btn-secondary">
              <Award size={16} color="var(--cyan)" />
              <span>Project Outputs & Benchmarks</span>
            </button>
          )}
          <button onClick={onNavigateToLab} className="btn-primary">
            <FileSearch size={16} />
            <span>New Forensic Triage</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
      }}>
        {/* Total Ingested */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>TOTAL ANALYSES</span>
            <Activity size={16} color="var(--cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            {stats.total_analyses}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Database-audited records
          </div>
        </div>

        {/* Audio Analyses */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>AUDIO INGEST</span>
            <Mic size={16} color="var(--cobalt)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            {stats.audio_analyses}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Voice cloning checks
          </div>
        </div>

        {/* Image Analyses */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>IMAGE INGEST</span>
            <ImageIcon size={16} color="#818CF8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            {stats.image_analyses}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Spectral & ELA checks
          </div>
        </div>

        {/* Video Analyses */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>VIDEO INGEST</span>
            <Video size={16} color="#A78BFA" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            {stats.video_analyses}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Temporal jitter scans
          </div>
        </div>

        {/* Suspicious Anomalies */}
        <div className="glass-panel" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>SUSPICIOUS</span>
            <AlertTriangle size={16} color="var(--amber)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--amber)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            {stats.suspicious_detections}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Medium-risk anomalies
          </div>
        </div>

        {/* High Risk Threats */}
        <div className={stats.high_risk_analyses > 0 ? "glass-panel glass-panel-danger" : "glass-panel"} style={{ padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>HIGH RISK DEEPFAKES</span>
            <Flame size={16} color="var(--crimson)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--crimson)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            {stats.high_risk_analyses}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Confirmed synthetic vector
          </div>
        </div>
      </div>

      {/* Main Grid: Risk Distribution & Trends / Empty State */}
      {isZeroData ? (
        <div className="glass-panel" style={{
          padding: '48px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 229, 255, 0.05)',
            border: '1px dashed rgba(0, 229, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Radar size={32} color="var(--cyan)" />
          </div>
          <div style={{ maxWidth: '460px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
              No analysis data available.
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Real-time database audit confirmed 0 recorded analyses. In accordance with zero-mock integrity, no simulated attack curves or fake confidence percentages are generated.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {onNavigateToOutputs && (
              <button onClick={onNavigateToOutputs} className="btn-secondary">
                <Award size={16} color="var(--cyan)" />
                <span>View Audited Project Outputs & Benchmark</span>
              </button>
            )}
            <button onClick={onNavigateToLab} className="btn-primary">
              <FileSearch size={16} />
              <span>Upload Media for Forensic Analysis</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Risk Level Distribution Panel */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--cyan)" />
              Bayesian Threat Distribution
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Low Risk Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--emerald)' }}>Likely Authentic (Low Risk)</span>
                  <span className="font-mono">{stats.risk_distribution.low} ({Math.round((stats.risk_distribution.low / stats.total_analyses) * 100)}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(stats.risk_distribution.low / stats.total_analyses) * 100}%`, height: '100%', background: 'var(--emerald)', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Medium Risk Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--amber)' }}>Suspicious Anomaly (Medium Risk)</span>
                  <span className="font-mono">{stats.risk_distribution.medium} ({Math.round((stats.risk_distribution.medium / stats.total_analyses) * 100)}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(stats.risk_distribution.medium / stats.total_analyses) * 100}%`, height: '100%', background: 'var(--amber)', borderRadius: '4px' }} />
                </div>
              </div>

              {/* High Risk Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--crimson)' }}>Confirmed Deepfake (High Risk)</span>
                  <span className="font-mono">{stats.risk_distribution.high} ({Math.round((stats.risk_distribution.high / stats.total_analyses) * 100)}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(stats.risk_distribution.high / stats.total_analyses) * 100}%`, height: '100%', background: 'var(--crimson)', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 7-Day Ingestion Trends */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--cyan)" />
              Database Ingestion Activity (Past 7 Days)
            </h3>
            {stats.trends.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not enough data for this chart.</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '12px', paddingTop: '16px' }}>
                {stats.trends.map((t, idx) => {
                  const maxVal = Math.max(...stats.trends.map(x => x.total), 1);
                  const heightPercent = Math.max(8, (t.total / maxVal) * 100);
                  return (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
                      <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t.total}</div>
                      <div style={{
                        width: '100%',
                        height: `${heightPercent}%`,
                        background: t.synthetic > 0 ? 'var(--crimson)' : 'var(--cyan)',
                        borderRadius: '3px 3px 0 0',
                        opacity: 0.85,
                      }} />
                      <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t.date}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Analyses Stream */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--cyan)" />
            Recent Forensic Evidence Records
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            LIVE LEDGER
          </span>
        </div>

        {recent.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No recent analyses found in the database.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  <th style={{ padding: '10px 12px' }}>ANALYSIS ID</th>
                  <th style={{ padding: '10px 12px' }}>MEDIA</th>
                  <th style={{ padding: '10px 12px' }}>TARGET FILENAME</th>
                  <th style={{ padding: '10px 12px' }}>SYNTHETIC PROBABILITY</th>
                  <th style={{ padding: '10px 12px' }}>RISK LEVEL</th>
                  <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr 
                    key={item.id} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s ease' }}
                  >
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
                      {item.id.slice(0, 8)}...
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '3px', 
                        fontSize: '10px', 
                        fontFamily: 'var(--font-mono)', 
                        textTransform: 'uppercase',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-primary)',
                      }}>
                        {item.media_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#FFFFFF', fontWeight: 500 }}>
                      {item.original_filename}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(item.synthetic_probability * 100)}%
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge-${item.risk_level}`}>
                        <span className={`status-led status-led-${item.risk_level === 'high' ? 'crimson' : (item.risk_level === 'medium' ? 'amber' : 'emerald')}`} />
                        {item.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {item.created_at}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => onSelectAnalysis(item.id)}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        <span>Inspect</span>
                        <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
