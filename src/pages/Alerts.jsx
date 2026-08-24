import { useState, useEffect, useMemo } from 'react';
import { Bell, Plus, CheckCircle, AlertTriangle, Shield, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import { fetchAlerts } from '../api/client';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchAlerts({ preset: 'all' });
      if (res) {
        setAlerts(res.items || res.alerts || []);
        setKpis(res.kpis || []);
      }
    } catch (e) {
      console.error('Failed to load alerts from API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAlerts = useMemo(() => {
    const k = kpis.find(item => item.id === 'open_alerts');
    return k?.value ?? alerts.filter(a => (a.status || '').toLowerCase() === 'open' || a.active).length;
  }, [kpis, alerts]);

  const criticalAlerts = useMemo(() => {
    const k = kpis.find(item => item.id === 'critical_alerts');
    return k?.value ?? alerts.filter(a => (a.severity || '').toLowerCase() === 'critical').length;
  }, [kpis, alerts]);

  const ackedAlerts = useMemo(() => {
    const k = kpis.find(item => item.id === 'acked_alerts');
    return k?.value ?? alerts.filter(a => (a.status || '').toLowerCase() === 'acknowledged').length;
  }, [kpis, alerts]);

  const resolvedAlerts = useMemo(() => {
    const k = kpis.find(item => item.id === 'resolved_alerts');
    return k?.value ?? alerts.filter(a => (a.status || '').toLowerCase() === 'resolved').length;
  }, [kpis, alerts]);

  return (
    <div className="fade-in">
      <PageHeader
        title="Alerts"
        subtitle="Configure and manage pipeline health alerts and notification channels."
        onRefresh={loadData}
      />

      {loading && !alerts.length ? (
        <LoadingSpinner />
      ) : (
        <div className="page-body">
          <div className="kpi-grid-4">
            <div className="kpi-card">
              <div className="kpi-label">Open Alerts</div>
              <div className="kpi-value" style={{ color: '#6366F1', marginTop: 4 }}>{openAlerts}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Requiring attention</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Critical Alerts</div>
              <div className="kpi-value" style={{ color: '#EF4444', marginTop: 4 }}>{criticalAlerts}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>High severity errors</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Acknowledged</div>
              <div className="kpi-value" style={{ color: '#F59E0B', marginTop: 4 }}>{ackedAlerts}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>In progress</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Resolved</div>
              <div className="kpi-value" style={{ color: '#10B981', marginTop: 4 }}>{resolvedAlerts}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Completed validations</div>
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
                    <th style={{ textAlign: 'right' }}>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No active alerts triggering at this moment.
                      </td>
                    </tr>
                  ) : (
                    alerts.map((a, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{a.name || a.title || 'Pipeline Alert'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{a.condition || a.message || 'Health check threshold'}</td>
                        <td>{a.channel || 'Slack / Email'}</td>
                        <td>
                          <span className={`status-pill ${(a.status || 'info').toLowerCase()}`}>
                            {a.status || 'Active'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`status-pill ${(a.severity || 'info').toLowerCase()}`}>
                            {a.severity || 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
