import { useEffect, useState, useMemo } from 'react';
import {
  Database, FileText, TrendingUp, Activity, Search, Filter,
  MoreVertical, ArrowUpRight, ArrowDownRight, Calendar, Info,
  CheckCircle, AlertCircle, X, RotateCcw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchVolume, fetchPipelines } from '../../api/client';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  itemStyle: { color: '#0F172A' },
  labelStyle: { color: '#64748B', fontWeight: 600 },
};

function fmtTime(ts) {
  if (!ts) return 'recently';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Robust resolver to map volume checks to exact registered pipelines
function resolvePipelineName(item, runMap = {}) {
  if (item.pipeline_name && item.pipeline_name !== 'etl' && item.pipeline_name !== 'unknown_pipeline') {
    return item.pipeline_name;
  }
  const runIdStr = String(item.run_id || item.id || '');
  if (runIdStr && runMap[runIdStr]) {
    return runMap[runIdStr];
  }
  const src = (item.source_dataset || '').toLowerCase();
  const tgt = (item.target_dataset || '').toLowerCase();
  if (src.includes('ecommerce') || tgt.includes('ecommerce') || src.includes('order') || tgt.includes('order') || tgt.includes('my_first_dbt')) {
    return 'ecommerce_etl';
  }
  if (src.includes('stock') || tgt.includes('stock') || src.includes('analytics_db') || tgt.includes('analytics_db')) {
    return 'stock_etl';
  }
  if (src.includes('hr') || tgt.includes('hr') || src.includes('employee') || src.includes('obs_run') || tgt.includes('staging_staging')) {
    return 'hr_etl';
  }
  return 'stock_etl';
}

export default function Volume() {
  const [rawData, setRawData] = useState([]);
  const [runToPipelineMap, setRunToPipelineMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Top Filters State (placed at the top above KPI cards)
  const [search, setSearch] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [viewUnit, setViewUnit] = useState('Rows');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [headerDatePreset, setHeaderDatePreset] = useState('all');
  const [customDateRange, setCustomDateRange] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [volRes, pipeRes] = await Promise.allSettled([
        fetchVolume({ preset: 'all' }),
        fetchPipelines()
      ]);

      // Build run_id -> pipeline_name map
      const rMap = {};
      if (pipeRes.status === 'fulfilled' && pipeRes.value) {
        const pipeList = pipeRes.value.pipelines || pipeRes.value || [];
        if (Array.isArray(pipeList)) {
          pipeList.forEach(p => {
            const pName = p.pipeline_name || p.name;
            if (Array.isArray(p.runs)) {
              p.runs.forEach(r => {
                if (r.run_id || r.id) rMap[String(r.run_id || r.id)] = pName;
              });
            }
          });
        }
      }
      setRunToPipelineMap(rMap);

      if (volRes.status === 'fulfilled' && volRes.value) {
        const list = volRes.value.items || volRes.value.volume_checks || (Array.isArray(volRes.value) ? volRes.value : volRes.value.datasets || []);
        // Normalize records with mapped pipeline names
        const normalized = list.map(item => ({
          ...item,
          pipeline_name: resolvePipelineName(item, rMap),
          created_at: item.observed_at || item.created_at || item.timestamp,
          row_drop_pct: item.drop_percentage ?? item.row_drop_pct ?? (
            item.source_rows && item.target_rows && item.source_rows > 0
              ? (((item.source_rows - item.target_rows) / item.source_rows) * 100).toFixed(1)
              : 0
          ),
          status: item.is_anomaly || (item.status || '').toLowerCase() === 'critical' || (item.status || '').toLowerCase() === 'failed' ? 'Anomaly' : 'Good'
        }));
        setRawData(normalized);
      }
    } catch (e) {
      console.error('Failed to load volume checks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Distinct pipelines and dates for dropdowns
  const distinctPipelines = useMemo(() => {
    const set = new Set();
    rawData.forEach(d => {
      if (d.pipeline_name) set.add(d.pipeline_name);
    });
    return Array.from(set).sort();
  }, [rawData]);

  const distinctDates = useMemo(() => {
    const map = new Map();
    rawData.forEach(d => {
      if (d.created_at) {
        const key = d.created_at.split('T')[0];
        const label = new Date(d.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        if (!map.has(key)) map.set(key, label);
      }
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [rawData]);

  // Extract latest timestamp for accurate relative date range calculation
  const latestTimestamp = useMemo(() => {
    const validTimestamps = rawData
      .map(d => (d.created_at ? new Date(d.created_at).getTime() : 0))
      .filter(t => !isNaN(t) && t > 0);
    return validTimestamps.length > 0 ? Math.max(...validTimestamps) : Date.now();
  }, [rawData]);

  // Reactive filtering based on Top Filters and Date Ranges
  const filteredData = useMemo(() => {
    const anchorTime = latestTimestamp;

    let minTime = 0;
    let maxTime = Infinity;

    if (headerDatePreset === '24h') {
      minTime = anchorTime - 24 * 60 * 60 * 1000;
    } else if (headerDatePreset === '7d') {
      minTime = anchorTime - 7 * 24 * 60 * 60 * 1000;
    } else if (headerDatePreset === '30d') {
      minTime = anchorTime - 30 * 24 * 60 * 60 * 1000;
    } else if (headerDatePreset === 'custom' && customDateRange?.start && customDateRange?.end) {
      minTime = new Date(customDateRange.start).getTime();
      maxTime = new Date(customDateRange.end).getTime() + (24 * 60 * 60 * 1000 - 1);
    }

    return rawData.filter(d => {
      const pName = d.pipeline_name ?? '';
      const srcName = d.source_dataset ?? '';
      const tgtName = d.target_dataset ?? '';
      const status = d.status ?? 'Good';
      const dateStr = (d.created_at || '').split('T')[0];

      // Search match
      const q = search.trim().toLowerCase();
      const matchSearch = !q || pName.toLowerCase().includes(q) ||
                          srcName.toLowerCase().includes(q) ||
                          tgtName.toLowerCase().includes(q) ||
                          String(d.run_id || '').includes(q);

      // Pipeline match
      const matchPipeline = pipelineFilter === 'All' || pName === pipelineFilter;

      // Status match
      const matchStatus = statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();

      // Date dropdown match
      const matchDate = dateFilter === 'All' || dateStr === dateFilter;

      // Global Header Date Range match
      let matchHeaderDate = true;
      if (d.created_at) {
        const ts = new Date(d.created_at).getTime();
        if (!isNaN(ts)) {
          matchHeaderDate = ts >= minTime && ts <= maxTime;
        }
      }

      return matchSearch && matchPipeline && matchStatus && matchDate && matchHeaderDate;
    });
  }, [rawData, search, pipelineFilter, statusFilter, dateFilter, headerDatePreset, customDateRange, latestTimestamp]);

  // Derived KPI metrics strictly calculated from filtered subset
  const totalSourceRows = useMemo(() => filteredData.reduce((s, d) => s + (d.source_rows ?? 0), 0), [filteredData]);
  const totalTargetRows = useMemo(() => filteredData.reduce((s, d) => s + (d.target_rows ?? 0), 0), [filteredData]);
  const netDropPct = useMemo(() => {
    if (totalSourceRows <= 0) return '0.0';
    return (((totalSourceRows - totalTargetRows) / totalSourceRows) * 100).toFixed(1);
  }, [totalSourceRows, totalTargetRows]);
  const anomaliesCount = useMemo(() => filteredData.filter(d => d.status === 'Anomaly' || d.is_anomaly).length, [filteredData]);

  // Group by pipeline for bar chart
  const pipelineGroups = useMemo(() => {
    const map = {};
    filteredData.forEach(d => {
      const name = d.pipeline_name || 'stock_etl';
      if (!map[name]) map[name] = { name, sourceRows: 0, targetRows: 0, count: 0 };
      map[name].sourceRows += (d.source_rows ?? 0);
      map[name].targetRows += (d.target_rows ?? 0);
      map[name].count += 1;
    });
    return Object.values(map).sort((a, b) => b.sourceRows - a.sourceRows);
  }, [filteredData]);

  // Area chart over time
  const timeChartData = useMemo(() => {
    return [...filteredData].slice(0, 10).map((d, i) => ({
      time: d.created_at ? new Date(d.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : `Run ${i+1}`,
      rows: d.source_rows ?? 0,
      targetRows: d.target_rows ?? 0
    })).reverse();
  }, [filteredData]);

  // Pagination
  const paginated = useMemo(() => {
    return filteredData.slice((page - 1) * perPage, page * perPage);
  }, [filteredData, page, perPage]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));

  const hasActiveFilters = search.trim() !== '' || pipelineFilter !== 'All' || statusFilter !== 'All' || dateFilter !== 'All';

  const handleResetFilters = () => {
    setSearch('');
    setPipelineFilter('All');
    setStatusFilter('All');
    setDateFilter('All');
    setPage(1);
  };

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
        title="Volume"
        subtitle="Track the amount of data flowing through your pipelines."
        onRefresh={loadData}
        onDateChange={handleHeaderDateChange}
        latestTimestamp={latestTimestamp}
      />

      <div className="page-body">
        {/* ── TOP FILTERS TOOLBAR (Positioned above KPI cards) ───────────── */}
        <div className="filters-bar" style={{ marginBottom: 14 }}>
          {/* Search Box */}
          <div className="filter-search" style={{ flex: 1, minWidth: 220 }}>
            <label>Search</label>
            <div className="search-box">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search dataset, pipeline, or table..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setPage(1); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Pipeline Dropdown Filter */}
          <div className="filter-select">
            <label>Pipeline</label>
            <select
              className="select-control"
              value={pipelineFilter}
              onChange={e => { setPipelineFilter(e.target.value); setPage(1); }}
            >
              <option value="All">All Pipelines</option>
              {distinctPipelines.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown Filter */}
          <div className="filter-select">
            <label>Status</label>
            <select
              className="select-control"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="All">All Statuses</option>
              <option value="Good">Good / Passed</option>
              <option value="Anomaly">Anomaly / Critical</option>
            </select>
          </div>

          {/* Execution Date Filter */}
          <div className="filter-select">
            <label>Observed Date</label>
            <select
              className="select-control"
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setPage(1); }}
            >
              <option value="All">All Dates</option>
              {distinctDates.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters Action Button */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="icon-btn"
                onClick={handleResetFilters}
                title="Reset all filters"
                style={{ height: 36, padding: '0 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, color: '#EF4444', borderColor: '#FCA5A5' }}
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Active Filters:</span>
            {pipelineFilter !== 'All' && (
              <span className="status-pill" style={{ background: '#EEF2FF', color: '#4F46E5', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Pipeline: {pipelineFilter}
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => { setPipelineFilter('All'); setPage(1); }} />
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="status-pill" style={{ background: '#ECFDF5', color: '#059669', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Status: {statusFilter}
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => { setStatusFilter('All'); setPage(1); }} />
              </span>
            )}
            {dateFilter !== 'All' && (
              <span className="status-pill" style={{ background: '#FFFBEB', color: '#D97706', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Date: {dateFilter}
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => { setDateFilter('All'); setPage(1); }} />
              </span>
            )}
            {search.trim() !== '' && (
              <span className="status-pill" style={{ background: '#F1F5F9', color: '#475569', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Search: "{search}"
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => { setSearch(''); setPage(1); }} />
              </span>
            )}
          </div>
        )}

        {/* ── TOP 4 KPI CARDS (Reactive & Simple without sparklines) ─────── */}
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Database size={18} />
              </div>
              <span className="kpi-label">Source Records In</span>
            </div>
            <div className="kpi-value">{totalSourceRows.toLocaleString()}</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>
                {pipelineFilter !== 'All'
                  ? `${filteredData.length} checks for ${pipelineFilter}`
                  : `Across ${filteredData.length} volume validation checks`}
              </span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <FileText size={18} />
              </div>
              <span className="kpi-label">Target Records Out</span>
            </div>
            <div className="kpi-value">{totalTargetRows.toLocaleString()}</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>Committed to target tables</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
                <TrendingUp size={18} />
              </div>
              <span className="kpi-label">Net Drop Rate</span>
            </div>
            <div className="kpi-value">{netDropPct}%</div>
            <div className={`kpi-delta ${Number(netDropPct) > 5 ? 'down' : 'up'}`}>
              <span>{Number(netDropPct) > 5 ? 'Elevated row drop' : 'Normal row retention'}</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: anomaliesCount > 0 ? '#FEF2F2' : '#F5F3FF', color: anomaliesCount > 0 ? '#EF4444' : '#8B5CF6' }}>
                <Activity size={18} />
              </div>
              <span className="kpi-label">Volume Anomalies</span>
            </div>
            <div className="kpi-value" style={{ color: anomaliesCount > 0 ? '#EF4444' : 'inherit' }}>{anomaliesCount}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {anomaliesCount > 0 ? `${anomaliesCount} threshold breaches flagged` : 'All checks within expected bounds'}
            </div>
          </div>
        </div>

        {/* ── 2 MIDDLE CHARTS ────────────────────────────────────────────── */}
        <div className="grid-2 mt-4">
          {/* Chart 1: Volume Over Time */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Volume Ingestion Over Time (Records)</span>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={timeChartData}>
                <defs>
                  <linearGradient id="volGradLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="rows" name="Source Rows" stroke="#3B82F6" fill="url(#volGradLive)" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Volume by Pipeline */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Total Records by Pipeline</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className={`pagination-btn ${viewUnit === 'Rows' ? 'active' : ''}`}
                  style={{ minWidth: 40, height: 24, fontSize: 11 }}
                  onClick={() => setViewUnit('Rows')}
                >
                  Rows
                </button>
                <button
                  className={`pagination-btn ${viewUnit === '%' ? 'active' : ''}`}
                  style={{ minWidth: 40, height: 24, fontSize: 11 }}
                  onClick={() => setViewUnit('%')}
                >
                  %
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              {pipelineGroups.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No pipeline volume records match the active filter.
                </div>
              ) : (
                pipelineGroups.map(p => {
                  const pct = totalSourceRows > 0 ? Math.round((p.sourceRows / totalSourceRows) * 100) : 100;
                  return (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 140, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      <div style={{ flex: 1, height: 8, background: '#EFF6FF', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(pct, 5)}%`, height: '100%', background: '#3B82F6', borderRadius: 99 }} />
                      </div>
                      <div style={{ width: 110, textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {viewUnit === 'Rows' ? `${p.sourceRows.toLocaleString()} rows` : `${pct}%`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── LIVE VOLUME CHECKS TABLE ───────────────────────────────────── */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Live Volume Checks ({filteredData.length})</span>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing {Math.min((page - 1) * perPage + 1, filteredData.length)}–{Math.min(page * perPage, filteredData.length)} of {filteredData.length} records
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="table-wrapper">
              <table className="vithi-table">
                <thead>
                  <tr>
                    <th>Pipeline</th>
                    <th>Source Dataset</th>
                    <th>Target Dataset</th>
                    <th>Source Rows</th>
                    <th>Target Rows</th>
                    <th>Row Drop %</th>
                    <th>Status</th>
                    <th>Detected At</th>
                    <th style={{ textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        No volume checks found for the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((v, idx) => {
                      const drop = v.row_drop_pct != null ? parseFloat(v.row_drop_pct) : 0;
                      const isGood = (v.status || '').toLowerCase() === 'good';

                      return (
                        <tr key={v.run_id ? `${v.run_id}-${idx}` : idx}>
                          <td style={{ fontWeight: 600 }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: '#F1F5F9',
                              color: '#334155',
                              fontSize: 12,
                              fontWeight: 600
                            }}>
                              {v.pipeline_name}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.source_dataset}>
                            {v.source_dataset ?? 'Source DB'}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.target_dataset}>
                            {v.target_dataset ?? 'Target DB'}
                          </td>
                          <td style={{ fontWeight: 600 }}>{(v.source_rows ?? 0).toLocaleString()}</td>
                          <td style={{ fontWeight: 600 }}>{(v.target_rows ?? 0).toLocaleString()}</td>
                          <td style={{ fontWeight: 600, color: drop > 10 ? '#EF4444' : '#10B981' }}>
                            {drop.toFixed(1)}%
                          </td>
                          <td>
                            <span className={`status-pill ${isGood ? 'good' : 'critical'}`}>
                              {isGood ? 'Good' : 'Anomaly'}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {fmtTime(v.created_at)}
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
            <span>Showing {Math.min((page - 1) * perPage + 1, filteredData.length)} to {Math.min(page * perPage, filteredData.length)} of {filteredData.length} checks</span>
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
