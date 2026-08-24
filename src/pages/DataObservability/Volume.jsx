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
import { fetchVolume } from '../../api/client';

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

export default function Volume() {
  const [data, setData] = useState([]);
  const [totalChecks, setTotalChecks] = useState(0);
  const [anomalies, setAnomalies] = useState(0);
  const [loading, setLoading] = useState(true);

  const [pipelineFilter, setPipelineFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [viewUnit, setViewUnit] = useState('Rows');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchVolume();
      if (res) {
        const list = res.volume_checks ?? (Array.isArray(res) ? res : res.datasets ?? []);
        setData(list);
        setTotalChecks(res.total_checks ?? list.length);
        setAnomalies(res.anomalies_detected ?? list.filter(v => v.status === 'failed' || (v.row_drop_pct ?? 0) > 20).length);
      }
    } catch (e) {
      console.error('Failed to load volume checks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSourceRows = data.reduce((s, d) => s + (d.source_rows ?? 0), 0);
  const totalTargetRows = data.reduce((s, d) => s + (d.target_rows ?? 0), 0);
  const totalDrop = totalSourceRows > 0 ? (((totalSourceRows - totalTargetRows) / totalSourceRows) * 100).toFixed(1) : '0.0';

  // Group by pipeline for bar chart
  const pipelineGroups = useMemo(() => {
    const map = {};
    data.forEach(d => {
      const name = d.pipeline_name ?? 'unknown_pipeline';
      if (!map[name]) map[name] = { name, sourceRows: 0, targetRows: 0, count: 0 };
      map[name].sourceRows += (d.source_rows ?? 0);
      map[name].targetRows += (d.target_rows ?? 0);
      map[name].count += 1;
    });
    return Object.values(map);
  }, [data]);

  // Area chart over time
  const timeChartData = useMemo(() => {
    return data.slice(0, 10).map((d, i) => ({
      time: d.created_at ? new Date(d.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : `Run ${i+1}`,
      rows: d.source_rows ?? 0,
      targetRows: d.target_rows ?? 0
    })).reverse();
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter(d => {
      const pName = d.pipeline_name ?? '';
      const srcName = d.source_dataset ?? '';
      const tgtName = d.target_dataset ?? '';
      const status = d.status ?? 'passed';

      const matchSearch = pName.toLowerCase().includes(search.toLowerCase()) ||
                          srcName.toLowerCase().includes(search.toLowerCase()) ||
                          tgtName.toLowerCase().includes(search.toLowerCase());
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
        title="Volume"
        subtitle="Track the amount of data flowing through your pipelines."
        onRefresh={loadData}
      />

      <div className="page-body">
        {/* Top 4 KPI Cards (Live Real Backend Data) */}
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Database size={18} />
              </div>
              <span className="kpi-label">Source Records In</span>
            </div>
            <div className="kpi-value">{totalSourceRows.toLocaleString()}</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>Across {totalChecks} volume validation checks</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <FileText size={18} />
              </div>
              <span className="kpi-label">Target Records Out</span>
            </div>
            <div className="kpi-value">{totalTargetRows.toLocaleString()}</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>Committed to warehouse</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
                <TrendingUp size={18} />
              </div>
              <span className="kpi-label">Net Drop Rate</span>
            </div>
            <div className="kpi-value">{totalDrop}%</div>
            <div className={`kpi-delta ${Number(totalDrop) > 5 ? 'down' : 'up'}`}>
              <span>{Number(totalDrop) > 5 ? 'Elevated drop rate' : 'Normal row retention'}</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: anomalies > 0 ? '#FEF2F2' : '#F5F3FF', color: anomalies > 0 ? '#EF4444' : '#8B5CF6' }}>
                <Activity size={18} />
              </div>
              <span className="kpi-label">Volume Anomalies</span>
            </div>
            <div className="kpi-value" style={{ color: anomalies > 0 ? '#EF4444' : 'inherit' }}>{anomalies}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {anomalies > 0 ? `${anomalies} threshold breaches flagged` : 'All pipelines within expected bounds'}
            </div>
          </div>
        </div>

        {/* 2 Charts */}
        <div className="grid-2 mt-4">
          {/* Chart 1: Volume Over Time */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Volume Ingestion Over Time (Records)</span>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={timeChartData}>
                <defs>
                  <linearGradient id="volGradLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="rows" name="Source Rows" stroke="#3B82F6" fill="url(#volGradLive)" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Volume by Pipeline */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Total Records by Pipeline</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className={`pagination-btn ${viewUnit === 'Rows' ? 'active' : ''}`}
                  style={{ minWidth: 40, height: 24, fontSize: 11 }}
                  onClick={() => setViewUnit('Rows')}
                >
                  Rows
                </button>
                <button
                  className={`pagination-btn ${viewUnit === '%' ? 'active' : ''}`}
                  style={{ minWidth: 40, height: 24, fontSize: 11 }}
                  onClick={() => setViewUnit('%')}
                >
                  %
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              {pipelineGroups.map(p => {
                const pct = totalSourceRows > 0 ? Math.round((p.sourceRows / totalSourceRows) * 100) : 100;
                return (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 140, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ flex: 1, height: 8, background: '#EFF6FF', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(pct, 5)}%`, height: '100%', background: '#3B82F6', borderRadius: 99 }} />
                    </div>
                    <div style={{ width: 110, textAlign: 'right', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {viewUnit === 'Rows' ? `${p.sourceRows.toLocaleString()} rows` : `${pct}%`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Volume Checks Table */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Live Volume Checks ({filtered.length})</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="search-box">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search dataset or pipeline..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  style={{ width: 220, height: 30 }}
                />
              </div>
              <select className="select-control" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="All">All Status</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
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
                    <th>Source Dataset</th>
                    <th>Target Dataset</th>
                    <th>Source Rows</th>
                    <th>Target Rows</th>
                    <th>Row Drop %</th>
                    <th>Status</th>
                    <th>Detected At</th>
                    <th style={{ textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        No volume checks found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((v, idx) => {
                      const drop = v.row_drop_pct != null ? parseFloat(v.row_drop_pct) : 0;
                      const isPassed = (v.status ?? 'passed').toLowerCase() === 'passed' && drop < 20;

                      return (
                        <tr key={v.run_id ?? idx}>
                          <td style={{ fontWeight: 600 }}>{v.pipeline_name ?? 'etl'}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v.source_dataset ?? 'Source DB'}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v.target_dataset ?? 'Target DB'}
                          </td>
                          <td style={{ fontWeight: 600 }}>{(v.source_rows ?? 0).toLocaleString()}</td>
                          <td style={{ fontWeight: 600 }}>{(v.target_rows ?? 0).toLocaleString()}</td>
                          <td style={{ fontWeight: 600, color: drop > 10 ? '#EF4444' : '#10B981' }}>
                            {drop.toFixed(1)}%
                          </td>
                          <td>
                            <span className={`status-pill ${isPassed ? 'good' : 'critical'}`}>
                              {isPassed ? 'Passed' : 'Anomaly'}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {fmtTime(v.created_at)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="icon-btn" style={{ width: 28, height: 28 }}>
                              <MoreVertical size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
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
