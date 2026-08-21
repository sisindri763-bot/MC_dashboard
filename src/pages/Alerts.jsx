import PageHeader from '../components/PageHeader';
import { Bell } from 'lucide-react';

export default function Alerts() {
  return (
    <div className="fade-in">
      <PageHeader title="Alerts" subtitle="Configure and manage pipeline health alerts." />
      <div className="page-body" style={{ paddingTop: 16 }}>
        <div className="card">
          <div className="empty-state" style={{ padding: 60 }}>
            <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div>No alerts configured</div>
            <div style={{ fontSize: 11, marginTop: 6, color: 'var(--text-muted)' }}>Set up alerts to get notified when pipelines fail or SLAs are breached.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
