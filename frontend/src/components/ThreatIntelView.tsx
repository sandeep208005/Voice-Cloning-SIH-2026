import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Globe, 
  Radio, 
  TrendingUp, 
  AlertTriangle, 
  Filter, 
  Download, 
  RefreshCw, 
  UserX, 
  Zap, 
  Flame, 
  Eye, 
  Layers
} from 'lucide-react';

interface ThreatEvent {
  id: string;
  time: string;
  type: 'Voice Clone' | 'Video Deepfake' | 'Image Manipulation' | 'IVR Biometric Spoof';
  riskScore: number;
  targetIdentity: string;
  targetRole: string;
  status: 'BLOCKED' | 'CHALLENGE_ISSUED' | 'QUARANTINED' | 'FLAGGED';
  originCountry: string;
  originIp: string;
  synthesizerModel: string;
  audioHash: string;
}

const INITIAL_THREAT_FEED: ThreatEvent[] = [
  {
    id: 'EVT-9042',
    time: '14:32:08',
    type: 'Voice Clone',
    riskScore: 94.7,
    targetIdentity: 'Rajesh Sharma',
    targetRole: 'Chief Financial Officer',
    status: 'BLOCKED',
    originCountry: 'Singapore (SG)',
    originIp: '103.14.28.91',
    synthesizerModel: 'ElevenLabs Multilingual v2',
    audioHash: '8e4f1a...c9d2',
  },
  {
    id: 'EVT-9041',
    time: '14:30:45',
    type: 'Video Deepfake',
    riskScore: 89.2,
    targetIdentity: 'Sarah Jenkins',
    targetRole: 'VP of Treasury Ops',
    status: 'BLOCKED',
    originCountry: 'United Kingdom (GB)',
    originIp: '185.220.101.5',
    synthesizerModel: 'SadTalker / LivePortrait-GAN',
    audioHash: '3a1b7e...99fa',
  },
  {
    id: 'EVT-9040',
    time: '14:28:12',
    type: 'Voice Clone',
    riskScore: 97.4,
    targetIdentity: 'Vikram Mehta',
    targetRole: 'Senior Banking Authorizer',
    status: 'BLOCKED',
    originCountry: 'Russia (RU)',
    originIp: '194.26.29.134',
    synthesizerModel: 'XTTS-v2 Diffusion Model',
    audioHash: 'f412c0...44aa',
  },
  {
    id: 'EVT-9039',
    time: '14:25:33',
    type: 'IVR Biometric Spoof',
    riskScore: 91.8,
    targetIdentity: 'Aditi Roy',
    targetRole: 'Executive Director',
    status: 'CHALLENGE_ISSUED',
    originCountry: 'United States (US)',
    originIp: '45.33.32.156',
    synthesizerModel: 'StyleTTS-2 FastPitch',
    audioHash: 'bb9031...112e',
  },
  {
    id: 'EVT-9038',
    time: '14:21:10',
    type: 'Image Manipulation',
    riskScore: 86.5,
    targetIdentity: 'Aarav Patel',
    targetRole: 'Identity Verification KYC',
    status: 'QUARANTINED',
    originCountry: 'Germany (DE)',
    originIp: '167.86.99.202',
    synthesizerModel: 'Stable Diffusion XL Face-Inpaint',
    audioHash: 'd7a842...551b',
  },
  {
    id: 'EVT-9037',
    time: '14:18:50',
    type: 'Voice Clone',
    riskScore: 96.1,
    targetIdentity: 'Kavita Nair',
    targetRole: 'Security Operations Lead',
    status: 'BLOCKED',
    originCountry: 'Hong Kong (HK)',
    originIp: '103.251.167.22',
    synthesizerModel: 'OpenVoice v2 Zero-Shot',
    audioHash: 'c129e4...fa09',
  },
];

export const ThreatIntelView: React.FC = () => {
  const [threatEvents, setThreatEvents] = useState<ThreatEvent[]>(INITIAL_THREAT_FEED);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'Voice Clone' | 'Video Deepfake' | 'Image Manipulation'>('ALL');
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D'>('7D');
  const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(INITIAL_THREAT_FEED[0]);

  // Live Threat Simulation Stream
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      const types: Array<ThreatEvent['type']> = ['Voice Clone', 'Video Deepfake', 'IVR Biometric Spoof', 'Image Manipulation'];
      const models = ['ElevenLabs v3 Clone', 'XTTS-v2 Zero-Shot', 'SadTalker Diff', 'DiffWave-F0', 'StyleTTS2'];
      const roles = ['Chief Executive Officer', 'Wire Transfer Manager', 'Cloud Admin', 'Board Member', 'Call Center Tier-2'];
      const names = ['Amitabh Sen', 'David Chen', 'Priya Deshmukh', 'Elena Rostova', 'Marcus Vance'];
      const geos = [
        { c: 'Singapore (SG)', ip: '103.14.28.' + Math.floor(Math.random() * 250) },
        { c: 'Germany (DE)', ip: '167.86.99.' + Math.floor(Math.random() * 250) },
        { c: 'United States (US)', ip: '45.33.32.' + Math.floor(Math.random() * 250) },
        { c: 'Netherlands (NL)', ip: '185.220.101.' + Math.floor(Math.random() * 250) },
      ];

      const chosenGeo = geos[Math.floor(Math.random() * geos.length)];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      const score = +(88 + Math.random() * 11.5).toFixed(1);
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];

      const newEvent: ThreatEvent = {
        id: `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
        time: timeStr,
        type: chosenType,
        riskScore: score,
        targetIdentity: names[Math.floor(Math.random() * names.length)],
        targetRole: roles[Math.floor(Math.random() * roles.length)],
        status: score > 92 ? 'BLOCKED' : 'CHALLENGE_ISSUED',
        originCountry: chosenGeo.c,
        originIp: chosenGeo.ip,
        synthesizerModel: models[Math.floor(Math.random() * models.length)],
        audioHash: Math.random().toString(36).substring(2, 8) + '...' + Math.random().toString(36).substring(2, 6),
      };

      setThreatEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const filteredEvents = selectedFilter === 'ALL' 
    ? threatEvents 
    : threatEvents.filter(e => e.type === selectedFilter);

  // Attack Trend Data Points
  const trendData = [
    { label: 'Mon', voice: 1420, video: 620, image: 380 },
    { label: 'Tue', voice: 1680, video: 740, image: 410 },
    { label: 'Wed', voice: 1950, video: 890, image: 520 },
    { label: 'Thu', voice: 2410, video: 1100, image: 640 },
    { label: 'Fri', voice: 2890, video: 1350, image: 720 },
    { label: 'Sat', voice: 2150, video: 980, image: 490 },
    { label: 'Sun', voice: 1840, video: 810, image: 410 },
  ];

  const maxTrendVal = 3200;

  return (
    <div className="view-container">
      {/* Top Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        paddingBottom: '20px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            background: 'rgba(255, 46, 91, 0.12)',
            border: '1px solid rgba(255, 46, 91, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--crimson-glow)',
          }}>
            <ShieldAlert size={26} color="var(--crimson)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Threat Intelligence & Attack Analytics
              </h1>
              <span style={{
                background: 'rgba(0, 229, 255, 0.12)',
                color: 'var(--cyan)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
              }}>
                CYBER DEFENSE SIEM
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Real-time telemetry, geographic attack origins, impersonation vectors, and adversarial AI signatures.
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            background: 'var(--surface-dark)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '2px',
          }}>
            {(['24H', '7D', '30D'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  background: timeRange === range ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  color: timeRange === range ? 'var(--cyan)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  fontWeight: timeRange === range ? 700 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              background: isLiveStreaming ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isLiveStreaming ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
              color: isLiveStreaming ? 'var(--emerald)' : 'var(--text-muted)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Radio size={14} className={isLiveStreaming ? 'pulse' : ''} />
            {isLiveStreaming ? 'LIVE RADAR ACTIVE' : 'STREAM PAUSED'}
          </button>
        </div>
      </div>

      {/* 6 Strategic Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        {/* Card 1: Total Attacks Detected */}
        <div className="card" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              TOTAL ATTACKS DETECTED
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(255, 46, 91, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={16} color="var(--crimson)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            14,892
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11px', color: 'var(--crimson)' }}>
            <TrendingUp size={12} />
            <span>+18.4% vs previous 7 days</span>
          </div>
        </div>

        {/* Card 2: Voice Cloning Attempts */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              VOICE CLONING ATTEMPTS
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(0, 229, 255, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color="var(--cyan)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cyan)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            8,421
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span>56.5% of total threat volume</span>
          </div>
        </div>

        {/* Card 3: Deepfake Video Attempts */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              DEEPFAKE VIDEO ATTEMPTS
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={16} color="var(--cobalt)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cobalt)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            4,115
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span>27.6% (Facial swap + Lipsync)</span>
          </div>
        </div>

        {/* Card 4: Image Manipulation */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              IMAGE / ELA FORGERY
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} color="var(--amber)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--amber)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            2,356
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span>15.9% (ID Card & Spec Forgery)</span>
          </div>
        </div>

        {/* Card 5: High-Risk Critical Incidents */}
        <div className="card" style={{ padding: '18px 20px', borderLeft: '3px solid var(--crimson)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--crimson)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', fontWeight: 600 }}>
              CRITICAL ZERO-DAY INCIDENTS
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(255, 46, 91, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={16} color="var(--crimson)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            142
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11px', color: 'var(--emerald)' }}>
            <span>100% Mitigated & Blocked</span>
          </div>
        </div>

        {/* Card 6: Mean Time to Detection */}
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              MEAN INFERENCE LATENCY (MTTD)
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={16} color="var(--emerald)" />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--emerald)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
            138 ms
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span>Edge ONNX & Mel-Filterbank</span>
          </div>
        </div>
      </div>

      {/* Row 2: Attack Trend Frequency Graph & Vector Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)',
        gap: '20px',
      }}>
        {/* Visual Multi-Vector Attack Trend Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                Attack Frequency & Velocity Over Time
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Aggregated daily volume across speech synthesizers, diffusion engines, and deepfake toolchains.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--cyan)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--cyan)' }} />
                Voice Clone
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--cobalt)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--cobalt)' }} />
                Video Deepfake
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--amber)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--amber)' }} />
                Image Manipulation
              </span>
            </div>
          </div>

          {/* Bar / Column Chart Representation */}
          <div style={{
            height: '240px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '14px',
            paddingTop: '20px',
            borderBottom: '1px solid var(--border-subtle)',
            position: 'relative',
          }}>
            {trendData.map((d, i) => {
              const total = d.voice + d.video + d.image;
              const voiceHeight = (d.voice / maxTrendVal) * 200;
              const videoHeight = (d.video / maxTrendVal) * 200;
              const imageHeight = (d.image / maxTrendVal) * 200;

              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', maxWidth: '44px', display: 'flex', flexDirection: 'column', gap: '2px', position: 'relative' }}>
                    {/* Stacked Bars */}
                    <div 
                      title={`Image Forgery: ${d.image}`}
                      style={{ height: `${imageHeight}px`, background: 'var(--amber)', borderRadius: '3px 3px 0 0', opacity: 0.9 }} 
                    />
                    <div 
                      title={`Video Deepfake: ${d.video}`}
                      style={{ height: `${videoHeight}px`, background: 'var(--cobalt)', opacity: 0.9 }} 
                    />
                    <div 
                      title={`Voice Clone: ${d.voice}`}
                      style={{ height: `${voiceHeight}px`, background: 'var(--cyan)', borderRadius: '0 0 3px 3px', boxShadow: '0 0 10px rgba(0, 229, 255, 0.3)' }} 
                    />
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '10px' }}>
                    {d.label}
                  </span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {total}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>Peak Attack Velocity: 4,960 attempts / 24h</span>
            <span>Ensemble Neutralization Ratio: 99.4%</span>
          </div>
        </div>

        {/* Vector Distribution & Top Synthesizers */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
              Adversarial Generator Signatures
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Detected synthesis toolchains classified via acoustic spectral footprint.
            </p>

            {/* Attack Types Distribution Progress Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { name: 'ElevenLabs Multilingual v2/v3', count: '4,620 (31.0%)', color: 'var(--cyan)', width: '78%' },
                { name: 'XTTS-v2 / Coqui Zero-Shot', count: '3,801 (25.5%)', color: 'var(--cobalt)', width: '64%' },
                { name: 'SadTalker & LivePortrait Diff', count: '2,890 (19.4%)', color: '#8B5CF6', width: '48%' },
                { name: 'StyleTTS-2 & DiffWave Neural', count: '2,140 (14.3%)', color: 'var(--amber)', width: '36%' },
                { name: 'FaceSwap-GAN / DeepFaceLive', count: '1,441 (9.8%)', color: 'var(--crimson)', width: '24%' },
              ].map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{item.count}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: item.width, height: '100%', background: item.color, borderRadius: '3px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '12px 14px',
            background: 'rgba(0, 229, 255, 0.05)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <Zap size={16} color="var(--cyan)" />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              DeepShield auto-extracts high-frequency phase residue to fingerprint the exact model family.
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Geographic Distribution & Most Targeted VIP Identities */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1.7fr)',
        gap: '20px',
      }}>
        {/* Most Targeted Identities */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <UserX size={18} color="var(--crimson)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
              Most Targeted Identities & Personas
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { name: 'Executive C-Suite (CFO / CEO)', role: 'Wire Authorization & Treasury', attempts: '4,290', risk: '96.2%', level: 'CRITICAL' },
              { name: 'Banking IVR Voice Biometrics', role: 'Telephonic Account Takeover', attempts: '3,840', risk: '94.8%', level: 'HIGH' },
              { name: 'Identity & Video KYC Agents', role: 'Loan & Account Creation Spoof', attempts: '2,910', risk: '88.5%', level: 'HIGH' },
              { name: 'Government & Defense VIPs', role: 'Command & Dispatch Disinformation', attempts: '1,720', risk: '98.4%', level: 'CRITICAL' },
              { name: 'Customer Support / Desk Auth', role: 'Helpdesk Password Reset Scam', attempts: '1,410', risk: '84.1%', level: 'MEDIUM' },
            ].map((target, idx) => (
              <div key={idx} style={{
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{target.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{target.role}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: target.level === 'CRITICAL' ? 'var(--crimson)' : 'var(--amber)' }}>
                    {target.attempts} attacks
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    Avg Risk: {target.risk}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Origin Geo Distribution & Global ASNs */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="var(--cyan)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                Geographic Origin & Attack Clusters
              </h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              GLOBAL ASN TELEMETRY
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
          }}>
            {[
              { region: 'Asia-Pacific', share: '38.4%', attacks: '5,718', trend: '+14%' },
              { region: 'North America', share: '24.2%', attacks: '3,603', trend: '+8%' },
              { region: 'Eastern Europe', share: '21.6%', attacks: '3,216', trend: '+31%' },
              { region: 'Western Europe', share: '11.8%', attacks: '1,757', trend: '-2%' },
            ].map((geo, i) => (
              <div key={i} style={{
                padding: '12px',
                background: 'rgba(10, 13, 20, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
              }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{geo.region}</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cyan)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  {geo.share}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                  {geo.attacks} ({geo.trend})
                </div>
              </div>
            ))}
          </div>

          {/* Geo Heatgrid Simulation */}
          <div style={{
            background: 'rgba(10, 13, 20, 0.95)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '14px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--cyan)' }}>ACTIVE THREAT INGRESS CHANNELS</span>
              <span>GEO-IP FILTERING: ENFORCED</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', height: '48px' }}>
              {Array.from({ length: 32 }).map((_, idx) => {
                const intensity = (idx * 37) % 100;
                const bg = intensity > 80 
                  ? 'rgba(255, 46, 91, 0.8)' 
                  : intensity > 50 
                  ? 'rgba(0, 229, 255, 0.6)' 
                  : 'rgba(255, 255, 255, 0.08)';
                return (
                  <div 
                    key={idx} 
                    title={`Node Cluster #${idx + 1} - Activity: ${intensity}%`}
                    style={{ background: bg, borderRadius: '2px', transition: 'all 0.3s ease' }} 
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: 🔥 Live Threat Feed (Real-Time SIEM Stream) */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--crimson)',
              boxShadow: '0 0 10px var(--crimson)',
              animation: 'pulse 1.5s infinite',
            }} />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              🔥 Live Threat Feed & Adversarial Ingress Stream
            </h3>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--text-muted)" />
            {(['ALL', 'Voice Clone', 'Video Deepfake', 'Image Manipulation'] as const).map(f => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                style={{
                  background: selectedFilter === f ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  border: selectedFilter === f ? '1px solid rgba(0, 229, 255, 0.4)' : '1px solid var(--border-subtle)',
                  color: selectedFilter === f ? 'var(--cyan)' : 'var(--text-muted)',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  fontWeight: selectedFilter === f ? 700 : 400,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Live Stream Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <th style={{ padding: '10px 12px' }}>TIMESTAMP</th>
                <th style={{ padding: '10px 12px' }}>ATTACK TYPE</th>
                <th style={{ padding: '10px 12px' }}>RISK SCORE</th>
                <th style={{ padding: '10px 12px' }}>TARGETED IDENTITY</th>
                <th style={{ padding: '10px 12px' }}>DETECTED TOOLCHAIN</th>
                <th style={{ padding: '10px 12px' }}>ORIGIN (GEO / IP)</th>
                <th style={{ padding: '10px 12px' }}>DEFENSE ACTION</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>DOSSIER</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((evt) => {
                const isHighRisk = evt.riskScore > 90;
                return (
                  <tr 
                    key={evt.id}
                    onClick={() => setSelectedThreat(evt)}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: selectedThreat?.id === evt.id ? 'rgba(0, 229, 255, 0.06)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {evt.time}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 600,
                        color: evt.type === 'Voice Clone' ? 'var(--cyan)' : evt.type === 'Video Deepfake' ? 'var(--cobalt)' : 'var(--amber)',
                      }}>
                        {evt.type === 'Voice Clone' && <Zap size={12} />}
                        {evt.type === 'Video Deepfake' && <Layers size={12} />}
                        {evt.type === 'Image Manipulation' && <AlertTriangle size={12} />}
                        {evt.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '11px',
                        background: isHighRisk ? 'rgba(255, 46, 91, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: isHighRisk ? 'var(--crimson)' : 'var(--amber)',
                        border: `1px solid ${isHighRisk ? 'rgba(255, 46, 91, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                      }}>
                        {evt.riskScore}%
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{evt.targetIdentity}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{evt.targetRole}</div>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '11px' }}>
                      {evt.synthesizerModel}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '11px' }}>
                      <div>{evt.originCountry}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{evt.originIp}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        background: evt.status === 'BLOCKED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: evt.status === 'BLOCKED' ? 'var(--emerald)' : 'var(--amber)',
                        border: `1px solid ${evt.status === 'BLOCKED' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                      }}>
                        {evt.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedThreat(evt);
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          color: 'var(--cyan)',
                          padding: '4px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Threat Inspection Modal / Detail Drawer */}
      {selectedThreat && (
        <div className="card" style={{
          padding: '20px 24px',
          background: 'rgba(15, 20, 32, 0.95)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cyan)', fontWeight: 700 }}>
                {selectedThreat.id}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                Deep Forensic Fingerprint: {selectedThreat.targetIdentity} ({selectedThreat.targetRole})
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              <span>Origin IP: {selectedThreat.originIp}</span>
              <span>Model Family: {selectedThreat.synthesizerModel}</span>
              <span>Audio SHA: {selectedThreat.audioHash}</span>
              <span>Risk: <strong style={{ color: 'var(--crimson)' }}>{selectedThreat.riskScore}%</strong></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => alert(`Forensic payload for ${selectedThreat.id} exported to Cryptographic Evidence Ledger.`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid var(--cyan)',
                color: 'var(--cyan)',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Download size={13} />
              Export SIEM Telemetry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
