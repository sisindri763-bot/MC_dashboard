import { useEffect, useState, useMemo } from 'react';
import { Search, Filter, Terminal, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, Database } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchLogs } from '../api/client';

function fmtTime(ts) {
  if (!ts) return 'recently';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(s) {
  if (!s && s !== 0) return '0s';
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec}s`;
}

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchLogs({ limit: 100 });
      if (res && res.logs) {
        setLogs(res.logs);
      }
    } catch (e) {
      console.error('Failed to load logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const pName = l.pipeline_name ?? '';
      const rId = String(l.run_id ?? '');
      const err = l.error_message ?? '';
      const q = l.query_text ?? '';
      const status = l.status ?? 'success';

      const matchSearch = pName.toLowerCase().includes(search.toLowerCase()) ||
                          rId.toLowerCase().includes(search.toLowerCase()) ||
                          err.toLowerCase().includes(search.toLowerCase()) ||
                          q.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [logs, search, statusFilter]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <div className="fade-in">
      <PageHeader
        title="Logs"
        subtitle="Searchable execution logs and query traces from all pipeline runs."
        onRefresh={loadData}
      />

      <div className="page-body">
        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <Search size={13} />
            <input
              type="text"
              placeholder="Search pipeline, Run ID, or SQL query..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ width: 280 }}
            />
          </div>

          <div className="filter-select">
            <label>Status</label>
            <select className="select-control" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="All">All Logs ({logs.length})</option>
              <option value="success">Success</option>
              <option value="failed">Failed / Error</option>
            </select>
          </div>
        </div>

        {/* Logs List */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Live Execution Logs ({filtered.length})</span>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {paginated.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                  No logs match the current search filters.
                </div>
              ) : (
                paginated.map((l, idx) => {
                  const isExp = expanded === (l.run_id ?? idx);
                  const isSuccess = (l.status ?? 'success').toLowerCase() === 'success';

                  return (
                    <div
                      key={l.run_id ?? idx}
                      style={{
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: 12,
                        background: isExp ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        onClick={() => setExpanded(isExp ? null : (l.run_id ?? idx))}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.pipeline_name}</span>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--bg-card-subtle)', padding: '2px 6px', borderRadius: 4 }}>
                            run_{l.run_id}
                          </span>
                          <span className={`status-pill ${isSuccess ? 'good' : 'critical'}`}>
                            {l.status}
                          </span>
                          {l.tool_name && (
                            <span className="status-pill info" style={{ fontSize: 10, textTransform: 'uppercase' }}>
                              {l.tool_name}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
                          <span>⏱ {fmtDuration(l.duration_seconds)}</span>
                          <span>{fmtTime(l.start_time)}</span>
                        </div>
                      </div>

                      {isExp && (
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', gap: 20, marginBottom: 8, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                            <span>Rows In: <strong style={{ color: 'var(--text-primary)' }}>{l.rows_in ?? '—'}</strong></span>
                            <span>Rows Out: <strong style={{ color: 'var(--text-primary)' }}>{l.rows_out ?? '—'}</strong></span>
                            <span>Completed: <strong style={{ color: 'var(--text-primary)' }}>{fmtTime(l.end_time)}</strong></span>
                          </div>

                          {l.error_message && (
                            <div style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
                              <strong>Error:</strong> {l.error_message}
                            </div>
                          )}

                          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>
                            SQL Trace & Ingestion Query:
                          </div>
                          <div style={{ background: '#0F172A', color: '#E2E8F0', padding: 10, borderRadius: 6, fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.6, overflowX: 'auto' }}>
                            <div style={{ color: isSuccess ? '#A7F3D0' : '#F87171' }}>
                              &gt; {l.query_text ?? `dbt run --models ${l.pipeline_name} (completed with status: ${l.status})`}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="pagination-bar">
            <span>Showing {Math.min((page - 1) * perPage + 1, filtered.length)} to {Math.min(page * perPage, filtered.length)} of {filtered.length} log runs</span>
            <div className="pagination-pages">
              <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`pagination-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
