import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch, CheckCircle, AlertCircle, Clock,
  ArrowUpRight, ArrowDownRight, Search, Play, MoreVertical,
  Activity, Sliders, Server, ExternalLink, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SparkLine from '../components/SparkLine';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchPipelines } from '../api/client';

const fmtDuration = (sec) => {
  if (!sec && sec !== 0) return '—';
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
};

export default function Pipelines() {
  const navigate = useNavigate();
  const [pipelinesRaw, setPipelinesRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [destFilter, setDestFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [activeMenu, setActiveMenu] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchPipelines();
      if (res) {
        const list = res.pipelines || res.items || (Array.isArray(res) ? res : []);
        setPipelinesRaw(list);
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

  // Group and deduplicate pipelines by unique pipeline_name
  const uniquePipelines = useMemo(() => {
    const map = new Map();
    (pipelinesRaw || []).forEach(p => {
      const name = p.pipeline_name || p.name || 'etl_pipeline';
      const existing = map.get(name);
      const runs = Number(p.total_runs ?? p.runs ?? 1) || 1;
      const rate = p.success_rate != null && p.success_rate !== 'N/A'
        ? parseFloat(p.success_rate)
        : ((p.status ?? '').toLowerCase() === 'success' ? 100 : 0);
      const duration = Number(p.avg_duration_seconds) || 10;
      const status = (p.status || p.latest_status || (p.has_open_incident ? 'Failed' : 'Success'));

      if (!existing) {
        map.set(name, {
          ...p,
          pipeline_name: name,
          total_runs: runs,
          runs: runs,
          success_rate: `${rate.toFixed(1)}%`,
          success_rate_num: rate,
          avg_duration_seconds: duration,
          status: status,
          source_tool: p.source_tool || 'snowflake',
          target_tool: p.target_tool || 'snowflake',
          etl_tool: p.etl_tool || 'dbt',
          last_run_time: p.last_run_time || p.last_run || (p.start_time ? new Date(p.start_time).toLocaleString() : 'recently'),
        });
      } else {
        const combinedRuns = existing.total_runs + runs;
        const combinedRate = ((existing.success_rate_num * existing.total_runs) + (rate * runs)) / combinedRuns;
        const combinedDuration = Math.round(((existing.avg_duration_seconds * existing.total_runs) + (duration * runs)) / combinedRuns);
        const combinedStatus = (existing.status.toLowerCase() === 'failed' || status.toLowerCase() === 'failed') ? 'Failed' : existing.status;

        map.set(name, {
          ...existing,
          total_runs: combinedRuns,
          runs: combinedRuns,
          success_rate: `${combinedRate.toFixed(1)}%`,
          success_rate_num: combinedRate,
          avg_duration_seconds: combinedDuration,
          status: combinedStatus,
        });
      }
    });
    return Array.from(map.values());
  }, [pipelinesRaw]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setSourceFilter('All');
    setDestFilter('All');
    setPage(1);
  };

  // Filtered unique pipelines
  const filtered = useMemo(() => {
    return uniquePipelines.filter(p => {
      const name = p.pipeline_name ?? '';
      const src = p.source_tool ?? p.source_system ?? 'Snowflake';
      const dst = p.target_tool ?? p.target_system ?? 'Snowflake';
      const status = p.status ?? 'Success';

      const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
                          src.toLowerCase().includes(search.toLowerCase()) ||
                          dst.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();
      const matchSource = sourceFilter === 'All' || src.toLowerCase().includes(sourceFilter.toLowerCase());
      const matchDest = destFilter === 'All' || dst.toLowerCase().includes(destFilter.toLowerCase());

      return matchSearch && matchStatus && matchSource && matchDest;
    });
  }, [uniquePipelines, search, statusFilter, sourceFilter, destFilter]);

  // Real KPI Aggregates from unique pipelines
  const totalPipelinesCount = uniquePipelines.length;
  const successfulCount = uniquePipelines.filter(p => (p.status ?? '').toLowerCase() === 'success').length;
  const failedCount = uniquePipelines.filter(p => (p.status ?? '').toLowerCase() === 'failed').length;
  const totalRunsCount = uniquePipelines.reduce((sum, p) => sum + (Number(p.total_runs ?? p.runs ?? 0) || 0), 0);

  const overallSuccessRate = useMemo(() => {
    if (!uniquePipelines.length) return '100.0';
    let weightedSum = 0;
    let runsCount = 0;
    uniquePipelines.forEach(p => {
      const runs = Number(p.total_runs ?? 1) || 1;
      const rate = p.success_rate_num ?? 100;
      weightedSum += rate * runs;
      runsCount += runs;
    });
    return runsCount > 0 ? (weightedSum / runsCount).toFixed(1) : '100.0';
  }, [uniquePipelines]);

  const avgDurationSec = uniquePipelines.length > 0
    ? uniquePipelines.reduce((sum, p) => sum + (Number(p.avg_duration_seconds) || 0), 0) / uniquePipelines.length
    : 0;

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
        {/* Top 5 KPI Cards (Live Real Unique Backend Data) */}
        <div className="kpi-grid-5">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <GitBranch size={18} />
              </div>
              <span className="kpi-label">Total Pipelines</span>
            </div>
            <div className="kpi-value">{totalPipelinesCount}</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>{totalPipelinesCount} unique models registered</span>
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
              <span>{successfulCount}/{totalPipelinesCount} pipelines healthy</span>
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
            <div className="kpi-value">{totalRunsCount}</div>
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
              <SparkLine color="#F59E0B" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
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
            <select
              className="select-control"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="All">All</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Source</label>
            <select
              className="select-control"
              value={sourceFilter}
              onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
            >
              <option value="All">All</option>
              <option value="Snowflake">Snowflake</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Destination</label>
            <select
              className="select-control"
              value={destFilter}
              onChange={e => { setDestFilter(e.target.value); setPage(1); }}
            >
              <option value="All">All</option>
              <option value="Snowflake">Snowflake</option>
            </select>
          </div>

          {(search || statusFilter !== 'All' || sourceFilter !== 'All' || destFilter !== 'All') && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <X size={12} style={{ display: 'inline', marginRight: 3 }} />
              Clear
            </button>
          )}
        </div>

        {/* Pipelines Table */}
        <div className="card mt-4">
          {loading && !uniquePipelines.length ? (
            <LoadingSpinner />
          ) : (
            <>
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
                        <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                          No pipelines match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      paginated.map((p, idx) => {
                        const status = (p.status ?? 'Success').toLowerCase();
                        const isSuccess = status === 'success' || status === 'completed';
                        const rateNum = p.success_rate_num ?? 100;
                        const isMenuOpen = activeMenu === (p.pipeline_id || p.pipeline_name || idx);

                        return (
                          <tr key={p.pipeline_id || p.pipeline_name || idx}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: 6,
                                  background: 'var(--bg-card-subtle)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#F59E0B', border: '1px solid var(--border)'
                                }}>
                                  <Server size={14} />
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                                    {p.pipeline_name}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                    {p.source_tool || 'snowflake'} &rarr; {p.target_tool || 'snowflake'} ({p.etl_tool || 'dbt'})
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`status-pill ${isSuccess ? 'success' : 'failed'}`}>
                                {isSuccess ? 'Success' : 'Failed'}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontSize: 12, fontWeight: 500 }}>{p.last_run_time}</div>
                              <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>recently</div>
                            </td>
                            <td style={{ fontSize: 12, fontWeight: 500 }}>
                              {fmtDuration(p.avg_duration_seconds)}
                            </td>
                            <td style={{ fontSize: 12.5, fontWeight: 600 }}>
                              {p.total_runs ?? p.runs ?? 1}
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 100 }}>
                                <span style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: isSuccess ? '#10B981' : '#EF4444'
                                }}>
                                  {p.success_rate}
                                </span>
                                <div className="progress-track" style={{ height: 4 }}>
                                  <div
                                    className="progress-fill"
                                    style={{
                                      width: `${Math.min(rateNum, 100)}%`,
                                      background: isSuccess ? '#10B981' : '#EF4444'
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ width: 60, height: 20 }}>
                                <SparkLine color={isSuccess ? '#10B981' : '#EF4444'} />
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', position: 'relative' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <button
                                  className="icon-btn"
                                  title="View Metrics"
                                  onClick={() => navigate('/metrics')}
                                  style={{ width: 28, height: 28 }}
                                >
                                  <Activity size={13} />
                                </button>
                                <button
                                  className="icon-btn"
                                  title="More Actions"
                                  onClick={() => setActiveMenu(isMenuOpen ? null : (p.pipeline_id || p.pipeline_name || idx))}
                                  style={{ width: 28, height: 28 }}
                                >
                                  <MoreVertical size={13} />
                                </button>
                              </div>

                              {isMenuOpen && (
                                <div style={{
                                  position: 'absolute', right: 0, top: '100%',
                                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                                  borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                  zIndex: 50, minWidth: 140, padding: 4, textAlign: 'left'
                                }}>
                                  <button
                                    className="nav-link"
                                    style={{ padding: '6px 10px', fontSize: 12 }}
                                    onClick={() => { setActiveMenu(null); navigate('/lineage'); }}
                                  >
                                    <GitBranch size={13} /> View Lineage
                                  </button>
                                  <button
                                    className="nav-link"
                                    style={{ padding: '6px 10px', fontSize: 12 }}
                                    onClick={() => { setActiveMenu(null); navigate('/logs'); }}
                                  >
                                    <ExternalLink size={13} /> View Logs
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="pagination-bar">
                <div style={{ color: 'var(--text-secondary)' }}>
                  Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1} to {Math.min(page * perPage, filtered.length)} of {filtered.length} pipelines
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    className="select-control"
                    value={perPage}
                    onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                    style={{ fontSize: 11.5, padding: '3px 8px' }}
                  >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                  </select>

                  <div className="pagination-pages">
                    <button
                      className="pagination-btn"
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={13} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                      <button
                        key={pNum}
                        className={`pagination-btn ${pNum === page ? 'active' : ''}`}
                        onClick={() => setPage(pNum)}
                      >
                        {pNum}
                      </button>
                    ))}
                    <button
                      className="pagination-btn"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
