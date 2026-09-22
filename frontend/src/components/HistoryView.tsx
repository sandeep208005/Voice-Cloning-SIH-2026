import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Trash2, 
  ArrowUpRight, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { Analysis } from '../types';

interface HistoryViewProps {
  onSelectAnalysis: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectAnalysis }) => {
  const [items, setItems] = useState<Analysis[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mediaType, setMediaType] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async (currentPage = page) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.listAnalyses({
        page: currentPage,
        limit: 10,
        media_type: mediaType,
        risk_level: riskLevel,
        search: search.trim() || undefined,
        sort_by: sortBy,
      });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setPage(currentPage);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load forensic records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [mediaType, riskLevel, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1);
  };

  const handleDelete = async (id: string, filename: string) => {
    if (window.confirm(`Are you sure you want to permanently purge analysis '${filename}' and its stored media?`)) {
      try {
        await api.deleteAnalysis(id);
        loadData(page);
      } catch (err: any) {
        alert(err.message || 'Deletion failed.');
      }
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Forensic Audit Logs & Evidence Ledger
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>
              {total} TOTAL RECORDS
            </span>
          </h1>
          <p className="page-subtitle">
            Database-backed chain of custody for all historical audio, visual, and video forensic evaluations.
          </p>
        </div>
        <div className="page-actions">
          <button onClick={() => loadData(page)} className="btn-secondary">
            <RefreshCw size={14} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search by ID or filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '4px',
                background: 'rgba(10, 13, 20, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
          <button type="submit" className="btn-secondary" style={{ padding: '6px 12px' }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: '1 1 auto' }}>
          {/* Media Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Media:</span>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value)}
              style={{
                background: 'rgba(10, 13, 20, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: '#FFFFFF',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <option value="all">All Modalities</option>
              <option value="audio">Audio</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Risk:</span>
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              style={{
                background: 'rgba(10, 13, 20, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: '#FFFFFF',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'rgba(10, 13, 20, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: '#FFFFFF',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="risk_high">Highest Threat</option>
              <option value="risk_low">Lowest Threat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Panel */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            QUERYING EVIDENCE LEDGER...
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Database size={32} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ fontSize: '15px', color: '#FFFFFF', fontWeight: 600 }}>No analysis data available.</h4>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>
              No forensic records matched your current query criteria.
            </p>
          </div>
        ) : (
          <div className="responsive-table-wrapper">
            <table style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'rgba(10, 13, 20, 0.5)' }}>
                  <th style={{ padding: '12px 16px' }}>ANALYSIS ID</th>
                  <th style={{ padding: '12px 16px' }}>MEDIA TYPE</th>
                  <th style={{ padding: '12px 16px' }}>ORIGINAL FILENAME</th>
                  <th style={{ padding: '12px 16px' }}>SYNTHETIC PROBABILITY</th>
                  <th style={{ padding: '12px 16px' }}>CONFIDENCE</th>
                  <th style={{ padding: '12px 16px' }}>RISK LEVEL</th>
                  <th style={{ padding: '12px 16px' }}>TIMESTAMP</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
                      {item.id.slice(0, 8)}...
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', background: 'rgba(255,255,255,0.06)' }}>
                        {item.media_type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#FFFFFF', fontWeight: 500 }}>
                      {item.original_filename}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>
                      {Math.round(item.synthetic_probability * 100)}%
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {Math.round(item.confidence * 100)}%
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge-${item.risk_level}`}>
                        <span className={`status-led status-led-${item.risk_level === 'high' ? 'crimson' : (item.risk_level === 'medium' ? 'amber' : 'emerald')}`} />
                        {item.risk_level}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      {item.created_at.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => onSelectAnalysis(item.id)}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11px' }}
                          title="Inspect Evidence"
                        >
                          <span>Inspect</span>
                          <ArrowUpRight size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.original_filename)}
                          style={{
                            background: 'rgba(255, 46, 91, 0.1)',
                            border: '1px solid rgba(255, 46, 91, 0.25)',
                            color: 'var(--crimson)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          title="Purge Record"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              PAGE {page} OF {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                disabled={page <= 1}
                onClick={() => loadData(page - 1)}
                className="btn-secondary"
                style={{ padding: '4px 10px' }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => loadData(page + 1)}
                className="btn-secondary"
                style={{ padding: '4px 10px' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
