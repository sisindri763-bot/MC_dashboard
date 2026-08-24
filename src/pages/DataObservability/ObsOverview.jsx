import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, BarChart2, Database, Shield, Layers,
  ChevronRight, ArrowUpRight, ArrowDownRight, AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import PageHeader from '../../components/PageHeader';
import SparkLine from '../../components/SparkLine';
import LoadingSpinner from '../../components/LoadingSpinner';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  itemStyle: { color: '#0F172A' },
  labelStyle: { color: '#64748B', fontWeight: 600 },
};

const PILLARS_CARDS = [
  { icon: Clock, label: 'Freshness', value: '92.1%', status: 'Good', delta: '+2.7% vs yesterday', isUp: true, color: '#10B981', bg: '#ECFDF5', route: '/observability/freshness' },
  { icon: BarChart2, label: 'Volume', value: '95.3%', status: 'Good', delta: '+1.8% vs yesterday', isUp: true, color: '#3B82F6', bg: '#EFF6FF', route: '/observability/volume' },
  { icon: Database, label: 'Volume Trend (Records)', value: '2.45B', status: '', delta: '+12.5% vs yesterday', isUp: true, color: '#6366F1', bg: '#EEF2FF', route: '/observability/volume' },
  { icon: Shield, label: 'Data Quality', value: '90.2%', status: 'Good', delta: '+3.1% vs yesterday', isUp: true, color: '#10B981', bg: '#ECFDF5', route: '/observability/data-quality' },
  { icon: Layers, label: 'Schema', value: '93.0%', status: 'Good', delta: '+1.2% vs yesterday', isUp: true, color: '#F59E0B', bg: '#FFFBEB', route: '/observability/schema' },
];

const FRESHNESS_DONUT = [
  { name: 'Fresh', value: 78, color: '#10B981' },
  { name: 'Warning', value: 15, color: '#F59E0B' },
  { name: 'Critical', value: 7, color: '#EF4444' },
];

const QUALITY_DONUT = [
  { name: 'Passed', value: 72, color: '#10B981' },
  { name: 'Warning', value: 18, color: '#F59E0B' },
  { name: 'Failed', value: 10, color: '#EF4444' },
];

const SCHEMA_DONUT = [
  { name: 'Valid', value: 82, color: '#10B981' },
  { name: 'Invalid', value: 10, color: '#F59E0B' },
  { name: 'Unknown', value: 8, color: '#EF4444' },
];

const VOLUME_WAVE_DATA = [
  { time: '12 AM', v: 28 },
  { time: '4 AM', v: 32 },
  { time: '8 AM', v: 29 },
  { time: '12 PM', v: 34 },
  { time: '4 PM', v: 30 },
  { time: '8 PM', v: 36 },
];

const TOP_DATA_ASSETS = [
  { name: 'sales_daily_summary', domain: 'Sales', freshness: 'Fresh', quality: 'Good', volume: '128M', schema: 'Valid', updated: '2m ago' },
  { name: 'marketing_campaign_performance', domain: 'Marketing', freshness: 'Warning', quality: 'Warning', volume: '96M', schema: 'Valid', updated: '10m ago' },
  { name: 'finance.transactions', domain: 'Finance', freshness: 'Fresh', quality: 'Good', volume: '64M', schema: 'Valid', updated: '15m ago' },
  { name: 'customer_profiles', domain: 'Operations', freshness: 'Fresh', quality: 'Good', volume: '47M', schema: 'Warning', updated: '30m ago' },
  { name: 'inventory_snapshot', domain: 'Operations', freshness: 'Critical', quality: 'Failed', volume: '23M', schema: 'Invalid', updated: '1h ago' },
];

const RECENT_OBS_INCIDENTS = [
  { title: 'Freshness issue in sales_daily_summary', asset: 'sales_daily_summary', severity: 'Critical', time: '10m ago', status: 'Open' },
  { title: 'Volume drop in marketing_campaign_performance', asset: 'marketing_campaign_performance', severity: 'High', time: '20m ago', status: 'Open' },
  { title: 'Data quality issue in finance.transactions', asset: 'finance.transactions', severity: 'Medium', time: '35m ago', status: 'Investigating' },
  { title: 'Schema change detected in customer_profiles', asset: 'customer_profiles', severity: 'Low', time: '1h ago', status: 'Resolved' },
  { title: 'Pipeline failure in inventory_snapshot', asset: 'inventory_snapshot', severity: 'Low', time: '2h ago', status: 'Resolved' },
];

const HEALTH_DIMENSIONS = [
  { label: 'Freshness', score: '92.1%', status: 'Good', good: 78, warn: 15, crit: 7, color: '#10B981', route: '/observability/freshness' },
  { label: 'Volume', score: '95.3%', status: 'Good', good: 80, warn: 15, crit: 5, color: '#10B981', route: '/observability/volume' },
  { label: 'Volume Trend', score: '2.45B', status: '↑ 12.5%', isTrend: true, good: 100, warn: 0, crit: 0, color: '#3B82F6', route: '/observability/volume' },
  { label: 'Data Quality', score: '90.2%', status: 'Good', good: 72, warn: 18, crit: 10, color: '#10B981', route: '/observability/data-quality' },
  { label: 'Schema', score: '93.0%', status: 'Good', good: 82, warn: 10, crit: 8, color: '#10B981', route: '/observability/schema' },
];

export default function ObsOverview() {
  const navigate = useNavigate();

  return (
    <div className="fade-in">
      <PageHeader
        title="Data Observability"
        subtitle="Monitor the health of your data across all dimensions."
      />

      <div className="page-body">
        {/* Top 5 KPI Pillars */}
        <div className="kpi-grid-5">
          {PILLARS_CARDS.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate(p.route)}>
                <div className="kpi-card-header">
                  <div className="kpi-icon" style={{ background: p.bg, color: p.color }}>
                    <Icon size={18} />
                  </div>
                  <span className="kpi-label">{p.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div className="kpi-value">{p.value}</div>
                  {p.status && (
                    <span className={`status-pill ${p.status.toLowerCase()}`} style={{ fontSize: 10.5, padding: '1px 6px' }}>
                      {p.status}
                    </span>
                  )}
                </div>
                <div className={`kpi-delta ${p.isUp ? 'up' : 'down'}`} style={{ marginTop: 4 }}>
                  <ArrowUpRight size={13} />
                  <span>{p.delta}</span>
                </div>
                <div className="sparkline-container">
                  <SparkLine color={p.color} />
                </div>
              </div>
            );
          })}
        </div>

        {/* 4 Middle Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 14 }}>
          {/* Donut 1: Freshness Overview */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">Freshness Overview</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
                <PieChart width={110} height={110}>
                  <Pie data={FRESHNESS_DONUT} cx={55} cy={55} innerRadius={35} outerRadius={50} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                    {FRESHNESS_DONUT.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="donut-center-label">
                  <div style={{ fontSize: 15, fontWeight: 800 }}>92.1%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Good</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {FRESHNESS_DONUT.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="card-link" style={{ marginTop: 8 }} onClick={() => navigate('/observability/freshness')}>
              View all →
            </button>
          </div>

          {/* Chart 2: Volume Overview Wave */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">Volume Overview</span>
              <select className="select-control" style={{ minWidth: 80, padding: '2px 6px', fontSize: 11 }}>
                <option>Last 24 Hours</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={VOLUME_WAVE_DATA}>
                  <defs>
                    <linearGradient id="volWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[10, 45]} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="v" stroke="#6366F1" fill="url(#volWave)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <button className="card-link" style={{ marginTop: 8 }} onClick={() => navigate('/observability/volume')}>
              View all →
            </button>
          </div>

          {/* Donut 3: Data Quality Overview */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">Data Quality Overview</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
                <PieChart width={110} height={110}>
                  <Pie data={QUALITY_DONUT} cx={55} cy={55} innerRadius={35} outerRadius={50} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                    {QUALITY_DONUT.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="donut-center-label">
                  <div style={{ fontSize: 15, fontWeight: 800 }}>90.2%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Good</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {QUALITY_DONUT.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="card-link" style={{ marginTop: 8 }} onClick={() => navigate('/observability/data-quality')}>
              View all →
            </button>
          </div>

          {/* Donut 4: Schema Overview */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">Schema Overview</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
                <PieChart width={110} height={110}>
                  <Pie data={SCHEMA_DONUT} cx={55} cy={55} innerRadius={35} outerRadius={50} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                    {SCHEMA_DONUT.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="donut-center-label">
                  <div style={{ fontSize: 15, fontWeight: 800 }}>93.0%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Good</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SCHEMA_DONUT.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="card-link" style={{ marginTop: 8 }} onClick={() => navigate('/observability/schema')}>
              View all →
            </button>
          </div>
        </div>

        {/* Top Data Assets by Status & Recent Data Incidents */}
        <div className="grid-2 mt-4">
          {/* Table: Top Data Assets */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top Data Assets by Status</span>
            </div>
            <div className="table-wrapper">
              <table className="vithi-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Data Asset</th>
                    <th>Domain</th>
                    <th>Freshness</th>
                    <th>Data Quality</th>
                    <th>Volume</th>
                    <th>Schema</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_DATA_ASSETS.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{a.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{a.domain}</td>
                      <td><span className={`status-pill ${a.freshness.toLowerCase()}`}>{a.freshness}</span></td>
                      <td><span className={`status-pill ${a.quality.toLowerCase()}`}>{a.quality}</span></td>
                      <td style={{ fontWeight: 600 }}>{a.volume}</td>
                      <td><span className={`status-pill ${a.schema.toLowerCase()}`}>{a.schema}</span></td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{a.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="card-link" style={{ marginTop: 8 }} onClick={() => navigate('/observability/freshness')}>
              View all data assets →
            </button>
          </div>

          {/* Table: Recent Data Incidents */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Data Incidents</span>
            </div>
            <div className="table-wrapper">
              <table className="vithi-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Incident</th>
                    <th>Data Asset</th>
                    <th>Severity</th>
                    <th>Detected At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_OBS_INCIDENTS.map((inc, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={13} style={{ color: inc.severity === 'Critical' ? '#EF4444' : inc.severity === 'High' ? '#EF4444' : '#F59E0B' }} />
                          <span style={{ fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inc.title}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.asset}</td>
                      <td><span className={`status-pill ${inc.severity.toLowerCase()}`}>{inc.severity}</span></td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{inc.time}</td>
                      <td><span className={`status-pill ${inc.status.toLowerCase()}`}>{inc.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="card-link" style={{ marginTop: 8 }} onClick={() => navigate('/incidents')}>
              View all incidents →
            </button>
          </div>
        </div>

        {/* Bottom Card: Data Assets Health by Dimension */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Data Assets Health by Dimension</span>
          </div>
          <div className="grid-5">
            {HEALTH_DIMENSIONS.map((dim, i) => (
              <div key={i} style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{dim.label}</span>
                  <span className="status-pill good" style={{ fontSize: 10, padding: '1px 5px' }}>{dim.status}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>
                  {dim.score}
                </div>
                {/* Segmented Bar */}
                <div style={{ display: 'flex', height: 6, gap: 2, borderRadius: 99, overflow: 'hidden', marginTop: 8 }}>
                  <div style={{ flex: dim.good, background: '#10B981' }} />
                  {dim.warn > 0 && <div style={{ flex: dim.warn, background: '#F59E0B' }} />}
                  {dim.crit > 0 && <div style={{ flex: dim.crit, background: '#EF4444' }} />}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>{dim.good}%</span>
                  {dim.warn > 0 && <span>{dim.warn}%</span>}
                  {dim.crit > 0 && <span>{dim.crit}%</span>}
                </div>
                <button
                  className="card-link"
                  style={{ marginTop: 8, fontSize: 11 }}
                  onClick={() => navigate(dim.route)}
                >
                  View details →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
