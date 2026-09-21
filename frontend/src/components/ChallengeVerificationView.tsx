import React, { useState, useRef } from 'react';
import { CheckCircle2, Mic, Square, RefreshCw, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { api } from '../services/api';
import { ChallengeGenerateResponse, ChallengeSubmitResponse } from '../types';

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

export const ChallengeVerificationView: React.FC = () => {
  const [challenge, setChallenge] = useState<ChallengeGenerateResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ChallengeSubmitResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleGenerateChallenge = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    setVerificationResult(null);
    setAudioBlob(null);
    setAudioUrl(null);

    try {
      const res = await api.generateChallenge();
      setChallenge(res);
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
      
      // Check best supported browser recording MIME
      let selectedMime = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(selectedMime)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          selectedMime = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          selectedMime = 'audio/ogg';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          selectedMime = 'audio/mp4';
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
          // Convert browser WebM/Opus audio to standard 16-bit PCM WAV
          const arrayBuffer = await rawBlob.arrayBuffer();
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          const wavBlob = audioBufferToWav(audioBuffer);
          setAudioBlob(wavBlob);
          setAudioUrl(URL.createObjectURL(wavBlob));
          await audioCtx.close();
        } catch {
          // Direct fallback: use raw WebM blob (backend natively handles and decodes WebM)
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
      const res = await api.submitChallenge(challenge.session_token, audioBlob);
      setVerificationResult(res);
    } catch (err: any) {
      const msg = typeof err?.message === 'string' ? err.message : (typeof err === 'string' ? err : 'Verification submission error.');
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Dynamic Challenge-Response Impersonation Verification
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Mitigates pre-recorded and real-time voice cloning attacks by generating dynamic, phonetically complex vocal challenges.
        </p>
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

      {/* Main Studio Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
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
              Generates a timestamped, cryptographically salted challenge phrase. The target identity must recite the phrase aloud to authenticate acoustic vocal tract integrity.
            </p>
            <button
              onClick={handleGenerateChallenge}
              disabled={isGenerating}
              className="btn-primary"
            >
              <RefreshCw size={16} />
              <span>{isGenerating ? 'Generating Phrase...' : 'Generate New Challenge Phrase'}</span>
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
                  ACTIVE VOCAL CHALLENGE PHRASE
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
                  <span>RECORDING LIVE AUDIO...</span>
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
                <span>{isSubmitting ? 'Evaluating Liveness...' : 'Submit Response for Verification'}</span>
              </button>

              <button
                onClick={handleGenerateChallenge}
                className="btn-secondary"
                title="Regenerate Challenge"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Verification Result */}
            {verificationResult && (
              <div style={{
                marginTop: '16px',
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
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
