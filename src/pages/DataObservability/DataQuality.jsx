import { useEffect, useState, useMemo } from 'react';
import {
  Shield, CheckCircle, AlertTriangle, XCircle, Search, Filter,
  MoreVertical, ArrowUpRight, Database
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import PageHeader from '../../components/PageHeader';
import SparkLine from '../../components/SparkLine';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchDataQuality } from '../../api/client';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  itemStyle: { color: '#0F172A' },
  labelStyle: { color: '#64748B', fontWeight: 600 },
};

const DEFAULT_PIPELINES_QUALITY = [
  { id: 1, name: 'orders_fact', score: 96, status: 'Good', checks: 210, failedChecks: '2 (1%)', lastCheck: '1 min ago', owner: 'DE', ownerName: 'Data Eng', trendColor: '#10B981' },
  { id: 2, name: 'user_events_stream', score: 93, status: 'Good', checks: 180, failedChecks: '3 (2%)', lastCheck: '1 min ago', owner: 'GR', ownerName: 'Growth', trendColor: '#10B981' },
  { id: 3, name: 'inventory_snapshot', score: 85, status: 'Warning', checks: 156, failedChecks: '12 (8%)', lastCheck: '5 min ago', owner: 'SU', ownerName: 'Supply', trendColor: '#F59E0B' },
  { id: 4, name: 'payments_ledger', score: 91, status: 'Good', checks: 178, failedChecks: '5 (3%)', lastCheck: '2 min ago', owner: 'FI', ownerName: 'Finance', trendColor: '#10B981' },
  { id: 5, name: 'marketing_attribution', score: 78, status: 'Poor', checks: 132, failedChecks: '18 (14%)', lastCheck: '6 min ago', owner: 'MA', ownerName: 'Marketing', trendColor: '#EF4444' },
];

const TIME_CHART_DATA = [
  { time: '12 AM', score: 72 },
  { time: '2 AM', score: 74 },
  { time: '4 AM', score: 73 },
  { time: '6 AM', score: 76 },
  { time: '8 AM', score: 75 },
  { time: '10 AM', score: 78 },
  { time: '12 PM', score: 77 },
  { time: '2 PM', score: 82 },
  { time: '4 PM', score: 80 },
  { time: '6 PM', score: 81 },
  { time: '8 PM', score: 79 },
];

const DONUT_DATA = [
  { name: 'Passed', value: 1592, color: '#10B981', pct: '92%' },
  { name: 'Warning', value: 98, color: '#F59E0B', pct: '6%' },
  { name: 'Failed', value: 40, color: '#EF4444', pct: '2%' },
];

export default function DataQuality() {
  const [pipelineFilter, setPipelineFilter] = useState('All Pipelines');
  const [domainFilter, setDomainFilter] = useState('All Domains');
  const [ownerFilter, setOwnerFilter] = useState('All Owners');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState(DEFAULT_PIPELINES_QUALITY);

  const clearFilters = () => {
    setPipelineFilter('All Pipelines');
    setDomainFilter('All Domains');
    setOwnerFilter('All Owners');
    setPage(1);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchOwner = ownerFilter === 'All Owners' || item.owner === ownerFilter;
      return matchOwner;
    });
  }, [items, ownerFilter]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Data Quality"
        subtitle="Real-time view of data quality across your pipelines."
      />

      <div className="page-body">
        {/* Top Filter Bar */}
        <div className="filters-bar">
          <div className="filter-select">
            <label>Pipeline</label>
            <select className="select-control" value={pipelineFilter} onChange={e => setPipelineFilter(e.target.value)}>
              <option value="All Pipelines">All Pipelines</option>
              <option value="orders_fact">orders_fact</option>
              <option value="user_events_stream">user_events_stream</option>
              <option value="inventory_snapshot">inventory_snapshot</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Domain</label>
            <select className="select-control" value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
              <option value="All Domains">All Domains</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Owner</label>
            <select className="select-control" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
              <option value="All Owners">All Owners</option>
              <option value="DE">Data Eng (DE)</option>
              <option value="GR">Growth (GR)</option>
              <option value="SU">Supply (SU)</option>
              <option value="FI">Finance (FI)</option>
              <option value="MA">Marketing (MA)</option>
            </select>
          </div>

          <button className="clear-filters-btn" style={{ marginLeft: 'auto' }} onClick={clearFilters}>
            Clear filters ✕
          </button>
        </div>

        {/* 5 KPI Cards */}
        <div className="kpi-grid-5">
          {/* Quality Status with Gauge */}
          <div className="kpi-card">
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Quality Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
              <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
                <PieChart width={60} height={60}>
                  <Pie
                    data={[{ value: 92 }, { value: 8 }]}
                    cx={30} cy={30} innerRadius={20} outerRadius={28}
                    startAngle={90} endAngle={-270} strokeWidth={0} dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#E2E8F0" />
                  </Pie>
                </PieChart>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 800, fontSize: 14 }}>
                  92%
                </div>
              </div>
              <div>
                <div className="status-pill good" style={{ padding: '2px 8px', fontSize: 11 }}>Good</div>
                <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 4 }}>
                  ↑ 2% vs yesterday
                </div>
              </div>
            </div>
            <div className="sparkline-container" style={{ height: 26, marginTop: 4 }}>
              <SparkLine color="#10B981" height={26} />
            </div>
          </div>

          {/* Checks Run */}
          <div className="kpi-card">
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Checks Run</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>1,730</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Last updated: 1 min ago</div>
            <div className="sparkline-container" style={{ height: 26, marginTop: 6 }}>
              <SparkLine color="#3B82F6" height={26} />
            </div>
          </div>

          {/* Passed */}
          <div className="kpi-card">
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Passed</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
              1,592 <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>(92%)</span>
            </div>
            <div className="progress-track" style={{ marginTop: 12, height: 6 }}>
              <div className="progress-fill green" style={{ width: '92%' }} />
            </div>
          </div>

          {/* Warning */}
          <div className="kpi-card">
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Warning</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B', marginTop: 4 }}>
              98 <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>(6%)</span>
            </div>
            <div className="progress-track" style={{ marginTop: 12, height: 6 }}>
              <div className="progress-fill orange" style={{ width: '6%' }} />
            </div>
          </div>

          {/* Failed */}
          <div className="kpi-card">
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Failed</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#EF4444', marginTop: 4 }}>
              40 <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>(2%)</span>
            </div>
            <div className="progress-track" style={{ marginTop: 12, height: 6 }}>
              <div className="progress-fill red" style={{ width: '2%' }} />
            </div>
          </div>
        </div>

        {/* 2 Middle Charts */}
        <div className="grid-2 mt-4">
          {/* Chart 1: Quality Score Over Time */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Quality Score Over Time ⓘ</span>
              <select className="select-control" style={{ minWidth: 110 }}>
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={TIME_CHART_DATA}>
                <defs>
                  <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={v => [`${v}%`, 'Quality Score']} />
                <Area type="monotone" dataKey="score" stroke="#6366F1" fill="url(#qGrad)" strokeWidth={2} dot={{ fill: '#6366F1', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Checks by Status (Donut) */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Checks by Status ⓘ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 190 }}>
              <div style={{ position: 'relative', width: 170, height: 170 }}>
                <PieChart width={170} height={170}>
                  <Pie
                    data={DONUT_DATA}
                    cx={85} cy={85} innerRadius={55} outerRadius={78}
                    startAngle={90} endAngle={-270} strokeWidth={0} dataKey="value"
                  >
                    {DONUT_DATA.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="donut-center-label">
                  <div className="big">1,730</div>
                  <div className="small">Total Checks</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {DONUT_DATA.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {d.value.toLocaleString()} ({d.pct})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Table: Top Pipelines by Quality Score */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Top Pipelines by Quality Score</span>
          </div>

          <div className="table-wrapper">
            <table className="vithi-table">
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>Quality Score</th>
                  <th>Status</th>
                  <th>Checks Run</th>
                  <th>Failed Checks</th>
                  <th>Last Check</th>
                  <th>Trend (24h)</th>
                  <th>Owner</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Database size={15} color="#3B82F6" />
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: p.score >= 90 ? '#10B981' : p.score >= 80 ? '#F59E0B' : '#EF4444' }}>
                      {p.score}%
                    </td>
                    <td>
                      <span className={`status-pill ${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.checks}</td>
                    <td style={{ color: p.failedChecks.startsWith('0') ? 'inherit' : '#EF4444', fontWeight: 600 }}>
                      {p.failedChecks}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.lastCheck}</td>
                    <td style={{ width: 90 }}>
                      <div style={{ width: 75, height: 22 }}>
                        <SparkLine color={p.trendColor} height={20} />
                      </div>
                    </td>
                    <td>
                      <div className="owner-chip">
                        <div className={`owner-circle ${p.owner.toLowerCase()}`}>{p.owner}</div>
                        <span>{p.ownerName}</span>
                      </div>
                    </td>
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

          {/* Pagination */}
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
              <select className="select-control" style={{ marginLeft: 8, padding: '4px 8px' }}>
                <option>5 / page</option>
                <option>10 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
