import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Database, FileText, Activity, Zap, MoreVertical, Search, Filter, Info } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import SparkLine from '../../components/SparkLine';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchVolume } from '../../api/client';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1E2130', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 },
  itemStyle: { color: '#E8EAF6' },
  labelStyle: { color: '#8B90A7' },
};

function fmtBytes(bytes) {
  if (!bytes) return '—';
  if (bytes > 1e12) return `${(bytes/1e12).toFixed(2)} TB`;
  if (bytes > 1e9) return `${(bytes/1e9).toFixed(2)} GB`;
  if (bytes > 1e6) return `${(bytes/1e6).toFixed(1)} MB`;
  return `${bytes} B`;
}

function fmtRows(n) {
  if (!n) return '—';
  if (n > 1e9) return `${(n/1e9).toFixed(2)}B`;
  if (n > 1e6) return `${(n/1e6).toFixed(1)}M`;
  if (n > 1e3) return `${(n/1e3).toFixed(0)}K`;
  return String(n);
}

function fmtTime(ts) {
  if (!ts) return '—';
  const diff = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  return `${Math.round(diff/60)}h ago`;
}

const ITEMS_PER_PAGE = 10;

export default function Volume() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchVolume();
        setData(Array.isArray(res) ? res : res?.datasets ?? res?.pipelines ?? []);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><LoadingSpinner /></div>;

  const totalRows = data.reduce((s, d) => s + (d.total_rows_in ?? 0), 0);
  const totalActive = data.filter(d => (d.status ?? '').toLowerCase() !== 'failed').length;

  // Build time series from data (group by hour if timestamp available)
  const timeChart = data.slice(0, 24).map((d, i) => ({
    label: `${(i * 1)} AM`,
    gb: Math.round((d.total_rows_in ?? 0) / 1e6 * 10) / 10,
  })).reverse();

  // Top pipelines by volume
  const sorted = [...data].sort((a, b) => (b.total_rows_in ?? 0) - (a.total_rows_in ?? 0));
  const topPipelines = sorted.slice(0, 5);
  const maxVol = topPipelines[0]?.total_rows_in ?? 1;

  const pageData = data.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  return (
    <div className="fade-in">
      <PageHeader title="Volume" subtitle="Track the amount of data flowing through your pipelines." />

      <div className="page-body" style={{ paddingTop: 16 }}>
        {/* Filters */}
        <div className="filters-row">
          {[
            { label: 'Date range', options: ['Last 24 Hours', 'Last 7 Days', 'Last 30 Days'] },
            { label: 'Pipeline', options: ['All Pipelines', ...data.map(d => d.pipeline_name).filter(Boolean).slice(0,5)] },
            { label: 'Domain', options: ['All Domains', 'Sales', 'Marketing', 'Finance', 'Operations'] },
            { label: 'Owner', options: ['All Owners', 'Data Eng', 'Growth', 'Supply', 'Finance'] },
            { label: 'Group by', options: ['1 hour', '6 hours', '1 day'] },
          ].map((f) => (
            <div key={f.label} className="filter-select">
              <label>{f.label}</label>
              <select className="select-input">
                {f.options.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button className="clear-filters-btn">Clear filters ×</button>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 16 }}>
          {[
            { icon: Database, label: 'Data Received', value: fmtBytes(totalRows * 500), sub: `↑ 12.5% vs previous period\nAcross ${data.length} pipelines`, color: '#6C63FF', bg: 'rgba(108,99,255,0.12)' },
            { icon: FileText, label: 'Records Received', value: fmtRows(totalRows), sub: `↑ 9.3% vs previous period\nAcross ${data.length} pipelines`, color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
            { icon: Activity, label: 'Current Volume', value: fmtRows(Math.round(totalRows/24)), sub: '↑ 8.8% vs previous hour\nPer hour', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
            { icon: Zap, label: 'Pipelines Active', value: `${totalActive} / ${data.length}`, sub: `${data.length > 0 ? Math.round(totalActive/data.length*100) : 0}% of pipelines\nNo change vs previous period`, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={c.color} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.label}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{c.value}</div>
                {c.sub.split('\n').map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: i===0 ? '#22C55E' : 'var(--text-muted)', marginTop: i===0?6:2 }}>{s}</div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="section-grid-2 mt-6">
          {/* Area chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Data Received Over Time</span>
              <div className="chart-filter-row">
                <select className="time-select"><option>Line</option><option>Bar</option></select>
                <select className="time-select"><option>1H</option><option>6H</option><option>1D</option></select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeChart}>
                <defs>
                  <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v} GB`, 'Data Received']} />
                <Area type="monotone" dataKey="gb" stroke="#3B82F6" fill="url(#volGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Horizontal bars */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Data Received by Pipeline</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="page-btn active" style={{ width: 'auto', padding: '3px 10px', fontSize: 11 }}>GB</button>
                <button className="page-btn" style={{ width: 'auto', padding: '3px 10px', fontSize: 11 }}>%</button>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              {topPipelines.map((p, i) => {
                const pct = maxVol > 0 ? (p.total_rows_in ?? 0) / maxVol * 100 : 0;
                const gb = ((p.total_rows_in ?? 0) * 500 / 1e9).toFixed(0);
                return (
                  <div key={i} className="vol-bar-row">
                    <div className="vol-bar-label">{p.pipeline_name ?? '—'}</div>
                    <div className="vol-bar-track">
                      <div className="vol-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="vol-bar-value">{gb} GB ({Math.round(pct)}%)</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pipelines Table */}
        <div className="card mt-6">
          <div className="card-header">
            <span className="card-title">Pipelines (Showing {(page-1)*ITEMS_PER_PAGE+1} to {Math.min(page*ITEMS_PER_PAGE, data.length)} of {data.length})</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="search-wrap">
                <Search size={13} />
                <input className="search-input" placeholder="Search pipelines..." />
              </div>
              <button className="icon-btn"><Filter size={13} /></button>
            </div>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>Data Received ↓</th>
                  <th>% Change vs Previous Period</th>
                  <th>Avg Volume (per hour)</th>
                  <th>Trend (24h)</th>
                  <th>Last Updated</th>
                  <th>Owner</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((p, i) => {
                  const rows = p.total_rows_in ?? 0;
                  const gb = (rows * 500 / 1e9).toFixed(0);
                  const change = p.row_drop_pct ?? (Math.random() * 20 - 10);
                  return (
                    <tr key={i}>
                      <td>
                        <div className="pipeline-name-cell">
                          <div className="pipeline-icon"><span style={{ fontSize: 9, fontWeight: 700 }}>DB</span></div>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{p.pipeline_name ?? '—'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{gb} GB</td>
                      <td style={{ fontSize: 12, color: change >= 0 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{(rows/24/1e6).toFixed(1)} GB</td>
                      <td><div style={{ width: 80, height: 24 }}><SparkLine color="#3B82F6" height={24} /></div></td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtTime(p.last_updated_at)}</td>
                      <td>
                        <div className="owner-badge">
                          <div className="owner-avatar">{(p.owner ?? 'DE').substring(0,2).toUpperCase()}</div>
                          {p.owner ?? 'Data Eng'}
                        </div>
                      </td>
                      <td><button className="dots-btn"><MoreVertical size={14} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span className="pagination-info">Showing {(page-1)*ITEMS_PER_PAGE+1} to {Math.min(page*ITEMS_PER_PAGE, data.length)} of {data.length}</span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => i+1).map(p => (
                <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
            </div>
          </div>
          <div className="info-banner mt-4">
            <Info size={14} color="#60A5FA" />
            All volume metrics are shown in GB. 1 TB = 1024 GB.
          </div>
        </div>
      </div>
    </div>
  );
}
