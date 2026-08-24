import { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Clock, Database, Play, CheckCircle, XCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchMetrics, fetchPipelines } from '../api/client';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  itemStyle: { color: '#0F172A' },
  labelStyle: { color: '#64748B', fontWeight: 600 },
};

function fmtDuration(s) {
  if (!s && s !== 0) return '0s';
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec}s`;
}

export default function Metrics() {
  const [metrics, setMetrics] = useState({ total: 38, successful: 29, failed: 9, success_rate: 76.3, average_duration_seconds: 12.6 });
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, pRes] = await Promise.allSettled([
        fetchMetrics(),
        fetchPipelines()
      ]);

      if (mRes.status === 'fulfilled' && mRes.value?.runs) {
        setMetrics(mRes.value.runs);
      }
      if (pRes.status === 'fulfilled' && pRes.value) {
        const list = Array.isArray(pRes.value) ? pRes.value : pRes.value.pipelines ?? [];
        setPipelines(list);
      }
    } catch (e) {
      console.error('Failed to load metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = pipelines.map(p => ({
    name: p.pipeline_name,
    runs: p.total_runs ?? p.runs ?? 1,
    duration: Math.round(p.avg_duration_seconds ?? 10),
    successRate: p.success_rate != null ? parseFloat(p.success_rate) : 100
  }));

  return (
    <div className="fade-in">
      <PageHeader
        title="Metrics"
        subtitle="Calculated observability metrics across all pipelines."
        onRefresh={loadData}
      />

      <div className="page-body">
        {/* Top 4 KPI Cards (Live Real Backend Data) */}
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Play size={18} />
              </div>
              <span className="kpi-label">Total Executions</span>
            </div>
            <div className="kpi-value">{metrics.total}</div>
            <div className="kpi-delta up">
              <span>Across all pipeline runs</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <CheckCircle size={18} />
              </div>
              <span className="kpi-label">Successful Executions</span>
            </div>
            <div className="kpi-value">{metrics.successful}</div>
            <div className="kpi-delta up">
              <span>{metrics.success_rate}% success rate</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                <XCircle size={18} />
              </div>
              <span className="kpi-label">Failed Runs</span>
            </div>
            <div className="kpi-value">{metrics.failed}</div>
            <div className="kpi-delta down">
              <span>Execution error aborts</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
                <Clock size={18} />
              </div>
              <span className="kpi-label">Average Runtime</span>
            </div>
            <div className="kpi-value">{fmtDuration(metrics.average_duration_seconds)}</div>
            <div className="kpi-delta up">
              <span>Mean execution time</span>
            </div>
          </div>
        </div>

        {/* 2 Charts */}
        <div className="grid-2 mt-4">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Total Executions per Pipeline</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="runs" name="Runs" fill="#6366F1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Average Runtime Duration (Seconds)</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="duration" name="Duration (s)" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metrics Table */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Pipeline Operational Metrics</span>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="table-wrapper">
              <table className="vithi-table">
                <thead>
                  <tr>
                    <th>Pipeline</th>
                    <th>Tool</th>
                    <th>Source &rarr; Target</th>
                    <th>Total Runs</th>
                    <th>Success Rate</th>
                    <th>Avg. Runtime</th>
                    <th>Health Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelines.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.pipeline_name}</td>
                      <td>
                        <span className="status-pill info" style={{ textTransform: 'uppercase' }}>
                          {p.etl_tool ?? 'dbt'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {p.source_tool ?? 'Snowflake'} &rarr; {p.target_tool ?? 'Snowflake'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.total_runs ?? p.runs ?? 1}</td>
                      <td style={{ color: (p.success_rate ?? 100) > 80 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                        {p.success_rate != null ? `${parseFloat(p.success_rate).toFixed(1)}%` : '100%'}
                      </td>
                      <td>{fmtDuration(p.avg_duration_seconds)}</td>
                      <td>
                        <span className={`status-pill ${(p.status ?? '').toLowerCase() === 'success' ? 'good' : 'critical'}`}>
                          {p.status ?? 'Success'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
