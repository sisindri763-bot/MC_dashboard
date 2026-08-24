import { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle, Clock, AlertTriangle, Search, Filter,
  MoreVertical, Database, Info
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchFreshness } from '../../api/client';

const DEFAULT_FRESHNESS_ITEMS = [
  { id: 1, name: 'orders_fact', updated: '2 min ago', sla: '15 min', lag: '2 min', lagStatus: 'good', status: 'Fresh', owner: 'DE', ownerName: 'Data Eng' },
  { id: 2, name: 'user_events_stream', updated: '1 min ago', sla: '5 min', lag: '1 min', lagStatus: 'good', status: 'Fresh', owner: 'GR', ownerName: 'Growth' },
  { id: 3, name: 'inventory_snapshot', updated: '42 min ago', sla: '30 min', lag: '12 min', lagStatus: 'warn', status: 'Delayed', owner: 'SU', ownerName: 'Supply' },
  { id: 4, name: 'marketing_attribution', updated: '3 hr ago', sla: '1 hr', lag: '2 hr', lagStatus: 'bad', status: 'Stale', owner: 'MA', ownerName: 'Marketing' },
  { id: 5, name: 'payments_ledger', updated: '4 min ago', sla: '10 min', lag: '4 min', lagStatus: 'good', status: 'Fresh', owner: 'FI', ownerName: 'Finance' },
  { id: 6, name: 'support_tickets', updated: '58 min ago', sla: '1 hr', lag: '2 min', lagStatus: 'warn', status: 'Delayed', owner: 'CX', ownerName: 'CX' },
  { id: 7, name: 'warehouse_ops', updated: '6 hr ago', sla: '2 hr', lag: '4 hr', lagStatus: 'bad', status: 'Stale', owner: 'SU', ownerName: 'Supply' },
  { id: 8, name: 'session_rollups', updated: '3 min ago', sla: '15 min', lag: '3 min', lagStatus: 'good', status: 'Fresh', owner: 'GR', ownerName: 'Growth' },
];

export default function Freshness() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pipelines, setPipelines] = useState(DEFAULT_FRESHNESS_ITEMS);

  const filtered = useMemo(() => {
    return pipelines.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [pipelines, search]);

  const totalPipelines = 42;

  return (
    <div className="fade-in">
      <PageHeader
        title="Data Freshness"
        subtitle="Monitor how up-to-date your data is across all pipelines."
      />

      <div className="page-body">
        {/* Top 4 KPI Cards */}
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                  <CheckCircle size={15} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Fresh</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>81%</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>34</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Within SLA</div>
            <div className="progress-track" style={{ marginTop: 10, height: 4 }}>
              <div className="progress-fill green" style={{ width: '81%' }} />
            </div>
          </div>

          <div className="kpi-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}>
                  <Clock size={15} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Delayed</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>12%</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>5</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Outside SLA</div>
            <div className="progress-track" style={{ marginTop: 10, height: 4 }}>
              <div className="progress-fill orange" style={{ width: '12%' }} />
            </div>
          </div>

          <div className="kpi-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                  <AlertTriangle size={15} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Stale</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>7%</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>3</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>No recent updates</div>
            <div className="progress-track" style={{ marginTop: 10, height: 4 }}>
              <div className="progress-fill red" style={{ width: '7%' }} />
            </div>
          </div>

          <div className="kpi-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
                <Clock size={15} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Average Lag</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>14 min</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Across all pipelines</div>
          </div>
        </div>

        {/* Pipelines Table Card */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Pipelines</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="search-box">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search pipelines..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: 190, height: 30 }}
                />
              </div>
              <button className="icon-btn" style={{ width: 30, height: 30 }}>
                <Filter size={13} />
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="vithi-table">
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>Last Updated</th>
                  <th>SLA</th>
                  <th>Current Lag</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const lagColor = p.lagStatus === 'good' ? '#10B981' : p.lagStatus === 'warn' ? '#F59E0B' : '#EF4444';
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Database size={15} color="#3B82F6" />
                          <span style={{ fontWeight: 600 }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{p.updated}</td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{p.sla}</td>
                      <td style={{ fontSize: 12.5, fontWeight: 600, color: lagColor }}>{p.lag}</td>
                      <td>
                        <span className={`status-pill ${p.status.toLowerCase()}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div className="owner-chip">
                          <div className={`owner-circle ${p.owner.toLowerCase()}`}>{p.owner}</div>
                          <span>{p.ownerName}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="icon-btn" style={{ width: 28, height: 28 }}>
                          <MoreVertical size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-bar">
            <span>Showing 1 to 8 of {totalPipelines} pipelines</span>
            <div className="pagination-pages">
              <button className="pagination-btn" disabled>‹</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <span style={{ padding: '0 4px' }}>...</span>
              <button className="pagination-btn">6</button>
              <button className="pagination-btn">›</button>
              <select className="select-control" style={{ marginLeft: 8, padding: '4px 8px' }}>
                <option>10 / page</option>
                <option>25 / page</option>
              </select>
            </div>
          </div>

          {/* Bottom Info Banner */}
          <div className="info-notice">
            <Info size={14} style={{ flexShrink: 0 }} />
            <span>Freshness is calculated based on the time since the last successful update compared to the defined SLA for each pipeline.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
