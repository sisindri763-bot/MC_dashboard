import { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, AlertCircle, Info, Search, Filter, MoreVertical, ArrowUpRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchRecentIncidents } from '../api/client';

function fmtTime(ts) {
  if (!ts) return 'recently';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [openCount, setOpenCount] = useState(1);
  const [resolvedCount, setResolvedCount] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('All');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchRecentIncidents({ preset: 'all' });
      if (res) {
        const incList = res.items || res.incidents || (Array.isArray(res) ? res : []);
        setIncidents(incList);
        setOpenCount(res.open_incidents ?? incList.filter(i => (i.state || i.status || '').toLowerCase() === 'open').length);
        setResolvedCount(res.resolved_incidents ?? incList.filter(i => (i.state || i.status || '').toLowerCase() === 'resolved').length);
      }
    } catch (e) {
      console.error('Failed to load incidents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return incidents.filter(inc => {
      const title = inc.title ?? inc.pipeline_name ?? '';
      const desc = inc.description ?? '';
      const pName = inc.pipeline_name ?? '';
      const sev = inc.severity ?? 'Critical';

      const matchSearch = title.toLowerCase().includes(search.toLowerCase()) ||
                          desc.toLowerCase().includes(search.toLowerCase()) ||
                          pName.toLowerCase().includes(search.toLowerCase());
      const matchSev = sevFilter === 'All' || sev.toLowerCase() === sevFilter.toLowerCase();
      return matchSearch && matchSev;
    });
  }, [incidents, search, sevFilter]);

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
        title="Incidents"
        subtitle="Track and manage all data pipeline incidents."
        onRefresh={loadData}
        onDateChange={handleHeaderDateChange}
      />

      <div className="page-body">
        {/* Top 4 KPI Cards (Live Real Backend Data) */}
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div className="kpi-label">Active Open Incidents</div>
            <div className="kpi-value" style={{ color: '#EF4444', marginTop: 4 }}>{openCount}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Requiring immediate attention</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Critical Severity</div>
            <div className="kpi-value" style={{ color: '#F59E0B', marginTop: 4 }}>{incidents.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Pipeline runtime aborts</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Resolved Incidents</div>
            <div className="kpi-value" style={{ color: '#10B981', marginTop: 4 }}>{resolvedCount}</div>
            <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 2 }}>Successfully recovered</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total Logged Incidents</div>
            <div className="kpi-value" style={{ color: '#6366F1', marginTop: 4 }}>{incidents.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Across all historical runs</div>
          </div>
        </div>

        {/* Incidents Table Card */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Live Pipeline Incidents ({filtered.length})</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="search-box">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search error or pipeline..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: 220, height: 30 }}
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

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="table-wrapper">
              <table className="vithi-table">
                <thead>
                  <tr>
                    <th>Incident</th>
                    <th>Pipeline</th>
                    <th>Error Details / Trace</th>
                    <th>Severity</th>
                    <th>State</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        No incidents match your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(inc => (
                      <tr key={inc.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <AlertTriangle size={15} color="#EF4444" />
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {inc.title ?? `${inc.pipeline_name} failure`}
                            </span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{inc.pipeline_name}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inc.description ?? 'Database execution failure'}
                        </td>
                        <td>
                          <span className="status-pill critical">
                            {inc.severity ?? 'Critical'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${inc.state === 'OPEN' ? 'warning' : 'good'}`}>
                            {inc.state ?? 'OPEN'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {fmtTime(inc.start_time ?? inc.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
