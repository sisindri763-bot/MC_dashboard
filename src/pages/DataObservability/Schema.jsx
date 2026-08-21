import { useEffect, useState } from 'react';
import { Layout, GitBranch, MoreVertical, Plus, Minus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { fetchSchema } from '../../api/client';

function fmtTime(ts) {
  if (!ts) return '—';
  const diff = Math.round((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 60) return `${diff}m ago`;
  return `${Math.round(diff/60)}h ago`;
}

export default function Schema() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchSchema();
        setData(Array.isArray(res) ? res : res?.datasets ?? res?.schema_drift ?? []);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><LoadingSpinner /></div>;

  const stable = data.filter(d => !d.has_drift && (d.columns_added?.length ?? 0) === 0 && (d.columns_dropped?.length ?? 0) === 0).length;
  const drifted = data.length - stable;

  return (
    <div className="fade-in">
      <PageHeader title="Schema" subtitle="Monitor column-level schema drift across pipeline runs." />

      <div className="page-body" style={{ paddingTop: 16 }}>
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Stable', value: stable, color: '#22C55E', desc: 'No schema changes detected' },
            { label: 'Drifted', value: drifted, color: '#F59E0B', desc: 'Schema changes detected' },
            { label: 'Schema Score', value: data.length > 0 ? `${Math.round(stable/data.length*100)}%` : '—', color: '#6C63FF', desc: 'Overall schema health' },
            { label: 'Total Datasets', value: data.length, color: '#3B82F6', desc: 'Tracked datasets' },
          ].map((c) => (
            <div key={c.label} className="card">
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Schema Drift Table */}
        <div className="card mt-6">
          <div className="card-header">
            <span className="card-title">Schema Drift History</span>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dataset</th>
                  <th>Pipeline</th>
                  <th>Run</th>
                  <th>Columns Added</th>
                  <th>Columns Dropped</th>
                  <th>Type Changes</th>
                  <th>Status</th>
                  <th>Detected At</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr><td colSpan={8} className="empty-state">No schema drift data</td></tr>
                )}
                {data.map((d, i) => {
                  const added = d.columns_added ?? [];
                  const dropped = d.columns_dropped ?? [];
                  const hasDrift = added.length > 0 || dropped.length > 0 || d.has_drift;
                  return (
                    <tr key={i}>
                      <td style={{ fontSize: 12, fontWeight: 500 }}>{d.object_name ?? d.dataset ?? '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.pipeline_name ?? '—'}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.run_id?.substring(0,8) ?? '—'}</td>
                      <td>
                        {added.length > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#22C55E', fontSize: 12 }}>
                            <Plus size={11} /> {added.join(', ')}
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td>
                        {dropped.length > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#EF4444', fontSize: 12 }}>
                            <Minus size={11} /> {dropped.join(', ')}
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.type_changes?.length ?? 0}</td>
                      <td><StatusBadge status={hasDrift ? 'Warning' : 'Valid'} /></td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtTime(d.run_start ?? d.observed_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
