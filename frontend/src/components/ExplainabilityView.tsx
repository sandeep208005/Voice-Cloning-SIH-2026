import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Zap,
  Mic,
  Video,
  Image as ImageIcon,
  UserCheck,
  Activity,
  Layers,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Flame,
  FileCheck,
  ChevronRight,
  RefreshCw,
  Code,
  Sliders,
  Maximize2
} from 'lucide-react';

interface ForensicSample {
  id: string;
  title: string;
  sourceType: 'Audio Stream' | 'Video KYC Stream' | 'Biometric Prompt';
  targetPersona: string;
  syntheticProbability: number;
  naturalProbability: number;
  voiceAuthenticity: number;
  audioResult: { status: string; confidence: number; note: string };
  videoResult: { status: string; confidence: number; note: string };
  imageResult: { status: string; confidence: number; note: string };
  identityResult: { status: string; confidence: number; note: string };
  overallDecision: 'HIGH-RISK IMPERSONATION DETECTED' | 'AUTHENTIC HUMAN VERIFIED' | 'SUSPICIOUS REPLAY DETECTED';
  overallConfidence: number;
  indicators: {
    name: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'CLEAN';
    score: number;
    detail: string;
  }[];
  spectralSignature: string;
}

const FORENSIC_SAMPLES: ForensicSample[] = [
  {
    id: 'sample-1',
    title: 'Executive Wire Transfer Call (CFO Clone)',
    sourceType: 'Audio Stream',
    targetPersona: 'Rajesh Sharma (CFO)',
    syntheticProbability: 91.0,
    naturalProbability: 18.0,
    voiceAuthenticity: 82.0,
    audioResult: { status: 'Synthetic', confidence: 94.7, note: 'ElevenLabs v3 vocoder artifacts isolated in 4kHz-8kHz band' },
    videoResult: { status: 'Manipulated', confidence: 87.2, note: 'Lip-sync drift of 142ms detected against phoneme timing' },
    imageResult: { status: 'Authentic', confidence: 96.1, note: 'Static ID card ELA noise patterns match canonical sensor profile' },
    identityResult: { status: 'Suspicious', confidence: 91.8, note: 'Cosine distance 0.884 exceeds biometric enrollment threshold (0.45)' },
    overallDecision: 'HIGH-RISK IMPERSONATION DETECTED',
    overallConfidence: 94.7,
    indicators: [
      {
        name: 'Abnormal Voice Frequency Patterns',
        description: 'Spectral cutoff at 8kHz and unnatural harmonic continuity typical of neural vocoders.',
        severity: 'CRITICAL',
        score: 96.4,
        detail: 'Discontinuity detected in upper harmonics (F3-F4 formants) with lack of natural glottal pulses.',
      },
      {
        name: 'Unnatural Speech Micro-Jitter',
        description: 'Synthetic speech exhibits unnatural periodic stability without physiological tremor.',
        severity: 'HIGH',
        score: 91.2,
        detail: 'Jitter score 0.014% (Natural range: 0.4% - 1.2%). Pitch variance is artificially flattened.',
      },
      {
        name: 'Audio Phase & Discontinuity Artifacts',
        description: 'Phase inversion and frame boundary stitching from auto-regressive audio synthesis.',
        severity: 'HIGH',
        score: 88.5,
        detail: 'STFT phase inconsistencies at phoneme boundary transitions [0.42s, 1.18s, 2.30s].',
      },
      {
        name: 'Lip-Sync Temporal Inconsistency',
        description: 'Viseme-to-phoneme timing discrepancy calculated via 3D facial mesh tracker.',
        severity: 'HIGH',
        score: 87.2,
        detail: 'Mouth aperture open duration lagged acoustic bilabial plosives /p/, /b/ by 142ms.',
      },
      {
        name: 'Facial Landmark Warping & Boundary Blur',
        description: 'Error Level Analysis (ELA) reveals spatial compression gradient boundaries.',
        severity: 'MODERATE',
        score: 74.0,
        detail: 'Perimeter of jawline shows 12% higher high-frequency noise variance than background frame.',
      },
      {
        name: 'Diffusion & GAN Footprint Residuals',
        description: 'Latent diffusion model high-frequency noise residuals in Mel-spectrogram.',
        severity: 'CRITICAL',
        score: 95.8,
        detail: 'Matches spectral fingerprint of XTTS-v2 Diffusion conditioning layer with 95.8% similarity.',
      },
    ],
    spectralSignature: 'SIG-XTTS2-MEL-882194',
  },
  {
    id: 'sample-2',
    title: 'Live Video KYC Session Onboarding',
    sourceType: 'Video KYC Stream',
    targetPersona: 'Sarah Jenkins (Treasury)',
    syntheticProbability: 84.5,
    naturalProbability: 24.0,
    voiceAuthenticity: 71.0,
    audioResult: { status: 'Suspicious', confidence: 82.4, note: 'Pitch jitter anomaly and unnatural breathing cadence' },
    videoResult: { status: 'Manipulated', confidence: 93.8, note: 'Face-swapping boundary mask detected around chin & forehead' },
    imageResult: { status: 'Manipulated', confidence: 89.2, note: 'Metadata mismatch and localized resampling gradients' },
    identityResult: { status: 'Suspicious', confidence: 88.0, note: '3D head rotation angle does not correlate with ear perspective' },
    overallDecision: 'HIGH-RISK IMPERSONATION DETECTED',
    overallConfidence: 91.2,
    indicators: [
      {
        name: 'Facial Landmark Boundary Inconsistency',
        description: 'Blending mask boundary between source video and generated face overlay.',
        severity: 'CRITICAL',
        score: 94.1,
        detail: 'Gradient difference on perimeter coordinates (x: 210-480, y: 140-390).',
      },
      {
        name: 'Blink Rate & Corneal Reflection Anomaly',
        description: 'Eye blinks do not follow Poisson distribution and corneal reflections lack light source consistency.',
        severity: 'HIGH',
        score: 89.6,
        detail: 'Zero micro-saccades detected over 8.4 seconds of continuous gaze tracking.',
      },
      {
        name: 'Audio-Visual Sync Temporal Drift',
        description: 'Audio onset timestamps precede visual articulation of open vowels.',
        severity: 'HIGH',
        score: 86.4,
        detail: 'Offset error delta +118ms across 14 spoken syllables.',
      },
    ],
    spectralSignature: 'SIG-SADTALKER-GAN-4401',
  },
  {
    id: 'sample-3',
    title: 'Verified Employee Authentication (Clean Sample)',
    sourceType: 'Biometric Prompt',
    targetPersona: 'Dr. Alok Verma (Verified User)',
    syntheticProbability: 6.2,
    naturalProbability: 97.4,
    voiceAuthenticity: 98.6,
    audioResult: { status: 'Authentic', confidence: 97.8, note: 'Natural acoustic room reverberation and organic glottal micro-tremor' },
    videoResult: { status: 'Authentic', confidence: 98.4, note: 'Natural biological blood flow micro-color changes (rPPG pulse confirmed)' },
    imageResult: { status: 'Authentic', confidence: 99.1, note: 'Pristine camera sensor Bayer noise pattern verified' },
    identityResult: { status: 'Verified', confidence: 98.9, note: 'Voice embedding cosine distance 0.142 (Well within threshold)' },
    overallDecision: 'AUTHENTIC HUMAN VERIFIED',
    overallConfidence: 98.2,
    indicators: [
      {
        name: 'Organic Glottal Pulse Dynamics',
        description: 'Natural human vocal cord vibrations and authentic acoustic shimmer.',
        severity: 'CLEAN',
        score: 4.1,
        detail: 'Natural pitch jitter of 0.78% perfectly within expected human vocal tract physiology.',
      },
      {
        name: 'Physiological Pulse (rPPG) Verification',
        description: 'Subtle facial skin micro-color pulse aligns with resting cardiovascular rate.',
        severity: 'CLEAN',
        score: 3.2,
        detail: 'Resting pulse 72 bpm detected across forehead region-of-interest.',
      },
      {
        name: 'Acoustic Room Reflection Consistency',
        description: 'Early reflections and room impulse response match calibrated microphone environment.',
        severity: 'CLEAN',
        score: 5.0,
        detail: 'No vocoder phase discontinuities or boundary clipping detected.',
      },
    ],
    spectralSignature: 'SIG-VERIFIED-HUMAN-9901',
  }
];

export const ExplainabilityView: React.FC = () => {
  const [selectedSample, setSelectedSample] = useState<ForensicSample>(FORENSIC_SAMPLES[0]);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'indicators' | 'spectral' | 'matrix'>('indicators');

  const isFake = selectedSample.syntheticProbability > 50;

  return (
    <div className="view-container">
      {/* Top Header */}
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
            <Brain size={26} color="var(--cyan)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                AI Model & Forensic Explainability (XAI)
              </h1>
              <span style={{
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#A78BFA',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
              }}>
                EXPLAINABLE AI ENGINE
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Transparent forensic rationale: Discover exactly why the ensemble model flags audio & video as synthetic.
            </p>
          </div>
        </div>

        {/* Sample Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SAMPLE DOSSIER:</span>
          {FORENSIC_SAMPLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSample(s)}
              style={{
                background: selectedSample.id === s.id ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${selectedSample.id === s.id ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                color: selectedSample.id === s.id ? 'var(--cyan)' : 'var(--text-secondary)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                fontWeight: selectedSample.id === s.id ? 700 : 400,
                transition: 'all 0.15s ease',
              }}
            >
              {s.title.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Hero: Final AI Decision Callout Banner */}
      <div className="card" style={{
        padding: '20px 24px',
        borderLeft: `4px solid ${isFake ? 'var(--crimson)' : 'var(--emerald)'}`,
        background: isFake 
          ? 'linear-gradient(90deg, rgba(255, 46, 91, 0.1) 0%, rgba(15, 20, 32, 0.9) 100%)'
          : 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 20, 32, 0.9) 100%)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: isFake ? 'rgba(255, 46, 91, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {isFake ? <AlertTriangle size={24} color="var(--crimson)" /> : <CheckCircle size={24} color="var(--emerald)" />}
          </div>
          <div>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              PRIMARY FORENSIC VERDICT
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: isFake ? 'var(--crimson)' : 'var(--emerald)', letterSpacing: '-0.01em' }}>
              {selectedSample.overallDecision}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ENSEMBLE CONFIDENCE</span>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              {selectedSample.overallConfidence}%
            </div>
          </div>

          <div style={{
            padding: '8px 12px',
            background: 'rgba(10, 13, 20, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }}>
            <div>TARGET: <strong style={{ color: '#FFFFFF' }}>{selectedSample.targetPersona}</strong></div>
            <div style={{ marginTop: '2px', color: 'var(--cyan)' }}>SIG: {selectedSample.spectralSignature}</div>
          </div>
        </div>
      </div>

      {/* Row 1: AI Detection Breakdown (Probabilities & Authenticity Gauges) */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
          AI Detection Probability Breakdown
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Calibrated posterior probabilities derived from multi-head acoustic and visual transformer encoders.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {/* Gauge 1: Synthetic Voice Probability */}
          <div style={{
            background: 'rgba(10, 13, 20, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--crimson)' }}>
                SYNTHETIC VOICE PROBABILITY
              </span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--crimson)', fontFamily: 'var(--font-mono)' }}>
                {selectedSample.syntheticProbability}%
              </span>
            </div>
            {/* Visual Bar */}
            <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                width: `${selectedSample.syntheticProbability}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #FF2E5B 0%, #FF6B8B 100%)',
                boxShadow: '0 0 10px rgba(255, 46, 91, 0.5)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>0% (Natural)</span>
              <span>100% (Fully Synthetic)</span>
            </div>
          </div>

          {/* Gauge 2: Natural Speech Probability */}
          <div style={{
            background: 'rgba(10, 13, 20, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--emerald)' }}>
                NATURAL SPEECH PROBABILITY
              </span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>
                {selectedSample.naturalProbability}%
              </span>
            </div>
            {/* Visual Bar */}
            <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                width: `${selectedSample.naturalProbability}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>0% (Synthetic)</span>
              <span>100% (Pristine Organic)</span>
            </div>
          </div>

          {/* Gauge 3: Voice Authenticity Metric */}
          <div style={{
            background: 'rgba(10, 13, 20, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cyan)' }}>
                SPEECH AUTHENTICITY SCORE
              </span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                {selectedSample.voiceAuthenticity}%
              </span>
            </div>
            {/* Visual Bar */}
            <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{
                width: `${selectedSample.voiceAuthenticity}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #00E5FF 0%, #3B82F6 100%)',
                boxShadow: '0 0 10px rgba(0, 229, 255, 0.4)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <span>Confidence Threshold: 65%</span>
              <span>Ensemble Match</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Multimodal Analysis Table & Explainable Indicators */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.8fr)',
        gap: '20px',
      }}>
        {/* Multimodal Analysis Confidence Table */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
              Multimodal Analysis Matrix
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Independent modal forensics evaluating cross-channel consistency.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <th style={{ padding: '8px 10px' }}>MODALITY</th>
                  <th style={{ padding: '8px 10px' }}>RESULT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>CONFIDENCE</th>
                </tr>
              </thead>
              <tbody>
                {/* Audio */}
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#FFFFFF' }}>
                    <Mic size={14} color="var(--cyan)" />
                    🎙️ Audio
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: selectedSample.audioResult.status === 'Synthetic' ? 'rgba(255, 46, 91, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: selectedSample.audioResult.status === 'Synthetic' ? 'var(--crimson)' : 'var(--emerald)',
                    }}>
                      {selectedSample.audioResult.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>
                    {selectedSample.audioResult.confidence}%
                  </td>
                </tr>

                {/* Video */}
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#FFFFFF' }}>
                    <Video size={14} color="var(--cobalt)" />
                    🎥 Video
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: selectedSample.videoResult.status === 'Manipulated' ? 'rgba(255, 46, 91, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: selectedSample.videoResult.status === 'Manipulated' ? 'var(--crimson)' : 'var(--emerald)',
                    }}>
                      {selectedSample.videoResult.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>
                    {selectedSample.videoResult.confidence}%
                  </td>
                </tr>

                {/* Image */}
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#FFFFFF' }}>
                    <ImageIcon size={14} color="var(--amber)" />
                    🖼️ Image / ELA
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: selectedSample.imageResult.status === 'Authentic' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 46, 91, 0.15)',
                      color: selectedSample.imageResult.status === 'Authentic' ? 'var(--emerald)' : 'var(--crimson)',
                    }}>
                      {selectedSample.imageResult.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>
                    {selectedSample.imageResult.confidence}%
                  </td>
                </tr>

                {/* Identity */}
                <tr>
                  <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#FFFFFF' }}>
                    <UserCheck size={14} color="#A78BFA" />
                    🧑 Identity
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      background: selectedSample.identityResult.status === 'Suspicious' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: selectedSample.identityResult.status === 'Suspicious' ? 'var(--amber)' : 'var(--emerald)',
                    }}>
                      {selectedSample.identityResult.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>
                    {selectedSample.identityResult.confidence}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{
            marginTop: '16px',
            padding: '12px 14px',
            background: 'rgba(0, 229, 255, 0.05)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            borderRadius: '6px',
            fontSize: '11px',
            color: 'var(--text-secondary)',
          }}>
            <strong style={{ color: 'var(--cyan)' }}>FORENSIC SYNCHRONY NOTE:</strong> {selectedSample.audioResult.note}
          </div>
        </div>

        {/* Explainable AI Specific Indicators (Why it is fake) */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
                Detected Explainability Indicators & Artifacts
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Mathematical evidence proving neural synthesis or organic human speech.
              </p>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {selectedSample.indicators.length} CRITICAL FACTORS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
            {selectedSample.indicators.map((ind, i) => {
              const isCrit = ind.severity === 'CRITICAL';
              const isHigh = ind.severity === 'HIGH';
              const isMod = ind.severity === 'MODERATE';
              const isClean = ind.severity === 'CLEAN';

              return (
                <div key={i} style={{
                  padding: '14px 16px',
                  background: 'rgba(10, 13, 20, 0.85)',
                  border: `1px solid ${isCrit ? 'rgba(255, 46, 91, 0.3)' : isClean ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
                  borderRadius: '6px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                        {ind.name}
                      </span>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        background: isCrit ? 'rgba(255, 46, 91, 0.15)' : isHigh ? 'rgba(245, 158, 11, 0.15)' : isClean ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 229, 255, 0.15)',
                        color: isCrit ? 'var(--crimson)' : isHigh ? 'var(--amber)' : isClean ? 'var(--emerald)' : 'var(--cyan)',
                      }}>
                        {ind.severity}
                      </span>
                    </div>

                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: isCrit ? 'var(--crimson)' : isClean ? 'var(--emerald)' : 'var(--amber)' }}>
                      Anomaly: {ind.score}%
                    </span>
                  </div>

                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    {ind.description}
                  </p>

                  <div style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: isCrit ? '#FFA4B6' : isClean ? '#A7F3D0' : 'var(--text-secondary)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '6px 10px',
                    borderRadius: '4px',
                  }}>
                    🔍 {ind.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
