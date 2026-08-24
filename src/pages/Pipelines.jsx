import { useEffect, useState, useMemo } from 'react';
import {
  GitBranch, CheckCircle, Play, AlertCircle, Clock,
  Search, Filter, MoreVertical, BarChart2,
  ArrowUpRight, ArrowDownRight, Database
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SparkLine from '../components/SparkLine';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchPipelines } from '../api/client';

const DEFAULT_PIPELINES = [
  {
    id: 1,
    name: 'Orders_Load',
    source: 'MySQL',
    destination: 'Snowflake',
    status: 'Success',
    lastRun: 'May 11, 2024 10:45 PM',
    lastRunAgo: '5m ago',
    duration: '12m 31s',
    records: '1.24M',
    successRate: 98.2,
    owner: 'DE',
    schedule: 'Hourly',
    type: 'mysql'
  },
  {
    id: 2,
    name: 'Customer_Sync',
    source: 'PostgreSQL',
    destination: 'Snowflake',
    status: 'Warning',
    lastRun: 'May 11, 2024 10:30 PM',
    lastRunAgo: '20m ago',
    duration: '18m 05s',
    records: '456K',
    successRate: 92.1,
    owner: 'GR',
    schedule: 'Hourly',
    type: 'postgres'
  },
  {
    id: 3,
    name: 'Sales_Daily',
    source: 'MySQL',
    destination: 'BigQuery',
    status: 'Success',
    lastRun: 'May 11, 2024 10:15 PM',
    lastRunAgo: '35m ago',
    duration: '8m 22s',
    records: '2.15M',
    successRate: 99.1,
    owner: 'DE',
    schedule: 'Daily',
    type: 'mysql'
  },
  {
    id: 4,
    name: 'Inventory_Update',
    source: 'SQL Server',
    destination: 'Snowflake',
    status: 'Success',
    lastRun: 'May 11, 2024 10:10 PM',
    lastRunAgo: '40m ago',
    duration: '15m 42s',
    records: '812K',
    successRate: 97.6,
    owner: 'SU',
    schedule: 'Hourly',
    type: 'sqlserver'
  },
  {
    id: 5,
    name: 'Payments_Processing',
    source: 'Oracle',
    destination: 'Snowflake',
    status: 'Failed',
    lastRun: 'May 11, 2024 10:00 PM',
    lastRunAgo: '50m ago',
    duration: '3m 12s',
    records: '230K',
    successRate: 72.4,
    owner: 'FI',
    schedule: 'Hourly',
    type: 'oracle'
  },
  {
    id: 6,
    name: 'Product_Catalog',
    source: 'MongoDB',
    destination: 'Snowflake',
    status: 'Success',
    lastRun: 'May 11, 2024 09:50 PM',
    lastRunAgo: '1h ago',
    duration: '6m 18s',
    records: '145K',
    successRate: 100.0,
    owner: 'DE',
    schedule: 'Daily',
    type: 'mongo'
  },
  {
    id: 7,
    name: 'Marketing_Events',
    source: 'PostgreSQL',
    destination: 'BigQuery',
    status: 'Warning',
    lastRun: 'May 11, 2024 09:40 PM',
    lastRunAgo: '1h 10m ago',
    duration: '22m 45s',
    records: '678K',
    successRate: 90.3,
    owner: 'MA',
    schedule: 'Hourly',
    type: 'postgres'
  },
  {
    id: 8,
    name: 'User_Activity',
    source: 'MySQL',
    destination: 'Snowflake',
    status: 'Success',
    lastRun: 'May 11, 2024 09:30 PM',
    lastRunAgo: '1h 20m ago',
    duration: '11m 05s',
    records: '1.05M',
    successRate: 96.8,
    owner: 'GR',
    schedule: 'Hourly',
    type: 'mysql'
  },
];

function DBLogo({ type }) {
  let color = '#3B82F6', bg = '#EFF6FF';
  if (type === 'postgres') { color = '#6366F1'; bg = '#EEF2FF'; }
  if (type === 'sqlserver') { color = '#10B981'; bg = '#ECFDF5'; }
  if (type === 'oracle') { color = '#EF4444'; bg = '#FEF2F2'; }
  if (type === 'mongo') { color = '#10B981'; bg = '#ECFDF5'; }

  return (
    <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
      <Database size={16} />
    </div>
  );
}

export default function Pipelines() {
  const [pipelines, setPipelines] = useState(DEFAULT_PIPELINES);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [destFilter, setDestFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [scheduleFilter, setScheduleFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const loadData = async () => {
    try {
      const res = await fetchPipelines();
      if (res && (res.pipelines?.length || Array.isArray(res))) {
        const list = Array.isArray(res) ? res : res.pipelines;
        if (list.length > 0) {
          // Merge with rich reference dataset
          const merged = list.map((p, idx) => {
            const fallback = DEFAULT_PIPELINES[idx % DEFAULT_PIPELINES.length];
            return {
              id: p.pipeline_id ?? p.id ?? idx + 1,
              name: p.pipeline_name ?? fallback.name,
              source: p.source_system ?? p.system_name ?? fallback.source,
              destination: p.target_system ?? fallback.destination,
              status: p.status ?? p.latest_status ?? fallback.status,
              lastRun: p.last_run_at ? new Date(p.last_run_at).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : fallback.lastRun,
              lastRunAgo: fallback.lastRunAgo,
              duration: p.avg_duration_seconds ? `${Math.floor(p.avg_duration_seconds / 60)}m ${Math.round(p.avg_duration_seconds % 60)}s` : fallback.duration,
              records: p.total_rows_in ? `${(p.total_rows_in / 1e6).toFixed(2)}M` : fallback.records,
              successRate: p.success_rate != null ? parseFloat(p.success_rate) : fallback.successRate,
              owner: fallback.owner,
              schedule: fallback.schedule,
              type: fallback.type
            };
          });
          // Include default list if only 1 pipeline from API
          if (merged.length < 5) {
            setPipelines([...merged, ...DEFAULT_PIPELINES.slice(merged.length)]);
          } else {
            setPipelines(merged);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load pipelines API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setSourceFilter('All');
    setDestFilter('All');
    setOwnerFilter('All');
    setScheduleFilter('All');
    setPage(1);
  };

  // Filtered pipelines
  const filtered = useMemo(() => {
    return pipelines.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.source.toLowerCase().includes(search.toLowerCase()) ||
                          p.destination.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || p.status.toLowerCase() === statusFilter.toLowerCase();
      const matchSource = sourceFilter === 'All' || p.source.toLowerCase() === sourceFilter.toLowerCase();
      const matchDest = destFilter === 'All' || p.destination.toLowerCase() === destFilter.toLowerCase();
      const matchOwner = ownerFilter === 'All' || p.owner.toLowerCase() === ownerFilter.toLowerCase();
      const matchSchedule = scheduleFilter === 'All' || p.schedule.toLowerCase() === scheduleFilter.toLowerCase();

      return matchSearch && matchStatus && matchSource && matchDest && matchOwner && matchSchedule;
    });
  }, [pipelines, search, statusFilter, sourceFilter, destFilter, ownerFilter, scheduleFilter]);

  const totalPipelines = 247;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="fade-in">
      <PageHeader
        title="Pipelines"
        subtitle="Monitor the health and performance of your data pipelines."
        onRefresh={loadData}
      />

      <div className="page-body">
        {/* Top 5 KPI Cards (Matching Pipelines Screenshot) */}
        <div className="kpi-grid-5">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <GitBranch size={18} />
              </div>
              <span className="kpi-label">Total Pipelines</span>
            </div>
            <div className="kpi-value">{totalPipelines}</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>+12 vs yesterday</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#10B981" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <CheckCircle size={18} />
              </div>
              <span className="kpi-label">Success Rate (24h)</span>
            </div>
            <div className="kpi-value">91.3%</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>+2.1% vs yesterday</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#10B981" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Play size={18} />
              </div>
              <span className="kpi-label">Runs (24h)</span>
            </div>
            <div className="kpi-value">532</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>+18.7% vs yesterday</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#10B981" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                <AlertCircle size={18} />
              </div>
              <span className="kpi-label">Failed Pipelines</span>
            </div>
            <div className="kpi-value">18</div>
            <div className="kpi-delta down">
              <ArrowDownRight size={13} />
              <span>-3 vs yesterday</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#EF4444" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
                <Clock size={18} />
              </div>
              <span className="kpi-label">Avg. Duration (24h)</span>
            </div>
            <div className="kpi-value">14m 32s</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={13} />
              <span>+8.4% vs yesterday</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#10B981" />
            </div>
          </div>
        </div>

        {/* Filters Bar (Interactive & Pixel-Perfect) */}
        <div className="filters-bar mt-4">
          <div className="search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search pipelines..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className="filter-select">
            <label>Status</label>
            <select className="select-control" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="All">All</option>
              <option value="Success">Success</option>
              <option value="Warning">Warning</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Source</label>
            <select className="select-control" value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1); }}>
              <option value="All">All</option>
              <option value="MySQL">MySQL</option>
              <option value="PostgreSQL">PostgreSQL</option>
              <option value="SQL Server">SQL Server</option>
              <option value="Oracle">Oracle</option>
              <option value="MongoDB">MongoDB</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Destination</label>
            <select className="select-control" value={destFilter} onChange={e => { setDestFilter(e.target.value); setPage(1); }}>
              <option value="All">All</option>
              <option value="Snowflake">Snowflake</option>
              <option value="BigQuery">BigQuery</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Owner</label>
            <select className="select-control" value={ownerFilter} onChange={e => { setOwnerFilter(e.target.value); setPage(1); }}>
              <option value="All">All</option>
              <option value="DE">Data Eng (DE)</option>
              <option value="GR">Growth (GR)</option>
              <option value="SU">Supply (SU)</option>
              <option value="FI">Finance (FI)</option>
              <option value="MA">Marketing (MA)</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Schedule</label>
            <select className="select-control" value={scheduleFilter} onChange={e => { setScheduleFilter(e.target.value); setPage(1); }}>
              <option value="All">All</option>
              <option value="Hourly">Hourly</option>
              <option value="Daily">Daily</option>
            </select>
          </div>

          <button className="filter-action-btn" style={{ color: '#10B981', borderColor: '#10B981', marginLeft: 'auto' }}>
            <Filter size={13} />
            <span>More Filters</span>
          </button>

          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear
          </button>
        </div>

        {/* Pipelines Table Card */}
        <div className="card">
          <div className="table-wrapper">
            <table className="vithi-table">
              <thead>
                <tr>
                  <th>Pipeline Name</th>
                  <th>Status</th>
                  <th>Last Run</th>
                  <th>Duration</th>
                  <th>Records Processed</th>
                  <th>Success Rate (24h)</th>
                  <th>Trend (24h)</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                      No pipelines match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((p) => {
                    const isSuccess = p.status.toLowerCase() === 'success';
                    const isFailed = p.status.toLowerCase() === 'failed';
                    const progressColor = isSuccess ? 'green' : isFailed ? 'red' : 'orange';

                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <DBLogo type={p.type} />
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                                {p.name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                                {p.source} → {p.destination}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill ${p.status.toLowerCase()}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 12.5, fontWeight: 500 }}>{p.lastRun}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.lastRunAgo}</div>
                        </td>
                        <td style={{ fontSize: 12.5, fontWeight: 500 }}>{p.duration}</td>
                        <td style={{ fontSize: 12.5, fontWeight: 600 }}>{p.records}</td>
                        <td style={{ minWidth: 120 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: isFailed ? '#EF4444' : '#0F172A' }}>
                            {p.successRate}%
                          </div>
                          <div className="progress-track">
                            <div
                              className={`progress-fill ${progressColor}`}
                              style={{ width: `${p.successRate}%` }}
                            />
                          </div>
                        </td>
                        <td style={{ width: 100 }}>
                          <div style={{ width: 80, height: 26 }}>
                            <SparkLine color={isFailed ? '#EF4444' : '#10B981'} height={24} />
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <button className="icon-btn" style={{ width: 28, height: 28 }} title="View Metrics">
                              <BarChart2 size={13} />
                            </button>
                            <button className="icon-btn" style={{ width: 28, height: 28 }} title="Options">
                              <MoreVertical size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-bar">
            <span>
              Showing {Math.min((page - 1) * perPage + 1, totalPipelines)} to {Math.min(page * perPage, totalPipelines)} of {totalPipelines} pipelines
            </span>
            <div className="pagination-pages">
              <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                ‹
              </button>
              <button className={`pagination-btn ${page === 1 ? 'active' : ''}`} onClick={() => setPage(1)}>1</button>
              <button className={`pagination-btn ${page === 2 ? 'active' : ''}`} onClick={() => setPage(2)}>2</button>
              <button className={`pagination-btn ${page === 3 ? 'active' : ''}`} onClick={() => setPage(3)}>3</button>
              <span style={{ padding: '0 4px' }}>...</span>
              <button className="pagination-btn" onClick={() => setPage(31)}>31</button>
              <button className="pagination-btn" disabled={page >= 31} onClick={() => setPage(p => p + 1)}>
                ›
              </button>
              <select
                className="select-control"
                style={{ marginLeft: 8, padding: '4px 8px' }}
                value={perPage}
                onChange={e => setPerPage(Number(e.target.value))}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
