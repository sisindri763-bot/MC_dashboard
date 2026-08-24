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
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

function fmtLag(mins) {
  if (mins == null || mins === 0) return '0 min';
  if (mins < 60) return `${Math.round(mins)} min`;
  return `${Math.round(mins / 60)} hr`;
}

// Map pipeline status to consistent values
function getStatus(d) {
  const s = (d.freshness_status ?? d.status ?? '').toLowerCase();
  if (s === 'fresh') return 'Fresh';
  if (s === 'delayed') return 'Delayed';
  if (s === 'stale') return 'Stale';
  // Infer from lag
  const lag = d.lag_minutes ?? 0;
  const sla = d.sla_minutes ?? 60;
  if (lag <= sla) return 'Fresh';
  if (lag <= sla * 2) return 'Delayed';
  return 'Stale';
}

// Rich icon per pipeline type
function PipelineTypeIcon({ name }) {
  const n = (name ?? '').toLowerCase();
  let bg = 'rgba(59,130,246,0.15)', color = '#60A5FA';
  if (n.includes('user') || n.includes('event')) { bg = 'rgba(108,99,255,0.15)'; color = '#9B94FF'; }
  if (n.includes('inventory') || n.includes('stock')) { bg = 'rgba(245,158,11,0.15)'; color = '#FCD34D'; }
  if (n.includes('market') || n.includes('attr')) { bg = 'rgba(239,68,68,0.15)'; color = '#F87171'; }
  if (n.includes('payment') || n.includes('ledger')) { bg = 'rgba(34,197,94,0.15)'; color = '#4ADE80'; }
  if (n.includes('support') || n.includes('ticket')) { bg = 'rgba(245,158,11,0.15)'; color = '#FCD34D'; }
  if (n.includes('session') || n.includes('rollup')) { bg = 'rgba(108,99,255,0.15)'; color = '#9B94FF'; }
  return (
    <div style={{ width: 30, height: 30, borderRadius: 7, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ width: 8, height: 8, borderRadius: 50, background: color }} />
    </div>
  );
}

const ITEMS = 10;

const OWNER_COLORS = {
  DE: ['rgba(59,130,246,0.2)', '#60A5FA'],
  GR: ['rgba(34,197,94,0.2)', '#4ADE80'],
  SU: ['rgba(245,158,11,0.2)', '#FCD34D'],
  MA: ['rgba(239,68,68,0.2)', '#F87171'],
  FI: ['rgba(108,99,255,0.2)', '#9B94FF'],
  CX: ['rgba(249,115,22,0.2)', '#FB923C'],
};

const OWNER_NAMES = { DE: 'Data Eng', GR: 'Growth', SU: 'Supply', MA: 'Marketing', FI: 'Finance', CX: 'CX' };

function OwnerCell({ owner }) {
  const key = Object.keys(OWNER_NAMES).find(k => (owner ?? '').toUpperCase().startsWith(k)) ?? 'DE';
  const [bg, color] = OWNER_COLORS[key] ?? OWNER_COLORS.DE;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: bg, color, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{key}</div>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{OWNER_NAMES[key]}</span>
    </div>
  );
}

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
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = data.filter(d =>
    (d.pipeline_name ?? d.object_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const fresh = filtered.filter(d => getStatus(d) === 'Fresh').length;
  const delayed = filtered.filter(d => getStatus(d) === 'Delayed').length;
  const stale = filtered.filter(d => getStatus(d) === 'Stale').length;
  const total = filtered.length;
  const avgLag = total > 0 ? filtered.reduce((s, d) => s + (d.lag_minutes ?? 0), 0) / total : 0;

  const pageData = filtered.slice((page - 1) * ITEMS, page * ITEMS);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS));

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner /></div>;

  return (
    <div className="fade-in">
      <PageHeader title="Data Freshness" subtitle="Monitor how up-to-date your data is across all pipelines." />

      <div className="page-body">
        {/* 4 Summary cards — matches screenshot exactly */}
        <div className="grid-4">
          {[
            {
              label: 'Fresh', icon: CheckCircle, color: '#22C55E', bg: 'rgba(34,197,94,0.12)',
              value: fresh, pct: total ? Math.round(fresh / total * 100) : 0,
              sub: 'Within SLA', barColor: '#22C55E',
            },
            {
              label: 'Delayed', icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',
              value: delayed, pct: total ? Math.round(delayed / total * 100) : 0,
              sub: 'Outside SLA', barColor: '#F59E0B',
            },
            {
              label: 'Stale', icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.12)',
              value: stale, pct: total ? Math.round(stale / total * 100) : 0,
              sub: 'No recent updates', barColor: '#EF4444',
            },
            {
              label: 'Average Lag', icon: Clock, color: '#6C63FF', bg: 'rgba(108,99,255,0.12)',
              value: fmtLag(avgLag), pct: null,
              sub: 'Across all pipelines', barColor: null,
            },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={17} color={c.color} />
                  </div>
                  <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{c.label}</span>
                  {c.pct != null && (
                    <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 700, color: c.color }}>{c.pct}%</span>
                  )}
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>{c.sub}</div>
                {c.pct != null && (
                  <div style={{ marginTop: 10, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${c.pct}%`, height: '100%', background: c.barColor, borderRadius: 99, transition: 'width 0.8s' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pipelines table */}
        <div className="card mt-6">
          <div className="card-header">
            <span className="card-title">Pipelines</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="search-wrap">
                <Search size={12} />
                <input
                  className="search-input" placeholder="Search pipelines..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
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
                  const status = getStatus(d);
                  const name = d.pipeline_name ?? d.object_name ?? '—';
                  const ownerKeys = Object.keys(OWNER_NAMES);
                  const ownerKey = ownerKeys[i % ownerKeys.length];
                  return (
                    <tr key={i}>
                      <td>
                        <div className="pipeline-name-cell">
                          <PipelineTypeIcon name={name} />
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {fmtTime(d.last_updated_at ?? d.observed_at)}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtLag(sla)}</td>
                      <td>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: lagColor }}>{fmtLag(lag)}</span>
                      </td>
                      <td><StatusBadge status={status} /></td>
                      <td><OwnerCell owner={d.owner ?? ownerKey} /></td>
                      <td>
                        <button className="dots-btn"><MoreVertical size={14} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination — matches exact screenshot style */}
          <div className="pagination">
            <span className="pagination-info">
              Showing {Math.min((page - 1) * ITEMS + 1, filtered.length)} to {Math.min(page * ITEMS, filtered.length)} of {filtered.length} pipelines
            </span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              {totalPages > 3 && <span className="page-btn" style={{ cursor: 'default', border: 'none' }}>...</span>}
              {totalPages > 3 && (
                <button className={`page-btn ${page === totalPages ? 'active' : ''}`} onClick={() => setPage(totalPages)}>{totalPages}</button>
              )}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <select className="per-page-select">
                <option>10 / page</option>
                <option>25 / page</option>
              </select>
            </div>
          </div>

          {/* Info note — matches screenshot */}
          <div className="info-banner">
            <Clock size={13} color="#60A5FA" style={{ flexShrink: 0 }} />
            Freshness is calculated based on the time since the last successful update compared to the defined SLA for each pipeline.
          </div>
        </div>
      </div>
    </div>
  );
}
