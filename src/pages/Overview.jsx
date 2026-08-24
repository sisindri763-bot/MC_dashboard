import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch, CheckCircle, XCircle, Clock, AlertTriangle,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  Shield, Database, Layers, CheckSquare, Sparkles
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

// Fallback / Hydration dataset matching exact reference design
const DEFAULT_KPIS = [
  { icon: GitBranch, label: 'Total Pipelines', value: '247', delta: '+12 vs yesterday', isUp: true, color: '#6366F1', bg: '#EEF2FF' },
  { icon: CheckCircle, label: 'Successful Runs', value: '91.3%', delta: '+2.1% vs yesterday', isUp: true, color: '#10B981', bg: '#ECFDF5' },
  { icon: XCircle, label: 'Failed Runs', value: '18', delta: '-3 vs yesterday', isUp: false, color: '#EF4444', bg: '#FEF2F2' },
  { icon: Clock, label: 'Avg. Pipeline Duration', value: '14m 32s', delta: '+8.4% vs yesterday', isUp: true, color: '#3B82F6', bg: '#EFF6FF' },
  { icon: AlertTriangle, label: 'Active Incidents', value: '12', delta: '-4 vs yesterday', isUp: false, color: '#8B5CF6', bg: '#F5F3FF' },
];

const DEFAULT_RUNS_DATA = [
  { time: '12 AM', Success: 320, Failed: 20, Running: 40, Cancelled: 10 },
  { time: '4 AM', Success: 380, Failed: 30, Running: 60, Cancelled: 15 },
  { time: '8 AM', Success: 420, Failed: 45, Running: 70, Cancelled: 20 },
  { time: '12 PM', Success: 390, Failed: 25, Running: 50, Cancelled: 12 },
  { time: '4 PM', Success: 360, Failed: 35, Running: 65, Cancelled: 18 },
  { time: '8 PM', Success: 440, Failed: 40, Running: 80, Cancelled: 22 },
];

const DEFAULT_SUCCESS_DATA = [
  { time: '12 AM', rate: 91 },
  { time: '2 AM', rate: 89 },
  { time: '4 AM', rate: 93 },
  { time: '6 AM', rate: 90 },
  { time: '8 AM', rate: 94 },
  { time: '10 AM', rate: 92 },
  { time: '12 PM', rate: 91 },
  { time: '2 PM', rate: 95 },
  { time: '4 PM', rate: 92 },
  { time: '6 PM', rate: 93 },
  { time: '8 PM', rate: 91.3 },
];

const DEFAULT_INCIDENTS_DATA = [
  { time: '12 AM', High: 5, Medium: 3, Low: 2 },
  { time: '4 AM', High: 8, Medium: 4, Low: 3 },
  { time: '8 AM', High: 15, Medium: 6, Low: 5 },
  { time: '12 PM', High: 10, Medium: 5, Low: 3 },
  { time: '4 PM', High: 12, Medium: 7, Low: 4 },
  { time: '8 PM', High: 14, Medium: 6, Low: 4 },
];

const HEALTH_ITEMS = [
  { name: 'Freshness', pct: 92.1, delta: '+2.7%', status: 'Good', color: '#10B981' },
  { name: 'Volume', pct: 95.3, delta: '+1.8%', status: 'Good', color: '#10B981' },
  { name: 'Data Quality', pct: 90.2, delta: '+3.1%', status: 'Good', color: '#10B981' },
  { name: 'Schema', pct: 93.0, delta: '+1.2%', status: 'Good', color: '#10B981' },
  { name: 'Consistency', pct: 91.1, delta: '+2.5%', status: 'Good', color: '#10B981' },
  { name: 'Uniqueness', pct: 89.2, delta: '-0.6%', status: 'Warning', color: '#F59E0B' },
];

const RECENT_INCIDENTS = [
  {
    title: 'Freshness issue in sales_daily_summary',
    desc: 'Table not updated in the expected time window',
    severity: 'High',
    time: '10m ago'
  },
  {
    title: 'Volume drop in marketing_campaign_performance',
    desc: 'Row count dropped by 62%',
    severity: 'Medium',
    time: '20m ago'
  },
  {
    title: 'Data quality issue in finance.transactions',
    desc: 'Null values in amount column > 5%',
    severity: 'Medium',
    time: '35m ago'
  },
  {
    title: 'Schema change detected in customer_profiles',
    desc: 'New column \'customer_tier\' added',
    severity: 'Low',
    time: '1h ago'
  },
  {
    title: 'Pipeline failure in inventory_update',
    desc: 'Snowflake connection timeout',
    severity: 'Low',
    time: '2h ago'
  },
];

const PIPELINE_MONITORING = [
  { name: 'users_sync_pipeline', status: 'Success', runs: 28, successRate: '96.4%', avgDuration: '6m 12s' },
  { name: 'monthly_aggregation_pipeline', status: 'Success', runs: 24, successRate: '95.8%', avgDuration: '12m 45s' },
  { name: 'data_ingestion_pipeline', status: 'Running', runs: 18, successRate: '88.9%', avgDuration: '8m 33s' },
  { name: 'marketing_pipeline', status: 'Failed', runs: 12, successRate: '66.7%', avgDuration: '15m 21s' },
  { name: 'finance_reporting_pipeline', status: 'Success', runs: 10, successRate: '90.0%', avgDuration: '7m 18s' },
];

export default function Overview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(DEFAULT_KPIS);
  const [runsChart, setRunsChart] = useState(DEFAULT_RUNS_DATA);
  const [successChart, setSuccessChart] = useState(DEFAULT_SUCCESS_DATA);
  const [incChart, setIncChart] = useState(DEFAULT_INCIDENTS_DATA);
  const [healthData, setHealthData] = useState(HEALTH_ITEMS);
  const [incidentsList, setIncidentsList] = useState(RECENT_INCIDENTS);
  const [pipelinesList, setPipelinesList] = useState(PIPELINE_MONITORING);

  const loadData = async () => {
    try {
      const [kRes, cRes, hRes, incRes, pRes] = await Promise.allSettled([
        fetchOverviewKPIs(),
        fetchOverviewCharts(),
        fetchOverviewHealth(),
        fetchRecentIncidents(),
        fetchPipelineMonitoring(),
      ]);

      // If backend returned valid KPI object, merge
      if (kRes.status === 'fulfilled' && kRes.value) {
        const k = kRes.value?.kpis ?? kRes.value;
        setKpis([
          { icon: GitBranch, label: 'Total Pipelines', value: String(k?.total_pipelines?.value ?? k?.totalPipelines?.value ?? '247'), delta: '+12 vs yesterday', isUp: true, color: '#6366F1', bg: '#EEF2FF' },
          { icon: CheckCircle, label: 'Successful Runs', value: String(k?.success_rate?.value ?? k?.successfulRuns?.value ?? '91.3%'), delta: '+2.1% vs yesterday', isUp: true, color: '#10B981', bg: '#ECFDF5' },
          { icon: XCircle, label: 'Failed Runs', value: String(k?.failed_runs?.value ?? k?.failedRuns?.value ?? '18'), delta: '-3 vs yesterday', isUp: false, color: '#EF4444', bg: '#FEF2F2' },
          { icon: Clock, label: 'Avg. Pipeline Duration', value: String(k?.avg_duration?.value ?? k?.avgDuration?.value ?? '14m 32s'), delta: '+8.4% vs yesterday', isUp: true, color: '#3B82F6', bg: '#EFF6FF' },
          { icon: AlertTriangle, label: 'Active Incidents', value: String(k?.active_incidents?.value ?? k?.activeIncidents?.value ?? '12'), delta: '-4 vs yesterday', isUp: false, color: '#8B5CF6', bg: '#F5F3FF' },
        ]);
      }

      // If backend returned charts, merge
      if (cRes.status === 'fulfilled' && cRes.value?.labels?.length) {
        const c = cRes.value;
        const labels = c.labels;
        const runs = c.runsOverTime ?? c.runs_over_time ?? {};
        const successRate = c.successRateOverTime ?? c.success_rate_over_time ?? [];
        const incidents = c.incidentsOverTime ?? c.incidents_over_time ?? {};

        setRunsChart(labels.map((lbl, i) => ({
          time: lbl,
          Success: (runs.success ?? [])[i] ?? 300,
          Failed: (runs.failed ?? [])[i] ?? 20,
          Running: (runs.running ?? [])[i] ?? 40,
          Cancelled: (runs.cancelled ?? [])[i] ?? 10,
        })));

        setSuccessChart(labels.map((lbl, i) => ({
          time: lbl,
          rate: parseFloat(successRate[i] ?? 90),
        })));

        setIncChart(labels.map((lbl, i) => ({
          time: lbl,
          High: (incidents.high ?? [])[i] ?? 5,
          Medium: (incidents.medium ?? [])[i] ?? 3,
          Low: (incidents.low ?? [])[i] ?? 2,
        })));
      }

      // If backend returned health pillars
      if (hRes.status === 'fulfilled' && hRes.value?.pillars?.length) {
        setHealthData(hRes.value.pillars.map(p => ({
          name: p.name,
          pct: parseFloat(p.score ?? p.value ?? 90),
          delta: '+1.5%',
          status: p.status ?? 'Good',
          color: (p.status === 'Critical' || p.status === 'Poor') ? '#EF4444' : p.status === 'Warning' ? '#F59E0B' : '#10B981'
        })));
      }

      // If backend returned recent incidents
      if (incRes.status === 'fulfilled' && incRes.value?.incidents?.length) {
        setIncidentsList(incRes.value.incidents.slice(0, 5).map(inc => ({
          title: inc.title ?? inc.pipeline_name ?? 'Pipeline failure',
          desc: inc.description ?? inc.error_message ?? 'Execution error',
          severity: inc.severity ?? 'Medium',
          time: inc.start_time ? `${new Date(inc.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '10m ago'
        })));
      }

      // If backend returned pipeline monitoring list
      if (pRes.status === 'fulfilled' && (pRes.value?.pipelines?.length || Array.isArray(pRes.value))) {
        const list = pRes.value?.pipelines ?? pRes.value;
        if (Array.isArray(list) && list.length > 0) {
          setPipelinesList(list.slice(0, 5).map(p => ({
            name: p.pipeline_name ?? 'etl_pipeline',
            status: p.status ?? p.latest_status ?? 'Success',
            runs: p.total_runs ?? 20,
            successRate: p.success_rate != null ? `${parseFloat(p.success_rate).toFixed(1)}%` : '95.0%',
            avgDuration: p.avg_duration_seconds ? `${Math.round(p.avg_duration_seconds)}s` : '8m 30s'
          })));
        }
      }
    } catch (e) {
      console.error('Failed to load overview data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="fade-in">
      <PageHeader
        title="Overview"
        subtitle="Real-time health summary of your data ecosystem"
        onRefresh={loadData}
      />

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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} /> Running
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8' }} /> Cancelled
                  </span>
                </div>
              </div>
              <select className="select-control" style={{ minWidth: 100 }}>
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={runsChart} barSize={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="Success" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Failed" fill="#EF4444" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Running" fill="#3B82F6" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Cancelled" fill="#CBD5E1" stackId="a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Pipeline Success Rate Over Time */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Pipeline Success Rate Over Time</div>
              <select className="select-control" style={{ minWidth: 100 }}>
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} /> Medium
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} /> Low
                  </span>
                </div>
              </div>
              <select className="select-control" style={{ minWidth: 100 }}>
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={incChart} barSize={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="High" fill="#EF4444" stackId="b" />
                <Bar dataKey="Medium" fill="#F59E0B" stackId="b" />
                <Bar dataKey="Low" fill="#3B82F6" stackId="b" radius={[2, 2, 0, 0]} />
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
                  <AlertTriangle size={14} style={{ color: inc.severity === 'High' ? '#EF4444' : inc.severity === 'Medium' ? '#F59E0B' : '#3B82F6', marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {inc.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
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
    </div>
  );
}
