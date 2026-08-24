import { useEffect, useState } from 'react';
import {
  Network, Database, GitBranch, ArrowRight, Layers, CheckCircle,
  AlertTriangle, XCircle, Search, Filter, Plus, MoreVertical,
  Download, ArrowUpRight, Check, ExternalLink
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SparkLine from '../components/SparkLine';
import LoadingSpinner from '../components/LoadingSpinner';

const LINEAGE_PIPELINES = [
  {
    id: 1,
    tag: 'PIPELINE 1',
    name: 'mysql_to_snowflake',
    source: { name: 'MySQL', sub: 'mysql-prod' },
    tool: { name: 'Fivetran', sub: 'Ingestion' },
    target: { name: 'Snowflake', sub: 'analytics_wh' },
    status: 'Healthy',
    lastRun: '5 min ago',
    volume: '18.6 GB',
    records: '28.4M',
    duration: '4 min 12 sec',
    owner: 'DE',
    ownerName: 'Data Engineering',
    schedule: 'Every 15 minutes',
    lastSuccessful: '5 min ago (10:42 AM)',
    quality: '96%',
    freshness: '5 min'
  },
  {
    id: 2,
    tag: 'PIPELINE 2',
    name: 'postgres_to_bigquery',
    source: { name: 'PostgreSQL', sub: 'pg-analytics' },
    tool: { name: 'Airbyte', sub: 'Ingestion' },
    target: { name: 'BigQuery', sub: 'bq-prod' },
    status: 'Healthy',
    lastRun: '8 min ago',
    volume: '12.4 GB',
    records: '19.1M',
    duration: '3 min 45 sec',
    owner: 'DA',
    ownerName: 'Analytics',
    schedule: 'Every 30 minutes',
    lastSuccessful: '8 min ago',
    quality: '94%',
    freshness: '8 min'
  },
  {
    id: 3,
    tag: 'PIPELINE 3',
    name: 'sqlserver_to_synapse',
    source: { name: 'SQL Server', sub: 'sqlserver01' },
    tool: { name: 'Azure Data Factory', sub: 'Ingestion' },
    target: { name: 'Synapse', sub: 'synapse-prod' },
    status: 'Degraded',
    lastRun: '32 min ago',
    volume: '8.2 GB',
    records: '12.0M',
    duration: '8 min 10 sec',
    owner: 'DE',
    ownerName: 'Data Eng',
    schedule: 'Hourly',
    lastSuccessful: '32 min ago',
    quality: '89%',
    freshness: '32 min'
  },
  {
    id: 4,
    tag: 'PIPELINE 4',
    name: 'oracle_to_snowflake',
    source: { name: 'Oracle', sub: 'oracle-prod' },
    tool: { name: 'Informatica', sub: 'Ingestion' },
    target: { name: 'Snowflake', sub: 'analytics_wh' },
    status: 'Failed',
    lastRun: '1 hr ago',
    volume: '0 GB',
    records: '0',
    duration: '—',
    owner: 'DE',
    ownerName: 'Data Eng',
    schedule: 'Daily',
    lastSuccessful: '1 day ago',
    quality: '76%',
    freshness: '1 hr'
  },
];

export default function Lineage() {
  const [selectedPipeline, setSelectedPipeline] = useState(LINEAGE_PIPELINES[0]);
  const [viewMode, setViewMode] = useState('pipeline');
  const [groupByTarget, setGroupByTarget] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="fade-in">
      <PageHeader
        title="Lineage"
        subtitle="View data pipelines across sources, tools and targets"
      />

      <div className="page-body">
        {/* Top 5 KPI Cards (Matches Screenshot Exactly) */}
        <div className="kpi-grid-5">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                <GitBranch size={16} />
              </div>
              <span className="kpi-label">Total Pipelines</span>
            </div>
            <div className="kpi-value">42</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={12} />
              <span>↑ 4% vs yesterday</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <CheckCircle size={16} />
              </div>
              <span className="kpi-label">Healthy</span>
            </div>
            <div className="kpi-value">36</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>86% of total</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
                <AlertTriangle size={16} />
              </div>
              <span className="kpi-label">Degraded</span>
            </div>
            <div className="kpi-value">4</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>10% of total</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                <XCircle size={16} />
              </div>
              <span className="kpi-label">Failed</span>
            </div>
            <div className="kpi-value">2</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>4% of total</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Database size={16} />
              </div>
              <span className="kpi-label">Data Sources</span>
            </div>
            <div className="kpi-value">12</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Across all pipelines</div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="filters-bar mt-4">
          <div className="filter-select">
            <label>Source Type</label>
            <select className="select-control">
              <option>All Sources</option>
              <option>MySQL</option>
              <option>PostgreSQL</option>
              <option>SQL Server</option>
              <option>Oracle</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Target Type</label>
            <select className="select-control">
              <option>All Targets</option>
              <option>Snowflake</option>
              <option>BigQuery</option>
              <option>Synapse</option>
            </select>
          </div>

          <div className="filter-select">
            <label>ETL / ELT Tool</label>
            <select className="select-control">
              <option>All Tools</option>
              <option>Fivetran</option>
              <option>Airbyte</option>
              <option>Azure Data Factory</option>
              <option>Informatica</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Status</label>
            <select className="select-control">
              <option>All Status</option>
              <option>Healthy</option>
              <option>Degraded</option>
              <option>Failed</option>
            </select>
          </div>

          <div className="search-box" style={{ flex: 1, maxWidth: 260 }}>
            <Search size={13} />
            <input type="text" placeholder="Search pipelines..." style={{ width: '100%' }} />
          </div>

          <button className="filter-action-btn" style={{ marginLeft: 'auto' }}>
            <Filter size={13} />
            <span>Filters</span>
          </button>
        </div>

        {/* Middle Lineage View + Pipeline Details Panel (Matches Screenshot) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 14 }}>
          {/* Left: Lineage Flow Cards */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Lineage by Pipeline ⓘ</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                  <button
                    style={{ padding: '3px 8px', fontSize: 11, background: viewMode === 'pipeline' ? '#10B981' : 'transparent', color: viewMode === 'pipeline' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer' }}
                    onClick={() => setViewMode('pipeline')}
                  >
                    Pipeline View
                  </button>
                  <button
                    style={{ padding: '3px 8px', fontSize: 11, background: viewMode === 'graph' ? '#10B981' : 'transparent', color: viewMode === 'graph' ? '#fff' : 'inherit', border: 'none', cursor: 'pointer' }}
                    onClick={() => setViewMode('graph')}
                  >
                    Graph View
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  <span>Group by Target</span>
                  <div
                    className={`toggle-switch ${groupByTarget ? 'on' : ''}`}
                    onClick={() => setGroupByTarget(!groupByTarget)}
                    style={{ width: 28, height: 16 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {LINEAGE_PIPELINES.map((p) => {
                const isSelected = selectedPipeline.id === p.id;
                const statusColor = p.status === 'Healthy' ? '#10B981' : p.status === 'Degraded' ? '#F59E0B' : '#EF4444';

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPipeline(p)}
                    style={{
                      border: `1px solid ${isSelected ? '#10B981' : 'var(--border)'}`,
                      background: isSelected ? '#F0FDF4' : 'var(--bg-card)',
                      borderRadius: 8,
                      padding: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      {p.tag}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Flow Nodes */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                        {/* Source */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                            <Database size={13} />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{p.source.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.source.sub}</div>
                          </div>
                        </div>

                        <span style={{ color: '#CBD5E1' }}>&rarr;</span>

                        {/* Tool */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                            <GitBranch size={13} />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{p.tool.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.tool.sub}</div>
                          </div>
                        </div>

                        <span style={{ color: '#CBD5E1' }}>&rarr;</span>

                        {/* Target */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4' }}>
                            <Layers size={13} />
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{p.target.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.target.sub}</div>
                          </div>
                        </div>
                      </div>

                      {/* Status + Run stats */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div>
                          <span className={`status-pill ${p.status.toLowerCase()}`}>
                            {p.status}
                          </span>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textAlign: 'right' }}>
                            Last run {p.lastRun}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, fontWeight: 600 }}>Volume (24h)</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.volume}</div>
                        </div>

                        <button className="icon-btn" style={{ width: 24, height: 24 }}>
                          <MoreVertical size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Pipeline Details Drawer (Matches Screenshot) */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="card-title">Pipeline Details</span>
                <span className={`status-pill ${selectedPipeline.status.toLowerCase()}`}>
                  {selectedPipeline.status}
                </span>
              </div>
              <button className="header-btn" style={{ height: 26, padding: '2px 8px', fontSize: 11 }}>
                Edit
              </button>
            </div>

            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              {selectedPipeline.name}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 12, fontSize: 12 }}>
              {['Overview', 'Lineage', 'Runs', 'Quality', 'Schema'].map(t => (
                <span
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    color: activeTab === t ? '#10B981' : 'var(--text-secondary)',
                    fontWeight: activeTab === t ? 600 : 400,
                    borderBottom: activeTab === t ? '2px solid #10B981' : 'none',
                    paddingBottom: 4,
                    cursor: 'pointer'
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Pipeline Meta Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Source</span>
                <span style={{ fontWeight: 600 }}>{selectedPipeline.source.name} ({selectedPipeline.source.sub})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>ETL / ELT Tool</span>
                <span style={{ fontWeight: 600 }}>{selectedPipeline.tool.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Target</span>
                <span style={{ fontWeight: 600 }}>{selectedPipeline.target.name} ({selectedPipeline.target.sub})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Owner</span>
                <div className="owner-chip">
                  <span className={`owner-circle ${selectedPipeline.owner.toLowerCase()}`}>{selectedPipeline.owner}</span>
                  <span style={{ fontWeight: 600 }}>{selectedPipeline.ownerName}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Schedule</span>
                <span>{selectedPipeline.schedule}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Last Successful Run</span>
                <span>{selectedPipeline.lastSuccessful}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Duration</span>
                <span>{selectedPipeline.duration}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Records (24h)</span>
                <span style={{ fontWeight: 600 }}>{selectedPipeline.records}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Volume (24h)</span>
                <span style={{ fontWeight: 600 }}>{selectedPipeline.volume}</span>
              </div>
            </div>

            {/* Health Indicators Box */}
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Health
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Freshness</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', marginTop: 2 }}>Healthy</div>
                </div>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Data Quality</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', marginTop: 2 }}>{selectedPipeline.quality}</div>
                </div>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 6, padding: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Schema</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', marginTop: 2 }}>Compatible</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="header-btn" style={{ flex: 1, justifyContent: 'center' }}>
                View in Catalog
              </button>
              <button className="export-btn" style={{ flex: 1, justifyContent: 'center', padding: '6px 8px' }}>
                View Full Lineage
              </button>
            </div>
          </div>
        </div>

        {/* Bottom All Pipelines Table */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">All Pipelines (1-4 of 42)</span>
            <button className="header-btn" style={{ height: 28, fontSize: 11 }}>
              <Download size={12} /> Export
            </button>
          </div>

          <div className="table-wrapper">
            <table className="vithi-table">
              <thead>
                <tr>
                  <th>Pipeline Name ↓</th>
                  <th>Source</th>
                  <th>ETL / ELT Tool</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Last Run</th>
                  <th>Data Quality</th>
                  <th>Freshness</th>
                  <th>Owner</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {LINEAGE_PIPELINES.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.source.name}</td>
                    <td>{p.tool.name}</td>
                    <td>{p.target.name}</td>
                    <td>
                      <span className={`status-pill ${p.status.toLowerCase()}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.lastRun}</td>
                    <td style={{ fontWeight: 600, color: '#10B981' }}>{p.quality}</td>
                    <td>{p.freshness}</td>
                    <td>
                      <div className="owner-chip">
                        <span className={`owner-circle ${p.owner.toLowerCase()}`}>{p.owner}</span>
                        <span>{p.ownerName}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="icon-btn" style={{ width: 28, height: 28 }}>
                        <MoreVertical size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <span>Showing 1 to 4 of 42 pipelines</span>
            <div className="pagination-pages">
              <button className="pagination-btn" disabled>‹</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <span style={{ padding: '0 4px' }}>...</span>
              <button className="pagination-btn">›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
