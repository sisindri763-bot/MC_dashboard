import { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertTriangle, Search, Filter, MoreVertical } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchFreshness } from '../../api/client';

function fmtTime(ts) {
  if (!ts) return '—';
  const diff = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff/60)}h ago`;
  return `${Math.round(diff/1440)}d ago`;
}

function fmtLag(mins) {
  if (mins == null) return '—';
  if (mins < 60) return `${Math.round(mins)} min`;
  return `${Math.round(mins/60)} hr`;
}

const ITEMS_PER_PAGE = 10;

export default function Freshness() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchFreshness({ sla_minutes: 60 });
        setData(Array.isArray(res) ? res : res?.datasets ?? res?.pipelines ?? []);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = data.filter(d =>
    (d.pipeline_name ?? d.object_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const fresh = filtered.filter(d => (d.freshness_status ?? d.status ?? '').toLowerCase() === 'fresh').length;
  const delayed = filtered.filter(d => (d.freshness_status ?? d.status ?? '').toLowerCase() === 'delayed').length;
  const stale = filtered.filter(d => (d.freshness_status ?? d.status ?? '').toLowerCase() === 'stale').length;
  const avgLag = filtered.length > 0
    ? filtered.reduce((s, d) => s + (d.lag_minutes ?? 0), 0) / filtered.length
    : 0;
  const total = filtered.length;

  const pageData = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><LoadingSpinner /></div>;

  return (
    <div className="fade-in">
      <PageHeader title="Data Freshness" subtitle="Monitor how up-to-date your data is across all pipelines." />

      <div className="page-body" style={{ paddingTop: 16 }}>
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Fresh', value: fresh, pct: total ? `${Math.round(fresh/total*100)}%` : '0%', color: '#22C55E', icon: CheckCircle, sub: 'Within SLA', barColor: '#22C55E' },
            { label: 'Delayed', value: delayed, pct: total ? `${Math.round(delayed/total*100)}%` : '0%', color: '#F59E0B', icon: Clock, sub: 'Outside SLA', barColor: '#F59E0B' },
            { label: 'Stale', value: stale, pct: total ? `${Math.round(stale/total*100)}%` : '0%', color: '#EF4444', icon: AlertTriangle, sub: 'No recent updates', barColor: '#EF4444' },
            { label: 'Average Lag', value: fmtLag(avgLag), pct: null, color: '#6C63FF', icon: Clock, sub: 'Across all pipelines', barColor: '#6C63FF' },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={c.color} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.label}</span>
                  {c.pct && <span style={{ marginLeft: 'auto', fontSize: 16, fontWeight: 700, color: c.color }}>{c.pct}</span>}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{c.sub}</div>
                {c.pct && (
                  <div style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: c.pct, height: '100%', background: c.barColor, borderRadius: 99, transition: 'width 0.8s ease' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pipeline Table */}
        <div className="card mt-6">
          <div className="card-header">
            <span className="card-title">Pipelines</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="search-wrap">
                <Search size={13} />
                <input
                  className="search-input"
                  placeholder="Search pipelines..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <button className="icon-btn" title="Filters"><Filter size={13} /></button>
            </div>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>Last Updated</th>
                  <th>SLA</th>
                  <th>Current Lag</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 && (
                  <tr><td colSpan={7} className="empty-state">No pipelines found</td></tr>
                )}
                {pageData.map((d, i) => {
                  const lag = d.lag_minutes ?? 0;
                  const sla = d.sla_minutes ?? 60;
                  const lagColor = lag <= sla ? '#22C55E' : lag <= sla * 2 ? '#F59E0B' : '#EF4444';
                  return (
                    <tr key={i}>
                      <td>
                        <div className="pipeline-name-cell">
                          <div className="pipeline-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#60A5FA' }}>
                            <span style={{ fontSize: 9, fontWeight: 700 }}>DB</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{d.pipeline_name ?? d.object_name ?? '—'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtTime(d.last_updated_at ?? d.observed_at)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtLag(sla)}</td>
                      <td style={{ fontSize: 12, color: lagColor, fontWeight: 600 }}>{fmtLag(lag)}</td>
                      <td><StatusBadge status={d.freshness_status ?? d.status ?? 'Fresh'} /></td>
                      <td>
                        <div className="owner-badge">
                          <div className="owner-avatar">{(d.owner ?? 'DE').substring(0,2).toUpperCase()}</div>
                          {d.owner ?? d.team ?? 'Data Eng'}
                        </div>
                      </td>
                      <td>
                        <button className="dots-btn"><MoreVertical size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span className="pagination-info">
              Showing {Math.min((page-1)*ITEMS_PER_PAGE+1, filtered.length)} to {Math.min(page*ITEMS_PER_PAGE, filtered.length)} of {filtered.length} pipelines
            </span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i+1).map(p => (
                <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
            </div>
          </div>

          <div className="info-banner mt-4">
            <Clock size={14} color="#60A5FA" />
            Freshness is calculated based on the time since the last successful update compared to the defined SLA for each pipeline.
          </div>
        </div>
      </div>
    </div>
  );
}
