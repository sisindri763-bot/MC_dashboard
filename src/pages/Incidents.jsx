import { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Search, Filter, MoreVertical, ArrowUpRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const ALL_INCIDENTS = [
  { id: 1, title: 'Freshness issue in sales_daily_summary', pipeline: 'Sales_Daily', error: 'Table not updated in expected time window (lag > 2hr)', severity: 'Critical', status: 'Open', time: '10m ago', blast: '5 downstream dashboards' },
  { id: 2, title: 'Volume drop in marketing_campaign_performance', pipeline: 'Marketing_Events', error: 'Row count dropped by 62% vs 7-day average', severity: 'High', status: 'Open', time: '20m ago', blast: '3 ML models' },
  { id: 3, title: 'Data quality issue in finance.transactions', pipeline: 'Payments_Processing', error: 'Null values in amount column > 5%', severity: 'Medium', status: 'Investigating', time: '35m ago', blast: 'Executive Financial Summary' },
  { id: 4, title: 'Schema change detected in customer_profiles', pipeline: 'Customer_Sync', error: 'New column \'customer_tier\' added to table schema', severity: 'Low', status: 'Resolved', time: '1h ago', blast: 'None' },
  { id: 5, title: 'Pipeline failure in inventory_snapshot', pipeline: 'Inventory_Update', error: 'Snowflake connection timeout error 504', severity: 'Low', status: 'Resolved', time: '2h ago', blast: 'Inventory Ops' },
];

export default function Incidents() {
  const [incidents, setIncidents] = useState(ALL_INCIDENTS);
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('All');

  const filtered = incidents.filter(inc => {
    const matchSearch = inc.title.toLowerCase().includes(search.toLowerCase()) || inc.pipeline.toLowerCase().includes(search.toLowerCase());
    const matchSev = sevFilter === 'All' || inc.severity === sevFilter;
    return matchSearch && matchSev;
  });

  const openCount = incidents.filter(i => i.status === 'Open').length;
  const criticalCount = incidents.filter(i => i.severity === 'Critical' || i.severity === 'High').length;

  return (
    <div className="fade-in">
      <PageHeader
        title="Incidents"
        subtitle="Track and manage all data pipeline incidents."
      />

      <div className="page-body">
        {/* 4 Summary Cards */}
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div className="kpi-label">Active Incidents</div>
            <div className="kpi-value" style={{ color: '#EF4444', marginTop: 4 }}>{openCount}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Requiring immediate attention</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Critical & High Severity</div>
            <div className="kpi-value" style={{ color: '#F59E0B', marginTop: 4 }}>{criticalCount}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Blocking downstream assets</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Resolved Today</div>
            <div className="kpi-value" style={{ color: '#10B981', marginTop: 4 }}>2</div>
            <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 2 }}>Mean Time to Resolve: 18m</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total Incidents (30d)</div>
            <div className="kpi-value" style={{ color: '#6366F1', marginTop: 4 }}>12</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>↓ 4 vs previous period</div>
          </div>
        </div>

        {/* Incidents Table Card */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">All Incidents</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="search-box">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: 180, height: 30 }}
                />
              </div>
              <select className="select-control" value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
                <option value="All">All Severity</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="vithi-table">
              <thead>
                <tr>
                  <th>Incident</th>
                  <th>Pipeline</th>
                  <th>Error Description</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Blast Radius</th>
                  <th>Detected At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inc => (
                  <tr key={inc.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inc.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{inc.pipeline}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inc.error}
                    </td>
                    <td>
                      <span className={`status-pill ${inc.severity.toLowerCase()}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${inc.status.toLowerCase()}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{inc.blast}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inc.time}</td>
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
