import { useState } from 'react';
import { Bell, Plus, CheckCircle, AlertTriangle, Shield, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const DEFAULT_ALERTS = [
  { id: 1, name: 'SLA Breach Alert', channel: '#data-eng-alerts (Slack)', condition: 'Pipeline freshness lag > 60 min', active: true },
  { id: 2, name: 'Critical Volume Drop', channel: 'PagerDuty', condition: 'Row count drops > 50% vs 7-day average', active: true },
  { id: 3, name: 'Schema Breaking Change', channel: '#data-governance (Slack)', condition: 'Columns dropped or data types altered', active: true },
  { id: 4, name: 'Data Quality Failure', channel: 'email: datateam@vithi.dev', condition: 'Quality check failure rate > 5%', active: false },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);

  const toggleAlert = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Alerts"
        subtitle="Configure and manage pipeline health alerts and notification channels."
      />

      <div className="page-body">
        <div className="kpi-grid-4">
          <div className="kpi-card">
            <div className="kpi-label">Configured Alerts</div>
            <div className="kpi-value" style={{ color: '#6366F1', marginTop: 4 }}>{alerts.length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Rules active across workspace</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Active Monitors</div>
            <div className="kpi-value" style={{ color: '#10B981', marginTop: 4 }}>{alerts.filter(a => a.active).length}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Live triggering enabled</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Alerts Fired (24h)</div>
            <div className="kpi-value" style={{ color: '#F59E0B', marginTop: 4 }}>2</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Sent to Slack & PagerDuty</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Connected Channels</div>
            <div className="kpi-value" style={{ color: '#3B82F6', marginTop: 4 }}>3</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Slack, PagerDuty, Email</div>
          </div>
        </div>

        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Alert Notification Rules</span>
            <button className="export-btn" style={{ padding: '4px 10px', fontSize: 12 }}>
              <Plus size={13} /> Add Alert Rule
            </button>
          </div>

          <div className="table-wrapper">
            <table className="vithi-table">
              <thead>
                <tr>
                  <th>Alert Name</th>
                  <th>Condition</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Toggle</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.condition}</td>
                    <td style={{ fontWeight: 500, color: '#6366F1' }}>{a.channel}</td>
                    <td>
                      <span className={`status-pill ${a.active ? 'good' : 'warning'}`}>
                        {a.active ? 'Active' : 'Muted'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        className={`toggle-switch ${a.active ? 'on' : ''}`}
                        onClick={() => toggleAlert(a.id)}
                        style={{ display: 'inline-block' }}
                      />
                    </td>
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
