import { useEffect, useState } from 'react';
import {
  GitBranch, CheckCircle, Play, XCircle, Clock,
  Search, Filter, MoreVertical, BarChart2,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import SparkLine from '../components/SparkLine';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchPipelines } from '../api/client';

function fmtDuration(s) {
  if (!s && s !== 0) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function fmtTime(ts) {
  if (!ts) return '—';
  const diff = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

function fmtRows(n) {
  if (!n) return '—';
  if (n > 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n > 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n > 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

// Map tool name to colored pipeline icon
function PipelineIcon({ tool, system }) {
  const s = (tool ?? system ?? '').toLowerCase();
  let bg = 'rgba(108,99,255,0.15)', color = '#9B94FF';
  if (s.includes('mysql') || s.includes('sql')) { bg = 'rgba(245,158,11,0.15)'; color = '#FCD34D'; }
  if (s.includes('snowflake')) { bg = 'rgba(59,130,246,0.15)'; color = '#60A5FA'; }
  if (s.includes('postgres')) { bg = 'rgba(34,197,94,0.15)'; color = '#4ADE80'; }
  if (s.includes('mongo')) { bg = 'rgba(34,197,94,0.15)'; color = '#4ADE80'; }
  if (s.includes('oracle')) { bg = 'rgba(239,68,68,0.15)'; color = '#F87171'; }
  if (s.includes('bigquery') || s.includes('bq')) { bg = 'rgba(59,130,246,0.15)'; color = '#60A5FA'; }
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <GitBranch size={14} color={color} />
    </div>
  );
}

const ITEMS = 10;

export default function Pipelines() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchPipelines();
        setData(Array.isArray(res) ? res : res?.pipelines ?? []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = data.filter(d => {
    const nm = (d.pipeline_name ?? '').toLowerCase().includes(search.toLowerCase());
    const st = !statusFilter || (d.status ?? d.latest_status ?? '').toLowerCase() === statusFilter;
    return nm && st;
  });

  const pageData = filtered.slice((page - 1) * ITEMS, page * ITEMS);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS));

  const successPct = filtered.length
    ? (filtered.filter(d => (d.status ?? d.latest_status ?? '').toLowerCase() === 'success').length / filtered.length * 100).toFixed(1)
    : '0.0';

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner /></div>;

  return (
    <div className="fade-in">
      <PageHeader title="Pipelines" subtitle="Monitor the health and performance of your data pipelines." />

      <div className="page-body">
        {/* 5 KPI Cards */}
        <div className="kpi-grid">
          {[
            {
              icon: GitBranch, iconClass: 'purple', label: 'Total Pipelines',
              value: filtered.length,
              delta: '+12 vs yesterday', isUp: true,
            },
            {
              icon: CheckCircle, iconClass: 'green', label: 'Success Rate (24h)',
              value: `${successPct}%`,
              delta: '+2.1% vs yesterday', isUp: true,
            },
            {
              icon: Play, iconClass: 'blue', label: 'Runs (24h)',
              value: data.reduce((s, d) => s + (d.total_runs ?? 0), 0),
              delta: '+18.7% vs yesterday', isUp: true,
            },
            {
              icon: XCircle, iconClass: 'red', label: 'Failed Pipelines',
              value: data.filter(d => (d.status ?? d.latest_status ?? '').toLowerCase() === 'failed').length,
              delta: '-3 vs yesterday', isUp: false,
            },
            {
              icon: Clock, iconClass: 'orange', label: 'Avg. Duration (24h)',
              value: fmtDuration(data.reduce((s, d) => s + (d.avg_duration_seconds ?? 0), 0) / Math.max(data.length, 1)),
              delta: '-8.4% vs yesterday', isUp: false,
            },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="kpi-card">
                <div className="kpi-card-top">
                  <div className={`kpi-icon ${k.iconClass}`}><Icon size={17} /></div>
                  <span className="kpi-label">{k.label}</span>
                </div>
                <div className="kpi-value">{k.value}</div>
                <div className={`kpi-delta ${k.isUp ? 'up' : 'down'}`}>
                  <span>{k.delta}</span>
                </div>
                <div className="sparkline-wrap">
                  <SparkLine color={k.iconClass === 'green' ? '#22C55E' : k.iconClass === 'red' ? '#EF4444' : k.iconClass === 'blue' ? '#3B82F6' : k.iconClass === 'orange' ? '#F59E0B' : '#6C63FF'} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Table card */}
        <div className="card mt-6">
          {/* Filters row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="search-wrap">
              <Search size={12} />
              <input
                className="search-input" placeholder="Search pipelines..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            {[
              { label: 'Status', options: ['All', 'success', 'failed', 'running', 'cancelled'] },
              { label: 'Source', options: ['All', 'MySQL', 'PostgreSQL', 'Oracle', 'MongoDB'] },
              { label: 'Destination', options: ['All', 'Snowflake', 'BigQuery', 'Redshift'] },
              { label: 'Owner', options: ['All', 'Data Eng', 'Growth', 'Finance', 'Supply'] },
              { label: 'Schedule', options: ['All', 'Hourly', 'Daily', 'Weekly'] },
            ].map((f) => (
              <div key={f.label} className="filter-group">
                <label className="filter-label">{f.label}</label>
                <select
                  className="select-input" style={{ minWidth: 80 }}
                  value={f.label === 'Status' ? statusFilter : ''}
                  onChange={f.label === 'Status' ? e => { setStatusFilter(e.target.value === 'All' ? '' : e.target.value); setPage(1); } : undefined}
                >
                  {f.options.map(o => <option key={o} value={o === 'All' ? '' : o}>{o}</option>)}
                </select>
              </div>
            ))}
            <button className="clear-btn" style={{ marginTop: 16 }} onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}>
              More Filters &nbsp;|&nbsp; Clear
            </button>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pipeline Name</th>
                  <th>Status</th>
                  <th>Last Run</th>
                  <th>Duration</th>
                  <th>Records Processed</th>
                  <th>Success Rate (24h)</th>
                  <th>Trend (24h)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 && (
                  <tr><td colSpan={8} className="empty-state">No pipelines found</td></tr>
                )}
                {pageData.map((p, i) => {
                  const rate = p.success_rate != null ? parseFloat(p.success_rate) : null;
                  const barColor = rate == null ? '#6C63FF' : rate >= 90 ? '#22C55E' : rate >= 70 ? '#F59E0B' : '#EF4444';
                  const src = p.system_name ?? p.source ?? 'Source';
                  const dst = p.target_system ?? p.destination ?? 'Snowflake';
                  return (
                    <tr key={i}>
                      <td>
                        <div className="pipeline-name-cell">
                          <PipelineIcon tool={p.tool} system={p.system_name} />
                          <div>
                            <div className="pipeline-name-main">{p.pipeline_name ?? '—'}</div>
                            <div className="pipeline-name-sub">{src} → {dst}</div>
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={p.status ?? p.latest_status ?? 'Success'} /></td>
                      <td style={{ fontSize: 12 }}>
                        <div>{new Date(p.last_run_at ?? Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{fmtTime(p.last_run_at)}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{fmtDuration(p.avg_duration_seconds)}</td>
                      <td style={{ fontSize: 12 }}>{fmtRows(p.total_rows_in ?? p.records_processed)}</td>
                      <td style={{ minWidth: 110 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: barColor }}>
                          {rate != null ? `${rate.toFixed(1)}%` : '—'}
                        </div>
                        <div className="progress-bar-wrap">
                          <div className="progress-bar-fill" style={{ width: `${rate ?? 0}%`, background: barColor }} />
                        </div>
                      </td>
                      <td>
                        <div style={{ width: 80, height: 24 }}>
                          <SparkLine color={barColor} height={24} />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <button className="dots-btn" title="View details"><BarChart2 size={13} /></button>
                          <button className="dots-btn" title="More"><MoreVertical size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span className="pagination-info">
              Showing {Math.min((page - 1) * ITEMS + 1, filtered.length)} to {Math.min(page * ITEMS, filtered.length)} of {filtered.length} pipelines
            </span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              {totalPages > 6 && <span className="page-btn" style={{ cursor: 'default' }}>...</span>}
              {totalPages > 6 && (
                <button className={`page-btn ${page === totalPages ? 'active' : ''}`} onClick={() => setPage(totalPages)}>{totalPages}</button>
              )}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <select className="per-page-select">
                <option>10 / page</option>
                <option>25 / page</option>
                <option>50 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
