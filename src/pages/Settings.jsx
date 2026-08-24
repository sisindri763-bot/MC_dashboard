import { useState } from 'react';
import { Settings as SettingsIcon, Sliders, Key, Bell, Users, Database, Globe, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getBaseUrl } from '../api/client';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [apiUrl, setApiUrl] = useState(getBaseUrl());
  const [slaTime, setSlaTime] = useState(60);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('API_BASE_URL', apiUrl.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Settings"
        subtitle="Manage platform configuration, connections and workspace preferences."
      />

      <div className="page-body">
        <div className="grid-2">
          {/* General Configuration */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">General Platform Config</span>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="filter-select">
                <label>Backend API Base URL</label>
                <input
                  type="text"
                  className="search-box"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                />
              </div>

              <div className="filter-select">
                <label>Default Freshness SLA (Minutes)</label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  value={slaTime}
                  onChange={e => setSlaTime(Number(e.target.value))}
                />
              </div>

              <button type="submit" className="export-btn" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                {saved ? <Check size={14} /> : null}
                <span>{saved ? 'Saved Successfully!' : 'Save Settings'}</span>
              </button>
            </form>
          </div>

          {/* Connected Integrations */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Connected Integrations</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Database size={18} style={{ color: '#38BDF8' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>Snowflake DW</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Live Connection — Target & Source</div>
                  </div>
                </div>
                <span className="status-pill healthy">Connected</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Sliders size={18} style={{ color: '#F97316' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>dbt Core / Cloud</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Transform Engine Hook</div>
                  </div>
                </div>
                <span className="status-pill healthy">Connected</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card-subtle)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Globe size={18} style={{ color: '#10B981' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>PostgreSQL Warehouse</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Active Warehouse Mirror</div>
                  </div>
                </div>
                <span className="status-pill healthy">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
