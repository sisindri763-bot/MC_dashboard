import { useEffect, useState } from 'react';
import { Network, Database, GitBranch, ArrowRight, Layers, CheckCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const LINEAGE_FLOWS = [
  {
    id: 1,
    source: { name: 'MySQL Raw DB', schema: 'ecom_orders', type: 'mysql' },
    pipeline: { name: 'Orders_Load', tool: 'dbt Cloud', status: 'Success' },
    target: { name: 'Snowflake Analytics', schema: 'analytics.orders_fact', type: 'snowflake' }
  },
  {
    id: 2,
    source: { name: 'PostgreSQL DB', schema: 'users_auth', type: 'postgres' },
    pipeline: { name: 'Customer_Sync', tool: 'Airflow', status: 'Warning' },
    target: { name: 'Snowflake DW', schema: 'core.dim_customers', type: 'snowflake' }
  },
  {
    id: 3,
    source: { name: 'MongoDB Cluster', schema: 'product_catalog', type: 'mongo' },
    pipeline: { name: 'Product_Catalog', tool: 'dbt Core', status: 'Success' },
    target: { name: 'Snowflake DW', schema: 'core.dim_products', type: 'snowflake' }
  },
  {
    id: 4,
    source: { name: 'Oracle Financials', schema: 'ledger_entries', type: 'oracle' },
    pipeline: { name: 'Payments_Processing', tool: 'Airflow', status: 'Failed' },
    target: { name: 'Snowflake DW', schema: 'finance.payments_fact', type: 'snowflake' }
  },
  {
    id: 5,
    source: { name: 'PostgreSQL DB', schema: 'marketing_leads', type: 'postgres' },
    pipeline: { name: 'Marketing_Events', tool: 'Fivetran', status: 'Warning' },
    target: { name: 'Google BigQuery', schema: 'mktg.campaign_attribution', type: 'bigquery' }
  },
];

export default function Lineage() {
  const [flows, setFlows] = useState(LINEAGE_FLOWS);

  return (
    <div className="fade-in">
      <PageHeader
        title="Lineage"
        subtitle="End-to-end data lineage graph showing source → pipeline → target."
      />

      <div className="page-body">
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div className="kpi-label">Total Data Sources</div>
            <div className="kpi-value" style={{ color: '#3B82F6', marginTop: 4 }}>5</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>MySQL, Postgres, Oracle, Mongo</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Active Pipelines</div>
            <div className="kpi-value" style={{ color: '#10B981', marginTop: 4 }}>42</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>dbt, Airflow, Fivetran</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Target Warehouses</div>
            <div className="kpi-value" style={{ color: '#6366F1', marginTop: 4 }}>2</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Snowflake & BigQuery</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Lineage Coverage</div>
            <div className="kpi-value" style={{ color: '#10B981', marginTop: 4 }}>100%</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>All active models mapped</div>
          </div>
        </div>

        {/* Lineage Graph Flow Cards */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Data Lineage Mappings</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>5 Active Flows</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10 }}>
            {flows.map((flow) => (
              <div
                key={flow.id}
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
                    <Database size={13} /> Source
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {flow.source.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {flow.source.schema}
                  </div>
                </div>

                <ArrowRight size={20} style={{ color: 'var(--brand-light)', flexShrink: 0 }} />

                {/* Pipeline Node */}
                <div style={{ flex: 1, padding: 14, background: 'var(--bg-card)', border: '1px solid #C7D2FE', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6366F1', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                      <GitBranch size={13} /> Pipeline
                    </div>
                    <span className={`status-pill ${flow.pipeline.status.toLowerCase()}`} style={{ fontSize: 10, padding: '1px 5px' }}>
                      {flow.pipeline.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {flow.pipeline.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Orchestrated via {flow.pipeline.tool}
                  </div>
                </div>

                <ArrowRight size={20} style={{ color: '#10B981', flexShrink: 0 }} />

                {/* Target Node */}
                <div style={{ flex: 1, padding: 14, background: 'var(--bg-card)', border: '1px solid #A7F3D0', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                    <Layers size={13} /> Target DW
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
                    {flow.target.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {flow.target.schema}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
