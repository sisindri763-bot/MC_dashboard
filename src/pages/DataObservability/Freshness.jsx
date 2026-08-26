import { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle, Clock, AlertTriangle, Search, Filter,
  MoreVertical, Database, Info
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchFreshness } from '../../api/client';

function fmtTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtLag(mins) {
  if (mins == null || mins === 0) return '0 min';
  if (mins < 60) return `${Math.round(mins)} min`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = Math.round(mins % 60);
  if (hrs < 24) return `${hrs}h ${remainingMins}m`;
  return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
}

export default function Freshness() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    total_assets: 0,
    fresh_count: 0,
    delayed_count: 0,
    stale_count: 0,
    compliance_rate: '0.0%'
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchFreshness({ preset: 'all' });
      if (res) {
        const list = res.items || res.freshness_checks || (Array.isArray(res) ? res : res.datasets || []);
        setData(list);
        if (res.summary) {
          setSummary(res.summary);
        } else {
          const fresh = list.filter(d => (d.status ?? d.freshness_status ?? '').toLowerCase() === 'fresh').length;
          const delayed = list.filter(d => (d.status ?? d.freshness_status ?? '').toLowerCase() === 'delayed').length;
          const stale = list.length - fresh - delayed;
          setSummary({
            total_assets: list.length,
            fresh_count: fresh,
            delayed_count: delayed,
            stale_count: stale,
            compliance_rate: list.length > 0 ? `${(fresh / list.length * 100).toFixed(1)}%` : '0.0%'
          });
        }
      }
    } catch (e) {
      console.error('Failed to load freshness data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return data.filter(d => {
      const name = d.dataset_id ?? d.pipeline_name ?? d.object_name ?? '';
      const status = d.status ?? d.freshness_status ?? 'Stale';
      const matchSearch = name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const total = summary.total_assets || data.length;
  const fresh = summary.fresh_count;
  const delayed = summary.delayed_count;
  const stale = summary.stale_count;

  const freshPct = total > 0 ? Math.round(fresh / total * 100) : 0;
  const delayedPct = total > 0 ? Math.round(delayed / total * 100) : 0;
  const stalePct = total > 0 ? Math.round(stale / total * 100) : (total > 0 ? 100 : 0);

  const avgLagMins = data.length > 0 ? data.reduce((s, d) => s + (d.lag_minutes ?? 0), 0) / data.length : 0;

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  const [headerDatePreset, setHeaderDatePreset] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState(null);

  const handleHeaderDateChange = (val) => {
    if (typeof val === 'string') {
      setHeaderDatePreset(val);
      setCustomDateRange(null);
    } else if (val && val.start && val.end) {
      setHeaderDatePreset('custom');
      setCustomDateRange(val);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Data Freshness"
        subtitle="Monitor how up-to-date your data is across all pipelines."
        onRefresh={loadData}
        onDateChange={handleHeaderDateChange}
      />

      <div className="page-body">
        {/* Top 4 KPI Cards (Live Real Backend Data) */}
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <CheckCircle size={15} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Fresh</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>{freshPct}%</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>{fresh}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Within SLA</div>
            <div className="progress-track" style={{ marginTop: 10, height: 4 }}>
              <div className="progress-fill green" style={{ width: `${freshPct}%` }} />
            </div>
          </div>

          <div className="kpi-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                  <Clock size={15} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Delayed</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>{delayedPct}%</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>{delayed}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Outside SLA</div>
            <div className="progress-track" style={{ marginTop: 10, height: 4 }}>
              <div className="progress-fill orange" style={{ width: `${delayedPct}%` }} />
            </div>
          </div>

          <div className="kpi-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                  <AlertTriangle size={15} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Stale</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>{stalePct}%</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>{stale}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>No recent updates</div>
            <div className="progress-track" style={{ marginTop: 10, height: 4 }}>
              <div className="progress-fill red" style={{ width: `${stalePct}%` }} />
            </div>
          </div>

          <div className="kpi-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
                <Clock size={15} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Average Lag</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>{fmtLag(avgLagMins)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Across all {total} monitored datasets</div>
          </div>
        </div>

        {/* Pipelines Table Card */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Monitored Datasets ({filtered.length})</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="search-box">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search dataset or pipeline..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  style={{ width: 220, height: 30 }}
                />
              </div>
              <select className="select-control" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="All">All Status</option>
                <option value="Fresh">Fresh</option>
                <option value="Delayed">Delayed</option>
                <option value="Stale">Stale</option>
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="table-wrapper">
              <table className="vithi-table">
                <thead>
                  <tr>
                    <th>Dataset / Pipeline</th>
                    <th>System</th>
                    <th>Last Updated</th>
                    <th>SLA Target</th>
                    <th>Current Lag</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th style={{ textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        No freshness datasets found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((d, i) => {
                      const name = d.dataset_id ?? d.pipeline_name ?? d.object_name ?? 'dataset';
                      const status = (d.status ?? d.freshness_status ?? 'Stale').toLowerCase();
                      const sla = d.sla_minutes ?? 60;
                      const lag = d.lag_minutes ?? 0;
                      const lagColor = lag <= sla ? '#10B981' : lag <= sla * 2 ? '#F59E0B' : '#EF4444';

                      return (
                        <tr key={d.asset_id ?? i}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Database size={15} color="#3B82F6" />
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12.5 }}>
                                  {name}
                                </div>
                                {d.pipeline_name && d.pipeline_name !== name && (
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                    Pipeline: {d.pipeline_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>{d.system_name ?? 'Snowflake'}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtTime(d.last_updated_at ?? d.observed_at)}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sla} min</td>
                          <td style={{ fontSize: 12.5, fontWeight: 600, color: lagColor }}>{fmtLag(lag)}</td>
                          <td>
                            <span className={`status-pill ${status}`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                          <td>
                            <div className="owner-chip">
                              <div className="owner-circle de">DE</div>
                              <span>{d.owner ?? 'Data Eng'}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="icon-btn" style={{ width: 28, height: 28 }}>
                              <MoreVertical size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="pagination-bar">
            <span>Showing {Math.min((page - 1) * perPage + 1, filtered.length)} to {Math.min(page * perPage, filtered.length)} of {filtered.length} datasets</span>
            <div className="pagination-pages">
              <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`pagination-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              {totalPages > 6 && <span>...</span>}
              {totalPages > 6 && (
                <button
                  className={`pagination-btn ${page === totalPages ? 'active' : ''}`}
                  onClick={() => setPage(totalPages)}
                >
                  {totalPages}
                </button>
              )}
              <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <select className="select-control" style={{ marginLeft: 8, padding: '4px 8px' }} value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>

          {/* Bottom Info Banner */}
          <div className="info-notice">
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>Freshness SLA calculation uses the duration elapsed since last verified ingestion commit on live AWS RDS / Snowflake clusters.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
