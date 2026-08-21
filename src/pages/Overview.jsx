import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, AreaChart, Area, ResponsiveContainer,
} from 'recharts';
import {
  GitBranch, CheckCircle, XCircle, Clock, AlertTriangle,
  AlertOctagon, Info, MoreVertical, ArrowRight, TrendingUp, TrendingDown,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  fetchOverviewKPIs, fetchOverviewCharts,
  fetchOverviewHealth, fetchRecentIncidents, fetchPipelineMonitoring,
} from '../api/client';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1E2130', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 },
  itemStyle: { color: '#E8EAF6' },
  labelStyle: { color: '#8B90A7' },
};

function fmtDuration(secs) {
  if (!secs && secs !== 0) return '—';
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}m ${s}s`;
}

function fmtTime(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const diff = Math.round((Date.now() - d.getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

function severityIcon(sev) {
  const s = String(sev || '').toLowerCase();
  if (s === 'high' || s === 'critical') return <AlertOctagon size={15} color="#EF4444" />;
  if (s === 'medium') return <AlertTriangle size={15} color="#F59E0B" />;
  return <Info size={15} color="#3B82F6" />;
}

export default function Overview() {
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [health, setHealth] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [k, c, h, inc, pip] = await Promise.all([
        fetchOverviewKPIs(),
        fetchOverviewCharts(),
        fetchOverviewHealth(),
        fetchRecentIncidents({ limit: 6 }),
        fetchPipelineMonitoring(),
      ]);
      setKpis(k);
      setCharts(c);
      setHealth(Array.isArray(h) ? h : h?.pillars ?? []);
      setIncidents(Array.isArray(inc) ? inc : inc?.incidents ?? []);
      setPipelines(Array.isArray(pip) ? pip : pip?.pipelines ?? pip?.pipeline_monitoring ?? []);
    } catch (e) {
      console.error('Overview load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner /></div>;

  // Build chart data from API — API returns labels[] + separate series arrays
  const labels = charts?.labels ?? [];
  const runsOverTime = charts?.runsOverTime ?? charts?.runs_over_time ?? {};
  const successRateArr = charts?.successRateOverTime ?? charts?.success_rate_over_time ?? [];
  const incidentsOverTime = charts?.incidentsOverTime ?? charts?.incidents_over_time ?? {};

  const runsChart = labels.map((lbl, i) => ({
    label: lbl,
    Success: (runsOverTime.success ?? [])[i] ?? 0,
    Failed: (runsOverTime.failed ?? [])[i] ?? 0,
    Running: (runsOverTime.running ?? [])[i] ?? 0,
    Cancelled: (runsOverTime.cancelled ?? [])[i] ?? 0,
  }));

  const successChart = labels.map((lbl, i) => ({
    label: lbl,
    rate: parseFloat(successRateArr[i] ?? 0),
  }));

  const incChart = labels.map((lbl, i) => ({
    label: lbl,
    High: (incidentsOverTime.high ?? [])[i] ?? 0,
    Medium: (incidentsOverTime.medium ?? [])[i] ?? 0,
    Low: (incidentsOverTime.low ?? [])[i] ?? 0,
  }));

  const healthItems = health;

  const pillarIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('fresh')) return <Clock size={14} color="#6C63FF" />;
    if (n.includes('vol')) return <GitBranch size={14} color="#3B82F6" />;
    if (n.includes('quality')) return <CheckCircle size={14} color="#22C55E" />;
    if (n.includes('schema')) return <GitBranch size={14} color="#F59E0B" />;
    if (n.includes('consist')) return <CheckCircle size={14} color="#8B5CF6" />;
    return <AlertTriangle size={14} color="#6C63FF" />;
  };

  // Extract from nested kpis object returned by the API
  const k = kpis?.kpis ?? {};
  const kpisList = [
    {
      icon: GitBranch, iconClass: 'purple', label: 'Total Pipelines',
      value: k?.total_pipelines?.value ?? kpis?.totalPipelines?.value ?? '—',
      sparkColor: '#6C63FF',
    },
    {
      icon: CheckCircle, iconClass: 'green', label: 'Successful Runs',
      value: k?.success_rate?.value ?? kpis?.successfulRuns?.value ?? '—',
      sparkColor: '#22C55E',
    },
    {
      icon: XCircle, iconClass: 'red', label: 'Failed Runs',
      value: k?.failed_runs?.value ?? kpis?.failedRuns?.value ?? '—',
      isGoodDown: true,
      sparkColor: '#EF4444',
    },
    {
      icon: Clock, iconClass: 'blue', label: 'Avg. Pipeline Duration',
      value: k?.avg_duration?.value ?? kpis?.avgDuration?.value ?? '—',
      sparkColor: '#3B82F6',
    },
    {
      icon: AlertTriangle, iconClass: 'orange', label: 'Active Incidents',
      value: k?.active_incidents?.value ?? kpis?.activeIncidents?.value ?? '—',
      isGoodDown: true,
      sparkColor: '#F59E0B',
    },
  ];

  return (
    <div className="fade-in">
      <PageHeader title="Overview" subtitle="Real-time health summary of your data ecosystem" />

      {/* KPI Cards */}
      <div className="page-body" style={{ paddingTop: 16 }}>
        <div className="kpi-grid">
          {kpisList.map((k) => (
            <KPICard key={k.label} {...k} sparkData={[]} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="charts-grid mt-6">
          {/* Pipeline Runs Over Time */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pipeline Runs Over Time</span>
              <div className="chart-filter-row">
                <select className="time-select">
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                </select>
              </div>
            </div>
            <div className="chart-legend" style={{ marginBottom: 12 }}>
              {['#22C55E', '#EF4444', '#3B82F6', '#9CA3AF'].map((c, i) =>
                <div key={i} className="legend-item">
                  <div className="legend-dot" style={{ background: c }} />
                  {['Success', 'Failed', 'Running', 'Cancelled'][i]}
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={runsChart} barSize={6} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="Success" fill="#22C55E" radius={[2,2,0,0]} />
                <Bar dataKey="Failed" fill="#EF4444" radius={[2,2,0,0]} />
                <Bar dataKey="Running" fill="#3B82F6" radius={[2,2,0,0]} />
                <Bar dataKey="Cancelled" fill="#6B7280" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Success Rate Over Time */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pipeline Success Rate Over Time</span>
              <select className="time-select">
                <option>Last 24 Hours</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={successChart}>
                <defs>
                  <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${parseFloat(v).toFixed(1)}%`]} />
                <Area type="monotone" dataKey="rate" stroke="#22C55E" fill="url(#successGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Incidents Over Time */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Incidents Over Time</span>
              <select className="time-select">
                <option>Last 24 Hours</option>
              </select>
            </div>
            <div className="chart-legend" style={{ marginBottom: 12 }}>
              {['#EF4444', '#F59E0B', '#3B82F6'].map((c, i) =>
                <div key={i} className="legend-item">
                  <div className="legend-dot" style={{ background: c }} />
                  {['High', 'Medium', 'Low'][i]}
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={incChart} barSize={6} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="High" fill="#EF4444" radius={[2,2,0,0]} />
                <Bar dataKey="Medium" fill="#F59E0B" radius={[2,2,0,0]} />
                <Bar dataKey="Low" fill="#3B82F6" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="section-grid-3 mt-6">
          {/* Data Observability Health */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Data Observability Health</span>
              <a className="card-link" href="/observability">View all</a>
            </div>
            <div className="health-grid">
              {healthItems.length === 0 ? (
                <div className="empty-state">No health data</div>
              ) : (
                healthItems.map((h) => {
                  const pct = parseFloat(h.value ?? h.score ?? 0);
                  const available = h.value != null;
                  const status = !available ? 'N/A' : (pct >= 90 ? 'Good' : pct >= 70 ? 'Warning' : 'Poor');
                  return (
                    <div key={h.name} className="health-row">
                      <div className="health-label">
                        {pillarIcon(h.name)}
                        <span>{h.name}</span>
                      </div>
                      <div className="health-pct">{available ? `${pct.toFixed(1)}%` : 'N/A'}</div>
                      <div className="health-bar-wrap">
                        <div className="health-bar" style={{ width: available ? `${Math.min(pct,100)}%` : '0%', background: pct >= 90 ? '#22C55E' : pct >= 70 ? '#F59E0B' : '#EF4444' }} />
                      </div>
                      <div className={`health-status ${status.toLowerCase()}`}>{status}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Incidents</span>
              <a className="card-link" href="/incidents">View all</a>
            </div>
            <div>
              {incidents.length === 0 ? (
                <div className="empty-state">No incidents</div>
              ) : (
                incidents.map((inc, i) => (
                  <div key={i} className="incident-row">
                    <div className="incident-icon">{severityIcon(inc.severity)}</div>
                    <div className="incident-body">
                      <div className="incident-title">{inc.title ?? inc.pipeline_name ?? '—'}</div>
                      <div className="incident-desc">{inc.description ?? inc.error_message ?? ''}</div>
                    </div>
                    <div className="incident-meta">
                      <StatusBadge status={inc.severity} />
                      <span className="incident-time">{fmtTime(inc.created_at ?? inc.start_time)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
              <a href="/incidents" className="card-link" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                View all incidents <ArrowRight size={12} />
              </a>
            </div>
          </div>

          {/* Pipeline Monitoring */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pipeline Monitoring</span>
              <a className="card-link" href="/pipelines">View all</a>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
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
                  {pipelines.slice(0, 6).map((p, i) => (
                    <tr key={i}>
                      <td>
                        <div className="pipeline-name-cell">
                          <div className="pipeline-icon"><GitBranch size={12} /></div>
                          <span style={{ fontSize: 12 }}>{p.pipeline_name ?? p.name ?? '—'}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={p.latest_status ?? p.status} /></td>
                      <td style={{ fontSize: 12 }}>{p.total_runs ?? '—'}</td>
                      <td style={{ fontSize: 12, color: '#22C55E' }}>
                        {p.success_rate != null ? `${parseFloat(p.success_rate).toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ fontSize: 12 }}>{p.avg_duration_formatted ?? fmtDuration(p.avg_duration_seconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
              <a href="/pipelines" className="card-link" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                View all pipelines <ArrowRight size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
