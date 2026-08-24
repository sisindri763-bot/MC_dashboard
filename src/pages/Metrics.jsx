import { useEffect, useState } from 'react';
import {
  Clock, Play, XCircle, CheckCircle, Activity,
  LineChart, Plus, RefreshCw, Download, Calendar, MoreVertical,
  ArrowUpRight, ArrowDownRight, Database
} from 'lucide-react';
import {
  LineChart as RechartsLineChart, Line, AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import PageHeader from '../components/PageHeader';
import SparkLine from '../components/SparkLine';
import LoadingSpinner from '../components/LoadingSpinner';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  itemStyle: { color: '#0F172A' },
  labelStyle: { color: '#64748B', fontWeight: 600 },
};

const MULTI_LINE_DURATION_DATA = [
  { time: '14:15', mysql: 650, postgres: 480, sqlserver: 900, oracle: 320, salesforce: 180 },
  { time: '14:17', mysql: 660, postgres: 470, sqlserver: 880, oracle: 310, salesforce: 190 },
  { time: '14:19', mysql: 680, postgres: 490, sqlserver: 920, oracle: 340, salesforce: 200 },
  { time: '14:21', mysql: 640, postgres: 460, sqlserver: 890, oracle: 300, salesforce: 185 },
  { time: '14:23', mysql: 670, postgres: 500, sqlserver: 910, oracle: 350, salesforce: 195 },
  { time: '14:25', mysql: 690, postgres: 510, sqlserver: 930, oracle: 360, salesforce: 210 },
  { time: '14:27', mysql: 660, postgres: 480, sqlserver: 890, oracle: 330, salesforce: 190 },
  { time: '14:29', mysql: 670, postgres: 490, sqlserver: 900, oracle: 340, salesforce: 200 },
];

const TOP_5_DURATION = [
  { rank: 1, name: 'sqlserver_to_synapse', duration: '8m 10s', color: '#F59E0B' },
  { rank: 2, name: 'oracle_to_snowflake', duration: '6m 45s', color: '#EF4444' },
  { rank: 3, name: 'mysql_to_snowflake', duration: '4m 12s', color: '#8B5CF6' },
  { rank: 4, name: 'postgres_to_bigquery', duration: '3m 45s', color: '#3B82F6' },
  { rank: 5, name: 'salesforce_to_snowflake', duration: '2m 30s', color: '#06B6D4' },
];

const SUCCESS_RATE_TIME = [
  { time: '14:15', rate: 96 },
  { time: '14:18', rate: 97.5 },
  { time: '14:20', rate: 98 },
  { time: '14:23', rate: 97.2 },
  { time: '14:25', rate: 98.4 },
  { time: '14:28', rate: 97.7 },
  { time: '14:30', rate: 97.7 },
];

const RUNS_STATUS_DONUT = [
  { name: 'Success', value: 125, color: '#10B981', pct: '97.7%' },
  { name: 'Failed', value: 3, color: '#EF4444', pct: '2.3%' },
  { name: 'Running', value: 0, color: '#F59E0B', pct: '0%' },
  { name: 'Cancelled', value: 0, color: '#94A3B8', pct: '0%' },
];

const DURATION_DISTRIBUTION = [
  { bucket: '0-1m', count: 10 },
  { bucket: '1-2m', count: 20 },
  { bucket: '2-3m', count: 30 },
  { bucket: '3-5m', count: 42 },
  { bucket: '5-10m', count: 35 },
  { bucket: '10-20m', count: 12 },
  { bucket: '20m+', count: 2 },
];

const LIVE_PIPELINE_METRICS = [
  { id: 1, name: 'mysql_to_snowflake', tool: 'Fivetran', status: 'Healthy', lastRun: '14:29:45', ago: '10 sec ago', duration: '4m 12s', successRate: 98.2, avgFreshness: '5 min', runFreq: '15.2 runs/hr' },
  { id: 2, name: 'postgres_to_bigquery', tool: 'Airbyte', status: 'Healthy', lastRun: '14:29:30', ago: '25 sec ago', duration: '3m 45s', successRate: 97.5, avgFreshness: '3 min', runFreq: '14.1 runs/hr' },
  { id: 3, name: 'sqlserver_to_synapse', tool: 'Azure Data Factory', status: 'Degraded', lastRun: '14:29:20', ago: '35 sec ago', duration: '8m 10s', successRate: 91.4, avgFreshness: '18 min', runFreq: '9.8 runs/hr' },
  { id: 4, name: 'oracle_to_snowflake', tool: 'Informatica', status: 'Failed', lastRun: '14:28:05', ago: '1m 50s ago', duration: '—', successRate: 0.0, avgFreshness: '—', runFreq: '0 runs/hr' },
  { id: 5, name: 'salesforce_to_snowflake', tool: 'Fivetran', status: 'Healthy', lastRun: '14:29:40', ago: '15 sec ago', duration: '2m 30s', successRate: 99.1, avgFreshness: '2 min', runFreq: '16.3 runs/hr' },
];

export default function Metrics() {
  const [chartType, setChartType] = useState('line');
  const [category, setCategory] = useState('All Categories');
  const [metric, setMetric] = useState('Pipeline Run Duration');
  const [groupBy, setGroupBy] = useState('Pipeline');
  const [pipeline, setPipeline] = useState('All Pipelines');
  const [tool, setTool] = useState('All Tools');

  return (
    <div className="fade-in">
      {/* Top Custom Header */}
      <header className="page-header">
        <div className="page-header-left">
          <h2>Metrics</h2>
          <p>Real-time metrics across your data platform</p>
        </div>

        <div className="page-header-right">
          <div className="header-btn">
            <select>
              <option>Production</option>
              <option>Staging</option>
            </select>
          </div>

          <div className="live-indicator">
            <span className="live-dot" />
            <span>Live 00:00:23</span>
          </div>

          <div className="header-btn">
            <Calendar size={13} style={{ color: 'var(--text-secondary)' }} />
            <span>Last 15 minutes</span>
          </div>

          <button className="header-btn" style={{ gap: 4 }}>
            <RefreshCw size={12} />
            <span>Auto refresh (10s)</span>
          </button>

          <button className="export-btn" onClick={() => window.print()}>
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </header>

      <div className="page-body">
        {/* Filters Bar */}
        <div className="filters-bar">
          <div className="filter-select">
            <label>Metric Category</label>
            <select className="select-control" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="All Categories">All Categories</option>
              <option value="Performance">Performance</option>
              <option value="Reliability">Reliability</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Metric</label>
            <select className="select-control" value={metric} onChange={e => setMetric(e.target.value)}>
              <option value="Pipeline Run Duration">Pipeline Run Duration</option>
              <option value="Success Rate">Success Rate</option>
              <option value="Throughput">Throughput</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Group By</label>
            <select className="select-control" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              <option value="Pipeline">Pipeline</option>
              <option value="Tool">Tool</option>
              <option value="Source">Source</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Pipelines</label>
            <select className="select-control" value={pipeline} onChange={e => setPipeline(e.target.value)}>
              <option value="All Pipelines">All Pipelines</option>
              <option value="mysql_to_snowflake">mysql_to_snowflake</option>
              <option value="postgres_to_bigquery">postgres_to_bigquery</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Tools</label>
            <select className="select-control" value={tool} onChange={e => setTool(e.target.value)}>
              <option value="All Tools">All Tools</option>
              <option value="Fivetran">Fivetran</option>
              <option value="Airbyte">Airbyte</option>
              <option value="Azure Data Factory">Azure Data Factory</option>
              <option value="Informatica">Informatica</option>
            </select>
          </div>

          <button className="clear-filters-btn" style={{ marginLeft: 'auto' }}>
            Reset
          </button>
          <button className="header-btn" style={{ height: 32 }}>
            Save View
          </button>
          <button className="export-btn" style={{ height: 32, padding: '4px 12px' }}>
            <Plus size={13} /> Add to Dashboard
          </button>
        </div>

        {/* 6 Top KPI Cards (Matches Screenshot Exactly) */}
        <div className="kpi-grid-6">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <Clock size={16} />
              </div>
              <span className="kpi-label">Average Duration</span>
            </div>
            <div className="kpi-value">4m 32s</div>
            <div className="kpi-delta up">
              <ArrowDownRight size={12} />
              <span>↓ 12% vs 15m ago</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#10B981" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <Play size={16} />
              </div>
              <span className="kpi-label">Runs (15m)</span>
            </div>
            <div className="kpi-value">128</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={12} />
              <span>↑ 18% vs 15m ago</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#10B981" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                <XCircle size={16} />
              </div>
              <span className="kpi-label">Failed Runs (15m)</span>
            </div>
            <div className="kpi-value">3</div>
            <div className="kpi-delta up">
              <ArrowDownRight size={12} />
              <span>↓ 40% vs 15m ago</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#EF4444" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <CheckCircle size={16} />
              </div>
              <span className="kpi-label">Success Rate (15m)</span>
            </div>
            <div className="kpi-value">97.7%</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={12} />
              <span>↑ 2.1% vs 15m ago</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#10B981" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Clock size={16} />
              </div>
              <span className="kpi-label">Avg Freshness (15m)</span>
            </div>
            <div className="kpi-value">5m</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={12} />
              <span>↑ 8% vs 15m ago</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#3B82F6" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
                <Activity size={16} />
              </div>
              <span className="kpi-label">Avg Run Frequency</span>
            </div>
            <div className="kpi-value">12.8 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>runs/hr</span></div>
            <div className="kpi-delta up">
              <ArrowUpRight size={12} />
              <span>↑ 5% vs 15m ago</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#F59E0B" />
            </div>
          </div>
        </div>

        {/* 2 Middle Duration Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginTop: 14 }}>
          {/* Multi-Line Duration Chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pipeline Run Duration (seconds) ⓘ</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                  <button
                    style={{ padding: '3px 8px', fontSize: 11, background: chartType === 'line' ? '#10B981' : 'transparent', color: chartType === 'line' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer' }}
                    onClick={() => setChartType('line')}
                  >
                    Line
                  </button>
                  <button
                    style={{ padding: '3px 8px', fontSize: 11, background: chartType === 'area' ? '#10B981' : 'transparent', color: chartType === 'area' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer' }}
                    onClick={() => setChartType('area')}
                  >
                    Area
                  </button>
                </div>
                <select className="select-control" style={{ minWidth: 80, padding: '2px 6px', fontSize: 11 }}>
                  <option>1 minute</option>
                  <option>5 minutes</option>
                </select>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={210}>
              <RechartsLineChart data={MULTI_LINE_DURATION_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 1200]} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} unit="s" />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="sqlserver" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="mysql" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="postgres" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="oracle" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="salesforce" stroke="#06B6D4" strokeWidth={2} dot={{ r: 2 }} />
              </RechartsLineChart>
            </ResponsiveContainer>

            <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B5CF6' }} /> mysql_to_snowflake
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} /> postgres_to_bigquery
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} /> sqlserver_to_synapse
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} /> oracle_to_snowflake
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06B6D4' }} /> salesforce_to_snowflake
              </span>
            </div>
          </div>

          {/* Top 5 Pipelines by Duration */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top 5 Pipelines by Duration ⓘ</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Avg Duration ▾</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TOP_5_DURATION.map((p) => (
                <div key={p.rank} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{p.rank}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{p.duration}</span>
                    <div style={{ width: 45, height: 16 }}>
                      <SparkLine color={p.color} height={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3 Lower Charts */}
        <div className="grid-3 mt-4">
          {/* Chart 1: Success Rate Over Time */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Success Rate Over Time (%) ⓘ</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>Avg: 97.7%</span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={SUCCESS_RATE_TIME}>
                <defs>
                  <linearGradient id="metricSuccessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fill: '#94A3B8', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={v => [`${v}%`, 'Success Rate']} />
                <Area type="monotone" dataKey="rate" stroke="#10B981" fill="url(#metricSuccessGrad)" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Runs by Status (Donut) */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Runs by Status (15m) ⓘ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 150 }}>
              <div style={{ position: 'relative', width: 120, height: 120 }}>
                <PieChart width={120} height={120}>
                  <Pie data={RUNS_STATUS_DONUT} cx={60} cy={60} innerRadius={40} outerRadius={55} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                    {RUNS_STATUS_DONUT.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="donut-center-label">
                  <div style={{ fontSize: 16, fontWeight: 800 }}>128</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Total</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {RUNS_STATUS_DONUT.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, fontSize: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color }} />
                      <span>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{d.value} ({d.pct})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 3: Duration Distribution Histogram */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pipeline Duration Distribution ⓘ</span>
              <select className="select-control" style={{ minWidth: 85, padding: '2px 6px', fontSize: 11 }}>
                <option>All Pipelines</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={DURATION_DISTRIBUTION} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fill: '#94A3B8', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#10B981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Pipeline Metrics Table */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Live Pipeline Metrics ⓘ</span>
            <div className="search-box">
              <input type="text" placeholder="Search pipelines..." style={{ width: 180, height: 30 }} />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="vithi-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Pipeline</th>
                  <th>Tool</th>
                  <th>Status</th>
                  <th>Last Run</th>
                  <th>Duration</th>
                  <th>Success Rate (15m)</th>
                  <th>Avg Freshness</th>
                  <th>Run Frequency</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {LIVE_PIPELINE_METRICS.map(p => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>
                      <div className="tool-badge">
                        <Database size={13} color="#10B981" />
                        <span>{p.tool}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.lastRun}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.ago}</div>
                    </td>
                    <td style={{ fontSize: 12.5, fontWeight: 500 }}>{p.duration}</td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.successRate}%</div>
                      <div className="progress-track">
                        <div
                          className={`progress-fill ${p.successRate > 95 ? 'green' : p.successRate > 80 ? 'orange' : 'red'}`}
                          style={{ width: `${p.successRate}%` }}
                        />
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5, fontWeight: 500 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        {p.avgFreshness !== '—' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />}
                        {p.avgFreshness}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, fontWeight: 500 }}>{p.runFreq}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="icon-btn" style={{ width: 28, height: 28 }}>
                        <MoreVertical size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <span>Showing 1 to 5 of 42 pipelines</span>
            <div className="pagination-pages">
              <button className="pagination-btn" disabled>‹</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <span style={{ padding: '0 4px' }}>...</span>
              <button className="pagination-btn">9</button>
              <button className="pagination-btn">›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
