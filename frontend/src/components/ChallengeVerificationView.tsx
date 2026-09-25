import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Mic, 
  Square, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Fingerprint, 
  Search, 
  Filter, 
  ExternalLink, 
  Activity, 
  Lock, 
  ArrowRight,
  Sparkles,
  Layers,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { ChallengeGenerateResponse, ChallengeSubmitResponse, VerificationRecord } from '../types';

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  // Format sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  // Data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, length, true);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = buffer.getChannelData(channel)[i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

interface ChallengeVerificationViewProps {
  initialEventId?: string | null;
  initialIdentity?: string | null;
  initialRiskLevel?: string | null;
  onClearEvent?: () => void;
}

export const ChallengeVerificationView: React.FC<ChallengeVerificationViewProps> = ({
  initialEventId,
  initialIdentity,
  initialRiskLevel,
  onClearEvent,
}) => {
  const [challenge, setChallenge] = useState<ChallengeGenerateResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ChallengeSubmitResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Dynamic Identity & Source Tagging
  const [activeEventId, setActiveEventId] = useState<string>(initialEventId || '');
  const [personIdentity, setPersonIdentity] = useState<string>(initialIdentity || 'Rajesh Sharma (CFO)');
  const [riskLevel, setRiskLevel] = useState<string>(initialRiskLevel || 'high');
  const [sourceChannel, setSourceChannel] = useState<string>(initialEventId ? 'Live Surveillance Radar' : 'Dynamic Challenge Studio');

  // Persistent Verification History
  const [historyRecords, setHistoryRecords] = useState<VerificationRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Fetch persistent history from SQLite backend on mount
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const records = await api.getVerificationHistory(50);
      setHistoryRecords(records);
    } catch (err: any) {
      console.warn('Failed to load persistent verification history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Update state if new props arrive
  useEffect(() => {
    if (initialEventId) {
      setActiveEventId(initialEventId);
      setSourceChannel('Live Surveillance Radar');
      if (initialIdentity) setPersonIdentity(initialIdentity);
      if (initialRiskLevel) setRiskLevel(initialRiskLevel);
      handleGenerateChallenge(initialEventId);
    }
  }, [initialEventId]);

  const handleGenerateChallenge = async (overrideEventId?: string) => {
    setIsGenerating(true);
    setErrorMsg('');
    setVerificationResult(null);
    setAudioBlob(null);
    setAudioUrl(null);

    const targetEvent = overrideEventId || activeEventId || `VRF-${Date.now().toString().slice(-6)}`;
    setActiveEventId(targetEvent);

    try {
      const res = await api.generateChallenge({
        event_id: targetEvent,
        source: sourceChannel,
        person_identity: personIdentity,
        detection_type: 'Vocal Liveness Challenge',
        risk_level: riskLevel,
        confidence_score: 0.88,
      });
      setChallenge(res);
      // Refresh history to show newly created pending challenge session in table
      fetchHistory();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate dynamic challenge.');
    } finally {
      setIsGenerating(false);
    }
  };

  const startRecording = async () => {
    setErrorMsg('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let selectedMime = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(selectedMime)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          selectedMime = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          selectedMime = 'audio/ogg';
        } else {
          selectedMime = '';
        }
      }

      const mediaRecorder = selectedMime
        ? new MediaRecorder(stream, { mimeType: selectedMime })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const rawBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        try {
          const arrayBuffer = await rawBlob.arrayBuffer();
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          const wavBlob = audioBufferToWav(audioBuffer);
          setAudioBlob(wavBlob);
          setAudioUrl(URL.createObjectURL(wavBlob));
          await audioCtx.close();
        } catch {
          setAudioBlob(rawBlob);
          setAudioUrl(URL.createObjectURL(rawBlob));
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!challenge) {
      setErrorMsg('No active challenge. Please generate a challenge phrase first.');
      return;
    }
    if (!audioBlob) {
      setErrorMsg('No vocal response recorded. Please record yourself reciting the phrase.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.submitChallenge(challenge.session_token, audioBlob, activeEventId);
      setVerificationResult(res);
      // Immediately refresh persistent database history so verification is reflected immediately
      await fetchHistory();
      if (onClearEvent) onClearEvent();
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : (typeof err === 'string' ? err : 'Verification submission error.');
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered History
  const filteredHistory = historyRecords.filter((rec) => {
    const q = searchFilter.toLowerCase();
    const matchSearch = rec.event_id.toLowerCase().includes(q) ||
                        rec.person_identity.toLowerCase().includes(q) ||
                        rec.source.toLowerCase().includes(q) ||
                        rec.detection_type.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || rec.verification_status === statusFilter || rec.final_decision.includes(statusFilter);
    return matchSearch && matchStatus;
  });

  return (
    <div className="view-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">
              Dynamic Challenge-Response Impersonation Verification
            </h1>
            <span style={{
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--emerald)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}>
              DATABASE SYNCHRONIZED
            </span>
          </div>
          <p className="page-subtitle">
            Mitigates real-time synthetic voice cloning and replay attacks via dynamic phonetically salted challenges and persistent verification logging.
          </p>
        </div>

        {initialEventId && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 229, 255, 0.12)',
            border: '1px solid var(--cyan)',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--cyan)',
          }}>
            <Activity size={14} />
            <span>LINKED RADAR EVENT: {initialEventId}</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '4px',
          background: 'rgba(255, 46, 91, 0.1)',
          border: '1px solid rgba(255, 46, 91, 0.3)',
          color: 'var(--crimson)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertTriangle size={16} />
          <span>{typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}</span>
        </div>
      )}

      {/* Main Verification Studio Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {/* Top Session Metadata Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '4px' }}>
              TARGET IDENTITY / SUBJECT
            </label>
            <input
              type="text"
              value={personIdentity}
              onChange={(e) => setPersonIdentity(e.target.value)}
              placeholder="e.g. Rajesh Sharma (CFO)"
              style={{
                width: '100%',
                background: 'rgba(10, 13, 20, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '8px 10px',
                color: '#FFFFFF',
                fontSize: '12px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '4px' }}>
              SOURCE / INGRESS CHANNEL
            </label>
            <select
              value={sourceChannel}
              onChange={(e) => setSourceChannel(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(10, 13, 20, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '8px 10px',
                color: 'var(--text-secondary)',
                fontSize: '12px',
              }}
            >
              <option value="Dynamic Challenge Studio">Dynamic Challenge Studio</option>
              <option value="Live Surveillance Radar">Live Surveillance Radar</option>
              <option value="Biometric Telephony IVR">Biometric Telephony IVR</option>
              <option value="Video KYC Onboarding">Video KYC Onboarding</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '4px' }}>
              EVENT / VERIFICATION ID
            </label>
            <input
              type="text"
              value={activeEventId}
              onChange={(e) => setActiveEventId(e.target.value)}
              placeholder="e.g. EVT-RADAR-88210"
              style={{
                width: '100%',
                background: 'rgba(10, 13, 20, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '8px 10px',
                color: 'var(--cyan)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
              }}
            />
          </div>
        </div>

        {!challenge ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(0, 229, 255, 0.08)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}>
              <CheckCircle2 size={28} color="var(--cyan)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>
              Initialize Active Liveness Challenge
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '8px auto 20px auto', lineHeight: '1.6' }}>
              Generates a timestamped, cryptographically salted challenge phrase. The subject must recite the phrase aloud to authenticate acoustic vocal tract dynamics.
            </p>
            <button
              onClick={() => handleGenerateChallenge()}
              disabled={isGenerating}
              className="btn-primary"
            >
              <RefreshCw size={16} />
              <span>{isGenerating ? 'Generating Dynamic Phrase...' : 'Generate New Challenge Phrase'}</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Dynamic Challenge Card */}
            <div style={{
              padding: '20px',
              borderRadius: '6px',
              background: 'rgba(10, 13, 20, 0.8)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
                  ACTIVE VOCAL CHALLENGE PHRASE • {challenge.event_id || activeEventId}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  <Clock size={12} />
                  EXPIRES IN 5 MIN
                </span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em', lineHeight: '1.5' }}>
                "{challenge.phrase}"
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                {challenge.instructions}
              </div>
            </div>

            {/* Recorder Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {!isRecording ? (
                <button onClick={startRecording} className="btn-primary">
                  <Mic size={16} />
                  <span>{audioBlob ? 'Re-record Vocal Response' : 'Start Vocal Recording'}</span>
                </button>
              ) : (
                <button onClick={stopRecording} className="btn-danger">
                  <Square size={16} />
                  <span>Stop Recording</span>
                </button>
              )}

              {isRecording && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--crimson)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                  <span className="status-led status-led-crimson" />
                  <span>RECORDING LIVE AUDIO RESPONSE...</span>
                </div>
              )}

              {audioUrl && !isRecording && (
                <audio controls src={audioUrl} style={{ height: '36px' }} />
              )}

              <button
                onClick={handleSubmitResponse}
                disabled={!audioBlob || isRecording || isSubmitting}
                className="btn-secondary"
                style={{ marginLeft: 'auto' }}
              >
                <ShieldCheck size={16} />
                <span>{isSubmitting ? 'Evaluating Liveness...' : 'Submit Response & Persist Result'}</span>
              </button>

              <button
                onClick={() => handleGenerateChallenge()}
                className="btn-secondary"
                title="Regenerate Challenge"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Verification Result Banner */}
            {verificationResult && (
              <div style={{
                marginTop: '8px',
                padding: '20px',
                borderRadius: '6px',
                background: verificationResult.is_authentic ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 46, 91, 0.08)',
                border: verificationResult.is_authentic ? '1px solid var(--emerald)' : '1px solid var(--crimson)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {verificationResult.is_authentic ? (
                    <ShieldCheck size={24} color="var(--emerald)" />
                  ) : (
                    <AlertTriangle size={24} color="var(--crimson)" />
                  )}
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: verificationResult.is_authentic ? 'var(--emerald)' : 'var(--crimson)' }}>
                      {verificationResult.is_authentic ? 'CHALLENGE PASSED — VOCAL LIVENESS VERIFIED' : 'CHALLENGE FAILED — SYNTHETIC OR INVALID RESPONSE'}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {verificationResult.explanation}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>VOICE AUTHENTICITY SCORE</span>
                    <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>
                      {Math.round(verificationResult.voice_authenticity_score * 100)}%
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CHALLENGE SIMILARITY</span>
                    <div className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF' }}>
                      {Math.round(verificationResult.similarity_score * 100)}%
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FINAL DECISION</span>
                    <div className="font-mono" style={{ fontSize: '14px', fontWeight: 800, color: verificationResult.is_authentic ? 'var(--emerald)' : 'var(--crimson)', marginTop: '4px' }}>
                      {verificationResult.final_decision || (verificationResult.is_authentic ? 'VERIFIED_AUTHENTIC' : 'IMPERSONATION_BLOCKED')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PERSISTENT DYNAMIC VERIFICATION HISTORY SECTION                           */}
      {/* ========================================================================= */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="var(--cyan)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
                Dynamic Verification History & Evidence Ledger
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Persistent SQLite / PostgreSQL audit trail recording every live surveillance event, challenge phrase, and biometric decision.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={fetchHistory}
              disabled={isLoadingHistory}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              <RefreshCw size={13} className={isLoadingHistory ? 'spin' : ''} />
              <span>{isLoadingHistory ? 'Refreshing...' : 'Refresh History'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{
            flex: 1,
            minWidth: '220px',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(10, 13, 20, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '0 10px',
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search event ID, person, source, or detection..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#FFFFFF',
                padding: '8px 10px',
                fontSize: '12px',
                width: '100%',
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'rgba(10, 13, 20, 0.8)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              padding: '0 12px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="verified">Verified (Authentic)</option>
            <option value="failed">Failed / Blocked</option>
            <option value="challenge_issued">Challenge Issued</option>
            <option value="pending">Pending Response</option>
          </select>
        </div>

        {/* Dynamic Verification History Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <th style={{ padding: '10px 12px' }}>EVENT ID</th>
                <th style={{ padding: '10px 12px' }}>DATE & TIME</th>
                <th style={{ padding: '10px 12px' }}>SOURCE</th>
                <th style={{ padding: '10px 12px' }}>IDENTITY</th>
                <th style={{ padding: '10px 12px' }}>CHALLENGE PHRASE</th>
                <th style={{ padding: '10px 12px' }}>CONFIDENCE</th>
                <th style={{ padding: '10px 12px' }}>RISK</th>
                <th style={{ padding: '10px 12px' }}>DECISION</th>
                <th style={{ padding: '10px 12px' }}>EVIDENCE HASH</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No verification records found in persistent database.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((rec) => {
                  const isVerified = rec.verification_status === 'verified' || rec.final_decision.includes('AUTHENTIC');
                  const isFailed = rec.verification_status === 'failed' || rec.final_decision.includes('BLOCKED');
                  const isPending = !isVerified && !isFailed;

                  return (
                    <tr
                      key={rec.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: rec.event_id === activeEventId ? 'rgba(0, 229, 255, 0.05)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontWeight: 700 }}>
                        {rec.event_id}
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {new Date(rec.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                        {rec.source}
                      </td>
                      <td style={{ padding: '12px', color: '#FFFFFF', fontWeight: 600 }}>
                        {rec.person_identity}
                      </td>
                      <td style={{ padding: '12px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }} title={rec.challenge_phrase || ''}>
                        {rec.challenge_phrase || 'N/A (Standard Liveness)'}
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>
                        {rec.confidence_score > 0 ? `${Math.round(rec.confidence_score * 100)}%` : `${Math.round(rec.voice_authenticity_score * 100)}%`}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className={`badge-${rec.risk_level || 'low'}`} style={{ fontSize: '10px' }}>
                          {(rec.risk_level || 'low').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 800,
                          background: isVerified ? 'rgba(16, 185, 129, 0.15)' : isFailed ? 'rgba(255, 46, 91, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: isVerified ? 'var(--emerald)' : isFailed ? 'var(--crimson)' : 'var(--amber)',
                          border: `1px solid ${isVerified ? 'rgba(16, 185, 129, 0.4)' : isFailed ? 'rgba(255, 46, 91, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                        }}>
                          {rec.final_decision}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <code>{rec.evidence_id || 'PENDING_SIG'}</code>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
