import React, { useState, useEffect } from 'react';
import { Cpu, CheckCircle2, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { ModelInfo } from '../types';

export const ModelsView: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getModelsStatus()
      .then(data => setModels(data))
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="view-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Neural Forensic Model Registry & Provenance
          </h1>
          <p className="page-subtitle">
            Documented signal processing architectures, frequency-domain extractors, and calibrated Bayesian risk engines.
          </p>
        </div>
      </div>

      {/* Scientific Integrity Disclaimer */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '6px',
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <Info size={20} color="var(--cobalt)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          <strong style={{ color: '#FFFFFF' }}>Forensic Limitations Notice:</strong> DeepShield AI detection algorithms evaluate statistical deviations in acoustic harmonics, spatial compression quantization, and inter-frame facial trajectory stability. While effective against state-of-the-art synthetic generators, no biometric detection model is 100% infallible. Results represent calibrated probabilities rather than absolute deterministic truth.
        </div>
      </div>

      {/* Models Grid */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          QUERYING MODEL REGISTRY...
        </div>
      ) : (
        <div className="grid-2col">
          {models.map((m) => (
            <div key={m.name} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '10px', 
                  fontFamily: 'var(--font-mono)', 
                  fontWeight: 600, 
                  textTransform: 'uppercase',
                  background: 'rgba(0, 229, 255, 0.1)',
                  color: 'var(--cyan)',
                  border: '1px solid rgba(0, 229, 255, 0.2)',
                }}>
                  {m.media_type} PIPELINE
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--emerald)', fontFamily: 'var(--font-mono)' }}>
                  <CheckCircle2 size={12} />
                  {m.status.toUpperCase()}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>{m.name}</h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  VERSION {m.version} • {m.device}
                </div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {m.description}
              </p>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  EXTRACTED FORENSIC SIGNALS:
                </span>
                <ul style={{ marginTop: '8px', paddingLeft: '16px', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {m.features_extracted.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
