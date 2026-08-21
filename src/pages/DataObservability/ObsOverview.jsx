import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, BarChart2, Database, Shield, Layout, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import SparkLine from '../../components/SparkLine';
import { fetchOverviewHealth, fetchRecentIncidents, fetchPipelines } from '../../api/client';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1E2130', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 },
  itemStyle: { color: '#E8EAF6' },
  labelStyle: { color: '#8B90A7' },
};

function fmtTime(ts) {
  if (!ts) return '—';
  const diff = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff/60)}h ago`;
  return `${Math.round(diff/1440)}d ago`;
}

function DonutCard({ title, value, label, data, colors, legendItems, href }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div className="donut-wrapper" style={{ position: 'relative' }}>
          <PieChart width={150} height={150}>
            <Pie data={data} cx={70} cy={70} innerRadius={48} outerRadius={68}
              dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
            </Pie>
          </PieChart>
          <div className="donut-center-label" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
            <div className="big">{value}</div>
            <div className="small">{label}</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {legendItems.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: colors[i], flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)' }}>{l.label}</span>
              </div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{l.value}</span>
            </div>
          ))}
        </div>
      </div>
      {href && (
        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
          <a href={href} className="card-link" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            View all <ArrowRight size={12} />
          </a>
        </div>
      )}
    </div>
  );
}

const PILLAR_META = [
  { key: 'freshness', icon: Clock, color: '#6C63FF', iconClass: 'purple', label: 'Freshness', href: '/observability/freshness' },
  { key: 'volume', icon: BarChart2, color: '#3B82F6', iconClass: 'blue', label: 'Volume', href: '/observability/volume' },
  { key: 'volume_trend', icon: Database, color: '#8B5CF6', iconClass: 'purple', label: 'Volume Trend (Records)', href: '/observability/volume' },
  { key: 'data_quality', icon: Shield, color: '#22C55E', iconClass: 'green', label: 'Data Quality', href: '/observability/data-quality' },
  { key: 'schema', icon: Layout, color: '#F59E0B', iconClass: 'orange', label: 'Schema', href: '/observability/schema' },
];

export default function ObsOverview() {
  const [health, setHealth] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [h, inc, pip] = await Promise.all([
          fetchOverviewHealth(),
          fetchRecentIncidents({ limit: 5 }),
          fetchPipelines(),
        ]);
        setHealth(Array.isArray(h) ? h : h?.pillars ?? h?.dimensions ?? []);
        setIncidents(Array.isArray(inc) ? inc : inc?.incidents ?? []);
        setPipelines(Array.isArray(pip) ? pip : pip?.pipelines ?? []);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><LoadingSpinner /></div>;

  // Build pillar scores map
  const pillarMap = {};
  health.forEach((h) => {
    const k = (h.dimension ?? h.pillar ?? h.name ?? '').toLowerCase().replace(/\s/g,'_');
    pillarMap[k] = h;
  });

  const getPillarScore = (key) => {
    const h = pillarMap[key] || Object.values(pillarMap).find(p => (p.dimension??p.pillar??p.name??'').toLowerCase().includes(key.split('_')[0]));
    return parseFloat(h?.score ?? h?.percentage ?? 0);
  };

  const freshnessScore = getPillarScore('freshness');
  const volumeScore = getPillarScore('volume');
  const qualityScore = getPillarScore('quality');
  const schemaScore = getPillarScore('schema');

  // Donut data
  const mkDonut = (pct, colors) => [
    { value: pct, label: 'ok' },
    { value: Math.max(0, 100 - pct), label: 'rest' },
  ];

  const incidentsByPipeline = {};
  incidents.forEach((inc) => {
    const name = inc.pipeline_name ?? inc.asset_name ?? '—';
    if (!incidentsByPipeline[name]) incidentsByPipeline[name] = inc;
  });
  const topAssets = pipelines.slice(0, 5);

  return (
    <div className="fade-in">
      <PageHeader title="Data Observability" subtitle="Monitor the health of your data across all dimensions." />

      <div className="page-body" style={{ paddingTop: 16 }}>
        {/* Top KPI cards */}
        <div className="obs-kpi-grid">
          {[
            { label: 'Freshness', value: `${freshnessScore.toFixed(1)}%`, status: 'Good', delta: '+2.7%', color: '#6C63FF', bgColor: 'rgba(108,99,255,0.12)' },
            { label: 'Volume', value: `${volumeScore.toFixed(1)}%`, status: 'Good', delta: '+1.8%', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.12)' },
            { label: 'Volume Trend (Records)', value: '—', status: null, delta: '+12.5%', color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.12)' },
            { label: 'Data Quality', value: `${qualityScore.toFixed(1)}%`, status: 'Good', delta: '+3.1%', color: '#22C55E', bgColor: 'rgba(34,197,94,0.12)' },
            { label: 'Schema', value: `${schemaScore.toFixed(1)}%`, status: 'Good', delta: '+1.2%', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.12)' },
          ].map((item) => (
            <div key={item.label} className="obs-kpi-card">
              <div className="obs-kpi-icon" style={{ background: item.bgColor }}>
                <Database size={16} color={item.color} />
              </div>
              <div className="obs-kpi-name">{item.label}</div>
              <div className="obs-kpi-value">{item.value}</div>
              {item.status && <div className="obs-kpi-status good">{item.status}</div>}
              <div style={{ fontSize: 11, color: '#22C55E', marginTop: 4 }}>{item.delta} vs yesterday</div>
              <div className="sparkline-wrap"><SparkLine color={item.color} /></div>
            </div>
          ))}
        </div>

        {/* Donut Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 14 }}>
          <DonutCard
            title="Freshness Overview"
            value={`${freshnessScore.toFixed(1)}%`} label="Good"
            data={mkDonut(78, [])}
            colors={['#22C55E', '#F59E0B', '#EF4444', 'rgba(255,255,255,0.06)']}
            legendItems={[{ label: 'Fresh', value: '78%' }, { label: 'Warning', value: '15%' }, { label: 'Critical', value: '7%' }]}
            href="/observability/freshness"
          />
          <DonutCard
            title="Volume Overview"
            value="95.3%" label="Good"
            data={[{ value: 80 }, { value: 20 }]}
            colors={['#3B82F6', 'rgba(255,255,255,0.06)']}
            legendItems={[]}
            href="/observability/volume"
          />
          <DonutCard
            title="Data Quality Overview"
            value={`${qualityScore.toFixed(1)}%`} label="Good"
            data={mkDonut(72, [])}
            colors={['#22C55E', '#F59E0B', '#EF4444', 'rgba(255,255,255,0.06)']}
            legendItems={[{ label: 'Passed', value: '72%' }, { label: 'Warning', value: '18%' }, { label: 'Failed', value: '10%' }]}
            href="/observability/data-quality"
          />
          <DonutCard
            title="Schema Overview"
            value={`${schemaScore.toFixed(1)}%`} label="Good"
            data={mkDonut(82, [])}
            colors={['#22C55E', '#EF4444', '#6B7280', 'rgba(255,255,255,0.06)']}
            legendItems={[{ label: 'Valid', value: '82%' }, { label: 'Invalid', value: '10%' }, { label: 'Unknown', value: '8%' }]}
            href="/observability/schema"
          />
        </div>

        {/* Bottom: Top Assets + Recent Incidents */}
        <div className="section-grid-2 mt-6">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top Data Assets by Status</span>
              <a className="card-link" href="/pipelines">View all data assets →</a>
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
                  {topAssets.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12, fontWeight: 500 }}>{p.pipeline_name ?? p.name ?? '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.system_name ?? p.domain ?? '—'}</td>
                      <td><StatusBadge status={p.freshness_status ?? 'Fresh'} /></td>
                      <td><StatusBadge status={p.quality_status ?? 'Good'} /></td>
                      <td style={{ fontSize: 12 }}>{p.total_rows_in != null ? `${Math.round(p.total_rows_in/1e6)}M` : '—'}</td>
                      <td><StatusBadge status={p.schema_status ?? 'Valid'} /></td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtTime(p.last_run_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Data Incidents</span>
              <a className="card-link" href="/incidents">View all incidents →</a>
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
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
                      <td style={{ fontSize: 12, fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inc.pipeline_name ?? inc.title ?? '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inc.pipeline_name ?? '—'}</td>
                      <td><StatusBadge status={inc.severity ?? 'Medium'} /></td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtTime(inc.detected_at ?? inc.failed_at)}</td>
                      <td><StatusBadge status={inc.incident_status ?? 'Open'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Health by Dimension */}
        <div className="card mt-6">
          <div className="card-header">
            <span className="card-title">Data Assets Health by Dimension</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
            {[
              { label: 'Freshness', pct: freshnessScore, color: '#6C63FF', href: '/observability/freshness' },
              { label: 'Volume', pct: volumeScore, color: '#3B82F6', href: '/observability/volume' },
              { label: 'Volume Trend', pct: 75, color: '#8B5CF6', href: '/observability/volume' },
              { label: 'Data Quality', pct: qualityScore, color: '#22C55E', href: '/observability/data-quality' },
              { label: 'Schema', pct: schemaScore, color: '#F59E0B', href: '/observability/schema' },
            ].map((d) => (
              <div key={d.label}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{d.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {d.pct > 0 ? `${d.pct.toFixed(1)}%` : '—'}
                </div>
                <div style={{ fontSize: 11, color: '#22C55E', marginBottom: 8 }}>Good</div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${d.pct}%`, background: d.color, borderRadius: 99, transition: 'width 0.8s ease' }} />
                </div>
                <a href={d.href} className="card-link" style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 8, fontSize: 11 }}>
                  View details <ArrowRight size={10} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
