import { useEffect, useState } from 'react';
import { AlertOctagon, AlertTriangle, Info, Search, Filter } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchRecentIncidents } from '../api/client';

function fmtTime(ts) {
  if (!ts) return '—';
  const diff = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.round(diff/60)}h ago`;
  return `${Math.round(diff/1440)}d ago`;
}

function SevIcon({ sev }) {
  const s = (sev ?? '').toLowerCase();
  if (s === 'high' || s === 'critical') return <AlertOctagon size={15} color="#EF4444" />;
  if (s === 'medium') return <AlertTriangle size={15} color="#F59E0B" />;
  return <Info size={15} color="#3B82F6" />;
}

const ITEMS_PER_PAGE = 10;

export default function Incidents() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchRecentIncidents({ limit: 100 });
        setData(Array.isArray(res) ? res : res?.incidents ?? []);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = data.filter(d => {
    const nameMatch = (d.pipeline_name ?? '').toLowerCase().includes(search.toLowerCase());
    const sevMatch = !sevFilter || (d.severity ?? '').toLowerCase() === sevFilter;
    return nameMatch && sevMatch;
  });

  const pageData = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const open = data.filter(d => (d.incident_status ?? 'open').toLowerCase() === 'open').length;
  const resolved = data.length - open;

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><LoadingSpinner /></div>;

  return (
    <div className="fade-in">
      <PageHeader title="Incidents" subtitle="Track and manage all data pipeline incidents." />

      <div className="page-body" style={{ paddingTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Total Incidents', value: data.length, color: '#6C63FF' },
            { label: 'Open', value: open, color: '#EF4444' },
            { label: 'Resolved', value: resolved, color: '#22C55E' },
            { label: 'High Severity', value: data.filter(d=>(d.severity??'').toLowerCase()==='high'||d.severity==='critical').length, color: '#F59E0B' },
          ].map(c => (
            <div key={c.label} className="card">
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        <div className="card mt-6">
          <div className="card-header">
            <span className="card-title">All Incidents ({filtered.length})</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="select-input" value={sevFilter} onChange={e => { setSevFilter(e.target.value); setPage(1); }}>
                <option value="">All Severity</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <div className="search-wrap">
                <Search size={13} />
                <input className="search-input" placeholder="Search incidents..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Pipeline</th>
                  <th>Error</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Detected At</th>
                  <th>Blast Radius</th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 && <tr><td colSpan={7} className="empty-state">No incidents found</td></tr>}
                {pageData.map((inc, i) => (
                  <tr key={i}>
                    <td style={{ width: 30 }}><SevIcon sev={inc.severity} /></td>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{inc.pipeline_name ?? '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inc.error_message ?? inc.description ?? '—'}
                    </td>
                    <td><StatusBadge status={inc.severity ?? 'Medium'} /></td>
                    <td><StatusBadge status={inc.incident_status ?? 'Open'} /></td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtTime(inc.detected_at ?? inc.failed_at)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{inc.blast_radius ?? inc.affected_datasets ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span className="pagination-info">Showing {Math.min((page-1)*ITEMS_PER_PAGE+1, filtered.length)} to {Math.min(page*ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page===1} onClick={()=>setPage(p=>p-1)}>‹</button>
              {Array.from({length:Math.min(totalPages,6)},(_,i)=>i+1).map(p=>(
                <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={()=>setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
