import React, { useState } from 'react';
import {
  AlertOctagon,
  Shield,
  Clock,
  CheckCircle2,
  FileText,
  UserCheck,
  AlertTriangle,
  Lock,
  ArrowRight,
  ExternalLink,
  Download,
  Search,
  Sliders,
  ChevronRight,
  Fingerprint,
  Cpu,
  Share2,
  Terminal,
  Activity
} from 'lucide-react';

interface IncidentCase {
  id: string;
  caseNumber: string;
  threatType: 'Voice Clone Impersonation' | 'Deepfake Video KYC Fraud' | 'Biometric Replay Attack' | 'Prompt-Injected Audio Payload';
  riskScore: number;
  targetUser: string;
  targetAccount: string;
  status: 'OPEN' | 'INVESTIGATING' | 'ESCALATED' | 'BLOCKED' | 'RESOLVED';
  detectedAt: string;
  sourceIp: string;
  deviceFingerprint: string;
  audioFingerprint: string;
  voiceEmbeddingDistance: number;
  playbookExecuted: string[];
  evidenceLedgerHash: string;
  notes: string;
}

const INITIAL_CASES: IncidentCase[] = [
  {
    id: 'inc-1',
    caseNumber: 'CASE #DS-2026-00421',
    threatType: 'Voice Clone Impersonation',
    riskScore: 96.8,
    targetUser: 'Rajesh Sharma (CFO)',
    targetAccount: 'ACC-CORP-99201',
    status: 'BLOCKED',
    detectedAt: '2026-09-25 14:32:08',
    sourceIp: '103.14.28.91 (Singapore)',
    deviceFingerprint: 'DEV-FP-Chrome-Windows-66f8a2',
    audioFingerprint: 'SHA256: 8e4f1a02938bdce981726a45fc9d2',
    voiceEmbeddingDistance: 0.884, // high cosine distance from real enrollment
    playbookExecuted: [
      'Real-time audio stream paused (< 150ms)',
      'Dynamic Challenge-Response dispatched to verified device',
      'Biometric token revoked on IAM cluster',
      'Merkle evidence leaf appended to Forensic Ledger',
      'SOC Tier-1 & Tier-2 pager alerts fired'
    ],
    evidenceLedgerHash: '0x9fa83b2718cd418e90aa234c01bf',
    notes: 'Voice clone attempted to authorize an urgent USD 450,000 wire transaction to offshore beneficiary.'
  },
  {
    id: 'inc-2',
    caseNumber: 'CASE #DS-2026-00420',
    threatType: 'Deepfake Video KYC Fraud',
    riskScore: 92.4,
    targetUser: 'Sarah Jenkins (Treasury Ops)',
    targetAccount: 'ACC-CORP-10492',
    status: 'INVESTIGATING',
    detectedAt: '2026-09-25 14:30:45',
    sourceIp: '185.220.101.5 (Tor Exit Node / UK)',
    deviceFingerprint: 'DEV-FP-Firefox-Linux-99c01a',
    audioFingerprint: 'SHA256: 3a1b7e44819d9fa0128cb54a',
    voiceEmbeddingDistance: 0.762,
    playbookExecuted: [
      'FaceSwap boundary artifacts flagged via ELA analysis',
      'Video session watermarked & quarantined',
      'High-resolution forensic frame dump generated'
    ],
    evidenceLedgerHash: '0x12bb45ca873e100f9184ac320e11',
    notes: 'Facial landmark temporal jitter observed during live video onboarding challenge.'
  },
  {
    id: 'inc-3',
    caseNumber: 'CASE #DS-2026-00419',
    threatType: 'Voice Clone Impersonation',
    riskScore: 98.1,
    targetUser: 'Vikram Mehta (Banking Authorizer)',
    targetAccount: 'ACC-RETAIL-88412',
    status: 'BLOCKED',
    detectedAt: '2026-09-25 14:28:12',
    sourceIp: '194.26.29.134 (Russia)',
    deviceFingerprint: 'DEV-FP-SIP-Trunk-Gateway-04',
    audioFingerprint: 'SHA256: f412c0119842a7810398aa44',
    voiceEmbeddingDistance: 0.941,
    playbookExecuted: [
      'Zero-Shot XTTS vocoder harmonics isolated',
      'Telephony IVR session terminated',
      'Account placed into High-Security Cooling Period (24h)',
      'Forensic report delivered to Banking Anti-Fraud Unit'
    ],
    evidenceLedgerHash: '0x7c491a039d91fbb291a8e32904c1',
    notes: 'Automated robocall attack utilizing synthetic voice to bypass IVR phone banking password reset.'
  },
  {
    id: 'inc-4',
    caseNumber: 'CASE #DS-2026-00418',
    threatType: 'Biometric Replay Attack',
    riskScore: 89.5,
    targetUser: 'Aditi Roy (Executive Director)',
    targetAccount: 'ACC-EXEC-00214',
    status: 'ESCALATED',
    detectedAt: '2026-09-25 14:25:33',
    sourceIp: '45.33.32.156 (USA)',
    deviceFingerprint: 'DEV-FP-Android-App-114a87',
    audioFingerprint: 'SHA256: bb9031765409ef112e88a091',
    voiceEmbeddingDistance: 0.690,
    playbookExecuted: [
      'Microphone acoustic room impulse discrepancy detected',
      'Replay attack spectral loop identified',
      'Case escalated to Tier-3 Forensic Lead'
    ],
    evidenceLedgerHash: '0x55d01248ba8123ef0900192ca11b',
    notes: 'High-quality pre-recorded studio audio sample played back into call speaker.'
  },
  {
    id: 'inc-5',
    caseNumber: 'CASE #DS-2026-00417',
    threatType: 'Prompt-Injected Audio Payload',
    riskScore: 78.4,
    targetUser: 'Kavita Nair (SecOps Lead)',
    targetAccount: 'ACC-SECOPS-55091',
    status: 'RESOLVED',
    detectedAt: '2026-09-25 14:18:50',
    sourceIp: '103.251.167.22 (Hong Kong)',
    deviceFingerprint: 'DEV-FP-WebRTC-Client-4402',
    audioFingerprint: 'SHA256: c129e487192aa55b0091fa09',
    voiceEmbeddingDistance: 0.512,
    playbookExecuted: [
      'Sub-audible ultrasonic frequency perturbation rejected',
      'Adaptive noise suppression filter engaged',
      'False positive reviewed and cleared by security officer'
    ],
    evidenceLedgerHash: '0x33e8901244ac571092837f6110a3',
    notes: 'Acoustic background noise caused temporary confidence drop. Re-verified via multi-factor SMS challenge.'
  }
];

export const IncidentResponseView: React.FC = () => {
  const [cases, setCases] = useState<IncidentCase[]>(INITIAL_CASES);
  const [selectedCase, setSelectedCase] = useState<IncidentCase>(INITIAL_CASES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter cases
  const filteredCases = cases.filter(c => {
    const matchesSearch = c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.targetUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.threatType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = (caseId: string, newStatus: IncidentCase['status'], actionText: string) => {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus } : c));
    if (selectedCase.id === caseId) {
      setSelectedCase(prev => ({ ...prev, status: newStatus }));
    }
    setActionNotice(`Action executed: ${actionText}`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleExportCase = (c: IncidentCase) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(c, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${c.caseNumber.replace(/[^a-zA-Z0-9]/g, '_')}_Forensic_Dossier.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

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
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px -2px rgba(245, 158, 11, 0.35)',
          }}>
            <AlertOctagon size={26} color="var(--amber)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Incident Response & Case Management
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
                AUTO-PREVENTION ENGINE
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Automated policy playbooks, containment actions, forensic dossiers, and SOC case investigation.
            </p>
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--emerald)',
            color: 'var(--emerald)',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}>
            <CheckCircle2 size={14} />
            {actionNotice}
          </div>
        )}
      </div>

      {/* Incident Summary Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
      }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>OPEN INCIDENTS</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            28
          </div>
          <span style={{ fontSize: '10px', color: 'var(--amber)', marginTop: '4px', display: 'block' }}>Requires SOC triage</span>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '3px solid var(--crimson)' }}>
          <span style={{ fontSize: '11px', color: 'var(--crimson)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>CRITICAL PRIORITY</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--crimson)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            6
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Risk &gt; 90% (Auto-Blocked)</span>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>INVESTIGATING</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--cyan)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            14
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>In forensic extraction</span>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>RESOLVED CASES</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--emerald)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            1,249
          </div>
          <span style={{ fontSize: '10px', color: 'var(--emerald)', marginTop: '4px', display: 'block' }}>99.2% auto-mitigated</span>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>FALSE POSITIVES</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            0.38%
          </div>
          <span style={{ fontSize: '10px', color: 'var(--emerald)', marginTop: '4px', display: 'block' }}>Optimal calibration</span>
        </div>
      </div>

      {/* Incident Lifecycle & Automated Prevention Playbook Pipeline */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
              Automated Prevention & Incident Lifecycle Pipeline
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Standard operating procedure executed autonomously upon synthetic voice or video detection.
            </p>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--cyan)',
            background: 'rgba(0, 229, 255, 0.1)',
            padding: '4px 10px',
            borderRadius: '4px',
            border: '1px solid rgba(0, 229, 255, 0.3)',
          }}>
            RULESET: PLAYBOOK-ALPHA-2026
          </span>
        </div>

        {/* Visual Pipeline Flow */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          alignItems: 'stretch',
        }}>
          {[
            { step: '1. Detection', desc: 'Real-Time Ingest', icon: Activity, active: true },
            { step: '2. Risk Assessment', desc: 'Confidence > 90%', icon: Cpu, active: true },
            { step: '3. Challenge Auth', desc: 'Liveness Prompt', icon: UserCheck, active: true },
            { step: '4. Threat Confirmed', desc: 'Biometric Mismatch', icon: AlertTriangle, active: true },
            { step: '5. Action Taken', desc: 'Instant Session Block', icon: Lock, active: true, highlight: 'var(--crimson)' },
            { step: '6. Ledger Preserved', desc: 'Merkle SHA-256', icon: Fingerprint, active: true, highlight: 'var(--cyan)' },
            { step: '7. SOC Resolved', desc: 'Dossier Closed', icon: CheckCircle2, active: true, highlight: 'var(--emerald)' },
          ].map((item, idx, arr) => {
            const Icon = item.icon;
            return (
              <div key={idx} style={{
                background: 'rgba(10, 13, 20, 0.85)',
                border: `1px solid ${item.highlight ? item.highlight : 'var(--border-subtle)'}`,
                borderRadius: '6px',
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: item.highlight || 'var(--text-muted)' }}>
                    {item.step}
                  </span>
                  <Icon size={14} color={item.highlight || 'var(--text-secondary)'} />
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#FFFFFF' }}>
                  {item.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Cases Table (Left) + Detailed Incident Dossier (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.6fr)',
        gap: '20px',
      }}>
        {/* Cases Table List */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Search & Status Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              flex: 1,
              minWidth: '180px',
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case, target, or threat..."
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
                padding: '0 10px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="BLOCKED">BLOCKED</option>
              <option value="INVESTIGATING">INVESTIGATING</option>
              <option value="ESCALATED">ESCALATED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          {/* Cases List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '560px', overflowY: 'auto' }}>
            {filteredCases.map((c) => {
              const isSelected = selectedCase.id === c.id;
              const isHigh = c.riskScore > 90;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(0, 229, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isSelected ? 'var(--cyan)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: isSelected ? 'var(--cyan)' : '#FFFFFF' }}>
                        {c.caseNumber}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        background: c.status === 'BLOCKED' ? 'rgba(16, 185, 129, 0.15)' : c.status === 'ESCALATED' ? 'rgba(255, 46, 91, 0.15)' : 'rgba(0, 229, 255, 0.15)',
                        color: c.status === 'BLOCKED' ? 'var(--emerald)' : c.status === 'ESCALATED' ? 'var(--crimson)' : 'var(--cyan)',
                      }}>
                        {c.status}
                      </span>
                    </div>

                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isHigh ? 'var(--crimson)' : 'var(--amber)',
                    }}>
                      {c.riskScore}%
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {c.targetUser}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    <span>{c.threatType}</span>
                    <span>{c.detectedAt.split(' ')[1]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Case Dossier / Detailed Inspector (Right) */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Dossier Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 800, color: 'var(--cyan)' }}>
                    {selectedCase.caseNumber}
                  </span>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    background: selectedCase.status === 'BLOCKED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 46, 91, 0.15)',
                    color: selectedCase.status === 'BLOCKED' ? 'var(--emerald)' : 'var(--crimson)',
                  }}>
                    {selectedCase.status}
                  </span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginTop: '4px' }}>
                  {selectedCase.threatType}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CONFIRMED RISK SCORE</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--crimson)', fontFamily: 'var(--font-mono)' }}>
                  {selectedCase.riskScore}%
                </div>
              </div>
            </div>

            {/* Target & Ingress Summary Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '16px 0',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '12px',
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>TARGET IDENTITY</span>
                <strong style={{ color: '#FFFFFF' }}>{selectedCase.targetUser}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>ACCOUNT / ENTITY ID</span>
                <code style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{selectedCase.targetAccount}</code>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>INGRESS ORIGIN (IP)</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{selectedCase.sourceIp}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>DEVICE FINGERPRINT</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{selectedCase.deviceFingerprint}</span>
              </div>
            </div>

            {/* Forensic Biometric Evidence Checklist */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Fingerprint size={16} color="var(--cyan)" />
                Forensic Cryptographic Evidence Preserved
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(10, 13, 20, 0.7)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <CheckCircle2 size={14} color="var(--emerald)" />
                  <span style={{ color: 'var(--text-muted)' }}>Audio Hash:</span>
                  <code style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{selectedCase.audioFingerprint}</code>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <CheckCircle2 size={14} color="var(--emerald)" />
                  <span style={{ color: 'var(--text-muted)' }}>Voice Embedding Cosine Distance:</span>
                  <strong style={{ color: 'var(--crimson)', fontFamily: 'var(--font-mono)' }}>{selectedCase.voiceEmbeddingDistance} (Impersonation Threshold: 0.450)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <CheckCircle2 size={14} color="var(--emerald)" />
                  <span style={{ color: 'var(--text-muted)' }}>Merkle Evidence Root:</span>
                  <code style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{selectedCase.evidenceLedgerHash}</code>
                </div>
              </div>
            </div>

            {/* Automated Playbook Execution Log */}
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                Automated Containment Execution Log
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedCase.playbookExecuted.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--cyan)' }}>[{idx + 1}]</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Case Investigation Notes */}
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderLeft: '3px solid var(--amber)', borderRadius: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>SOC INVESTIGATOR SUMMARY:</span>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '4px' }}>
                {selectedCase.notes}
              </p>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={() => handleUpdateStatus(selectedCase.id, 'BLOCKED', `Immediate Vector Block enforced on ${selectedCase.caseNumber}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                background: 'rgba(255, 46, 91, 0.15)',
                border: '1px solid var(--crimson)',
                color: 'var(--crimson)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Lock size={14} />
              Block Vector
            </button>

            <button
              onClick={() => handleUpdateStatus(selectedCase.id, 'INVESTIGATING', `Investigation active on ${selectedCase.caseNumber}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                background: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid var(--cyan)',
                color: 'var(--cyan)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Search size={14} />
              Investigate
            </button>

            <button
              onClick={() => handleUpdateStatus(selectedCase.id, 'ESCALATED', `Escalated ${selectedCase.caseNumber} to Level-3 SOC`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid var(--amber)',
                color: 'var(--amber)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <AlertTriangle size={14} />
              Escalate
            </button>

            <button
              onClick={() => handleExportCase(selectedCase)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#FFFFFF',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              <Download size={14} />
              Export Case Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
