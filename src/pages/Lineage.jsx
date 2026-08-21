import { useEffect, useState, useRef } from 'react';
import { Network, Database, GitBranch, ArrowRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchLineage } from '../api/client';

export default function Lineage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchLineage();
        setData(res);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}><LoadingSpinner /></div>;

  const nodes = Array.isArray(data) ? data : data?.nodes ?? data?.lineage ?? [];

  // Group by type
  const sources = nodes.filter(n => n.node_type === 'source' || n.type === 'source');
  const pipelines = nodes.filter(n => n.node_type === 'pipeline' || n.type === 'pipeline' || n.pipeline_name);
  const targets = nodes.filter(n => n.node_type === 'target' || n.type === 'target');

  // If no typed nodes, try to extract unique pipelines
  const allPipelines = pipelines.length > 0 ? pipelines : 
    [...new Map(nodes.map(n => [n.pipeline_name, n])).values()].filter(n => n.pipeline_name);

  return (
    <div className="fade-in">
      <PageHeader title="Lineage" subtitle="End-to-end data lineage graph showing source → pipeline → target." />

      <div className="page-body" style={{ paddingTop: 16 }}>
        {nodes.length === 0 ? (
          <div className="card">
            <div className="empty-state" style={{ padding: 60 }}>
              <Network size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div>No lineage data available</div>
              <div style={{ fontSize: 11, marginTop: 6, color: 'var(--text-muted)' }}>Configure pipeline lineage to see data flow</div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Data Lineage Graph</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{nodes.length} nodes</span>
            </div>
            <div style={{ overflowX: 'auto', padding: '20px 0' }}>
              {allPipelines.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '0 16px' }}>
                  {/* Source */}
                  <div className="lineage-node source" style={{ minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Database size={14} color="#60A5FA" />
                      <span style={{ fontSize: 10, color: '#60A5FA', fontWeight: 600, textTransform: 'uppercase' }}>Source</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.source_system ?? p.system_name ?? 'Source DB'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.database_name ?? p.source_db ?? '—'}</div>
                  </div>

                  <ArrowRight size={18} color="rgba(255,255,255,0.2)" />

                  {/* Pipeline */}
                  <div className="lineage-node pipeline" style={{ minWidth: 180 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <GitBranch size={14} color="#A78BFA" />
                      <span style={{ fontSize: 10, color: '#A78BFA', fontWeight: 600, textTransform: 'uppercase' }}>Pipeline</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.pipeline_name ?? '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.tool ?? p.dbt_project ?? 'dbt'}</div>
                  </div>

                  <ArrowRight size={18} color="rgba(255,255,255,0.2)" />

                  {/* Target */}
                  <div className="lineage-node target" style={{ minWidth: 160 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Database size={14} color="#4ADE80" />
                      <span style={{ fontSize: 10, color: '#4ADE80', fontWeight: 600, textTransform: 'uppercase' }}>Target</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.target_system ?? p.schema_name ?? 'Warehouse'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.object_name ?? p.target_table ?? '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
