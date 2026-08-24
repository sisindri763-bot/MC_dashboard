import { useEffect, useState } from 'react';
import { Layout, Plus, Minus, Search, Filter, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';

const DEFAULT_SCHEMA_DATA = [
  { id: 1, dataset: 'orders_fact', pipeline: 'Orders_Load', runId: 'run_9128', added: ['discount_code', 'tax_rate'], dropped: [], status: 'Warning', detected: '10m ago' },
  { id: 2, dataset: 'customer_profiles', pipeline: 'Customer_Sync', runId: 'run_9124', added: ['customer_tier'], dropped: [], status: 'Warning', detected: '30m ago' },
  { id: 3, dataset: 'inventory_snapshot', pipeline: 'Inventory_Update', runId: 'run_9118', added: [], dropped: ['legacy_sku'], status: 'Critical', detected: '1h ago' },
  { id: 4, dataset: 'payments_ledger', pipeline: 'Payments_Processing', runId: 'run_9110', added: [], dropped: [], status: 'Valid', detected: '2h ago' },
  { id: 5, dataset: 'user_events_stream', pipeline: 'User_Activity', runId: 'run_9105', added: ['session_metadata'], dropped: [], status: 'Warning', detected: '3h ago' },
];

export default function Schema() {
  const [data, setData] = useState(DEFAULT_SCHEMA_DATA);
  const [search, setSearch] = useState('');

  const stable = data.filter(d => d.status === 'Valid').length;
  const drifted = data.length - stable;

  return (
    <div className="fade-in">
      <PageHeader
        title="Schema"
        subtitle="Monitor column-level schema drift across pipeline runs."
      />

      <div className="page-body">
        {/* 4 Summary Cards */}
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div className="kpi-label">Stable Datasets</div>
            <div className="kpi-value" style={{ color: '#10B981', marginTop: 4 }}>{stable + 18}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>No schema changes detected</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Drifted Datasets</div>
            <div className="kpi-value" style={{ color: '#F59E0B', marginTop: 4 }}>{drifted}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Schema changes detected</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Schema Health Score</div>
            <div className="kpi-value" style={{ color: '#6366F1', marginTop: 4 }}>93.0%</div>
            <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 2 }}>↑ 1.2% vs yesterday</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Tracked Datasets</div>
            <div className="kpi-value" style={{ color: '#3B82F6', marginTop: 4 }}>42</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Across all active pipelines</div>
          </div>
        </div>

        {/* Schema Drift History Table */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Schema Drift History</span>
            <div className="search-box">
              <Search size={13} />
              <input
                type="text"
                placeholder="Search dataset..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: 180, height: 30 }}
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="vithi-table">
              <thead>
                <tr>
                  <th>Dataset</th>
                  <th>Pipeline</th>
                  <th>Run ID</th>
                  <th>Columns Added</th>
                  <th>Columns Dropped</th>
                  <th>Status</th>
                  <th>Detected At</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Database size={15} color="#6366F1" />
                        <span style={{ fontWeight: 600 }}>{d.dataset}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{d.pipeline}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 11.5, background: 'var(--bg-card-subtle)', padding: '2px 6px', borderRadius: 4 }}>
                        {d.runId}
                      </span>
                    </td>
                    <td>
                      {d.added.length > 0 ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10B981', fontWeight: 600, fontSize: 12 }}>
                          <Plus size={12} /> {d.added.join(', ')}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {d.dropped.length > 0 ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#EF4444', fontWeight: 600, fontSize: 12 }}>
                          <Minus size={12} /> {d.dropped.join(', ')}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${d.status.toLowerCase()}`}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.detected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
