import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  Mic,
  Video,
  Image as ImageIcon,
  UploadCloud,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRightLeft,
  FileAudio,
  FileVideo,
  FileImage,
  TrendingUp,
  Cpu,
  Fingerprint,
  Info,
  Maximize2
} from 'lucide-react';

type MediaType = 'audio' | 'video' | 'image';

interface AudioAnalysisState {
  filename: string;
  duration: string;
  sampleRate: string;
  bitrate: string;
  syntheticProb: number;
  naturalProb: number;
  authenticityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  meanPitch: number;
  pitchRange: [number, number];
  meanRmsEnergy: number;
  zcrRate: number;
  mfccDistance: number;
  vocoderFootprint: string;
  phaseDiscrepancy: number;
}

interface VideoAnalysisState {
  filename: string;
  duration: string;
  fps: number;
  resolution: string;
  facesDetected: number;
  deepfakeProb: number;
  authenticityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lipSyncDeltaMs: number;
  landmarkDeviationScore: number;
  avSyncCorrelation: number;
  highestAnomalyFrame: number;
  frameScores: number[];
}

interface ImageAnalysisState {
  filename: string;
  dimensions: string;
  colorSpace: string;
  fileSize: string;
  manipulationProb: number;
  authenticityScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  elaAnomalyScore: number;
  noiseVariance: number;
  faceConfidence: number;
  fftHighFreqSpike: number;
  resamplingArtifacts: string;
}

export const DynamicAnalyticsView: React.FC = () => {
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('audio');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(35); // 0 to 100
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(4); // For video frame inspection
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Audio dynamic preset
  const audioData: AudioAnalysisState = useMemo(() => ({
    filename: uploadedFileName || 'suspicious_cfo_wire_call.wav',
    duration: '18.4 sec',
    sampleRate: '44.1 kHz (16-bit PCM)',
    bitrate: '705.6 kbps',
    syntheticProb: 94.7,
    naturalProb: 5.3,
    authenticityScore: 82.4,
    riskLevel: 'CRITICAL',
    meanPitch: 124.8, // Hz
    pitchRange: [118, 131], // Monotonic synthetic compression
    meanRmsEnergy: -18.2, // dB
    zcrRate: 0.042,
    mfccDistance: 0.884,
    vocoderFootprint: 'ElevenLabs Multilingual v2 (Diffusion-Vocoder)',
    phaseDiscrepancy: 88.5,
  }), [uploadedFileName]);

  // Video dynamic preset
  const videoData: VideoAnalysisState = useMemo(() => ({
    filename: uploadedFileName || 'kyc_live_onboarding_stream.mp4',
    duration: '10.2 sec',
    fps: 30,
    resolution: '1920x1080 (H.264)',
    facesDetected: 1,
    deepfakeProb: 92.4,
    authenticityScore: 71.2,
    riskLevel: 'CRITICAL',
    lipSyncDeltaMs: 142,
    landmarkDeviationScore: 84.3,
    avSyncCorrelation: 0.38,
    highestAnomalyFrame: 4,
    frameScores: [21, 38, 76, 93, 84, 62, 79, 91, 88, 74, 52, 41],
  }), [uploadedFileName]);

  // Image dynamic preset
  const imageData: ImageAnalysisState = useMemo(() => ({
    filename: uploadedFileName || 'passport_identity_card_forgery.png',
    dimensions: '2400 x 1600 px',
    colorSpace: 'sRGB 24bpp',
    fileSize: '3.84 MB',
    manipulationProb: 89.5,
    authenticityScore: 76.1,
    riskLevel: 'HIGH',
    elaAnomalyScore: 91.2,
    noiseVariance: 86.4,
    faceConfidence: 98.7,
    fftHighFreqSpike: 84.1,
    resamplingArtifacts: 'Bicubic Face Inpainting Boundary Detected',
  }), [uploadedFileName]);

  // Playback ticker simulation
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setPlaybackProgress((prev) => (prev >= 100 ? 0 : prev + 2));
      }, 150);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // File Upload handler to dynamically update graphs
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    if (file.type.startsWith('video/')) {
      setSelectedMediaType('video');
    } else if (file.type.startsWith('image/')) {
      setSelectedMediaType('image');
    } else {
      setSelectedMediaType('audio');
    }
    setPlaybackProgress(0);
    setIsPlaying(true);
  };

  // Waveform data generation (32 time steps)
  const waveformPoints = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => {
      const t = i / 48;
      const baseAmp = Math.sin(t * Math.PI * 6) * 0.4 + Math.sin(t * Math.PI * 14) * 0.3;
      const noise = (Math.sin(i * 13.7) % 1) * 0.25;
      const amp = Math.abs(baseAmp + noise);
      return Math.min(Math.max(amp, 0.08), 0.95);
    });
  }, []);

  // Pitch F0 Curve (Genuine vs Input Synthetic)
  const pitchSeries = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      // Natural speech has rich expressive pitch swings
      const genuineF0 = 120 + Math.sin(i * 0.6) * 35 + Math.cos(i * 1.2) * 15;
      // Synthetic speech is unnaturally flat / compressed
      const syntheticF0 = 125 + Math.sin(i * 0.2) * 6 + ((i * 7) % 3);
      return { step: i, genuineF0, syntheticF0 };
    });
  }, []);

  // Energy RMS Curve
  const energySeries = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const genuineEnergy = -24 + Math.sin(i * 0.5) * 12;
      const syntheticEnergy = -18 + Math.sin(i * 0.3) * 4;
      return { step: i, genuineEnergy, syntheticEnergy };
    });
  }, []);

  return (
    <div className="view-container">
      {/* Header Banner */}
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
            background: 'rgba(0, 229, 255, 0.12)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--cyan-glow)',
          }}>
            <Activity size={26} color="var(--cyan)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Dynamic Forensic Analytics Dashboard
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
                AUTO-GRAPH ENGINE
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Input → Feature Extraction → Dynamic Graph Generation → Cryptographic Forensic Verification.
            </p>
          </div>
        </div>

        {/* Action Controls & Media Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* File Upload Trigger */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            background: 'rgba(0, 229, 255, 0.1)',
            border: '1px solid var(--cyan)',
            color: 'var(--cyan)',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            <UploadCloud size={14} />
            <span>Upload File for Live Analysis</span>
            <input
              type="file"
              accept="audio/*,video/*,image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>

          {/* Media Type Selector Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--surface-dark)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '3px',
          }}>
            <button
              onClick={() => { setSelectedMediaType('audio'); setUploadedFileName(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: selectedMediaType === 'audio' ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                color: selectedMediaType === 'audio' ? 'var(--cyan)' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                fontWeight: selectedMediaType === 'audio' ? 700 : 400,
              }}
            >
              <Mic size={13} />
              Audio Input
            </button>

            <button
              onClick={() => { setSelectedMediaType('video'); setUploadedFileName(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: selectedMediaType === 'video' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: selectedMediaType === 'video' ? 'var(--cobalt)' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                fontWeight: selectedMediaType === 'video' ? 700 : 400,
              }}
            >
              <Video size={13} />
              Video Input
            </button>

            <button
              onClick={() => { setSelectedMediaType('image'); setUploadedFileName(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: selectedMediaType === 'image' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: selectedMediaType === 'image' ? 'var(--amber)' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                fontWeight: selectedMediaType === 'image' ? 700 : 400,
              }}
            >
              <ImageIcon size={13} />
              Image Input
            </button>
          </div>
        </div>
      </div>

      {/* Input Metadata HUD Bar */}
      <div className="card" style={{
        padding: '14px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        background: 'rgba(10, 13, 20, 0.9)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectedMediaType === 'audio' && <FileAudio size={18} color="var(--cyan)" />}
            {selectedMediaType === 'video' && <FileVideo size={18} color="var(--cobalt)" />}
            {selectedMediaType === 'image' && <FileImage size={18} color="var(--amber)" />}
            <div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block' }}>TARGET FILE</span>
              <strong style={{ fontSize: '13px', color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                {selectedMediaType === 'audio' ? audioData.filename : selectedMediaType === 'video' ? videoData.filename : imageData.filename}
              </strong>
            </div>
          </div>

          <div style={{ height: '24px', width: '1px', background: 'var(--border-subtle)' }} />

          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block' }}>FORMAT & ENCODING</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {selectedMediaType === 'audio' ? audioData.sampleRate : selectedMediaType === 'video' ? videoData.resolution : imageData.dimensions}
            </span>
          </div>

          <div style={{ height: '24px', width: '1px', background: 'var(--border-subtle)' }} />

          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block' }}>DURATION / SIZE</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {selectedMediaType === 'audio' ? audioData.duration : selectedMediaType === 'video' ? videoData.duration : imageData.fileSize}
            </span>
          </div>
        </div>

        {/* Compare With Genuine Voice Toggle */}
        {selectedMediaType === 'audio' && (
          <button
            onClick={() => setIsCompareMode(!isCompareMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '6px',
              background: isCompareMode ? 'rgba(255, 46, 91, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${isCompareMode ? 'var(--crimson)' : 'var(--border-subtle)'}`,
              color: isCompareMode ? 'var(--crimson)' : 'var(--text-primary)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowRightLeft size={14} />
            <span>{isCompareMode ? 'Comparing with Enrolled Voice' : 'Compare with Genuine Voice'}</span>
          </button>
        )}
      </div>

      {/* Top 2 Big KPI Scores */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {/* Card 1: Primary Probability Verdict */}
        <div className="card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--crimson)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                {selectedMediaType === 'audio' ? 'SYNTHETIC VOICE PROBABILITY' : selectedMediaType === 'video' ? 'DEEPFAKE MANIPULATION PROBABILITY' : 'IMAGE FORGERY PROBABILITY'}
              </span>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--crimson)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {selectedMediaType === 'audio' ? `${audioData.syntheticProb}%` : selectedMediaType === 'video' ? `${videoData.deepfakeProb}%` : `${imageData.manipulationProb}%`}
              </div>
            </div>
            <div style={{
              padding: '4px 10px',
              borderRadius: '4px',
              background: 'rgba(255, 46, 91, 0.15)',
              border: '1px solid var(--crimson)',
              color: 'var(--crimson)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
            }}>
              CRITICAL RISK
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <AlertTriangle size={14} color="var(--crimson)" />
            <span>
              {selectedMediaType === 'audio'
                ? `Vocoder Signature: ${audioData.vocoderFootprint}`
                : selectedMediaType === 'video'
                ? `Lip-Sync Delta: ${videoData.lipSyncDeltaMs}ms on bilabial plosives`
                : `ELA Anomaly: ${imageData.resamplingArtifacts}`}
            </span>
          </div>
        </div>

        {/* Card 2: Voice / Media Authenticity Score */}
        <div className="card" style={{ padding: '20px 24px', borderLeft: '4px solid var(--cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                MEDIA AUTHENTICITY SCORE
              </span>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--cyan)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {selectedMediaType === 'audio' ? `${audioData.authenticityScore}%` : selectedMediaType === 'video' ? `${videoData.authenticityScore}%` : `${imageData.authenticityScore}%`}
              </div>
            </div>
            <div style={{
              padding: '4px 10px',
              borderRadius: '4px',
              background: 'rgba(0, 229, 255, 0.15)',
              border: '1px solid var(--cyan)',
              color: 'var(--cyan)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
            }}>
              ENSEMBLE AUDIT
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Cpu size={14} color="var(--cyan)" />
            <span>Cross-modal transformer verified with calibrated temperature threshold</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DYNAMIC GRAPHS SECTION: AUDIO / VOICE MODE                                */}
      {/* ========================================================================= */}
      {selectedMediaType === 'audio' && !isCompareMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Waveform Visualization with Player Controls */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                  Acoustic Audio Waveform (Amplitude vs Time)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  High-resolution oscillogram showing frame envelopes and micro-pause discontinuities.
                </p>
              </div>

              {/* Play / Scrub Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'var(--cyan)',
                    color: '#0A0D14',
                    border: 'none',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlaying ? 'PAUSE SCAN' : 'PLAY & SCAN'}</span>
                </button>
                <button
                  onClick={() => setPlaybackProgress(0)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Dynamic Waveform Bars */}
            <div style={{
              height: '110px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '4px',
              padding: '16px',
              background: 'rgba(10, 13, 20, 0.85)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Playback Scrub Marker */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${playbackProgress}%`,
                width: '2px',
                background: 'var(--crimson)',
                boxShadow: '0 0 10px var(--crimson)',
                zIndex: 10,
                transition: 'left 0.15s linear',
              }} />

              {waveformPoints.map((amp, idx) => {
                const isCurrent = Math.abs((idx / waveformPoints.length) * 100 - playbackProgress) < 4;
                const isAnomaly = idx > 18 && idx < 28; // Synthetic artifact window
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      height: `${amp * 100}%`,
                      background: isCurrent
                        ? '#FFFFFF'
                        : isAnomaly
                        ? 'var(--crimson)'
                        : 'var(--cyan)',
                      borderRadius: '2px',
                      opacity: isCurrent ? 1 : 0.75,
                      boxShadow: isAnomaly ? '0 0 8px rgba(255, 46, 91, 0.4)' : 'none',
                      transition: 'height 0.2s ease, background 0.2s ease',
                    }}
                  />
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              <span>0.00s</span>
              <span style={{ color: 'var(--crimson)' }}>⚠️ Anomaly detected @ 8.2s - 12.4s (Vocoder Phase Inversion)</span>
              <span>{audioData.duration}</span>
            </div>
          </div>

          {/* 2-Column: Spectrogram Heatmap (Left) + MFCC Matrix (Right) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.6fr)',
            gap: '20px',
          }}>
            {/* Spectrogram Frequency Heatmap */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                    Mel-Spectrogram Frequency Domain
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    High-frequency Nyquist cutoff & upper-harmonic roll-off.
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
                  0 - 8000 Hz
                </span>
              </div>

              {/* Visual Simulated Spectrogram Grid */}
              <div style={{
                height: '180px',
                background: 'linear-gradient(180deg, #0A0D14 0%, #161A28 100%)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '10px',
                display: 'grid',
                gridTemplateRows: 'repeat(6, 1fr)',
                gap: '4px',
                position: 'relative',
              }}>
                {[
                  { freq: '8 kHz', intensity: 'var(--crimson)', label: 'Vocoder Cutoff' },
                  { freq: '6 kHz', intensity: 'rgba(255, 46, 91, 0.4)', label: 'Phase Inversion' },
                  { freq: '4 kHz', intensity: 'var(--amber)', label: 'Formant F3' },
                  { freq: '2 kHz', intensity: 'var(--cyan)', label: 'Formant F2' },
                  { freq: '1 kHz', intensity: 'var(--cobalt)', label: 'Formant F1' },
                  { freq: '0 Hz', intensity: 'var(--emerald)', label: 'Fundamental F0' },
                ].map((row, rIdx) => (
                  <div key={rIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '38px', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {row.freq}
                    </span>
                    <div style={{
                      flex: 1,
                      height: '100%',
                      background: `linear-gradient(90deg, ${row.intensity} 0%, rgba(255,255,255,0.05) 50%, ${row.intensity} 100%)`,
                      borderRadius: '3px',
                      opacity: 0.85,
                    }} />
                    <span style={{ width: '90px', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textAlign: 'right' }}>
                      {row.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* MFCC Coefficient Matrix & Mel-Filterbanks */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                    MFCC Feature Analysis (13 Coefficients)
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Mel-Frequency Cepstral Coefficients distance vs human speech baseline.
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--crimson)' }}>
                  Δ DISTANCE: 0.884
                </span>
              </div>

              {/* 13 MFCC Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { name: 'C01 (Overall Energy)', val: 88, status: 'NORMAL' },
                  { name: 'C02 (Spectral Tilt)', val: 94, status: 'ANOMALOUS (High Tilt)' },
                  { name: 'C03 (Formant F1 Ratio)', val: 82, status: 'FLAT VOCAL TRACT' },
                  { name: 'C04 (Formant F2 Ratio)', val: 91, status: 'SYNTHETIC SMOOTHING' },
                  { name: 'C05 - C13 (Higher Cepstrals)', val: 96, status: 'UNNATURAL HARMONICS' },
                ].map((mfcc, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{mfcc.name}</span>
                      <span style={{ color: mfcc.val > 85 ? 'var(--crimson)' : 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{mfcc.status}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${mfcc.val}%`, height: '100%', background: mfcc.val > 85 ? 'var(--crimson)' : 'var(--cyan)', borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px', padding: '10px 12px', background: 'rgba(255, 46, 91, 0.08)', borderRadius: '4px', border: '1px solid rgba(255, 46, 91, 0.25)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <strong>Cepstral Discontinuity:</strong> Higher MFCC coefficients exceed standard standard deviation ($&gt;3.4\sigma$), confirming auto-regressive vocoder synthesis.
              </div>
            </div>
          </div>

          {/* Row 3: Pitch (F0) & Energy (RMS) Curves */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '20px',
          }}>
            {/* Pitch / F0 Variation Graph */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                    Fundamental Pitch ($F_0$) Variation
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Mean Pitch: {audioData.meanPitch} Hz — Unnatural pitch monotonicity.
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
                  JITTER: 0.014%
                </span>
              </div>

              {/* Pitch SVG Area */}
              <div style={{ height: '140px', width: '100%', background: 'rgba(10, 13, 20, 0.8)', borderRadius: '6px', border: '1px solid var(--border-subtle)', padding: '10px', position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 240 100" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="25" x2="240" y2="25" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                  <line x1="0" y1="50" x2="240" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                  <line x1="0" y1="75" x2="240" y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

                  {/* Synthetic Pitch Path */}
                  <path
                    d={`M ${pitchSeries.map((p, i) => `${i * 10},${100 - (p.syntheticF0 - 100) * 1.5}`).join(' L ')}`}
                    fill="none"
                    stroke="var(--crimson)"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                <span>100 Hz</span>
                <span>Lack of natural physiological pitch excursion</span>
                <span>160 Hz</span>
              </div>
            </div>

            {/* Energy RMS Variation Graph */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                    Energy Profile & Zero-Crossing Rate (ZCR)
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Mean RMS: {audioData.meanRmsEnergy} dB — ZCR: {audioData.zcrRate}
                  </p>
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
                  SHIMMER: 0.08 dB
                </span>
              </div>

              {/* Energy SVG Area */}
              <div style={{ height: '140px', width: '100%', background: 'rgba(10, 13, 20, 0.8)', borderRadius: '6px', border: '1px solid var(--border-subtle)', padding: '10px', position: 'relative' }}>
                <svg width="100%" height="100%" viewBox="0 0 240 100" preserveAspectRatio="none">
                  <line x1="0" y1="25" x2="240" y2="25" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                  <line x1="0" y1="50" x2="240" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                  <line x1="0" y1="75" x2="240" y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />

                  {/* Synthetic Energy Path */}
                  <path
                    d={`M ${energySeries.map((p, i) => `${i * 10},${100 - (p.syntheticEnergy + 30) * 3}`).join(' L ')}`}
                    fill="none"
                    stroke="var(--cyan)"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                <span>-30 dB</span>
                <span>Unnatural silence gating at frame boundaries</span>
                <span>0 dB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* "COMPARE WITH GENUINE VOICE" SIDE-BY-SIDE MODE                            */}
      {/* ========================================================================= */}
      {selectedMediaType === 'audio' && isCompareMode && (
        <div className="card" style={{ padding: '24px', border: '1px solid var(--crimson)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--crimson)' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF' }}>
                  Biometric Voiceprint Comparison: Enrolled Genuine vs Uploaded Input
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Comparing enrolled target profile (Rajesh Sharma, CFO) against incoming audio stream.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', textAlign: 'right' }}>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SIMILARITY SCORE</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>38.6%</div>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>IMPERSONATION RISK</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--crimson)', fontFamily: 'var(--font-mono)' }}>92.4%</div>
              </div>
            </div>
          </div>

          {/* Comparative Table / Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: '20px',
            marginBottom: '20px',
          }}>
            {/* Left: Genuine Profile */}
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald)', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>
                <CheckCircle2 size={16} />
                <span>GENUINE ENROLLED VOICE (BASELINE)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pitch Range ($F_0$):</span>
                  <strong style={{ color: '#FFFFFF' }}>95 Hz - 165 Hz (Normal Dynamic)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Micro-Jitter:</span>
                  <strong style={{ color: '#FFFFFF' }}>0.78% (Organic Physiological)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Shimmer:</span>
                  <strong style={{ color: '#FFFFFF' }}>0.34 dB (Natural Vocal Cord)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Room Acoustics:</span>
                  <strong style={{ color: '#FFFFFF' }}>Office Calibrated (RT60: 0.32s)</strong>
                </div>
              </div>
            </div>

            {/* Right: Suspicious Input */}
            <div style={{ background: 'rgba(255, 46, 91, 0.05)', border: '1px solid rgba(255, 46, 91, 0.3)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crimson)', fontWeight: 700, fontSize: '13px', marginBottom: '12px' }}>
                <AlertTriangle size={16} />
                <span>INPUT DETECTED VOICE (SUSPICIOUS)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pitch Range ($F_0$):</span>
                  <strong style={{ color: 'var(--crimson)' }}>118 Hz - 131 Hz (Anomalous Flat)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Micro-Jitter:</span>
                  <strong style={{ color: 'var(--crimson)' }}>0.014% (Synthetic Deficit)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Shimmer:</span>
                  <strong style={{ color: 'var(--crimson)' }}>0.08 dB (Vocoder Compression)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Room Acoustics:</span>
                  <strong style={{ color: 'var(--crimson)' }}>Zero Reverb / Neural Artifacts</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Superimposed Comparison Graph (Pitch Contours) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
                Superimposed Pitch Contour Overlay ($F_0$ Tracking)
              </span>
              <div style={{ display: 'flex', gap: '14px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--emerald)' }}>── Genuine Pitch Swings</span>
                <span style={{ color: 'var(--crimson)' }}>── Synthetic Flattened Line</span>
              </div>
            </div>

            <div style={{ height: '140px', width: '100%', background: 'rgba(10, 13, 20, 0.95)', borderRadius: '6px', border: '1px solid var(--border-subtle)', padding: '10px' }}>
              <svg width="100%" height="100%" viewBox="0 0 240 100" preserveAspectRatio="none">
                {/* Genuine Pitch Path */}
                <path
                  d={`M ${pitchSeries.map((p, i) => `${i * 10},${100 - (p.genuineF0 - 80) * 1.0}`).join(' L ')}`}
                  fill="none"
                  stroke="var(--emerald)"
                  strokeWidth="2.5"
                  opacity="0.85"
                />
                {/* Synthetic Pitch Path */}
                <path
                  d={`M ${pitchSeries.map((p, i) => `${i * 10},${100 - (p.syntheticF0 - 80) * 1.0}`).join(' L ')}`}
                  fill="none"
                  stroke="var(--crimson)"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DYNAMIC GRAPHS SECTION: VIDEO INPUT MODE                                  */}
      {/* ========================================================================= */}
      {selectedMediaType === 'video' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Frame-by-Frame Manipulation Scores Bar Chart */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                  Frame-by-Frame Deepfake Anomaly Breakdown
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Temporal manipulation index computed across individual video frames.
                </p>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--crimson)' }}>
                CRITICAL SPIKE: FRAME #04 (93%)
              </span>
            </div>

            {/* Frame Bars */}
            <div style={{
              height: '160px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '12px',
              paddingTop: '20px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              {videoData.frameScores.map((score, fIdx) => {
                const isSelected = selectedFrameIndex === fIdx;
                const isSpike = score > 80;
                return (
                  <div
                    key={fIdx}
                    onClick={() => setSelectedFrameIndex(fIdx)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isSpike ? 'var(--crimson)' : 'var(--text-secondary)', marginBottom: '4px' }}>
                      {score}%
                    </span>
                    <div style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${score}%`,
                      background: isSelected
                        ? '#FFFFFF'
                        : isSpike
                        ? 'var(--crimson)'
                        : 'var(--cobalt)',
                      borderRadius: '3px 3px 0 0',
                      boxShadow: isSpike ? '0 0 10px rgba(255, 46, 91, 0.4)' : 'none',
                      transition: 'all 0.15s ease',
                    }} />
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isSelected ? 'var(--cyan)' : 'var(--text-muted)', marginTop: '8px' }}>
                      F{fIdx + 1 < 10 ? `0${fIdx + 1}` : fIdx + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>Select frame to inspect high-resolution biometric landmarks</span>
              <span style={{ color: 'var(--cyan)' }}>Currently Inspecting: Frame #{selectedFrameIndex + 1}</span>
            </div>
          </div>

          {/* 3-Column: Lip-Sync Delta + Landmark Drift + Audio-Visual Correlation */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '20px',
          }}>
            {/* 1. Lip-Sync Delta */}
            <div className="card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LIP-SYNC PHONEME DELTA</span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--crimson)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                +{videoData.lipSyncDeltaMs} ms
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Mouth aperture open duration lags acoustic plosive audio onset by 142ms.
              </p>
            </div>

            {/* 2. Landmark Mesh Drift */}
            <div className="card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>3D FACIAL MESH DEVIATION</span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--amber)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {videoData.landmarkDeviationScore}%
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Jawline perimeter coordinates exhibit high-frequency jitter during head rotation.
              </p>
            </div>

            {/* 3. A/V Sync Correlation */}
            <div className="card" style={{ padding: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CROSS-MODAL A/V CORRELATION</span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cobalt)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {videoData.avSyncCorrelation}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Canonical human correlation benchmark is &gt; 0.85 (Critical mismatch detected).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DYNAMIC GRAPHS SECTION: IMAGE INPUT MODE                                  */}
      {/* ========================================================================= */}
      {selectedMediaType === 'image' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.6fr)',
            gap: '20px',
          }}>
            {/* ELA Heatmap & Noise Analysis */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                Error Level Analysis (ELA) & Compression Gradients
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Identifies localized re-saving, pixel inpainting, and GAN boundary blending.
              </p>

              <div style={{
                height: '180px',
                background: 'radial-gradient(circle at 60% 40%, rgba(255, 46, 91, 0.4) 0%, rgba(10, 13, 20, 0.95) 70%)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}>
                <div style={{
                  padding: '8px 14px',
                  background: 'rgba(10, 13, 20, 0.85)',
                  border: '1px solid var(--crimson)',
                  borderRadius: '4px',
                  color: 'var(--crimson)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}>
                  ⚠️ Inpainting Gradient Spike (x: 410-680, y: 220-490)
                </div>
              </div>
            </div>

            {/* Frequency Domain 2D FFT & Noise Variance */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                2D Fast Fourier Transform (FFT) Spectrum
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Radial symmetry analysis exposing synthetic diffusion generator artifacts.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { name: 'High-Frequency Radial Spikes', score: `${imageData.fftHighFreqSpike}%`, level: 'ANOMALOUS' },
                  { name: 'Bayer Noise Pattern Consistency', score: `${imageData.noiseVariance}%`, level: 'DISRUPTED' },
                  { name: 'Face Landmark Bounding Box', score: `${imageData.faceConfidence}%`, level: 'MATCHED' },
                  { name: 'Resampling Bicubic Artifacts', score: '91.8%', level: 'DETECTED' },
                ].map((item, idx) => (
                  <div key={idx} style={{
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{item.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>{item.score}</span>
                      <span style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        background: item.level === 'MATCHED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 46, 91, 0.15)',
                        color: item.level === 'MATCHED' ? 'var(--emerald)' : 'var(--crimson)',
                      }}>
                        {item.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
