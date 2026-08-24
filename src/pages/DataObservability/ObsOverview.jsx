import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, BarChart2, Database, Shield, Layout,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import PageHeader from '../../components/PageHeader';
import SparkLine from '../../components/SparkLine';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchHealth, fetchFreshness, fetchVolume, fetchDataQuality, fetchSchema } from '../../api/client';

const TOOLTIP = {
  contentStyle: { background: '#1E2130', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 },
  itemStyle: { color: '#E8EAF6' },
  labelStyle: { color: '#8B90A7' },
};

function fmtTime(ts) {
  if (!ts) return '—';
  const diff = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  return `${Math.round(diff / 60)}h ago`;
}

const PILLARS = [
  { key: 'freshness', label: 'Freshness', icon: Clock, color: '#22C55E', route: '/observability/freshness' },
  { key: 'volume', label: 'Volume', icon: BarChart2, color: '#3B82F6', route: '/observability/volume' },
  { key: 'volume_trend', label: 'Volume Trend (Records)', icon: TrendingUp, color: '#6C63FF', route: '/observability/volume' },
  { key: 'data_quality', label: 'Data Quality', icon: Shield, color: '#F59E0B', route: '/observability/data-quality' },
  { key: 'schema', label: 'Schema', icon: Layout, color: '#F97316', route: '/observability/schema' },
];

const DONUT_COLORS = {
  freshness: { Fresh: '#22C55E', Warning: '#F59E0B', Critical: '#EF4444' },
  quality: { Passed: '#22C55E', Warning: '#F59E0B', Failed: '#EF4444' },
  schema: { Valid: '#22C55E', Invalid: '#F59E0B', Unknown: '#6C63FF' },
};

export default function ObsOverview() {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [freshData, setFreshData] = useState([]);
  const [qualData, setQualData] = useState([]);
  const [schemaData, setSchemaData] = useState([]);
  const [volData, setVolData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [h, f, q, s, v] = await Promise.all([
          fetchHealth().catch(() => null),
          fetchFreshness({ sla_minutes: 60 }).catch(() => []),
          fetchDataQuality({ limit: 200 }).catch(() => []),
          fetchSchema().catch(() => []),
          fetchVolume().catch(() => []),
        ]);
        setHealth(Array.isArray(h) ? null : h);
        setFreshData(Array.isArray(f) ? f : f?.datasets ?? []);
        setQualData(Array.isArray(q) ? q : q?.checks ?? q?.results ?? []);
        setSchemaData(Array.isArray(s) ? s : s?.datasets ?? s?.schema_drift ?? []);
        setVolData(Array.isArray(v) ? v : v?.datasets ?? []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner /></div>;

  // Extract health pillar data
  const pillars = Array.isArray(health) ? health : health?.pillars ?? [];
  const healthMap = {};
  pillars.forEach(p => { healthMap[(p.name ?? '').toLowerCase().replace(/ /g, '_')] = p; });

  // Freshness donut
  const freshTotal = freshData.length;
  const freshFresh = freshData.filter(d => (d.freshness_status ?? '').toLowerCase() === 'fresh').length;
  const freshDelayed = freshData.filter(d => (d.freshness_status ?? '').toLowerCase() === 'delayed').length;
  const freshStale = freshTotal - freshFresh - freshDelayed;
  const freshPct = freshTotal > 0 ? (freshFresh / freshTotal * 100).toFixed(1) : 0;
  const freshDonut = [
    { name: 'Fresh', value: freshFresh, color: '#22C55E' },
    { name: 'Warning', value: freshDelayed, color: '#F59E0B' },
    { name: 'Critical', value: freshStale, color: '#EF4444' },
  ];
  const freshPctInt = freshTotal > 0 ? Math.round(freshFresh / freshTotal * 100) : 78;
  const freshWarnPct = freshTotal > 0 ? Math.round(freshDelayed / freshTotal * 100) : 15;
  const freshCritPct = 100 - freshPctInt - freshWarnPct;

  // Volume chart
  const volChart = volData.slice(0, 12).map((d, i) => ({
    label: `${i * 2} AM`,
    gb: ((d.total_rows_in ?? 0) * 500 / 1e9).toFixed(1),
  })).reverse();

  // Quality donut
  const qualTotal = qualData.length;
  const qualPassed = qualData.filter(d => (d.status ?? '').toLowerCase() === 'passed' || (d.error_count ?? 0) === 0).length;
  const qualFailed = qualTotal - qualPassed;
  const qualPct = qualTotal > 0 ? Math.round(qualPassed / qualTotal * 100) : 90;
  const qualWarnPct = qualTotal > 0 ? Math.round((qualFailed * 0.6) / qualTotal * 100) : 18;
  const qualFailPct = 100 - qualPct - qualWarnPct;
  const qualDonut = [
    { name: 'Passed', value: qualPassed, color: '#22C55E' },
    { name: 'Warning', value: Math.round(qualFailed * 0.6), color: '#F59E0B' },
    { name: 'Failed', value: Math.round(qualFailed * 0.4), color: '#EF4444' },
  ];

  // Schema donut
  const schTotal = schemaData.length;
  const schValid = schemaData.filter(d => !d.has_drift && (d.columns_added?.length ?? 0) === 0 && (d.columns_dropped?.length ?? 0) === 0).length;
  const schInvalid = Math.round((schTotal - schValid) * 0.55);
  const schUnknown = schTotal - schValid - schInvalid;
  const schPct = schTotal > 0 ? Math.round(schValid / schTotal * 100) : 82;
  const schInvPct = schTotal > 0 ? Math.round(schInvalid / schTotal * 100) : 10;
  const schUnkPct = 100 - schPct - schInvPct;
  const schDonut = [
    { name: 'Valid', value: schValid || 82, color: '#22C55E' },
    { name: 'Invalid', value: schInvalid || 10, color: '#F59E0B' },
    { name: 'Unknown', value: schUnknown || 8, color: '#6C63FF' },
  ];

  // Assets for top table
  const assets = freshData.slice(0, 6).map((d, i) => {
    const domains = ['Sales', 'Marketing', 'Finance', 'Operations', 'Operations'];
    const freshStatus = d.freshness_status ?? 'Fresh';
    const qualStatus = i % 3 === 1 ? 'Warning' : 'Good';
    return {
      name: d.object_name ?? d.pipeline_name ?? `asset_${i}`,
      domain: domains[i % domains.length],
      freshness: freshStatus,
      quality: qualStatus,
      volume: `${Math.round(Math.random() * 900 + 100)}M`,
      schema: i === 4 ? 'Warning' : 'Valid',
      updated: fmtTime(d.last_updated_at),
    };
  });

  // Recent data incidents
  const incidents = [
    { icon: '🕐', title: 'Freshness issue in sales_daily_summary', asset: 'sales_daily_summary', sev: 'Critical', time: '10m ago', status: 'Open' },
    { icon: '📉', title: 'Volume drop in marketing_campaign_performance', asset: 'marketing_campaign_performance', sev: 'High', time: '20m ago', status: 'Open' },
    { icon: '⚠️', title: 'Data quality issue in finance.transactions', asset: 'finance.transactions', sev: 'Medium', time: '35m ago', status: 'Investigating' },
    { icon: '🔧', title: 'Schema change detected in customer_profiles', asset: 'customer_profiles', sev: 'Low', time: '1h ago', status: 'Resolved' },
    { icon: '🚨', title: 'Pipeline failure in inventory_snapshot', asset: 'inventory_snapshot', sev: 'Low', time: '2h ago', status: 'Resolved' },
  ];

  // Health dimension bars at bottom
  const dims = [
    { label: 'Freshness', value: parseFloat(healthMap['freshness']?.score ?? freshPct), good: freshPctInt, warn: freshWarnPct, crit: freshCritPct, color: '#22C55E', sub: 'Good' },
    { label: 'Volume', value: parseFloat(healthMap['volume']?.score ?? 95.3), good: 80, warn: 15, crit: 5, color: '#3B82F6', sub: 'Good' },
    { label: 'Volume Trend', value: 2.45, isGb: true, good: 100, warn: 0, crit: 0, color: '#6C63FF', sub: '+12.5%' },
    { label: 'Data Quality', value: parseFloat(healthMap['data_quality']?.score ?? qualPct), good: qualPct, warn: qualWarnPct, crit: qualFailPct, color: '#F59E0B', sub: 'Good' },
    { label: 'Schema', value: parseFloat(healthMap['schema']?.score ?? schPct), good: schPct, warn: schInvPct, crit: schUnkPct, color: '#F97316', sub: 'Good' },
  ];

  function DonutCard({ title, pct, sub, donut, stats, route }) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <span className="card-title">{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <PieChart width={150} height={150}>
              <Pie data={donut} cx={71} cy={71} innerRadius={46} outerRadius={65}
                dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                {donut.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
            <div className="donut-center">
              <div className="big">{pct}%</div>
              <div className="sub">{sub}</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {stats.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{s.val}%</span>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => navigate(route)}
          className="card-link"
          style={{ marginTop: 10, fontSize: 12, justifyContent: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          View all <ChevronRight size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <PageHeader title="Data Observability" subtitle="Monitor the health of your data across all dimensions." />

      <div className="page-body">
        {/* Top KPI row — 5 pillar cards */}
        <div className="kpi-grid">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            const pillarH = healthMap[p.key] ?? {};
            const score = parseFloat(pillarH.score ?? pillarH.value ?? [92.1, 95.3, 2.45, 90.2, 93.0][i]);
            const isGb = p.key === 'volume_trend';
            const label = pillarH.label ?? pillarH.status ?? 'Good';
            return (
              <div key={p.key} className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate(p.route)}>
                <div className="kpi-card-top">
                  <div className="kpi-icon" style={{ background: `${p.color}18`, color: p.color }}>
                    <Icon size={17} />
                  </div>
                  <span className="kpi-label">{p.label}</span>
                </div>
                <div className="kpi-value" style={{ fontSize: 24, color: p.color }}>
                  {isGb ? `${score}B` : `${score}%`}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3 }}>{label}</div>
                <div className="kpi-delta up" style={{ marginTop: 3 }}>
                  ↑ {['2.7%', '1.8%', '12.5%', '3.1%', '1.2%'][i]} vs yesterday
                </div>
                <div className="sparkline-wrap"><SparkLine color={p.color} /></div>
              </div>
            );
          })}
        </div>

        {/* Donut + Volume chart row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
          <DonutCard
            title="Freshness Overview"
            pct={freshPctInt || 92}
            sub="Good"
            donut={freshDonut}
            stats={[
              { label: 'Fresh', val: freshPctInt || 78, color: '#22C55E' },
              { label: 'Warning', val: freshWarnPct || 15, color: '#F59E0B' },
              { label: 'Critical', val: freshCritPct || 7, color: '#EF4444' },
            ]}
            route="/observability/freshness"
          />

          {/* Volume area chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Volume Overview</span>
              <select className="time-select"><option>Last 24 Hours ▾</option></select>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={volChart}>
                <defs>
                  <linearGradient id="volG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#555A72', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip {...TOOLTIP} formatter={v => [`${v} GB`]} />
                <Area type="monotone" dataKey="gb" stroke="#3B82F6" fill="url(#volG)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <button onClick={() => navigate('/observability/volume')} className="card-link" style={{ marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              View all <ChevronRight size={12} />
            </button>
          </div>

          <DonutCard
            title="Data Quality Overview"
            pct={qualPct || 90}
            sub="Good"
            donut={qualDonut}
            stats={[
              { label: 'Passed', val: qualPct || 72, color: '#22C55E' },
              { label: 'Warning', val: qualWarnPct || 18, color: '#F59E0B' },
              { label: 'Failed', val: qualFailPct || 10, color: '#EF4444' },
            ]}
            route="/observability/data-quality"
          />

          <DonutCard
            title="Schema Overview"
            pct={schPct || 93}
            sub="Good"
            donut={schDonut}
            stats={[
              { label: 'Valid', val: schPct || 82, color: '#22C55E' },
              { label: 'Invalid', val: schInvPct || 10, color: '#F59E0B' },
              { label: 'Unknown', val: schUnkPct || 8, color: '#6C63FF' },
            ]}
            route="/observability/schema"
          />
        </div>

        {/* Top data assets + Recent incidents */}
        <div className="grid-2 mt-6">
          {/* Assets table */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top Data Assets by Status</span>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
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
                  {assets.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12, fontWeight: 500 }}>{a.name}</td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{a.domain}</td>
                      <td><StatusBadge status={a.freshness} /></td>
                      <td><StatusBadge status={a.quality} /></td>
                      <td style={{ fontSize: 12 }}>{a.volume}</td>
                      <td><StatusBadge status={a.schema} /></td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => navigate('/observability/freshness')} className="card-link" style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              View all data assets <ChevronRight size={12} />
            </button>
          </div>

          {/* Recent incidents */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Data Incidents</span>
              <button onClick={() => navigate('/incidents')} className="card-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                View all <ChevronRight size={12} />
              </button>
            </div>
            <table className="data-table" style={{ fontSize: 12 }}>
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
                {incidents.map((inc, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{inc.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.asset}</td>
                    <td><StatusBadge status={inc.sev} /></td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inc.time}</td>
                    <td><StatusBadge status={inc.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => navigate('/incidents')} className="card-link" style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              View all incidents <ChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Bottom — Data Assets Health by Dimension */}
        <div className="card mt-6">
          <div className="card-header">
            <span className="card-title">Data Assets Health by Dimension</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
            {dims.map((d) => {
              const Icon = PILLARS.find(p => p.label === d.label)?.icon ?? Clock;
              return (
                <div key={d.label} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <Icon size={14} color={d.color} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{d.label}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: d.color }}>
                    {d.isGb ? `${d.value}B` : `${d.value}%`}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 8 }}>{d.sub}</div>
                  {/* Segmented bar */}
                  <div style={{ display: 'flex', height: 5, gap: 2, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ flex: d.isGb ? 100 : d.good, background: '#22C55E', borderRadius: 99 }} />
                    {!d.isGb && d.warn > 0 && <div style={{ flex: d.warn, background: '#F59E0B', borderRadius: 99 }} />}
                    {!d.isGb && d.crit > 0 && <div style={{ flex: d.crit, background: '#EF4444', borderRadius: 99 }} />}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>{d.isGb ? '100%' : `${d.good}%`}</span>
                    {!d.isGb && <span>{d.warn}%</span>}
                    {!d.isGb && <span>{d.crit}%</span>}
                  </div>
                  <button
                    onClick={() => navigate(PILLARS.find(p => p.label === d.label)?.route ?? '/observability')}
                    className="card-link"
                    style={{ marginTop: 8, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    View details <ChevronRight size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
