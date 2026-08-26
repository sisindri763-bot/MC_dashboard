import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch, CheckCircle, XCircle, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Search, Play, Server,
  RotateCcw, Tag, X, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import PageHeader from '../components/PageHeader';
import SparkLine from '../components/SparkLine';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  fetchOverviewKPIs,
  fetchOverviewCharts,
  fetchOverviewHealth,
  fetchRecentIncidents,
  fetchPipelines,
  fetchLogs
} from '../api/client';

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    fontSize: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    color: '#0F172A'
  },
  itemStyle: { color: '#0F172A' },
  labelStyle: { color: '#64748B', fontWeight: 600 },
};

export default function Overview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Live state
  const [runs, setRuns] = useState([]);
  const [pipelinesList, setPipelinesList] = useState([]);
  const [healthData, setHealthData] = useState([]);
  const [incidentsList, setIncidentsList] = useState([]);

  // Top Filters
  const [search, setSearch] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toolFilter, setToolFilter] = useState('All');
  const [headerDatePreset, setHeaderDatePreset] = useState('all');
  const [customDateRange, setCustomDateRange] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hRes, incRes, pRes, lRes] = await Promise.allSettled([
        fetchOverviewHealth(),
        fetchRecentIncidents(),
        fetchPipelines(),
        fetchLogs({ limit: 100 })
      ]);

      if (hRes.status === 'fulfilled' && hRes.value) {
        const pillars = hRes.value.pillars || hRes.value.items || hRes.value.health || [];
        setHealthData(pillars.map(p => ({
          name: p.name || p.title || p.id,
          pct: parseFloat(p.score ?? p.value ?? (p.status === 'Good' ? 100 : 0)),
          details: typeof p.details === 'string' ? p.details : (p.display || ''),
          status: p.status ?? 'Good',
          color: (p.status === 'Critical' || p.status === 'Poor') ? '#EF4444' : (p.status === 'Warning' || p.status === 'N/A') ? '#F59E0B' : '#10B981'
        })));
      }

      if (incRes.status === 'fulfilled' && incRes.value) {
        const incs = incRes.value.incidents || incRes.value.items || [];
        setIncidentsList(incs.map(inc => ({
          title: inc.title ?? inc.pipeline_name ?? 'Pipeline execution issue',
          desc: inc.description ?? inc.error_message ?? 'Execution error detected',
          pipeline_name: inc.pipeline_name || '',
          severity: inc.severity ?? 'Critical',
          state: inc.state ?? inc.status ?? 'OPEN',
          start_time: inc.opened_at || inc.start_time,
          time: inc.opened_age ?? (inc.opened_at || inc.start_time ? new Date(inc.opened_at || inc.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently')
        })));
      }

      if (pRes.status === 'fulfilled' && pRes.value) {
        const pList = pRes.value.pipelines || pRes.value.items || (Array.isArray(pRes.value) ? pRes.value : []);
        setPipelinesList(pList);
      }

      if (lRes.status === 'fulfilled' && lRes.value) {
        const logs = lRes.value.logs || lRes.value.items || (Array.isArray(lRes.value) ? lRes.value : []);
        setRuns(logs);
      }
    } catch (e) {
      console.error('Failed to load live overview data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Distinct pipeline names for filter dropdown
  const distinctPipelineNames = useMemo(() => {
    return Array.from(new Set([
      ...pipelinesList.map(p => p.pipeline_name || p.name),
      ...runs.map(r => r.pipeline_name)
    ].filter(Boolean)));
  }, [pipelinesList, runs]);

  // Handle header date range change
  const handleHeaderDateChange = (val) => {
    if (typeof val === 'string') {
      setHeaderDatePreset(val);
      setCustomDateRange(null);
    } else if (val && val.start && val.end) {
      setHeaderDatePreset('custom');
      setCustomDateRange(val);
    }
  };

  // Real-time instant filtering across all parameters and date ranges
  const filteredRuns = useMemo(() => {
    const latestTimestamp = runs.length > 0
      ? Math.max(...runs.map(r => new Date(r.start_time || 0).getTime()).filter(t => !isNaN(t) && t > 0))
      : Date.now();

    const now = Date.now();
    const anchorTime = Math.max(now, latestTimestamp);

    let minTime = 0;
    let maxTime = Infinity;

    if (headerDatePreset === '24h') {
      minTime = anchorTime - 24 * 60 * 60 * 1000;
    } else if (headerDatePreset === '7d') {
      minTime = anchorTime - 7 * 24 * 60 * 60 * 1000;
    } else if (headerDatePreset === '30d') {
      minTime = anchorTime - 30 * 24 * 60 * 60 * 1000;
    } else if (headerDatePreset === 'custom' && customDateRange) {
      minTime = new Date(customDateRange.start).getTime();
      maxTime = new Date(customDateRange.end).getTime() + 24 * 60 * 60 * 1000;
    }

    return runs.filter(r => {
      const pName = (r.pipeline_name || '').toLowerCase();
      const runId = String(r.run_id || '').toLowerCase();
      const status = (r.status || '').toLowerCase();
      const tool = (r.tool_name || r.source_tool || 'dbt').toLowerCase();
      const errMsg = (r.error_message || '').toLowerCase();
      const startTimeStr = r.start_time || '';
      const runTime = startTimeStr ? new Date(startTimeStr).getTime() : 0;

      const matchSearch = !search ||
        pName.includes(search.toLowerCase()) ||
        runId.includes(search.toLowerCase()) ||
        tool.includes(search.toLowerCase()) ||
        errMsg.includes(search.toLowerCase());

      const matchStatus = statusFilter === 'All' || status === statusFilter.toLowerCase();
      const matchPipeline = pipelineFilter === 'All' || r.pipeline_name === pipelineFilter;
      const matchTool = toolFilter === 'All' || tool === toolFilter.toLowerCase();
      const matchHeaderDate = headerDatePreset === 'all' || (runTime >= minTime && runTime <= maxTime);

      return matchSearch && matchStatus && matchPipeline && matchTool && matchHeaderDate;
    });
  }, [runs, search, statusFilter, pipelineFilter, toolFilter, headerDatePreset, customDateRange]);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidentsList.filter(inc => {
      const matchPipeline = pipelineFilter === 'All' || inc.pipeline_name === pipelineFilter;
      const matchSearch = !search || (inc.title || '').toLowerCase().includes(search.toLowerCase()) || (inc.pipeline_name || '').toLowerCase().includes(search.toLowerCase());
      return matchPipeline && matchSearch;
    });
  }, [incidentsList, pipelineFilter, search]);

  // Filtered unique pipelines count
  const filteredUniquePipelinesCount = useMemo(() => {
    const names = new Set(filteredRuns.map(r => r.pipeline_name).filter(Boolean));
    return names.size;
  }, [filteredRuns]);

  const totalUniquePipelinesInSystem = useMemo(() => {
    const names = new Set(runs.map(r => r.pipeline_name).filter(Boolean));
    return names.size || 3;
  }, [runs]);

  // Derived KPI metrics strictly from filtered dataset
  const totalRuns = filteredRuns.length;
  const successfulRuns = filteredRuns.filter(r => (r.status || '').toLowerCase() === 'success').length;
  const failedRuns = filteredRuns.filter(r => (r.status || '').toLowerCase() === 'failed').length;
  const successRatePct = totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(1) : '0.0';

  const avgDurationSec = totalRuns > 0
    ? Math.round(filteredRuns.reduce((sum, r) => sum + (Number(r.duration || r.duration_seconds) || 0), 0) / totalRuns)
    : 0;

  // Chart 1: Real Runs Over Time derived from filtered dataset
  const runsChart = useMemo(() => {
    const dateMap = {};
    filteredRuns.forEach(r => {
      const dateKey = (r.start_time || '').substring(0, 10);
      if (!dateKey) return;
      const fmt = new Date(dateKey).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      if (!dateMap[fmt]) dateMap[fmt] = { time: fmt, Success: 0, Failed: 0, dateRaw: dateKey };
      if ((r.status || '').toLowerCase() === 'success') {
        dateMap[fmt].Success += 1;
      } else {
        dateMap[fmt].Failed += 1;
      }
    });

    const entries = Object.values(dateMap);
    entries.sort((a, b) => a.dateRaw.localeCompare(b.dateRaw));
    return entries;
  }, [filteredRuns]);

  // Chart 2: Real Success Rate Over Time derived from filtered dataset
  const successChart = useMemo(() => {
    return runsChart.map(item => {
      const total = item.Success + item.Failed;
      const rate = total > 0 ? Math.round((item.Success / total) * 100) : 0;
      return { time: item.time, rate };
    });
  }, [runsChart]);

  // Chart 3: Real Incidents Over Time
  const incidentsChart = useMemo(() => {
    return runsChart.map(item => ({
      time: item.time,
      count: item.Failed
    }));
  }, [runsChart]);

  // Filtered Deduplicated Pipelines for Monitoring List
  const monitoredPipelines = useMemo(() => {
    const map = new Map();
    filteredRuns.forEach(r => {
      const name = r.pipeline_name;
      const existing = map.get(name);
      const isSuccess = (r.status || '').toLowerCase() === 'success';

      if (!existing) {
        map.set(name, {
          name,
          runs: 1,
          successRuns: isSuccess ? 1 : 0,
          status: isSuccess ? 'Success' : 'Failed',
          totalDuration: Number(r.duration || r.duration_seconds) || 0,
          source_tool: r.tool_name || 'snowflake',
          target_tool: 'snowflake',
          etl_tool: r.tool_name || 'dbt'
        });
      } else {
        map.set(name, {
          ...existing,
          runs: existing.runs + 1,
          successRuns: existing.successRuns + (isSuccess ? 1 : 0),
          status: (!isSuccess || existing.status === 'Failed') ? 'Failed' : existing.status,
          totalDuration: existing.totalDuration + (Number(r.duration || r.duration_seconds) || 0)
        });
      }
    });

    return Array.from(map.values()).map(p => ({
      ...p,
      successRate: `${((p.successRuns / p.runs) * 100).toFixed(1)}%`,
      avgDuration: `${Math.round(p.totalDuration / p.runs)}s`
    }));
  }, [filteredRuns]);

  const clearFilters = () => {
    setSearch('');
    setPipelineFilter('All');
    setStatusFilter('All');
    setToolFilter('All');
    setHeaderDatePreset('all');
    setCustomDateRange(null);
  };

  const hasActiveFilters = search || pipelineFilter !== 'All' || statusFilter !== 'All' || toolFilter !== 'All' || headerDatePreset !== 'all';

  return (
    <div className="fade-in">
      <PageHeader
        title="Overview"
        subtitle="Monitor the health and performance of your data pipelines."
        onRefresh={loadData}
        onDateChange={handleHeaderDateChange}
      />

      <div className="page-body">
        {/* 1. TOP FILTERS TOOLBAR (Placed at the very top of the page body) */}
        <div className="filters-bar">
          <div className="search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search pipelines, error diagnostics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-select">
            <label>Pipeline</label>
            <select
              className="select-control"
              value={pipelineFilter}
              onChange={e => setPipelineFilter(e.target.value)}
            >
              <option value="All">All Pipelines</option>
              {distinctPipelineNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="filter-select">
            <label>Status</label>
            <select
              className="select-control"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Engine / Tool</label>
            <select
              className="select-control"
              value={toolFilter}
              onChange={e => setToolFilter(e.target.value)}
            >
              <option value="All">All Engines</option>
              <option value="dbt">dbt</option>
              <option value="snowflake">Snowflake</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters} title="Reset all filters">
              <RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />
              Reset Filters
            </button>
          )}
        </div>

        {/* Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Tag size={12} /> Active Scope:
            </span>

            {pipelineFilter !== 'All' && (
              <span className="tool-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}>
                Pipeline: <strong>{pipelineFilter}</strong>
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setPipelineFilter('All')} />
              </span>
            )}

            {statusFilter !== 'All' && (
              <span className="tool-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}>
                Status: <strong>{statusFilter}</strong>
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('All')} />
              </span>
            )}

            {toolFilter !== 'All' && (
              <span className="tool-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}>
                Engine: <strong>{toolFilter}</strong>
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setToolFilter('All')} />
              </span>
            )}

            {search && (
              <span className="tool-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}>
                Search: <strong>"{search}"</strong>
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSearch('')} />
              </span>
            )}

            {headerDatePreset !== 'all' && (
              <span className="tool-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px' }}>
                Range: <strong>{headerDatePreset}</strong>
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => { setHeaderDatePreset('all'); setCustomDateRange(null); }} />
              </span>
            )}
          </div>
        )}

        {/* 2. DYNAMIC TOP 5 KPI CARDS (100% Reactive to top filters and date range) */}
        <div className="kpi-grid-5 mt-4">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                <GitBranch size={18} />
              </div>
              <span className="kpi-label">{pipelineFilter !== 'All' ? 'Selected Pipeline' : 'Total Pipelines'}</span>
            </div>
            <div className="kpi-value" style={{ fontSize: pipelineFilter !== 'All' ? 18 : 24, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pipelineFilter !== 'All' ? pipelineFilter : filteredUniquePipelinesCount}
            </div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>{pipelineFilter !== 'All' ? `1 specific pipeline` : `${filteredUniquePipelinesCount} unique registered models`}</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#6366F1" data={filteredRuns.map(r => Number(r.duration || 0))} />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <CheckCircle size={18} />
              </div>
              <span className="kpi-label">Successful Runs</span>
            </div>
            <div className="kpi-value">{successRatePct}%</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>{successfulRuns}/{totalRuns} runs passed</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#10B981" data={filteredRuns.map(r => ((r.status || '').toLowerCase() === 'success' ? 100 : 0))} />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                <XCircle size={18} />
              </div>
              <span className="kpi-label">Failed Runs</span>
            </div>
            <div className="kpi-value">{failedRuns}</div>
            <div className={`kpi-delta ${failedRuns > 0 ? 'down' : 'up'}`}>
              {failedRuns > 0 ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
              <span>{failedRuns > 0 ? `${failedRuns} execution failures` : '0 failures'}</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color={failedRuns > 0 ? '#EF4444' : '#10B981'} data={filteredRuns.map(r => ((r.status || '').toLowerCase() === 'failed' ? 100 : 0))} />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Clock size={18} />
              </div>
              <span className="kpi-label">Avg. Pipeline Duration</span>
            </div>
            <div className="kpi-value">{avgDurationSec}s</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>{totalRuns > 0 ? `${avgDurationSec}s average runtime` : 'No runs'}</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#3B82F6" data={filteredRuns.map(r => Number(r.duration || 0))} />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#F5F3FF', color: '#8B5CF6' }}>
                <AlertTriangle size={18} />
              </div>
              <span className="kpi-label">Active Incidents</span>
            </div>
            <div className="kpi-value">{filteredIncidents.length}</div>
            <div className={`kpi-delta ${filteredIncidents.length > 0 ? 'down' : 'up'}`}>
              {filteredIncidents.length > 0 ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
              <span>{filteredIncidents.length > 0 ? `${filteredIncidents.length} requiring attention` : 'All healthy'}</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color={filteredIncidents.length > 0 ? '#EF4444' : '#10B981'} data={filteredIncidents.map((_, i) => i + 1)} />
            </div>
          </div>
        </div>

        {/* 3 Middle Charts: 100% derived dynamically from filtered subset */}
        <div className="grid-3 mt-4">
          {/* Chart 1: Pipeline Runs Over Time */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Pipeline Runs Over Time</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> Success
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} /> Failed
                  </span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={runsChart} barSize={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="Success" fill="#10B981" stackId="a" />
                <Bar dataKey="Failed" fill="#EF4444" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Pipeline Success Rate Over Time */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Pipeline Success Rate Over Time</div>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={successChart}>
                <defs>
                  <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Success Rate']} />
                <Area type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2} fill="url(#successGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Incidents Over Time */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Incidents Over Time</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} /> Failures
                  </span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={incidentsChart} barSize={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#EF4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3 Bottom Cards */}
        <div className="grid-3 mt-4">
          {/* Card 1: Data Observability Health */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Data Observability Health</div>
              <button className="card-link" onClick={() => navigate('/observability')}>
                View all &rarr;
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {healthData.map(h => (
                <div key={h.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{h.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{h.pct}%</span>
                      <span className={`status-pill ${h.status.toLowerCase()}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                        {h.status}
                      </span>
                    </div>
                  </div>
                  <div className="progress-track" style={{ height: 4 }}>
                    <div className="progress-fill" style={{ width: `${Math.min(h.pct, 100)}%`, background: h.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Recent Incidents */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Incidents</div>
              <button className="card-link" onClick={() => navigate('/incidents')}>
                View all &rarr;
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredIncidents.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No active incidents for the selected scope.
                </div>
              ) : (
                filteredIncidents.slice(0, 3).map((inc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ color: inc.severity === 'Critical' ? '#EF4444' : '#F59E0B', marginTop: 2, flexShrink: 0 }}>
                      <AlertTriangle size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {inc.title}
                        </div>
                        <span className={`status-pill ${inc.severity.toLowerCase()}`} style={{ fontSize: 9.5, padding: '1px 5px' }}>
                          {inc.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inc.desc}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{inc.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 3: Pipeline Monitoring */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Pipeline Monitoring</div>
              <button className="card-link" onClick={() => navigate('/pipelines')}>
                View all &rarr;
              </button>
            </div>
            <table className="vithi-table" style={{ fontSize: 11.5 }}>
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>Status</th>
                  <th>Runs</th>
                  <th>Success</th>
                </tr>
              </thead>
              <tbody>
                {monitoredPipelines.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pipelines in scope</td>
                  </tr>
                ) : (
                  monitoredPipelines.map(p => (
                    <tr key={p.name} style={{ cursor: 'pointer' }} onClick={() => navigate('/pipelines')}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </td>
                      <td>
                        <span className={`status-pill ${p.status.toLowerCase()}`} style={{ fontSize: 9.5, padding: '1px 5px' }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.runs}</td>
                      <td style={{ color: p.status === 'Success' ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {p.successRate}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
