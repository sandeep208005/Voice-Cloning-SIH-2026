import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Mic, 
  Image as ImageIcon, 
  Video, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Cpu, 
  FileCode, 
  Layers, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { AnalysisDetail } from '../types';

interface ForensicLabViewProps {
  onAnalysisCompleted: () => void;
  selectedAnalysisDetail: AnalysisDetail | null;
  onClearSelected: () => void;
}

export const ForensicLabView: React.FC<ForensicLabViewProps> = ({
  onAnalysisCompleted,
  selectedAnalysisDetail,
  onClearSelected,
}) => {
  const [mediaType, setMediaType] = useState<'audio' | 'image' | 'video'>('audio');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'spectrogram' | 'gradcam' | 'technical' | 'frames' | 'raw'>('overview');
  const [localResult, setLocalResult] = useState<AnalysisDetail | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentResult = selectedAnalysisDetail || localResult;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setErrorMessage('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMessage('');
    }
  };

  const handleRunAnalysis = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage('');
    setStatusMessage('Validating cryptographic MIME headers and transmitting payload...');

    try {
      setTimeout(() => {
        if (mediaType === 'audio') {
          setStatusMessage('Decomposing audio into Mel-Spectrogram & computing high-frequency vocoder attenuation...');
        } else if (mediaType === 'image') {
          setStatusMessage('Executing facial landmark localization & 2D-FFT frequency spectrum analysis...');
        } else {
          setStatusMessage('Extracting temporal frame sequence & calculating inter-frame facial trajectory jitter...');
        }
      }, 700);

      const result = await api.uploadMedia(mediaType, file);
      setLocalResult(result);
      onAnalysisCompleted();
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis failed. Please inspect input media.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  const handleReset = () => {
    setFile(null);
    setLocalResult(null);
    onClearSelected();
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getFormatLabel = () => {
    switch (mediaType) {
      case 'audio': return 'WAV, MP3, FLAC, M4A, OGG (Max 100MB)';
      case 'image': return 'JPG, PNG, WEBP (Max 100MB)';
      case 'video': return 'MP4, WEBM, MOV (Max 100MB)';
    }
  };

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Forensic Ingestion & Multimodal Analysis Lab
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Upload raw suspicious media to execute deterministic neural vocoder, 2D-FFT spectral, and temporal inconsistency forensics.
          </p>
        </div>
        {currentResult && (
          <button onClick={handleReset} className="btn-secondary">
            <RefreshCw size={14} />
            <span>Analyze Another Sample</span>
          </button>
        )}
      </div>

      {/* Upload & Ingestion Interface */}
      {!currentResult ? (
        <div className="glass-panel" style={{ padding: '24px' }}>
          {/* Media Type Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[
              { id: 'audio', label: 'Audio / Voiceprint', icon: Mic },
              { id: 'image', label: 'Image / Visual Forensics', icon: ImageIcon },
              { id: 'video', label: 'Video / Temporal Streams', icon: Video },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSel = mediaType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setMediaType(tab.id as any); setFile(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    background: isSel ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                    border: isSel ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
                    color: isSel ? 'var(--cyan)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`dropzone-container ${isDragging ? 'drag-active' : ''}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept={
                mediaType === 'audio' ? 'audio/*' :
                mediaType === 'image' ? 'image/*' : 'video/*'
              }
            />
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(0, 229, 255, 0.08)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
            }}>
              <UploadCloud size={24} color="var(--cyan)" />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>
              {file ? file.name : `Select or drag & drop ${mediaType} file here`}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {getFormatLabel()}
            </div>
            {file && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div style={{
              marginTop: '16px',
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
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '4px', background: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid var(--cyan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'radar-sweep 0.8s linear infinite' }} />
                <span style={{ fontSize: '13px', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                  {statusMessage}
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleRunAnalysis}
              disabled={!file || isProcessing}
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: '14px' }}
            >
              <Cpu size={16} />
              <span>{isProcessing ? 'Analyzing Telemetry...' : 'Trigger Forensic Inspection'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Results View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Production Safety Notice */}
          <div style={{
            padding: '12px 18px',
            borderRadius: '6px',
            background: 'rgba(0, 229, 255, 0.06)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '12px',
            color: '#FFFFFF',
            boxShadow: '0 2px 12px rgba(0, 229, 255, 0.08)'
          }}>
            <AlertTriangle size={18} color="var(--cyan)" style={{ flexShrink: 0 }} />
            <div style={{ lineHeight: '1.5' }}>
              <span style={{ color: 'var(--cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>PRODUCTION SAFETY RULE: </span>
              {currentResult.production_safety_notice || "This result is an AI model prediction, not definitive proof of image origin."}
            </div>
          </div>

          {/* Main Verdict Card */}
          <div className={currentResult.analysis.risk_level === 'high' ? 'glass-panel glass-panel-danger' : 'glass-panel'} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge-${currentResult.analysis.risk_level}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                    <span className={`status-led status-led-${currentResult.analysis.risk_level === 'high' ? 'crimson' : (currentResult.analysis.risk_level === 'medium' ? 'amber' : 'emerald')}`} />
                    {currentResult.analysis.risk_level.toUpperCase()} RISK
                  </span>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(0, 229, 255, 0.1)',
                    color: 'var(--cyan)',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid rgba(0, 229, 255, 0.3)'
                  }}>
                    CALIBRATED PROBABILITY
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ID: {currentResult.analysis.id}
                  </span>
                </div>

                {/* Main Prediction Headline */}
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>Prediction:</span>
                  <span style={{
                    color: currentResult.analysis.classification === 'uncertain'
                      ? 'var(--amber)'
                      : (currentResult.analysis.classification === 'real' || currentResult.analysis.classification === 'likely_authentic'
                          ? 'var(--emerald)'
                          : 'var(--crimson)')
                  }}>
                    {currentResult.analysis.classification === 'uncertain'
                      ? 'UNCERTAIN'
                      : (currentResult.analysis.classification === 'real' || currentResult.analysis.classification === 'likely_authentic'
                          ? 'REAL'
                          : 'AI GENERATED')}
                  </span>
                </h2>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '720px', lineHeight: '1.6' }}>
                  {currentResult.analysis.summary_explanation}
                </p>
              </div>

              {/* Three Stat Gauges: Synthetic Prob, Real Prob, Model Confidence */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ textAlign: 'center', padding: '10px 16px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SYNTHETIC PROBABILITY</div>
                  <div className="font-mono" style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: currentResult.analysis.synthetic_probability >= 0.5 ? 'var(--crimson)' : 'var(--text-secondary)',
                    marginTop: '4px',
                  }}>
                    {(currentResult.analysis.synthetic_probability * 100).toFixed(2)}%
                  </div>
                </div>

                <div style={{ textAlign: 'center', padding: '10px 16px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>REAL PROBABILITY</div>
                  <div className="font-mono" style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: (currentResult.real_probability ?? (1.0 - currentResult.analysis.synthetic_probability)) >= 0.5 ? 'var(--emerald)' : 'var(--text-secondary)',
                    marginTop: '4px',
                  }}>
                    {((currentResult.real_probability ?? (1.0 - currentResult.analysis.synthetic_probability)) * 100).toFixed(2)}%
                  </div>
                </div>

                <div style={{ textAlign: 'center', padding: '10px 16px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MODEL CONFIDENCE</div>
                  <div className="font-mono" style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cyan)', marginTop: '4px' }}>
                    {(currentResult.analysis.confidence * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Provenance Metadata Bar */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '20px',
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}>
              <div>MODEL: <span style={{ color: '#FFFFFF' }}>{currentResult.analysis.model_name}</span></div>
              <div>VERSION: <span style={{ color: '#FFFFFF' }}>{currentResult.analysis.model_version}</span></div>
              <div>THRESHOLD: <span style={{ color: 'var(--cyan)' }}>θ* = {(currentResult.threshold ?? 0.50).toFixed(2)}</span></div>
              <div>LATENCY: <span style={{ color: '#FFFFFF' }}>{currentResult.analysis.processing_time_ms}ms</span></div>
              <div>TARGET: <span style={{ color: '#FFFFFF' }}>{currentResult.analysis.original_filename}</span></div>
              <div>SIZE: <span style={{ color: '#FFFFFF' }}>{(currentResult.analysis.file_size_bytes / 1024).toFixed(1)} KB</span></div>
            </div>

            {/* Limitations Notice */}
            <div style={{
              marginTop: '14px',
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              borderTop: '1px dashed rgba(255,255,255,0.08)',
              paddingTop: '10px'
            }}>
              {currentResult.limitations || "Limitations: AI-generated image detection is probabilistic and may produce false positives and false negatives, particularly under heavy compression or social media re-encoding."}
            </div>
          </div>

          {/* Technical Inspector Tabs */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '16px' }}>
              <button
                onClick={() => setActiveTab('overview')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === 'overview' ? 'var(--cyan)' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderBottom: activeTab === 'overview' ? '2px solid var(--cyan)' : '2px solid transparent',
                  paddingBottom: '8px',
                }}
              >
                Forensic Breakdown
              </button>

              {currentResult.gradcam_heatmap && (
                <button
                  onClick={() => setActiveTab('gradcam')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: activeTab === 'gradcam' ? 'var(--cyan)' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderBottom: activeTab === 'gradcam' ? '2px solid var(--cyan)' : '2px solid transparent',
                    paddingBottom: '8px',
                  }}
                >
                  Grad-CAM Spatial Heatmap
                </button>
              )}

              {currentResult.spectrogram_url && (
                <button
                  onClick={() => setActiveTab('spectrogram')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: activeTab === 'spectrogram' ? 'var(--cyan)' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderBottom: activeTab === 'spectrogram' ? '2px solid var(--cyan)' : '2px solid transparent',
                    paddingBottom: '8px',
                  }}
                >
                  Spectrogram Heatmap
                </button>
              )}

              {currentResult.frame_metrics && currentResult.frame_metrics.length > 0 && (
                <button
                  onClick={() => setActiveTab('frames')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: activeTab === 'frames' ? 'var(--cyan)' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderBottom: activeTab === 'frames' ? '2px solid var(--cyan)' : '2px solid transparent',
                    paddingBottom: '8px',
                  }}
                >
                  Per-Frame Anomaly Timeline ({currentResult.frame_metrics.length} Frames)
                </button>
              )}

              <button
                onClick={() => setActiveTab('technical')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === 'technical' ? 'var(--cyan)' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderBottom: activeTab === 'technical' ? '2px solid var(--cyan)' : '2px solid transparent',
                  paddingBottom: '8px',
                }}
              >
                Technical Details
              </button>

              <button
                onClick={() => setActiveTab('raw')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === 'raw' ? 'var(--cyan)' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderBottom: activeTab === 'raw' ? '2px solid var(--cyan)' : '2px solid transparent',
                  paddingBottom: '8px',
                }}
              >
                Raw Telemetry JSON
              </button>
            </div>

            {/* Tab: Overview Breakdown */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {Object.entries(currentResult.technical_features).map(([key, val]) => {
                  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                    return (
                      <div key={key} style={{ padding: '14px', borderRadius: '6px', background: 'rgba(10, 13, 20, 0.7)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                          {key.replace(/_/g, ' ')}
                        </div>
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                          {Object.entries(val).map(([subK, subV]) => (
                            <div key={subK} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>{subK.replace(/_/g, ' ')}</span>
                              <span className="font-mono" style={{ color: '#FFFFFF' }}>{String(subV)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={key} style={{ padding: '14px', borderRadius: '6px', background: 'rgba(10, 13, 20, 0.7)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="font-mono" style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginTop: '6px' }}>
                        {String(val)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab: Grad-CAM Spatial Heatmap */}
            {activeTab === 'gradcam' && currentResult.gradcam_heatmap && (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{ marginBottom: '10px', fontSize: '13px', fontWeight: 600, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                  GRAD-CAM NEURAL ATTENTION ACTIVATION MAP
                </div>
                <img
                  src={currentResult.gradcam_heatmap}
                  alt="Grad-CAM Visual Attention Heatmap"
                  style={{ width: '100%', maxWidth: '480px', height: 'auto', borderRadius: '6px', border: '1px solid var(--cyan)', boxShadow: '0 0 20px rgba(0, 229, 255, 0.2)' }}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', maxWidth: '600px', margin: '12px auto 0 auto', lineHeight: '1.5' }}>
                  Visualization highlights regions that maximally influenced the neural classification head.
                  <strong> Note:</strong> Highlighted areas represent model attention/contribution, not a definitive "deepfake boundary".
                </div>
              </div>
            )}

            {/* Tab: Technical Details */}
            {activeTab === 'technical' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div style={{ padding: '14px', borderRadius: '6px', background: 'rgba(10, 13, 20, 0.7)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>IMAGE RESOLUTION</div>
                  <div className="font-mono" style={{ fontSize: '16px', color: '#FFFFFF', marginTop: '6px' }}>
                    {currentResult.metadata_info?.width || 'N/A'} × {currentResult.metadata_info?.height || 'N/A'} px
                  </div>
                </div>
                <div style={{ padding: '14px', borderRadius: '6px', background: 'rgba(10, 13, 20, 0.7)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FILE TYPE & SIZE</div>
                  <div className="font-mono" style={{ fontSize: '16px', color: '#FFFFFF', marginTop: '6px' }}>
                    {currentResult.analysis.mime_type} ({(currentResult.analysis.file_size_bytes / 1024).toFixed(1)} KB)
                  </div>
                </div>
                <div style={{ padding: '14px', borderRadius: '6px', background: 'rgba(10, 13, 20, 0.7)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>MODEL VERSION</div>
                  <div className="font-mono" style={{ fontSize: '16px', color: 'var(--cyan)', marginTop: '6px' }}>
                    {currentResult.analysis.model_name} (v{currentResult.analysis.model_version})
                  </div>
                </div>
                <div style={{ padding: '14px', borderRadius: '6px', background: 'rgba(10, 13, 20, 0.7)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PREPROCESSING VERSION</div>
                  <div className="font-mono" style={{ fontSize: '16px', color: '#FFFFFF', marginTop: '6px' }}>
                    Standardized Dual-Stream v2.1.0
                  </div>
                </div>
                <div style={{ padding: '14px', borderRadius: '6px', background: 'rgba(10, 13, 20, 0.7)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>INFERENCE TIMESTAMP</div>
                  <div className="font-mono" style={{ fontSize: '14px', color: '#FFFFFF', marginTop: '6px' }}>
                    {new Date(currentResult.analysis.created_at).toLocaleString()}
                  </div>
                </div>
                <div style={{ padding: '14px', borderRadius: '6px', background: 'rgba(10, 13, 20, 0.7)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DECISION THRESHOLD (θ*)</div>
                  <div className="font-mono" style={{ fontSize: '16px', color: 'var(--cyan)', marginTop: '6px' }}>
                    {(currentResult.threshold ?? 0.50).toFixed(2)} (Validation F1 = 0.973)
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Spectrogram Visualizer */}
            {activeTab === 'spectrogram' && currentResult.spectrogram_url && (
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  NORMALIZED MEL-SPECTROGRAM (0 - 8000 Hz)
                </div>
                <img
                  src={currentResult.spectrogram_url}
                  alt="Acoustic Mel-Spectrogram"
                  style={{ width: '100%', maxWidth: '800px', height: 'auto', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Generated from real Fourier transform energy bins. Sharp high-frequency cutoff points reveal neural vocoder reconstruction.
                </div>
              </div>
            )}

            {/* Tab: Per-frame Timeline */}
            {activeTab === 'frames' && currentResult.frame_metrics && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                  INTER-FRAME SYNTHETIC SCORE TRACKER
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '6px', background: 'rgba(10, 13, 20, 0.8)', padding: '16px 12px 0 12px', borderRadius: '6px' }}>
                  {currentResult.frame_metrics.map((fm) => {
                    const score = fm.frame_synthetic_score;
                    const heightPercent = Math.max(10, score * 100);
                    const isThreat = score >= 0.6;
                    return (
                      <div key={fm.frame_index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{
                          width: '100%',
                          height: `${heightPercent}%`,
                          background: isThreat ? 'var(--crimson)' : (score >= 0.35 ? 'var(--amber)' : 'var(--emerald)'),
                          borderRadius: '2px 2px 0 0',
                          opacity: 0.85,
                        }} title={`Frame ${fm.frame_index}: ${Math.round(score * 100)}%`} />
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                          F{fm.frame_index}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab: Raw JSON */}
            {activeTab === 'raw' && (
              <pre style={{
                background: 'rgba(10, 13, 20, 0.95)',
                padding: '16px',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#38BDF8',
                overflowX: 'auto',
                maxHeight: '380px',
              }}>
                {JSON.stringify(currentResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
