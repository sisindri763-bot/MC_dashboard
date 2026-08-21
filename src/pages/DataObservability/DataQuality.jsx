import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, MoreVertical } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import SparkLine from '../../components/SparkLine';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchDataQuality } from '../../api/client';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1E2130', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 },
  itemStyle: { color: '#E8EAF6' },
};

function fmtTime(ts) {
  if (!ts) return '—';
  const diff = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  return `${Math.round(diff/60)}h ago`;
}

const ITEMS_PER_PAGE = 5;

export default function DataQuality() {
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchDataQuality({ limit: 100 });
        setChecks(Array.isArray(res) ? res : res?.checks ?? res?.results ?? []);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><LoadingSpinner /></div>;

  const total = checks.length;
  const passed = checks.filter(c => (c.status ?? '').toLowerCase() === 'passed' || (c.error_count ?? 0) === 0).length;
  const failed = checks.filter(c => (c.status ?? '').toLowerCase() === 'failed' || (c.error_count ?? 0) > 0).length;
  const warning = total - passed - failed;
  const qualityScore = total > 0 ? Math.round(passed / total * 100) : 0;

  // Group by pipeline
  const byPipeline = {};
  checks.forEach(c => {
    const name = c.pipeline_name ?? 'Unknown';
    if (!byPipeline[name]) byPipeline[name] = { name, total: 0, passed: 0, failed: 0, checks: [] };
    byPipeline[name].total++;
    if ((c.status ?? '').toLowerCase() === 'passed' || (c.error_count ?? 0) === 0) byPipeline[name].passed++;
    else byPipeline[name].failed++;
    byPipeline[name].checks.push(c);
  });

  const pipelineRows = Object.values(byPipeline)
    .sort((a, b) => (b.passed/Math.max(b.total,1)) - (a.passed/Math.max(a.total,1)));
  const pageData = pipelineRows.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);
  const totalPages = Math.ceil(pipelineRows.length / ITEMS_PER_PAGE);

  // Chart data (simulate over time)
  const timeData = Array.from({ length: 13 }, (_, i) => ({
    label: i === 0 ? '12 AM' : i === 6 ? '12 PM' : `${i*2} AM`,
    rate: 75 + Math.random() * 20,
  }));

  const donutData = [
    { name: 'Passed', value: passed, color: '#22C55E' },
    { name: 'Warning', value: warning, color: '#F59E0B' },
    { name: 'Failed', value: failed, color: '#EF4444' },
  ];

  return (
    <div className="fade-in">
      <PageHeader title="Data Quality" subtitle="Real-time view of data quality across your pipelines." />

      <div className="page-body" style={{ paddingTop: 16 }}>
        {/* Filters */}
        <div className="filters-row">
          {['Pipeline', 'Domain', 'Owner'].map(f => (
            <div key={f} className="filter-select">
              <label>{f}</label>
              <select className="select-input"><option>All {f}s</option></select>
            </div>
          ))}
          <button className="clear-filters-btn" style={{ marginTop: 18 }}>Clear filters ×</button>
        </div>

        {/* KPI Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginTop: 16 }}>
          {[
            { label: 'Quality Status', value: `${qualityScore}%`, sub: `↑ 2% vs yesterday`, highlight: '#22C55E', showDonut: true },
            { label: 'Checks Run', value: total.toLocaleString(), sub: 'Last updated: 1 min ago', highlight: null },
            { label: 'Passed', value: `${passed.toLocaleString()} (${qualityScore}%)`, sub: null, highlight: '#22C55E', bar: qualityScore },
            { label: 'Warning', value: `${warning} (${total>0?Math.round(warning/total*100):0}%)`, sub: null, highlight: '#F59E0B', bar: total>0?Math.round(warning/total*100):0 },
            { label: 'Failed', value: `${failed} (${total>0?Math.round(failed/total*100):0}%)`, sub: null, highlight: '#EF4444', bar: total>0?Math.round(failed/total*100):0 },
          ].map((c) => (
            <div key={c.label} className="card">
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: c.showDonut ? 18 : 22, fontWeight: 800, color: c.highlight ?? 'var(--text-primary)' }}>{c.value}</div>
              {c.sub && <div style={{ fontSize: 11, color: '#22C55E', marginTop: 4 }}>{c.sub}</div>}
              {c.bar != null && (
                <div style={{ marginTop: 10, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99 }}>
                  <div style={{ width: `${c.bar}%`, height: '100%', background: c.highlight, borderRadius: 99 }} />
                </div>
              )}
              {c.showDonut && <div className="sparkline-wrap mt-4"><SparkLine color="#6C63FF" /></div>}
              {!c.showDonut && !c.bar && <div className="sparkline-wrap mt-4"><SparkLine color={c.highlight ?? '#6C63FF'} /></div>}
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="section-grid-2 mt-6">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Quality Score Over Time</span>
              <select className="time-select"><option>Last 24 Hours</option></select>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="qualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} formatter={v=>[`${parseFloat(v).toFixed(1)}%`]} />
                <Area type="monotone" dataKey="rate" stroke="#6C63FF" fill="url(#qualGrad)" strokeWidth={2} dot={{ fill: '#6C63FF', r: 3, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Checks by Status</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ position: 'relative' }}>
                <PieChart width={200} height={200}>
                  <Pie data={donutData} cx={95} cy={95} innerRadius={60} outerRadius={85}
                    dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{total.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total Checks</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {donutData.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color }} />
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {d.value.toLocaleString()} ({total > 0 ? Math.round(d.value/total*100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Pipelines Table */}
        <div className="card mt-6">
          <div className="card-header">
            <span className="card-title">Top Pipelines by Quality Score</span>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((p, i) => {
                  const score = p.total > 0 ? Math.round(p.passed/p.total*100) : 0;
                  const status = score >= 90 ? 'Good' : score >= 70 ? 'Warning' : 'Poor';
                  const failPct = p.total > 0 ? Math.round(p.failed/p.total*100) : 0;
                  return (
                    <tr key={i}>
                      <td>
                        <div className="pipeline-name-cell">
                          <div className="pipeline-icon"><Shield size={12} /></div>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 700, color: score>=90?'#22C55E':score>=70?'#F59E0B':'#EF4444' }}>{score}%</td>
                      <td><StatusBadge status={status} /></td>
                      <td style={{ fontSize: 12 }}>{p.total}</td>
                      <td style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>{p.failed} ({failPct}%)</td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>1 min ago</td>
                      <td><div style={{ width: 80, height: 24 }}><SparkLine color={score>=90?'#22C55E':score>=70?'#F59E0B':'#EF4444'} height={24} /></div></td>
                      <td>
                        <div className="owner-badge">
                          <div className="owner-avatar">DE</div>
                          Data Eng
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
            <span className="pagination-info">Showing 1 to {Math.min(ITEMS_PER_PAGE, pipelineRows.length)} of {pipelineRows.length} pipelines</span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => i+1).map(p => (
                <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
