import { useEffect, useState } from 'react';
import { Search, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchLogs, fetchRunDetail } from '../api/client';

function fmtTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString();
}

function fmtDur(s) {
  if (!s) return '—';
  return `${Math.floor(s/60)}m ${Math.round(s%60)}s`;
}

const ITEMS_PER_PAGE = 20;

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hasError, setHasError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [runDetail, setRunDetail] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = async (p) => {
    setLoading(true);
    try {
      const res = await fetchLogs({ limit: ITEMS_PER_PAGE, offset: (p-1)*ITEMS_PER_PAGE, has_error: hasError === 'true' ? true : hasError === 'false' ? false : undefined });
      const arr = Array.isArray(res) ? res : res?.logs ?? res?.results ?? [];
      const tot = res?.total ?? arr.length;
      setLogs(arr);
      setTotal(tot);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page, hasError]);

  const toggleExpand = async (runId) => {
    if (expanded === runId) { setExpanded(null); return; }
    setExpanded(runId);
    if (!runDetail[runId]) {
      try {
        const detail = await fetchRunDetail(runId);
        setRunDetail(prev => ({ ...prev, [runId]: detail }));
      } catch(e) {}
    }
  };

  const filtered = logs.filter(l =>
    (l.pipeline_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="fade-in">
      <PageHeader title="Logs" subtitle="Searchable execution logs and query traces." />

      <div className="page-body" style={{ paddingTop: 16 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
          <div className="filter-select">
            <label>Has Error</label>
            <select className="select-input" value={hasError} onChange={e => { setHasError(e.target.value); setPage(1); }}>
              <option value="">All Logs</option>
              <option value="true">Errors Only</option>
              <option value="false">No Errors</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Search</div>
            <div className="search-wrap">
              <Search size={13} />
              <input className="search-input" placeholder="Search pipeline..."
                value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
            </div>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            <div>
              {filtered.map((log, i) => {
                const runId = log.run_id;
                const isOpen = expanded === runId;
                const detail = runDetail[runId];
                const hasErr = log.has_error || (log.error_count ?? 0) > 0;
                return (
                  <div key={i} className="log-entry">
                    <div className="log-meta">
                      <button
                        onClick={() => toggleExpand(runId)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 0 }}
                      >
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <span className="log-pipeline">{log.pipeline_name ?? '—'}</span>
                      <StatusBadge status={log.status} />
                      {hasErr && <StatusBadge status="Failed" />}
                      <span className="log-time">{fmtTime(log.start_time ?? log.run_start)}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDur(log.duration_seconds)}</span>
                    </div>
                    {log.error_message && (
                      <div className="log-error">⚠ {log.error_message}</div>
                    )}
                    {isOpen && detail && (
                      <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
                          Query Traces ({detail.queries?.length ?? 0})
                        </div>
                        {(detail.queries ?? []).map((q, qi) => (
                          <div key={qi} style={{ marginBottom: 8 }}>
                            <div className="log-query">{q.query_text ?? q.sql ?? '—'}</div>
                            {q.error_message && <div className="log-error">{q.error_message}</div>}
                          </div>
                        ))}
                        {(!detail.queries || detail.queries.length === 0) && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No query traces available</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && <div className="empty-state">No logs found</div>}
            </div>

            <div className="pagination">
              <span className="pagination-info">
                Showing {Math.min((page-1)*ITEMS_PER_PAGE+1, total)} to {Math.min(page*ITEMS_PER_PAGE, total)} of {total} logs
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
                {Array.from({length:Math.min(totalPages,6)},(_,i)=>i+1).map(p=>(
                  <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={()=>setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
