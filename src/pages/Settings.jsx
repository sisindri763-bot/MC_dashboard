import PageHeader from '../components/PageHeader';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="fade-in">
      <PageHeader title="Settings" subtitle="Configure your VITHI observability platform." />
      <div className="page-body" style={{ paddingTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {['General', 'Connections', 'Notifications', 'Team', 'API Keys', 'Billing'].map(s => (
            <div key={s} className="card" style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(108,99,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SettingsIcon size={16} color="#8B84FF" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Configure {s.toLowerCase()} settings</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
