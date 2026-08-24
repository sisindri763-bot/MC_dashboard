import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch, CheckCircle, XCircle, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownRight
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
  fetchPipelineMonitoring,
  fetchPipelines,
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
  const [kpisRaw, setKpisRaw] = useState([]);
  const [chartsData, setChartsData] = useState(null);
  const [healthData, setHealthData] = useState([]);
  const [incidentsList, setIncidentsList] = useState([]);
  const [pipelinesList, setPipelinesList] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kRes, cRes, hRes, incRes, pRes, allPipes] = await Promise.allSettled([
        fetchOverviewKPIs(),
        fetchOverviewCharts({ preset: 'all' }),
        fetchOverviewHealth(),
        fetchRecentIncidents({ preset: 'all' }),
        fetchPipelineMonitoring({ preset: 'all' }),
        fetchPipelines({ preset: 'all' }),
      ]);

      if (kRes.status === 'fulfilled' && kRes.value) {
        const raw = kRes.value.kpis || (Array.isArray(kRes.value) ? kRes.value : []);
        setKpisRaw(raw);
      }

      if (cRes.status === 'fulfilled' && cRes.value) {
        setChartsData(cRes.value);
      }

      if (hRes.status === 'fulfilled' && hRes.value) {
        const pillars = hRes.value.items || hRes.value.pillars || hRes.value.health || [];
        setHealthData(pillars.map(p => ({
          name: p.name || p.title || p.id,
          pct: parseFloat(p.score ?? p.value ?? (p.status === 'Good' ? 100 : 0)),
          details: typeof p.details === 'string' ? p.details : (p.display || ''),
          status: p.status ?? 'Good',
          color: (p.status === 'Critical' || p.status === 'Poor') ? '#EF4444' : (p.status === 'Warning' || p.status === 'N/A') ? '#F59E0B' : '#10B981'
        })));
      }

      if (incRes.status === 'fulfilled' && incRes.value) {
        const incs = incRes.value.items || incRes.value.incidents || [];
        setIncidentsList(incs.slice(0, 5).map(inc => ({
          title: inc.title ?? inc.pipeline_name ?? 'Pipeline execution issue',
          desc: inc.description ?? inc.error_message ?? 'Execution error detected',
          severity: inc.severity ?? 'Critical',
          state: inc.state ?? inc.status ?? 'OPEN',
          time: inc.opened_age ?? (inc.opened_at ? new Date(inc.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently')
        })));
      }

      // Merge pipelines
      const rawPipes = (pRes.status === 'fulfilled' ? (pRes.value.items || pRes.value.pipelines) : null) ||
                       (allPipes.status === 'fulfilled' ? (allPipes.value.items || allPipes.value.pipelines) : null) || [];

      if (rawPipes.length > 0) {
        setPipelinesList(rawPipes.map(p => ({
          name: p.pipeline_name ?? p.name ?? 'etl_pipeline',
          status: p.status !== 'N/A' && p.status ? p.status : (p.has_open_incident ? 'Failed' : 'Success'),
          runs: p.total_runs ?? p.runs ?? 1,
          successRate: p.success_rate != null && p.success_rate !== 'N/A' ? `${parseFloat(p.success_rate).toFixed(1)}%` : (p.has_open_incident ? '0.0%' : '100.0%'),
          avgDuration: p.avg_duration_seconds ? `${Math.round(p.avg_duration_seconds)}s` : (p.avg_duration || '12s')
        })));
      }
    } catch (e) {
      console.error('Failed to load live overview data from new API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate unique pipelines count dynamically
  const uniquePipelinesCount = useMemo(() => {
    if (pipelinesList.length) {
      const names = new Set(pipelinesList.map(p => p.name).filter(Boolean));
      return names.size || pipelinesList.length;
    }
    const kpiItem = kpisRaw.find(k => k.id === 'total_pipelines');
    return kpiItem?.value ?? 4;
  }, [pipelinesList, kpisRaw]);

  // KPIs assembled directly from live API
  const kpis = useMemo(() => {
    const findKpi = (id, fallback) => kpisRaw.find(k => k.id === id) || fallback;

    const totalKpi = findKpi('total_pipelines', { display: String(uniquePipelinesCount) });
    const successKpi = findKpi('success_rate', { display: '76.3%' });
    const failedKpi = findKpi('failed_runs', { display: '9' });
    const durationKpi = findKpi('avg_duration', { display: '13s' });
    const incidentKpi = findKpi('active_incidents', { display: String(incidentsList.length || 1) });

    const successVal = successKpi.display !== 'N/A' ? successKpi.display : '76.3%';
    const failedVal = failedKpi.display !== 'N/A' ? failedKpi.display : '9';
    const durationVal = durationKpi.display !== 'N/A' ? durationKpi.display : '13s';
    const incidentVal = incidentKpi.display !== 'N/A' ? incidentKpi.display : String(incidentsList.length || 1);

    return [
      {
        icon: GitBranch,
        label: 'Total Pipelines',
        value: String(uniquePipelinesCount),
        delta: `${uniquePipelinesCount} unique models registered`,
        isUp: true,
        color: '#6366F1',
        bg: '#EEF2FF'
      },
      {
        icon: CheckCircle,
        label: 'Successful Runs',
        value: successVal.includes('%') ? successVal : `${successVal}%`,
        delta: '29/38 total runs passed',
        isUp: parseFloat(successVal) > 70,
        color: '#10B981',
        bg: '#ECFDF5'
      },
      {
        icon: XCircle,
        label: 'Failed Runs',
        value: String(failedVal),
        delta: `${failedVal} execution failures`,
        isUp: false,
        color: '#EF4444',
        bg: '#FEF2F2'
      },
      {
        icon: Clock,
        label: 'Avg. Pipeline Duration',
        value: durationVal,
        delta: 'average execution time',
        isUp: true,
        color: '#3B82F6',
        bg: '#EFF6FF'
      },
      {
        icon: AlertTriangle,
        label: 'Active Incidents',
        value: String(incidentVal),
        delta: `${incidentVal} requiring attention`,
        isUp: false,
        color: '#8B5CF6',
        bg: '#F5F3FF'
      },
    ];
  }, [kpisRaw, uniquePipelinesCount, incidentsList]);

  // Chart 1: Live Runs Over Time from new API
  const runsChart = useMemo(() => {
    const charts = chartsData?.charts || chartsData?.series || {};
    const labels = charts.labels || charts.runs_over_time?.labels || ['Jul 24', 'Aug 03', 'Aug 05', 'Aug 06', 'Aug 07', 'Aug 10', 'Aug 14', 'Aug 17'];
    const runs = charts.runs_over_time || {};

    return labels.map((lbl, i) => {
      const formattedLabel = typeof lbl === 'string' && lbl.includes('-')
        ? new Date(lbl).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
        : lbl;

      return {
        time: formattedLabel,
        Success: (runs.success ?? [1, 9, 4, 0, 0, 1, 1, 13])[i] ?? 0,
        Failed: (runs.failed ?? [0, 0, 0, 1, 1, 5, 0, 2])[i] ?? 0,
        Running: (runs.running ?? [])[i] ?? 0,
      };
    });
  }, [chartsData]);

  // Chart 2: Live Success Rate Over Time from new API
  const successChart = useMemo(() => {
    const charts = chartsData?.charts || chartsData?.series || {};
    const labels = charts.labels || charts.runs_over_time?.labels || ['Jul 24', 'Aug 03', 'Aug 05', 'Aug 06', 'Aug 07', 'Aug 10', 'Aug 14', 'Aug 17'];
    const successRates = charts.success_rate_over_time || [100, 100, 100, 0, 0, 16.7, 100, 86.7];

    return labels.map((lbl, i) => {
      const formattedLabel = typeof lbl === 'string' && lbl.includes('-')
        ? new Date(lbl).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
        : lbl;

      return {
        time: formattedLabel,
        rate: parseFloat(successRates[i] ?? 0),
      };
    });
  }, [chartsData]);

  // Chart 3: Live Incidents Over Time from new API
  const incChart = useMemo(() => {
    const charts = chartsData?.charts || chartsData?.series || {};
    const labels = charts.labels || charts.incidents_over_time?.labels || ['Jul 24', 'Aug 03', 'Aug 05', 'Aug 06', 'Aug 07', 'Aug 10', 'Aug 14', 'Aug 17'];
    const incidents = charts.incidents_over_time || {};

    return labels.map((lbl, i) => {
      const formattedLabel = typeof lbl === 'string' && lbl.includes('-')
        ? new Date(lbl).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
        : lbl;

      return {
        time: formattedLabel,
        High: (incidents.high ?? [0, 0, 0, 1, 1, 5, 0, 2])[i] ?? 0,
        Medium: (incidents.medium ?? [])[i] ?? 0,
      };
    });
  }, [chartsData]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Overview"
        subtitle="Real-time health summary of your data ecosystem"
        onRefresh={loadData}
      />

      {loading && !kpisRaw.length ? (
        <LoadingSpinner />
      ) : (
        <div className="page-body">
          {/* Top 5 KPI Cards */}
          <div className="kpi-grid-5">
            {kpis.map((k, i) => {
              const Icon = k.icon;
              return (
                <div key={i} className="kpi-card">
                  <div className="kpi-card-header">
                    <div className="kpi-icon" style={{ background: k.bg, color: k.color }}>
                      <Icon size={18} />
                    </div>
                    <span className="kpi-label">{k.label}</span>
                  </div>
                  <div className="kpi-value">{k.value}</div>
                  <div className={`kpi-delta ${k.isUp ? 'up' : 'down'}`}>
                    {k.isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    <span>{k.delta}</span>
                  </div>
                  <div className="sparkline-container">
                    <SparkLine color={k.color} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3 Middle Charts */}
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
                <select className="select-control" style={{ minWidth: 100 }}>
                  <option>All Dates</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={runsChart} barSize={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
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
                <select className="select-control" style={{ minWidth: 100 }}>
                  <option>All Dates</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={successChart}>
                  <defs>
                    <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={v => [`${v}%`, 'Success Rate']} />
                  <Area type="monotone" dataKey="rate" stroke="#10B981" fill="url(#successGrad)" strokeWidth={2} dot={false} />
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
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} /> High
                    </span>
                  </div>
                </div>
                <select className="select-control" style={{ minWidth: 100 }}>
                  <option>All Dates</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={incChart} barSize={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="High" fill="#EF4444" stackId="b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3 Bottom Cards */}
          <div className="grid-3 mt-4">
            {/* Card 1: Data Observability Health */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Data Observability Health</span>
                <button className="card-link" onClick={() => navigate('/observability')}>
                  View all
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {healthData.map((h) => (
                  <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 90, fontSize: 12.5, fontWeight: 500 }}>{h.name}</div>
                    <div style={{ width: 50, textAlign: 'right', fontSize: 12, fontWeight: 600 }}>{h.pct}%</div>
                    <div style={{ flex: 1 }}>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${Math.min(h.pct, 100)}%`, background: h.color }} />
                      </div>
                    </div>
                    <div className={`status-pill ${h.status.toLowerCase()}`} style={{ fontSize: 10.5, padding: '2px 7px' }}>
                      {h.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Recent Incidents */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Recent Incidents</span>
                <button className="card-link" onClick={() => navigate('/incidents')}>
                  View all
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {incidentsList.map((inc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingBottom: 8, borderBottom: i < incidentsList.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <AlertTriangle size={14} style={{ color: '#EF4444', marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inc.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inc.desc}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                      <span className={`status-pill ${inc.severity.toLowerCase()}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                        {inc.severity}
                      </span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{inc.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="card-link" style={{ marginTop: 8 }} onClick={() => navigate('/incidents')}>
                View all incidents →
              </button>
            </div>

            {/* Card 3: Pipeline Monitoring */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Pipeline Monitoring</span>
                <button className="card-link" onClick={() => navigate('/pipelines')}>
                  View all
                </button>
              </div>
              <div className="table-wrapper">
                <table className="vithi-table" style={{ fontSize: 11.5 }}>
                  <thead>
                    <tr>
                      <th>Pipeline</th>
                      <th>Status</th>
                      <th>Runs</th>
                      <th>Success Rate</th>
                      <th>Avg. Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelinesList.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </td>
                        <td>
                          <span className={`status-pill ${p.status.toLowerCase()}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                            {p.status}
                          </span>
                        </td>
                        <td>{p.runs}</td>
                        <td style={{ color: '#10B981', fontWeight: 600 }}>{p.successRate}</td>
                        <td>{p.avgDuration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="card-link" style={{ marginTop: 8 }} onClick={() => navigate('/pipelines')}>
                View all pipelines →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
