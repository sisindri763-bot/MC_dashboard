import { useEffect, useState, useMemo } from 'react';
import {
  FileText, XCircle, CheckCircle, Clock, Search, Filter,
  Download, MoreVertical, Database, ArrowUpRight, ArrowDownRight,
  Columns
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SparkLine from '../components/SparkLine';
import LoadingSpinner from '../components/LoadingSpinner';

const LOGS_LIST_DATA = [
  { id: 1, time: 'May 11, 2024 12:30:45 PM', pipeline: 'oracle_to_snowflake', level: 'ERROR', tool: 'Informatica', message: 'ORA-12541: TNS:no listener', duration: '1.24 s' },
  { id: 2, time: 'May 11, 2024 12:30:44 PM', pipeline: 'sqlserver_to_synapse', level: 'WARN', tool: 'Azure Data Factory', message: 'Copy activity retry attempt 2 of 3', duration: '842 ms' },
  { id: 3, time: 'May 11, 2024 12:30:43 PM', pipeline: 'mysql_to_snowflake', level: 'INFO', tool: 'Fivetran', message: 'Successfully synced 12,543 records', duration: '320 ms' },
  { id: 4, time: 'May 11, 2024 12:30:42 PM', pipeline: 'postgres_to_bigquery', level: 'INFO', tool: 'Airbyte', message: 'Sync complete in 3m 45s', duration: '512 ms' },
  { id: 5, time: 'May 11, 2024 12:30:41 PM', pipeline: 'kafka_to_snowflake', level: 'DEBUG', tool: 'Databricks', message: 'Processed batch 1051 (offset: 204858)', duration: '215 ms' },
  { id: 6, time: 'May 11, 2024 12:30:40 PM', pipeline: 'salesforce_to_snowflake', level: 'INFO', tool: 'Fivetran', message: 'Incremental sync completed', duration: '301 ms' },
  { id: 7, time: 'May 11, 2024 12:30:39 PM', pipeline: 'sqlserver_to_synapse', level: 'WARN', tool: 'Azure Data Factory', message: 'Data conversion issue on column \'amount\'', duration: '670 ms' },
  { id: 8, time: 'May 11, 2024 12:30:38 PM', pipeline: 'mysql_to_snowflake', level: 'INFO', tool: 'Fivetran', message: 'Heartbeat: pipeline is running', duration: '180 ms' },
  { id: 9, time: 'May 11, 2024 12:30:37 PM', pipeline: 'oracle_to_snowflake', level: 'ERROR', tool: 'Informatica', message: 'Failed to connect to target database', duration: '2.05 s' },
  { id: 10, time: 'May 11, 2024 12:30:36 PM', pipeline: 'postgres_to_bigquery', level: 'INFO', tool: 'Airbyte', message: 'Destination commit successful', duration: '290 ms' },
];

export default function Logs() {
  const [pipelineFilter, setPipelineFilter] = useState('All Pipelines');
  const [toolFilter, setToolFilter] = useState('All Tools');
  const [levelFilter, setLevelFilter] = useState('All Levels');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return LOGS_LIST_DATA.filter(l => {
      const matchSearch = l.message.toLowerCase().includes(search.toLowerCase()) ||
                          l.pipeline.toLowerCase().includes(search.toLowerCase()) ||
                          l.tool.toLowerCase().includes(search.toLowerCase());
      const matchPipeline = pipelineFilter === 'All Pipelines' || l.pipeline === pipelineFilter;
      const matchTool = toolFilter === 'All Tools' || l.tool === toolFilter;
      const matchLevel = levelFilter === 'All Levels' || l.level === levelFilter;

      return matchSearch && matchPipeline && matchTool && matchLevel;
    });
  }, [search, pipelineFilter, toolFilter, levelFilter]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Logs"
        subtitle="View and monitor logs from your data pipelines and tools in real time."
      />

      <div className="page-body">
        {/* 4 KPI Cards (Matches Screenshot Exactly) */}
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                <FileText size={18} />
              </div>
              <span className="kpi-label">Total Logs</span>
            </div>
            <div className="kpi-value">1,248,342</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={12} />
              <span>↑ 18% vs last 15 minutes</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#6366F1" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#FEF2F2', color: '#EF4444' }}>
                <XCircle size={18} />
              </div>
              <span className="kpi-label">Failed Logs</span>
            </div>
            <div className="kpi-value">2,543</div>
            <div className="kpi-delta down">
              <ArrowUpRight size={12} />
              <span>↑ 12% vs last 15 minutes</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#EF4444" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <CheckCircle size={18} />
              </div>
              <span className="kpi-label">Success Logs</span>
            </div>
            <div className="kpi-value">1,245,799</div>
            <div className="kpi-delta up">
              <ArrowUpRight size={12} />
              <span>↑ 19% vs last 15 minutes</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#10B981" />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-header">
              <div className="kpi-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Clock size={18} />
              </div>
              <span className="kpi-label">Log Duration (Avg)</span>
            </div>
            <div className="kpi-value">320 ms</div>
            <div className="kpi-delta up">
              <ArrowDownRight size={12} />
              <span>↓ 8% vs last 15 minutes</span>
            </div>
            <div className="sparkline-container">
              <SparkLine color="#3B82F6" />
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="filters-bar mt-4">
          <div className="filter-select">
            <label>Pipelines</label>
            <select className="select-control" value={pipelineFilter} onChange={e => setPipelineFilter(e.target.value)}>
              <option value="All Pipelines">All Pipelines</option>
              <option value="oracle_to_snowflake">oracle_to_snowflake</option>
              <option value="sqlserver_to_synapse">sqlserver_to_synapse</option>
              <option value="mysql_to_snowflake">mysql_to_snowflake</option>
              <option value="postgres_to_bigquery">postgres_to_bigquery</option>
              <option value="kafka_to_snowflake">kafka_to_snowflake</option>
              <option value="salesforce_to_snowflake">salesforce_to_snowflake</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Tool</label>
            <select className="select-control" value={toolFilter} onChange={e => setToolFilter(e.target.value)}>
              <option value="All Tools">All Tools</option>
              <option value="Informatica">Informatica</option>
              <option value="Azure Data Factory">Azure Data Factory</option>
              <option value="Fivetran">Fivetran</option>
              <option value="Airbyte">Airbyte</option>
              <option value="Databricks">Databricks</option>
            </select>
          </div>

          <div className="filter-select">
            <label>Log Level</label>
            <select className="select-control" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
              <option value="All Levels">All Levels</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>

          <div className="search-box" style={{ flex: 1, maxWidth: 300 }}>
            <Search size={13} />
            <input
              type="text"
              placeholder="Search by message, pipeline, tool..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <button className="filter-action-btn" style={{ marginLeft: 'auto' }}>
            <Filter size={13} />
            <span>More Filters</span>
          </button>
        </div>

        {/* Logs Table Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Logs (1,248,342)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="header-btn" style={{ height: 30, fontSize: 11 }}>
                <Columns size={12} /> Columns ▾
              </button>
              <button className="header-btn" style={{ height: 30, fontSize: 11 }}>
                <Download size={12} /> Download Logs
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="vithi-table">
              <thead>
                <tr>
                  <th>Timestamp ⇅</th>
                  <th>Pipeline Name</th>
                  <th>Level</th>
                  <th>Pipeline</th>
                  <th>Tool</th>
                  <th>Message</th>
                  <th>Duration</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l.time}</td>
                    <td style={{ fontWeight: 600 }}>{l.pipeline}</td>
                    <td>
                      <span className={`status-pill ${l.level.toLowerCase()}`}>
                        {l.level}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{l.pipeline}</td>
                    <td>
                      <div className="tool-badge">
                        <Database size={13} color="#10B981" />
                        <span>{l.tool}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.message}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l.duration}</td>
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
            <span>Showing 1 to 10 of 1,248,342 logs</span>
            <div className="pagination-pages">
              <button className="pagination-btn" disabled>‹</button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <button className="pagination-btn">4</button>
              <button className="pagination-btn">5</button>
              <span style={{ padding: '0 4px' }}>...</span>
              <button className="pagination-btn">›</button>
              <select className="select-control" style={{ marginLeft: 8, padding: '4px 8px' }}>
                <option>10 / page</option>
                <option>25 / page</option>
                <option>50 / page</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
