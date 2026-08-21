import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchMetrics } from '../api/client';

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

export default function Metrics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchMetrics();
        setData(Array.isArray(res) ? res : res?.metrics ?? []);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><LoadingSpinner /></div>;

  const byPipeline = [...new Map(data.map(d => [d.pipeline_name, d])).values()];
  const chartData = byPipeline.slice(0, 10).map(d => ({
    name: (d.pipeline_name ?? '').substring(0, 12),
    rows_in: d.total_rows_in ?? 0,
    rows_out: d.total_rows_out ?? 0,
    duration: d.avg_duration_seconds ?? 0,
  }));

  return (
    <div className="fade-in">
      <PageHeader title="Metrics" subtitle="Calculated observability metrics across all pipelines." />

      <div className="page-body" style={{ paddingTop: 16 }}>
        <div className="section-grid-2">
          <div className="card">
            <div className="card-header"><span className="card-title">Rows In vs Rows Out by Pipeline</span></div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical" barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="rows_in" fill="#6C63FF" radius={[0,2,2,0]} name="Rows In" />
                <Bar dataKey="rows_out" fill="#22C55E" radius={[0,2,2,0]} name="Rows Out" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Avg Duration by Pipeline (seconds)</span></div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical" barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8B90A7', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="duration" fill="#F59E0B" radius={[0,2,2,0]} name="Duration (s)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card mt-6">
          <div className="card-header"><span className="card-title">Pipeline Metrics Detail</span></div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>System</th>
                  <th>Rows In</th>
                  <th>Rows Out</th>
                  <th>Drop %</th>
                  <th>Avg Duration</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && <tr><td colSpan={7} className="empty-state">No metrics data</td></tr>}
                {data.slice(0, 50).map((d, i) => {
                  const drop = d.total_rows_in > 0 ? ((d.total_rows_in - (d.total_rows_out ?? 0)) / d.total_rows_in * 100) : 0;
                  return (
                    <tr key={i}>
                      <td style={{ fontSize: 12, fontWeight: 500 }}>{d.pipeline_name ?? '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.system_name ?? '—'}</td>
                      <td style={{ fontSize: 12 }}>{(d.total_rows_in ?? 0).toLocaleString()}</td>
                      <td style={{ fontSize: 12 }}>{(d.total_rows_out ?? 0).toLocaleString()}</td>
                      <td style={{ fontSize: 12, color: drop > 50 ? '#EF4444' : drop > 20 ? '#F59E0B' : '#22C55E' }}>
                        {drop.toFixed(1)}%
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {d.avg_duration_seconds != null ? `${Math.round(d.avg_duration_seconds)}s` : '—'}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtTime(d.last_updated_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
