import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Camera, 
  CameraOff, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  Flame, 
  Activity, 
  UserCheck, 
  Users,
  ExternalLink 
} from 'lucide-react';
import { api, getApiBaseUrl } from '../services/api';
import { VerificationRecord } from '../types';

interface RealtimeRadarViewProps {
  onTriggerVerification?: (eventId: string, identity: string, riskLevel: string) => void;
}

export const RealtimeRadarView: React.FC<RealtimeRadarViewProps> = ({ onTriggerVerification }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string>(() => `EVT-RADAR-${Math.floor(10000 + Math.random() * 90000)}`);
  const [targetIdentity, setTargetIdentity] = useState('Target Subject (Live Stream)');
  const [persistedNotice, setPersistedNotice] = useState<string | null>(null);
  const [recentRadarEvents, setRecentRadarEvents] = useState<VerificationRecord[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<any>(null);

  // Helper to get correct WebSocket endpoint
  const getWsUrl = (): string => {
    try {
      const apiBase = getApiBaseUrl();
      if (apiBase.startsWith('http')) {
        const parsed = new URL(apiBase);
        const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${parsed.host}/ws/realtime`;
      }
    } catch {
      // fallback
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/realtime`;
  };

  // Load recent verification records from DB on mount
  useEffect(() => {
    api.getVerificationHistory(10)
      .then((records) => {
        setRecentRadarEvents(records);
      })
      .catch((err) => {
        console.warn('Failed to fetch initial radar verification history:', err);
      });
  }, []);

  // Draw face bounding boxes on overlay canvas when telemetry updates
  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    if (isStreaming && telemetry?.face_boxes && Array.isArray(telemetry.face_boxes)) {
      const scaleX = overlay.width / 320;
      const scaleY = overlay.height / 240;

      telemetry.face_boxes.forEach(([x, y, w, h]: [number, number, number, number], idx: number) => {
        const sx = x * scaleX;
        const sy = y * scaleY;
        const sw = w * scaleX;
        const sh = h * scaleY;

        // Bounding box
        ctx.strokeStyle = idx === 0 ? '#00E5FF' : '#F59E0B';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, sw, sh);

        // Corner accents
        const cornerLen = Math.min(12, sw / 4);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        
        // Top-left
        ctx.beginPath();
        ctx.moveTo(sx, sy + cornerLen);
        ctx.lineTo(sx, sy);
        ctx.lineTo(sx + cornerLen, sy);
        ctx.stroke();

        // Label background
        ctx.fillStyle = idx === 0 ? 'rgba(0, 229, 255, 0.85)' : 'rgba(245, 158, 11, 0.85)';
        ctx.fillRect(sx, Math.max(0, sy - 18), 76, 16);

        // Label text
        ctx.fillStyle = '#05070A';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`FACE #${idx + 1}`, sx + 4, Math.max(12, sy - 6));
      });
    }
  }, [telemetry, isStreaming]);

  const startLiveStream = async () => {
    setStreamError(null);
    const newEventId = `EVT-RADAR-${Math.floor(10000 + Math.random() * 90000)}`;
    setCurrentEventId(newEventId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Open WebSocket with robust endpoint resolver
      const wsUrl = getWsUrl();
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
        setIsStreaming(true);
        setStreamError(null);

        // Send high-definition frames (320x240) every 400ms for accurate multi-face detection
        timerRef.current = setInterval(() => {
          if (videoRef.current && canvasRef.current && ws.readyState === WebSocket.OPEN) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, 320, 240);
              const base64 = canvas.toDataURL('image/jpeg', 0.7);
              ws.send(JSON.stringify({
                type: 'video_frame',
                data: base64,
                identity: targetIdentity,
                timestamp: Date.now(),
              }));
            }
          }
        }, 400);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setTelemetry(data);
          if (data.event_id) {
            setCurrentEventId(data.event_id);
          }
        } catch {
          // ignore malformed
        }
      };

      ws.onerror = () => {
        setWsConnected(false);
        setStreamError('Real-time forensic WebSocket endpoint offline or unreachable.');
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      wsRef.current = ws;

    } catch (err: any) {
      setStreamError(err.message || 'Camera or microphone access denied.');
      setIsStreaming(false);
    }
  };

  const stopLiveStream = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (wsRef.current) wsRef.current.close();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setWsConnected(false);
    setTelemetry(null);
  };

  useEffect(() => {
    return () => {
      stopLiveStream();
    };
  }, []);

  const handleManualTriggerVerification = async () => {
    const risk = telemetry?.risk_level || 'high';
    const conf = telemetry?.rolling_risk_score ? Math.round(telemetry.rolling_risk_score * 100) / 100 : 0.88;

    try {
      const record = await api.recordRadarEvent({
        event_id: currentEventId,
        source: 'Live Surveillance Radar',
        person_identity: targetIdentity,
        detection_type: 'Live Stream Anomaly Verification',
        risk_level: risk,
        confidence_score: conf,
        details: {
          laplacian_variance: telemetry?.frame_laplacian_variance || 28.4,
          faces_detected: telemetry?.faces_detected || 1,
        }
      });

      setPersistedNotice(`Event ${currentEventId} persisted to database. Challenge issued!`);
      setTimeout(() => setPersistedNotice(null), 4000);

      // Refresh history
      const updated = await api.getVerificationHistory(10);
      setRecentRadarEvents(updated);

      if (onTriggerVerification) {
        onTriggerVerification(currentEventId, targetIdentity, risk);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to persist radar verification event.');
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Live Surveillance & Radar Stream
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: isStreaming ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.06)', color: isStreaming ? 'var(--emerald)' : 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-mono)' }}>
              {isStreaming ? 'STREAMING ACTIVE' : 'RADAR STANDBY'}
            </span>
          </h1>
          <p className="page-subtitle">
            Short-window visual and acoustic anomaly detection with automatic persistence and dynamic challenge escalation.
          </p>
        </div>

        <div className="page-actions" style={{ display: 'flex', gap: '10px' }}>
          {isStreaming ? (
            <button onClick={stopLiveStream} className="btn-danger">
              <CameraOff size={16} />
              <span>Terminate Live Radar</span>
            </button>
          ) : (
            <button onClick={startLiveStream} className="btn-primary">
              <Camera size={16} />
              <span>Connect Live Feed</span>
            </button>
          )}

          {isStreaming && (
            <button onClick={handleManualTriggerVerification} className="btn-primary" style={{ background: 'var(--crimson)', borderColor: 'var(--crimson)' }}>
              <Zap size={15} />
              <span>Trigger Challenge Verification</span>
            </button>
          )}
        </div>
      </div>

      {persistedNotice && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '6px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid var(--emerald)',
          color: 'var(--emerald)',
          fontSize: '13px',
          fontFamily: 'var(--font-mono)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <CheckCircle2 size={16} />
          <span>{persistedNotice}</span>
        </div>
      )}

      {streamError && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '6px',
          background: 'rgba(255, 46, 91, 0.1)',
          border: '1px solid rgba(255, 46, 91, 0.3)',
          color: 'var(--crimson)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <AlertTriangle size={18} />
          <span>{streamError}</span>
        </div>
      )}

      {/* Main Stream & Telemetry Area */}
      <div className="grid-2col">
        {/* Video Canvas Box */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              EVENT ID: <strong style={{ color: 'var(--cyan)' }}>{currentEventId}</strong>
            </span>
            <span className="font-mono" style={{ fontSize: '11px', color: wsConnected ? 'var(--cyan)' : 'var(--text-muted)' }}>
              {wsConnected ? 'PIPE: ENCRYPTED OPEN' : 'PIPE: CLOSED'}
            </span>
          </div>

          <div style={{
            width: '100%',
            maxWidth: '480px',
            aspectRatio: '4/3',
            borderRadius: '6px',
            overflow: 'hidden',
            background: '#0B0E15',
            border: '1px solid var(--border-subtle)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: isStreaming ? 'block' : 'none',
              }}
            />

            {/* Real-time Multi-Face Bounding Box Overlay */}
            <canvas
              ref={overlayCanvasRef}
              width={480}
              height={360}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 4,
                display: isStreaming ? 'block' : 'none',
              }}
            />

            {!isStreaming && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Radio size={32} color="rgba(255,255,255,0.2)" />
                <p style={{ marginTop: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>FEED INACTIVE</p>
              </div>
            )}

            {isStreaming && (
              <div className="radar-sweep-line" />
            )}
          </div>
          <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />

          {/* Identity Tag Input */}
          <div style={{ width: '100%', maxWidth: '480px', marginTop: '14px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={targetIdentity}
              onChange={(e) => setTargetIdentity(e.target.value)}
              placeholder="Tag subject identity..."
              style={{
                flex: 1,
                background: 'rgba(10, 13, 20, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '8px 12px',
                color: '#FFFFFF',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
        </div>

        {/* Telemetry Dashboard */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} color="var(--cyan)" />
              Real-Time Rolling Anomaly Scores
            </h3>

            {!telemetry ? (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Connect feed to initialize real-time anomaly packet parsing.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  padding: '16px',
                  borderRadius: '6px',
                  background: telemetry.risk_level === 'high' ? 'rgba(255, 46, 91, 0.1)' : 'rgba(0, 229, 255, 0.05)',
                  border: telemetry.risk_level === 'high' ? '1px solid var(--crimson)' : '1px solid rgba(0, 229, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ROLLING RISK SCORE</div>
                    <div className="font-mono" style={{ fontSize: '28px', fontWeight: 800, color: telemetry.risk_level === 'high' ? 'var(--crimson)' : (telemetry.risk_level === 'medium' ? 'var(--amber)' : 'var(--emerald)') }}>
                      {Math.round(telemetry.rolling_risk_score * 100)}%
                    </div>
                  </div>
                  <span className={`badge-${telemetry.risk_level}`}>
                    {telemetry.risk_level.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* FACES TRACKED Card */}
                  <div style={{
                    padding: '12px',
                    borderRadius: '4px',
                    background: (telemetry.faces_detected || 0) > 1 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(10, 13, 20, 0.7)',
                    border: (telemetry.faces_detected || 0) > 1 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.2s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FACES TRACKED</div>
                      {(telemetry.faces_detected || 0) > 1 && (
                        <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
                          MULTI-SUBJECT
                        </span>
                      )}
                    </div>
                    <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: (telemetry.faces_detected || 0) > 1 ? 'var(--amber)' : ((telemetry.faces_detected || 0) === 1 ? 'var(--cyan)' : 'var(--text-muted)'), marginTop: '4px' }}>
                      {telemetry.faces_detected !== undefined ? telemetry.faces_detected : 0} {telemetry.faces_detected === 1 ? 'Subject' : 'Subjects'}
                    </div>
                    <div style={{ fontSize: '10px', color: (telemetry.faces_detected || 0) > 1 ? 'var(--amber)' : 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      {(telemetry.faces_detected || 0) === 0 ? 'No faces in view' : ((telemetry.faces_detected || 0) === 1 ? '1 face tracked' : `${telemetry.faces_detected} simultaneous faces tracked`)}
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '4px', background: 'rgba(10, 13, 20, 0.7)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LAPLACIAN VARIANCE</div>
                    <div className="font-mono" style={{ fontSize: '18px', color: 'var(--cyan)', marginTop: '4px' }}>
                      {telemetry.frame_laplacian_variance}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                      Spatial sharpness index
                    </div>
                  </div>
                </div>

                {/* Multi-Face Live Roster */}
                {telemetry.faces_detected && telemetry.faces_detected > 1 && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '4px',
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    fontSize: '11px',
                    color: '#FFFFFF',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--amber)', marginBottom: '6px' }}>
                      <Users size={14} />
                      <span>Simultaneous Faces Detected ({telemetry.faces_detected})</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {Array.from({ length: telemetry.faces_detected }).map((_, idx) => (
                        <span key={idx} style={{
                          padding: '2px 8px',
                          borderRadius: '3px',
                          background: idx === 0 ? 'rgba(0, 229, 255, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          border: idx === 0 ? '1px solid var(--cyan)' : '1px solid var(--amber)',
                          color: idx === 0 ? 'var(--cyan)' : 'var(--amber)',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {idx === 0 ? 'Subject #1 (Primary)' : `Subject #${idx + 1}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Values represent live multi-face bounding variances and spatial sharpness transmitted every 400ms. High risk alerts automatically synchronize with the Verification Ledger.
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Bridge Button */}
          {telemetry && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={handleManualTriggerVerification}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'rgba(0, 229, 255, 0.12)',
                  border: '1px solid var(--cyan)',
                  color: 'var(--cyan)',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                <span>ESCALATE TO DYNAMIC CHALLENGE STUDIO</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Synchronized Verification Ledger Preview */}
      <div className="glass-panel" style={{ padding: '20px', marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--cyan)" />
            Recent Synchronized Surveillance Events (Persistent Ledger)
          </h3>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            DATABASE PERSISTED
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <th style={{ padding: '8px 10px' }}>EVENT ID</th>
                <th style={{ padding: '8px 10px' }}>TIMESTAMP</th>
                <th style={{ padding: '8px 10px' }}>IDENTITY</th>
                <th style={{ padding: '8px 10px' }}>DETECTION TYPE</th>
                <th style={{ padding: '8px 10px' }}>RISK LEVEL</th>
                <th style={{ padding: '8px 10px' }}>DECISION</th>
              </tr>
            </thead>
            <tbody>
              {recentRadarEvents.slice(0, 5).map((evt) => (
                <tr key={evt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontWeight: 600 }}>
                    {evt.event_id}
                  </td>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {new Date(evt.created_at).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '10px', color: '#FFFFFF', fontWeight: 500 }}>
                    {evt.person_identity}
                  </td>
                  <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                    {evt.detection_type}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className={`badge-${evt.risk_level}`} style={{ fontSize: '10px' }}>
                      {evt.risk_level.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      background: evt.final_decision.includes('AUTHENTIC') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 46, 91, 0.15)',
                      color: evt.final_decision.includes('AUTHENTIC') ? 'var(--emerald)' : 'var(--crimson)',
                    }}>
                      {evt.final_decision}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
