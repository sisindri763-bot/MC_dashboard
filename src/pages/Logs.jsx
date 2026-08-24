import { useEffect, useState } from 'react';
import { Search, Filter, Terminal, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const DEFAULT_LOGS = [
  { id: 'run_9128', pipeline: 'Orders_Load', status: 'Success', duration: '12m 31s', time: 'May 11, 2024 10:45 PM', queries: ['SELECT * FROM mysql.raw_orders WHERE created_at >= NOW() - INTERVAL 1 HOUR;', 'INSERT INTO snowflake.analytics.orders_fact VALUES (...);', 'MERGE INTO snowflake.analytics.orders_dim USING temp_orders ON id;'] },
  { id: 'run_9124', pipeline: 'Customer_Sync', status: 'Warning', duration: '18m 05s', time: 'May 11, 2024 10:30 PM', queries: ['SELECT id, email, tier FROM postgres.users WHERE updated_at >= NOW() - INTERVAL 1 HOUR;', 'WARNING: 12 rows missing postal_code in customer payload'] },
  { id: 'run_9118', pipeline: 'Payments_Processing', status: 'Failed', duration: '3m 12s', time: 'May 11, 2024 10:00 PM', queries: ['CONNECT TO oracle_financials_cluster_prod;', 'ERROR 504: Gateway Timeout connecting to Oracle Financial DB endpoint'] },
  { id: 'run_9110', pipeline: 'Sales_Daily', status: 'Success', duration: '8m 22s', time: 'May 11, 2024 10:15 PM', queries: ['dbt run --select models/marts/sales_daily_summary', 'Finished running 1 incremental model in 8.35s. Completed successfully.'] },
];

export default function Logs() {
  const [logs, setLogs] = useState(DEFAULT_LOGS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expanded, setExpanded] = useState(null);

  const filtered = logs.filter(l => {
    const matchSearch = l.pipeline.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="fade-in">
      <PageHeader
        title="Logs"
        subtitle="Searchable execution logs and query traces."
      />

      <div className="page-body">
        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <Search size={13} />
            <input
              type="text"
              placeholder="Search pipeline or Run ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 240 }}
            />
          </div>

          <div className="filter-select">
            <label>Status</label>
            <select className="select-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Logs</option>
              <option value="Success">Success</option>
              <option value="Warning">Warning</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Logs List */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Execution Log Traces</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(l => {
              const isExp = expanded === l.id;
              return (
                <div
                  key={l.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 12,
                    background: isExp ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
                    transition: 'all 0.15s'
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    onClick={() => setExpanded(isExp ? null : l.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.pipeline}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--bg-card-subtle)', padding: '2px 6px', borderRadius: 4 }}>
                        {l.id}
                      </span>
                      <span className={`status-pill ${l.status.toLowerCase()}`}>
                        {l.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span>⏱ {l.duration}</span>
                      <span>{l.time}</span>
                    </div>
                  </div>

                  {isExp && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Query Log Details:
                      </div>
                      <div style={{ background: '#0F172A', color: '#E2E8F0', padding: 10, borderRadius: 6, fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.6 }}>
                        {l.queries.map((q, idx) => (
                          <div key={idx} style={{ color: q.includes('ERROR') ? '#F87171' : q.includes('WARNING') ? '#FCD34D' : '#A7F3D0' }}>
                            &gt; {q}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
