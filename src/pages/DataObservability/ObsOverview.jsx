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
import {
  fetchOverviewHealth,
  fetchFreshness,
  fetchVolume,
  fetchDataQuality,
  fetchSchema,
  fetchRecentIncidents
} from '../../api/client';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  itemStyle: { color: '#0F172A' },
  labelStyle: { color: '#64748B', fontWeight: 600 },
};

function fmtTime(ts) {
  if (!ts) return 'recently';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ObsOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Live state
  const [healthPillars, setHealthPillars] = useState([]);
  const [freshnessChecks, setFreshnessChecks] = useState([]);
  const [freshnessSummary, setFreshnessSummary] = useState({ total_assets: 0, fresh_count: 0, delayed_count: 0, stale_count: 0 });
  const [volumeData, setVolumeData] = useState([]);
  const [qualitySummary, setQualitySummary] = useState({ total_checks: 0, passed_checks: 0, failed_checks: 0 });
  const [schemaSummary, setSchemaSummary] = useState({ monitored: 0, drift_events: 0 });
  const [incidents, setIncidents] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hRes, fRes, vRes, qRes, sRes, incRes] = await Promise.allSettled([
        fetchOverviewHealth(),
        fetchFreshness(),
        fetchVolume(),
        fetchDataQuality(),
        fetchSchema(),
        fetchRecentIncidents()
      ]);

      if (hRes.status === 'fulfilled' && hRes.value) {
        const pillars = hRes.value.pillars || hRes.value.items || [];
        setHealthPillars(pillars);
      }

      if (fRes.status === 'fulfilled' && fRes.value) {
        const list = fRes.value.freshness_checks || fRes.value.items || [];
        setFreshnessChecks(list);
        if (fRes.value.summary) setFreshnessSummary(fRes.value.summary);
      }

      if (vRes.status === 'fulfilled' && vRes.value) {
        setVolumeData(vRes.value.volume_checks || vRes.value.items || []);
      }

      if (qRes.status === 'fulfilled' && qRes.value) {
        const qList = qRes.value.checks || qRes.value.items || [];
        if (qRes.value.summary) {
          setQualitySummary(qRes.value.summary);
        } else {
          setQualitySummary({
            total_checks: qList.length,
            passed_checks: qList.filter(c => (c.status || '').toLowerCase() === 'passed').length,
            failed_checks: qList.filter(c => (c.status || '').toLowerCase() === 'failed').length,
          });
        }
      }

      if (sRes.status === 'fulfilled' && sRes.value) {
        setSchemaSummary({
          monitored: sRes.value.total_datasets_monitored || sRes.value.items?.length || 0,
          drift_events: sRes.value.total_drift_events || 0
        });
      }

      if (incRes.status === 'fulfilled' && incRes.value?.incidents) {
        setIncidents(incRes.value.incidents);
      }
    } catch (e) {
      console.error('Failed to load observability overview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map health pillars
  const pillarMap = {};
  healthPillars.forEach(p => {
    pillarMap[(p.name ?? '').toLowerCase().replace(/ /g, '_')] = p;
  });

  const freshnessPillar = pillarMap['freshness'] ?? { score: '0.0%', status: 'Critical', value: 0 };
  const volumePillar = pillarMap['volume'] ?? { score: '92.9%', status: 'Good', value: 92.9 };
  const qualityPillar = pillarMap['data_quality'] ?? { score: '0.0%', status: 'Critical', value: 0 };
  const schemaPillar = pillarMap['schema'] ?? { score: '20.8%', status: 'Critical', value: 20.8 };

  // Donut data from real summaries
  const totalFreshness = freshnessSummary.total_assets || 79;
  const freshPct = totalFreshness > 0 ? Math.round((freshnessSummary.fresh_count / totalFreshness) * 100) : 0;
  const delayedPct = totalFreshness > 0 ? Math.round((freshnessSummary.delayed_count / totalFreshness) * 100) : 0;
  const stalePct = totalFreshness > 0 ? Math.round((freshnessSummary.stale_count / totalFreshness) * 100) : 100;

  const freshnessDonut = [
    { name: 'Fresh', value: freshnessSummary.fresh_count || (freshPct > 0 ? freshPct : 0), color: '#10B981' },
    { name: 'Delayed', value: freshnessSummary.delayed_count || 0, color: '#F59E0B' },
    { name: 'Stale', value: freshnessSummary.stale_count || totalFreshness, color: '#EF4444' },
  ];

  const totalQual = qualitySummary.total_checks || 4;
  const qualityDonut = [
    { name: 'Passed', value: qualitySummary.passed_checks, color: '#10B981' },
    { name: 'Failed', value: qualitySummary.failed_checks, color: '#EF4444' },
  ];

  const schemaDonut = [
    { name: 'Valid', value: schemaSummary.monitored - schemaSummary.drift_events, color: '#10B981' },
    { name: 'Drifted', value: schemaSummary.drift_events, color: '#EF4444' },
  ];

  // Volume wave chart from real checks
  const volumeWaveData = useMemo(() => {
    if (!volumeData.length) return [];
    return volumeData.slice(0, 8).map((v, i) => ({
      time: v.created_at ? new Date(v.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : `Run ${i+1}`,
      v: v.source_rows ?? 0
    })).reverse();
  }, [volumeData]);

  const totalVolumeRows = volumeData.reduce((s, v) => s + (v.source_rows ?? 0), 0);

  const [headerDatePreset, setHeaderDatePreset] = useState('30d');
  const [customDateRange, setCustomDateRange] = useState(null);

  const handleHeaderDateChange = (val) => {
    if (typeof val === 'string') {
      setHeaderDatePreset(val);
      setCustomDateRange(null);
    } else if (val && val.start && val.end) {
      setHeaderDatePreset('custom');
      setCustomDateRange(val);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Data Observability"
        subtitle="Monitor the health of your data across all dimensions."
        onRefresh={loadData}
        onDateChange={handleHeaderDateChange}
      />

      <div className="page-body">
        {/* Top 5 KPI Pillars (Live Real Backend Data) */}
        <div className="kpi-grid-5">
          <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/observability/freshness')}>
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <Clock size={18} />
              </div>
              <span className="kpi-label">Freshness</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div className="kpi-value">{freshnessPillar.score}</div>
              <span className={`status-pill ${freshnessPillar.status.toLowerCase()}`} style={{ fontSize: 10.5, padding: '1px 6px' }}>
                {freshnessPillar.status}
              </span>
            </div>
            <div className="kpi-delta up" style={{ marginTop: 4 }}>
              <span>{freshnessSummary.fresh_count}/{totalFreshness} assets compliant</span>
            </div>
          </div>

          <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/observability/volume')}>
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <BarChart2 size={18} />
              </div>
              <span className="kpi-label">Volume</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div className="kpi-value">{volumePillar.score}</div>
              <span className={`status-pill ${volumePillar.status.toLowerCase()}`} style={{ fontSize: 10.5, padding: '1px 6px' }}>
                {volumePillar.status}
              </span>
            </div>
            <div className="kpi-delta up" style={{ marginTop: 4 }}>
              <span>{totalVolumeRows.toLocaleString()} rows monitored</span>
            </div>
          </div>

          <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/observability/volume')}>
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                <Database size={18} />
              </div>
              <span className="kpi-label">Volume Checks</span>
            </div>
            <div className="kpi-value">{volumeData.length}</div>
            <div className="kpi-delta up" style={{ marginTop: 4 }}>
              <span>Total validation runs</span>
            </div>
          </div>

          <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/observability/data-quality')}>
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                <Shield size={18} />
              </div>
              <span className="kpi-label">Data Quality</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div className="kpi-value">{qualityPillar.score}</div>
              <span className={`status-pill ${qualityPillar.status.toLowerCase()}`} style={{ fontSize: 10.5, padding: '1px 6px' }}>
                {qualityPillar.status}
              </span>
            </div>
            <div className="kpi-delta down" style={{ marginTop: 4 }}>
              <span>{qualitySummary.failed_checks} failed test checks</span>
            </div>
          </div>

          <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/observability/schema')}>
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
                <Layers size={18} />
              </div>
              <span className="kpi-label">Schema</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div className="kpi-value">{schemaPillar.score}</div>
              <span className={`status-pill ${schemaPillar.status.toLowerCase()}`} style={{ fontSize: 10.5, padding: '1px 6px' }}>
                {schemaPillar.status}
              </span>
            </div>
            <div className="kpi-delta up" style={{ marginTop: 4 }}>
              <span>{schemaSummary.monitored} datasets tracked</span>
            </div>
          </div>
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
                  <Pie data={freshnessDonut} cx={55} cy={55} innerRadius={35} outerRadius={50} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                    {freshnessDonut.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="donut-center-label">
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{freshnessPillar.score}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>{freshnessPillar.status}</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {freshnessDonut.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="card-link" style={{ marginTop: 8 }} onClick={() => navigate('/observability/freshness')}>
              View all →
            </button>
          </div>

          {/* Chart 2: Volume Ingestion Wave */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">Volume Ingestion Trend</span>
            </div>
            <div style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={volumeWaveData}>
                  <defs>
                    <linearGradient id="volWaveLive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="v" stroke="#3B82F6" fill="url(#volWaveLive)" strokeWidth={2} dot={false} />
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
                  <Pie data={qualityDonut} cx={55} cy={55} innerRadius={35} outerRadius={50} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                    {qualityDonut.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="donut-center-label">
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{qualityPillar.score}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>{qualityPillar.status}</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {qualityDonut.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{d.value}</span>
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
                  <Pie data={schemaDonut} cx={55} cy={55} innerRadius={35} outerRadius={50} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                    {schemaDonut.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="donut-center-label">
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{schemaPillar.score}</div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>{schemaPillar.status}</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {schemaDonut.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="card-link" style={{ marginTop: 8 }} onClick={() => navigate('/observability/schema')}>
              View all →
            </button>
          </div>
        </div>

        {/* Top Monitored Assets & Recent Incidents */}
        <div className="grid-2 mt-4">
          {/* Table: Top Freshness Assets */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top Data Assets by Freshness</span>
              <button className="card-link" onClick={() => navigate('/observability/freshness')}>
                View all →
              </button>
            </div>
            <div className="table-wrapper">
              <table className="vithi-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Data Asset</th>
                    <th>System</th>
                    <th>Lag</th>
                    <th>Status</th>
                    <th>Last Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {freshnessChecks.slice(0, 5).map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.dataset_id ?? a.pipeline_name ?? 'Dataset'}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{a.system_name ?? 'Snowflake'}</td>
                      <td style={{ fontWeight: 600, color: '#EF4444' }}>{a.lag_minutes ? `${Math.round(a.lag_minutes / 60)}h` : '—'}</td>
                      <td><span className={`status-pill ${a.status?.toLowerCase() ?? 'stale'}`}>{a.status ?? 'Stale'}</span></td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fmtTime(a.last_updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Live Data Incidents */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Live Data Incidents</span>
              <button className="card-link" onClick={() => navigate('/incidents')}>
                View all →
              </button>
            </div>
            <div className="table-wrapper">
              <table className="vithi-table" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Incident</th>
                    <th>Pipeline</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Detected At</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={13} style={{ color: '#EF4444' }} />
                          <span style={{ fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inc.title ?? inc.description}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{inc.pipeline_name}</td>
                      <td><span className="status-pill critical">{inc.severity ?? 'Critical'}</span></td>
                      <td><span className={`status-pill ${inc.state === 'OPEN' ? 'warning' : 'good'}`}>{inc.state ?? 'OPEN'}</span></td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fmtTime(inc.start_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Card: Health by Dimension */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Data Assets Health by Dimension (Live Evaluation)</span>
          </div>
          <div className="grid-5">
            {healthPillars.map((dim, i) => {
              const val = dim.value ?? 0;
              const isGood = val > 80;
              const isCrit = val <= 50;

              return (
                <div key={i} style={{ background: 'var(--bg-card-subtle)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{dim.name}</span>
                    <span className={`status-pill ${isGood ? 'good' : isCrit ? 'critical' : 'warning'}`} style={{ fontSize: 10, padding: '1px 5px' }}>
                      {dim.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: isGood ? '#10B981' : isCrit ? '#EF4444' : '#F59E0B', marginTop: 6 }}>
                    {dim.score}
                  </div>
                  {/* Segmented Bar */}
                  <div className="progress-track" style={{ marginTop: 8 }}>
                    <div
                      className={`progress-fill ${isGood ? 'green' : isCrit ? 'red' : 'orange'}`}
                      style={{ width: `${Math.max(val, 5)}%` }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.3 }}>
                    {dim.details}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
