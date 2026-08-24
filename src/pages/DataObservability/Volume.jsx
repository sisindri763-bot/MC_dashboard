import { useEffect, useState, useMemo } from 'react';
import {
  Database, FileText, TrendingUp, Activity, Search, Filter,
  MoreVertical, ArrowUpRight, ArrowDownRight, Calendar, Info
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import PageHeader from '../../components/PageHeader';
import SparkLine from '../../components/SparkLine';
import LoadingSpinner from '../../components/LoadingSpinner';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  itemStyle: { color: '#0F172A' },
  labelStyle: { color: '#64748B', fontWeight: 600 },
};

const VOLUME_OVER_TIME = [
  { time: '12 AM', gb: 310 },
  { time: '2 AM', gb: 260 },
  { time: '4 AM', gb: 330 },
  { time: '6 AM', gb: 320 },
  { time: '8 AM', gb: 440 },
  { time: '10 AM', gb: 680 },
  { time: '12 PM', gb: 520 },
  { time: '2 PM', gb: 420 },
  { time: '4 PM', gb: 490 },
  { time: '6 PM', gb: 390 },
  { time: '8 PM', gb: 450 },
];

const TOP_VOLUME_PIPELINES = [
  { name: 'orders_fact', gb: 620, pct: 25 },
  { name: 'user_events_stream', gb: 410, pct: 17 },
  { name: 'inventory_snapshot', gb: 280, pct: 11 },
  { name: 'payments_ledger', gb: 210, pct: 8 },
  { name: 'marketing_attribution', gb: 120, pct: 5 },
];

const DEFAULT_VOLUME_TABLE = [
  { id: 1, name: 'orders_fact', dataReceived: '620 GB', change: '+14.7%', isUp: true, avgVol: '25.8 GB', updated: '2 min ago', owner: 'DE', ownerName: 'Data Eng' },
  { id: 2, name: 'user_events_stream', dataReceived: '410 GB', change: '+9.1%', isUp: true, avgVol: '17.1 GB', updated: '1 min ago', owner: 'GR', ownerName: 'Growth' },
  { id: 3, name: 'inventory_snapshot', dataReceived: '280 GB', change: '-5.3%', isUp: false, avgVol: '11.6 GB', updated: '42 min ago', owner: 'SU', ownerName: 'Supply' },
  { id: 4, name: 'payments_ledger', dataReceived: '210 GB', change: '+6.8%', isUp: true, avgVol: '8.7 GB', updated: '4 min ago', owner: 'FI', ownerName: 'Finance' },
  { id: 5, name: 'marketing_attribution', dataReceived: '120 GB', change: '-2.2%', isUp: false, avgVol: '5.0 GB', updated: '3 hr ago', owner: 'MA', ownerName: 'Marketing' },
];

export default function Volume() {
  const [pipelineFilter, setPipelineFilter] = useState('All Pipelines');
  const [domainFilter, setDomainFilter] = useState('All Domains');
  const [ownerFilter, setOwnerFilter] = useState('All Owners');
  const [groupBy, setGroupBy] = useState('1 hour');
  const [search, setSearch] = useState('');
  const [viewUnit, setViewUnit] = useState('GB');

  const clearFilters = () => {
    setPipelineFilter('All Pipelines');
    setDomainFilter('All Domains');
    setOwnerFilter('All Owners');
    setGroupBy('1 hour');
    setSearch('');
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Volume"
        subtitle="Track the amount of data flowing through your pipelines."
      />

      <div className="page-body">
        {/* Filters Bar */}
        <div className="filters-bar">
          <div className="filter-select">
            <label>Date range</label>
            <div className="header-btn" style={{ padding: '6px 10px', height: 32 }}>
              <span>May 11, 2024 12:00 AM – May 11, 2024 11:59 PM</span>
              <Calendar size={12} style={{ color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <div className="filter-select">
            <label>Pipeline</label>
            <select className="select-control" value={pipelineFilter} onChange={e => setPipelineFilter(e.target.value)}>
              <option value="All Pipelines">All Pipelines</option>
              <option value="orders_fact">orders_fact</option>
              <option value="user_events_stream">user_events_stream</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Domain</label>
            <select className="select-control" value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
              <option value="All Domains">All Domains</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Owner</label>
            <select className="select-control" value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
              <option value="All Owners">All Owners</option>
              <option value="DE">Data Eng (DE)</option>
              <option value="GR">Growth (GR)</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Group by</label>
            <select className="select-control" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              <option value="1 hour">1 hour</option>
              <option value="6 hours">6 hours</option>
              <option value="1 day">1 day</option>
            </select>
          </div>

          <button className="clear-filters-btn" style={{ marginLeft: 'auto', marginTop: 14 }} onClick={clearFilters}>
            Clear filters ✕
          </button>
        </div>

        {/* 4 KPI Cards */}
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Database size={18} />
              </div>
              <span className="kpi-label">Data Received</span>
            </div>
            <div className="kpi-value">2.45 TB</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>↑ 12.5% vs previous period</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Across 42 pipelines</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <FileText size={18} />
              </div>
              <span className="kpi-label">Records Received</span>
            </div>
            <div className="kpi-value">2.1B</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>↑ 9.3% vs previous period</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Across 42 pipelines</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
                <TrendingUp size={18} />
              </div>
              <span className="kpi-label">Current Volume</span>
            </div>
            <div className="kpi-value">28.6M <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>records</span></div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>↑ 8.8% vs previous hour</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Per hour</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#F5F3FF', color: '#8B5CF6' }}>
                <Activity size={18} />
              </div>
              <span className="kpi-label">Pipelines Active</span>
            </div>
            <div className="kpi-value">38 / 42</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>
              90% of pipelines
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>No change vs previous period</div>
          </div>
        </div>

        {/* 2 Middle Charts */}
        <div className="grid-2 mt-4">
          {/* Chart 1: Data Received Over Time */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Data Received Over Time ⓘ</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <select className="select-control" style={{ minWidth: 70, padding: '3px 8px' }}>
                  <option>Line</option>
                  <option>Bar</option>
                </select>
                <select className="select-control" style={{ minWidth: 60, padding: '3px 8px' }}>
                  <option>1H</option>
                  <option>6H</option>
                  <option>1D</option>
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={VOLUME_OVER_TIME}>
                <defs>
                  <linearGradient id="volBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 800]} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} unit=" GB" />
                <Tooltip {...TOOLTIP_STYLE} formatter={v => [`${v} GB`, 'Data Received']} />
                <Area type="monotone" dataKey="gb" stroke="#3B82F6" fill="url(#volBlue)" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Data Received by Pipeline (Horizontal Bars) */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Data Received by Pipeline ⓘ</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  className={`pagination-btn ${viewUnit === 'GB' ? 'active' : ''}`}
                  style={{ minWidth: 32, height: 24, fontSize: 11 }}
                  onClick={() => setViewUnit('GB')}
                >
                  GB
                </button>
                <button
                  className={`pagination-btn ${viewUnit === '%' ? 'active' : ''}`}
                  style={{ minWidth: 32, height: 24, fontSize: 11 }}
                  onClick={() => setViewUnit('%')}
                >
                  %
                </button>
                <button className="icon-btn" style={{ width: 24, height: 24 }}>
                  <MoreVertical size={12} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
              {TOP_VOLUME_PIPELINES.map((p) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 140, fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div style={{ flex: 1, height: 10, background: '#EFF6FF', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${p.pct * 3}%`, height: '100%', background: '#3B82F6', borderRadius: 99 }} />
                  </div>
                  <div style={{ width: 90, textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {viewUnit === 'GB' ? `${p.gb} GB (${p.pct}%)` : `${p.pct}%`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Pipelines Table */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Pipelines (Showing 1 to 5 of 42)</span>
            <div className="search-box">
              <Search size={13} />
              <input
                type="text"
                placeholder="Search pipelines..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 180, height: 30 }}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="vithi-table">
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>Data Received ↓</th>
                  <th>% Change vs Previous Period</th>
                  <th>Avg Volume (per hour)</th>
                  <th>Trend (24h)</th>
                  <th>Last Updated</th>
                  <th>Owner</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {DEFAULT_VOLUME_TABLE.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Database size={15} color="#3B82F6" />
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.dataReceived}</td>
                    <td style={{ color: p.isUp ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                      {p.isUp ? <ArrowUpRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> : <ArrowDownRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />}
                      {p.change}
                    </td>
                    <td style={{ fontSize: 12.5 }}>{p.avgVol}</td>
                    <td style={{ width: 90 }}>
                      <div style={{ width: 75, height: 22 }}>
                        <SparkLine color="#3B82F6" height={20} />
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.updated}</td>
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
              <button className="pagination-btn">6</button>
              <button className="pagination-btn">›</button>
              <select className="select-control" style={{ marginLeft: 8, padding: '4px 8px' }}>
                <option>10 / page</option>
                <option>25 / page</option>
              </select>
            </div>
          </div>

          {/* Notice info banner */}
          <div className="info-notice">
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>All volume metrics are shown in GB. 1 TB = 1024 GB.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
