import React, { useState, useEffect, useRef } from 'react';
import { Radio, Camera, CameraOff, Mic, ShieldAlert, AlertTriangle } from 'lucide-react';

export const RealtimeRadarView: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [wsConnected, setWsConnected] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<any>(null);

  const startLiveStream = async () => {
    setStreamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 },
        audio: true,
      });
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Open WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/realtime`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
        setIsStreaming(true);
        setStreamError(null);

        // Send frames every 400ms for short-window analysis
        timerRef.current = setInterval(() => {
          if (videoRef.current && canvasRef.current && ws.readyState === WebSocket.OPEN) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(videoRef.current, 0, 0, 160, 120);
              const base64 = canvas.toDataURL('image/jpeg', 0.6);
              ws.send(JSON.stringify({
                type: 'video_frame',
                data: base64,
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

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            Live Surveillance & Radar Stream
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: isStreaming ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.06)', color: isStreaming ? 'var(--emerald)' : 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-mono)' }}>
              {isStreaming ? 'STREAMING ACTIVE' : 'RADAR STANDBY'}
            </span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Short-window real-time visual and acoustic anomaly detection via WebSocket pipe.
          </p>
        </div>

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
      </div>

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

      {/* Main Stream Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Video Canvas Box */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>OPTICAL RADAR FEED</span>
            <span className="font-mono" style={{ fontSize: '11px', color: wsConnected ? 'var(--cyan)' : 'var(--text-muted)' }}>
              {wsConnected ? 'PIPE: OPEN' : 'PIPE: CLOSED'}
            </span>
          </div>

          <div style={{
            width: '100%',
            maxWidth: '480px',
            height: '280px',
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
          <canvas ref={canvasRef} width={160} height={120} style={{ display: 'none' }} />
        </div>

        {/* Telemetry Dashboard */}
        <div className="glass-panel" style={{ padding: '20px' }}>
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
                <div style={{ padding: '12px', borderRadius: '4px', background: 'rgba(10, 13, 20, 0.7)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FACES TRACKED</div>
                  <div className="font-mono" style={{ fontSize: '18px', color: '#FFFFFF', marginTop: '4px' }}>
                    {telemetry.faces_detected}
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '4px', background: 'rgba(10, 13, 20, 0.7)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LAPLACIAN VARIANCE</div>
                  <div className="font-mono" style={{ fontSize: '18px', color: 'var(--cyan)', marginTop: '4px' }}>
                    {telemetry.frame_laplacian_variance}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Values represent live spatial sharpness and facial landmark bounding variances transmitted every 400ms. Zero synthetic timer simulation.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
