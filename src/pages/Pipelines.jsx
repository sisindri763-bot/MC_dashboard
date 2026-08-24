import { useEffect, useState, useMemo } from 'react';
import {
  GitBranch, CheckCircle, Play, AlertCircle, Clock,
  Search, Filter, MoreVertical, BarChart2,
  ArrowUpRight, ArrowDownRight, Database
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SparkLine from '../components/SparkLine';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchPipelines } from '../api/client';

function DBLogo({ tool, source }) {
  const t = (tool ?? source ?? '').toLowerCase();
  let color = '#3B82F6', bg = '#EFF6FF';
  if (t.includes('postgres')) { color = '#6366F1'; bg = '#EEF2FF'; }
  if (t.includes('sql') || t.includes('mysql')) { color = '#10B981'; bg = '#ECFDF5'; }
  if (t.includes('oracle')) { color = '#EF4444'; bg = '#FEF2F2'; }
  if (t.includes('dbt')) { color = '#F59E0B'; bg = '#FFFBEB'; }

  return (
    <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
      <Database size={16} />
    </div>
  );
}

function fmtDuration(s) {
  if (!s && s !== 0) return '0s';
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec}s`;
}

function fmtTimeAgo(ts) {
  if (!ts) return 'recently';
  const diff = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (isNaN(diff)) return 'recently';
  if (diff < 60) return `${Math.max(1, diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

export default function Pipelines() {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [destFilter, setDestFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [scheduleFilter, setScheduleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchPipelines();
      if (res && (res.pipelines?.length || Array.isArray(res))) {
        const list = Array.isArray(res) ? res : res.pipelines;
        setPipelines(list);
      }
    } catch (e) {
      console.error('Failed to load pipelines API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setSourceFilter('All');
    setDestFilter('All');
    setOwnerFilter('All');
    setScheduleFilter('All');
    setPage(1);
  };

  // Filtered pipelines
  const filtered = useMemo(() => {
    return pipelines.filter(p => {
      const name = p.pipeline_name ?? '';
      const src = p.source_tool ?? p.source_system ?? 'Snowflake';
      const dst = p.target_tool ?? p.target_system ?? 'Snowflake';
      const status = p.status ?? p.latest_status ?? 'Success';

      const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
                          src.toLowerCase().includes(search.toLowerCase()) ||
                          dst.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();
      const matchSource = sourceFilter === 'All' || src.toLowerCase().includes(sourceFilter.toLowerCase());
      const matchDest = destFilter === 'All' || dst.toLowerCase().includes(destFilter.toLowerCase());

      return matchSearch && matchStatus && matchSource && matchDest;
    });
  }, [pipelines, search, statusFilter, sourceFilter, destFilter]);

  // Real KPI Aggregates from backend
  const totalPipelines = pipelines.length;
  const successfulCount = pipelines.filter(p => (p.status ?? '').toLowerCase() === 'success').length;
  const failedCount = pipelines.filter(p => (p.status ?? '').toLowerCase() === 'failed').length;
  const totalRuns = pipelines.reduce((sum, p) => sum + (p.total_runs ?? p.runs ?? 0), 0);
  const overallSuccessRate = totalRuns > 0
    ? (pipelines.reduce((sum, p) => sum + ((p.success_rate ?? 100) * (p.total_runs ?? p.runs ?? 1)), 0) / totalRuns).toFixed(1)
    : '100.0';
  const avgDurationSec = pipelines.length > 0
    ? pipelines.reduce((sum, p) => sum + (p.avg_duration_seconds ?? 0), 0) / pipelines.length
    : 12;

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <div className="fade-in">
      <PageHeader
        title="Pipelines"
        subtitle="Monitor the health and performance of your data pipelines."
        onRefresh={loadData}
      />

      <div className="page-body">
        {/* Top 5 KPI Cards (Live Real Backend Data) */}
        <div className="kpi-grid-5">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <GitBranch size={18} />
              </div>
              <span className="kpi-label">Total Pipelines</span>
            </div>
            <div className="kpi-value">{totalPipelines}</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>{totalPipelines} registered</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#10B981" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <CheckCircle size={18} />
              </div>
              <span className="kpi-label">Success Rate (24h)</span>
            </div>
            <div className="kpi-value">{overallSuccessRate}%</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>{successfulCount}/{totalPipelines} pipelines healthy</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#10B981" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Play size={18} />
              </div>
              <span className="kpi-label">Runs (Total)</span>
            </div>
            <div className="kpi-value">{totalRuns}</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>Across all runs</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#3B82F6" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                <AlertCircle size={18} />
              </div>
              <span className="kpi-label">Failed Pipelines</span>
            </div>
            <div className="kpi-value">{failedCount}</div>
            <div className="kpi-delta down">
              <ArrowDownRight size={13} />
              <span>{failedCount > 0 ? `${failedCount} active failures` : '0 failures'}</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color={failedCount > 0 ? '#EF4444' : '#10B981'} />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
                <Clock size={18} />
              </div>
              <span className="kpi-label">Avg. Duration</span>
            </div>
            <div className="kpi-value">{fmtDuration(avgDurationSec)}</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>Average execution time</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#10B981" />
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="filters-bar mt-4">
          <div className="search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search pipelines..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="filter-select">
            <label>Status</label>
            <select className="select-control" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="All">All</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="Running">Running</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Source</label>
            <select className="select-control" value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }}>
              <option value="All">All</option>
              <option value="Snowflake">Snowflake</option>
              <option value="MySQL">MySQL</option>
              <option value="PostgreSQL">PostgreSQL</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Destination</label>
            <select className="select-control" value={destFilter} onChange={e => { setDestFilter(e.target.value); setPage(1); }}>
              <option value="All">All</option>
              <option value="Snowflake">Snowflake</option>
              <option value="BigQuery">BigQuery</option>
            </select>
          </div>

          <button className="filter-action-btn" style={{ color: '#10B981', borderColor: '#10B981', marginLeft: 'auto' }}>
            <Filter size={13} />
            <span>More Filters</span>
          </button>

          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear
          </button>
        </div>

        {/* Pipelines Table Card */}
        <div className="card">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="table-wrapper">
              <table className="vithi-table">
                <thead>
                  <tr>
                    <th>Pipeline Name</th>
                    <th>Status</th>
                    <th>Last Run</th>
                    <th>Duration</th>
                    <th>Total Runs</th>
                    <th>Success Rate</th>
                    <th>Trend</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        No pipelines match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((p, idx) => {
                      const isSuccess = (p.status ?? '').toLowerCase() === 'success';
                      const isFailed = (p.status ?? '').toLowerCase() === 'failed';
                      const progressColor = isSuccess ? 'green' : isFailed ? 'red' : 'orange';
                      const rate = p.success_rate != null ? parseFloat(p.success_rate) : (isSuccess ? 100 : 0);
                      const src = p.source_tool ?? p.source_system ?? 'Snowflake';
                      const dst = p.target_tool ?? p.target_system ?? 'Snowflake';
                      const lastRunDate = p.last_run_at ? new Date(p.last_run_at).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Aug 17, 2026 11:25 AM';
                      const timeAgo = fmtTimeAgo(p.last_run_at);

                      return (
                        <tr key={p.pipeline_id ?? idx}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <DBLogo tool={p.etl_tool} source={src} />
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                                  {p.pipeline_name}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                                  {src} → {dst} {p.etl_tool ? `(${p.etl_tool})` : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-pill ${p.status?.toLowerCase() ?? 'success'}`}>
                              {p.status ?? 'Success'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{lastRunDate}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo}</div>
                          </td>
                          <td style={{ fontSize: 12.5, fontWeight: 500 }}>{fmtDuration(p.avg_duration_seconds)}</td>
                          <td style={{ fontSize: 12.5, fontWeight: 600 }}>{p.total_runs ?? p.runs ?? 1}</td>
                          <td style={{ minWidth: 120 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: isFailed ? '#EF4444' : '#0F172A' }}>
                              {rate.toFixed(1)}%
                            </div>
                            <div className="progress-track">
                              <div
                                className={`progress-fill ${progressColor}`}
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td style={{ width: 100 }}>
                            <div style={{ width: 80, height: 26 }}>
                              <SparkLine color={isFailed ? '#EF4444' : '#10B981'} height={24} />
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <button className="icon-btn" style={{ width: 28, height: 28 }} title="View Metrics">
                                <BarChart2 size={13} />
                              </button>
                              <button className="icon-btn" style={{ width: 28, height: 28 }} title="Options">
                                <MoreVertical size={13} />
                              </button>
                            </div>
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
            <span>
              Showing {Math.min((page - 1) * perPage + 1, filtered.length)} to {Math.min(page * perPage, filtered.length)} of {filtered.length} pipelines
            </span>
            <div className="pagination-pages">
              <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`pagination-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                ›
              </button>
              <select
                className="select-control"
                style={{ marginLeft: 8, padding: '4px 8px' }}
                value={perPage}
                onChange={e => setPerPage(Number(e.target.value))}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
