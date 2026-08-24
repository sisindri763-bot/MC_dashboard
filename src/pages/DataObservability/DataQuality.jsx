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

function fmtTime(ts) {
  if (!ts) return 'recently';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DataQuality() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ total_checks: 0, passed_checks: 0, failed_checks: 0, pass_rate: 0 });
  const [loading, setLoading] = useState(true);

  const [pipelineFilter, setPipelineFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchDataQuality({ preset: 'all' });
      if (res) {
        const list = res.items || res.checks || (Array.isArray(res) ? res : res.results || []);
        setData(list);
        if (res.summary) {
          setSummary(res.summary);
        } else {
          const passed = list.filter(c => (c.status ?? '').toLowerCase() === 'passed').length;
          const failed = list.length - passed;
          setSummary({
            total_checks: list.length,
            passed_checks: passed,
            failed_checks: failed,
            pass_rate: list.length > 0 ? Math.round((passed / list.length) * 100) : 0
          });
        }
      }
    } catch (e) {
      console.error('Failed to load quality checks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalChecks = summary.total_checks || data.length;
  const passedChecks = summary.passed_checks;
  const failedChecks = summary.failed_checks;
  const passRate = summary.pass_rate ?? 0;
  const warningChecks = Math.max(0, totalChecks - passedChecks - failedChecks);

  const donutData = [
    { name: 'Passed', value: passedChecks, color: '#10B981', pct: `${totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0}%` },
    { name: 'Warning', value: warningChecks, color: '#F59E0B', pct: `${totalChecks > 0 ? Math.round((warningChecks / totalChecks) * 100) : 0}%` },
    { name: 'Failed', value: failedChecks, color: '#EF4444', pct: `${totalChecks > 0 ? Math.round((failedChecks / totalChecks) * 100) : 100}%` },
  ];

  const timeData = useMemo(() => {
    if (data.length === 0) {
      return [{ time: 'Aug 17', score: passRate }];
    }
    return data.map((d, i) => ({
      time: d.start_time ? new Date(d.start_time).toLocaleDateString([], { month: 'short', day: 'numeric' }) : `Check ${i+1}`,
      score: (d.status ?? '').toLowerCase() === 'passed' ? 100 : 0
    })).reverse();
  }, [data, passRate]);

  const filtered = useMemo(() => {
    return data.filter(d => {
      const pName = d.pipeline_name ?? '';
      const qId = d.query_id ?? '';
      const err = d.error_message ?? '';
      const status = d.status ?? 'failed';

      const matchSearch = pName.toLowerCase().includes(search.toLowerCase()) ||
                          qId.toLowerCase().includes(search.toLowerCase()) ||
                          err.toLowerCase().includes(search.toLowerCase());
      const matchPipeline = pipelineFilter === 'All' || pName === pipelineFilter;
      const matchStatus = statusFilter === 'All' || status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchPipeline && matchStatus;
    });
  }, [data, search, pipelineFilter, statusFilter]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  return (
    <div className="fade-in">
      <PageHeader
        title="Data Quality"
        subtitle="Real-time view of data quality across your pipelines."
        onRefresh={loadData}
      />

      <div className="page-body">
        {/* Top 5 KPI Cards (Live Real Backend Data) */}
        <div className="kpi-grid-5">
          {/* Quality Status with Gauge */}
          <div className="kpi-card">
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Quality Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
              <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                <PieChart width={56} height={56}>
                  <Pie
                    data={[{ value: passRate }, { value: Math.max(0, 100 - passRate) }]}
                    cx={28} cy={28} innerRadius={18} outerRadius={26}
                    startAngle={90} endAngle={-270} strokeWidth={0} dataKey="value"
                  >
                    <Cell fill={passRate > 80 ? '#10B981' : passRate > 50 ? '#F59E0B' : '#EF4444'} />
                    <Cell fill="#E2E8F0" />
                  </Pie>
                </PieChart>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 800, fontSize: 13 }}>
                  {passRate}%
                </div>
              </div>
              <div>
                <span className={`status-pill ${passRate > 80 ? 'good' : passRate > 50 ? 'warning' : 'critical'}`} style={{ padding: '2px 8px', fontSize: 11 }}>
                  {passRate > 80 ? 'Good' : passRate > 50 ? 'Warning' : 'Critical'}
                </span>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {passedChecks}/{totalChecks} checks passed
                </div>
              </div>
            </div>
            <div className="sparkline-container" style={{ height: 24, marginTop: 4 }}>
              <SparkLine color={passRate > 50 ? '#10B981' : '#EF4444'} height={24} />
            </div>
          </div>

          {/* Checks Run */}
          <div className="kpi-card">
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Checks Run</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{totalChecks}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Total test assertions</div>
            <div className="sparkline-container" style={{ height: 24, marginTop: 6 }}>
              <SparkLine color="#3B82F6" height={24} />
            </div>
          </div>

          {/* Passed */}
          <div className="kpi-card">
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Passed</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 4 }}>
              {passedChecks} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>({totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0}%)</span>
            </div>
            <div className="progress-track" style={{ marginTop: 12, height: 5 }}>
              <div className="progress-fill green" style={{ width: `${totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0}%` }} />
            </div>
          </div>

          {/* Warning */}
          <div className="kpi-card">
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Warning</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B', marginTop: 4 }}>
              {warningChecks} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>(0%)</span>
            </div>
            <div className="progress-track" style={{ marginTop: 12, height: 5 }}>
              <div className="progress-fill orange" style={{ width: '0%' }} />
            </div>
          </div>

          {/* Failed */}
          <div className="kpi-card">
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Failed</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#EF4444', marginTop: 4 }}>
              {failedChecks} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>({totalChecks > 0 ? Math.round((failedChecks / totalChecks) * 100) : 100}%)</span>
            </div>
            <div className="progress-track" style={{ marginTop: 12, height: 5 }}>
              <div className="progress-fill red" style={{ width: `${totalChecks > 0 ? (failedChecks / totalChecks) * 100 : 100}%` }} />
            </div>
          </div>
        </div>

        {/* 2 Middle Charts */}
        <div className="grid-2 mt-4">
          {/* Chart 1: Quality Score Over Time */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Quality Pass Rate (%)</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="qGradLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={passRate > 50 ? '#10B981' : '#EF4444'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={passRate > 50 ? '#10B981' : '#EF4444'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="score" stroke={passRate > 50 ? '#10B981' : '#EF4444'} fill="url(#qGradLive)" strokeWidth={2} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Checks by Status (Donut) */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Checks by Status</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 180 }}>
              <div style={{ position: 'relative', width: 150, height: 150 }}>
                <PieChart width={150} height={150}>
                  <Pie
                    data={donutData}
                    cx={75} cy={75} innerRadius={48} outerRadius={68}
                    startAngle={90} endAngle={-270} strokeWidth={0} dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="donut-center-label">
                  <div className="big">{totalChecks}</div>
                  <div className="small">Total Checks</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {donutData.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: d.color }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {d.value} ({d.pct})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quality Checks Table */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Quality Checks Execution Log ({filtered.length})</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="search-box">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search error or pipeline..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  style={{ width: 220, height: 30 }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="table-wrapper">
              <table className="vithi-table">
                <thead>
                  <tr>
                    <th>Pipeline</th>
                    <th>Query ID</th>
                    <th>Error Message / SQL Trace</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th style={{ textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        No data quality logs found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((c, i) => (
                      <tr key={c.id ?? i}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Database size={15} color="#3B82F6" />
                            <span style={{ fontWeight: 600 }}>{c.pipeline_name ?? 'hr_etl'}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--bg-card-subtle)', padding: '2px 6px', borderRadius: 4 }}>
                            {c.query_id ? c.query_id.slice(0, 18) + '...' : '—'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.error_message ?? 'Check passed with 0 validation errors'}
                        </td>
                        <td>
                          <span className={`status-pill ${c.status === 'passed' ? 'good' : 'critical'}`}>
                            {c.status ?? 'failed'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {fmtTime(c.start_time)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="icon-btn" style={{ width: 28, height: 28 }}>
                            <MoreVertical size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="pagination-bar">
            <span>Showing {Math.min((page - 1) * perPage + 1, filtered.length)} to {Math.min(page * perPage, filtered.length)} of {filtered.length} checks</span>
            <div className="pagination-pages">
              <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`pagination-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className="pagination-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
