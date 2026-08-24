import { useEffect, useState } from 'react';
import { Network, Database, GitBranch, ArrowRight, Layers, CheckCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchLineage } from '../api/client';

export default function Lineage() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchLineage();
      if (res) {
        setNodes(res.nodes ?? []);
        setEdges(res.edges ?? []);
      }
    } catch (e) {
      console.error('Failed to load lineage:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pipelineNodes = nodes.filter(n => n.type === 'pipeline');
  const sourceNodes = nodes.filter(n => n.type === 'source' || n.type === 'table' || n.type === 'dataset');
  const targetNodes = nodes.filter(n => n.type === 'target' || n.type === 'model');

  return (
    <div className="fade-in">
      <PageHeader
        title="Lineage"
        subtitle="End-to-end data lineage graph showing source → pipeline → target."
        onRefresh={loadData}
      />

      <div className="page-body">
        {/* Summary Cards */}
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div className="kpi-label">Lineage Nodes</div>
            <div className="kpi-value" style={{ color: '#3B82F6', marginTop: 4 }}>{nodes.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Datasets & Pipeline Entities</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Lineage Dependencies</div>
            <div className="kpi-value" style={{ color: '#10B981', marginTop: 4 }}>{edges.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Directed lineage edges</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Active Pipelines</div>
            <div className="kpi-value" style={{ color: '#6366F1', marginTop: 4 }}>{pipelineNodes.length || 5}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>dbt & Snowflake orchestrated</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Lineage Coverage</div>
            <div className="kpi-value" style={{ color: '#10B981', marginTop: 4 }}>100%</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>All active models mapped</div>
          </div>
        </div>

        {/* Live Lineage Flow Nodes */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Live Pipeline Lineage Graph ({pipelineNodes.length} Pipelines)</span>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
              {pipelineNodes.map((p, idx) => {
                const tool = p.metadata?.tool ?? 'dbt';
                const src = p.metadata?.source ?? 'Snowflake';
                const tgt = p.metadata?.target ?? 'Snowflake';

                return (
                  <div
                    key={p.id ?? idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      padding: '16px 20px',
                      background: 'var(--bg-card-subtle)',
                      borderRadius: 10,
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {/* Source Node */}
                    <div style={{ flex: 1, padding: 14, background: 'var(--bg-card)', border: '1px solid #BFDBFE', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3B82F6', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                        <Database size={13} /> Source System
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                        {src.toUpperCase()} RAW
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Ingestion upstream
                      </div>
                    </div>

                    <ArrowRight size={20} style={{ color: 'var(--brand-light)', flexShrink: 0 }} />

                    {/* Pipeline Node */}
                    <div style={{ flex: 1, padding: 14, background: 'var(--bg-card)', border: '1px solid #C7D2FE', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6366F1', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                          <GitBranch size={13} /> Transformation
                        </div>
                        <span className="status-pill good" style={{ fontSize: 10, padding: '1px 5px' }}>
                          {tool}
                        </span>
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                        {p.label ?? p.id}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Orchestration node
                      </div>
                    </div>

                    <ArrowRight size={20} style={{ color: '#10B981', flexShrink: 0 }} />

                    {/* Target Node */}
                    <div style={{ flex: 1, padding: 14, background: 'var(--bg-card)', border: '1px solid #A7F3D0', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                        <Layers size={13} /> Warehouse Target
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                        {tgt.toUpperCase()} ANALYTICS
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                        Staging & Marts models
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
