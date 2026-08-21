import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, GitBranch, Activity, Network,
  AlertTriangle, BarChart2, Bell, FileText, Settings,
  ChevronDown, ChevronRight, Moon, Database, Shield,
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { icon: LayoutDashboard, label: 'Overview', to: '/' },
  { icon: GitBranch, label: 'Pipelines', to: '/pipelines' },
  {
    icon: Database, label: 'Data Observability', to: '/observability',
    children: [
      { label: 'Overview', to: '/observability' },
      { label: 'Freshness', to: '/observability/freshness' },
      { label: 'Volume', to: '/observability/volume' },
      { label: 'Data Quality', to: '/observability/data-quality' },
      { label: 'Schema', to: '/observability/schema' },
    ],
  },
  { icon: Network, label: 'Lineage', to: '/lineage' },
  { icon: AlertTriangle, label: 'Incidents', to: '/incidents' },
  { icon: Shield, label: 'Data Quality', to: '/data-quality' },
  { icon: BarChart2, label: 'Metrics', to: '/metrics' },
  { icon: Bell, label: 'Alerts', to: '/alerts' },
  { icon: FileText, label: 'Logs', to: '/logs' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

export default function Sidebar() {
  const [obsOpen, setObsOpen] = useState(true);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Activity size={17} color="#fff" />
        </div>
        <div className="sidebar-logo-text">
          <h1>VITHI</h1>
          <span>Data Observability</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <ul>
          {NAV.map((item) => {
            const Icon = item.icon;

            if (item.children) {
              return (
                <li key={item.label} className="nav-item">
                  <button
                    className="nav-link"
                    onClick={() => setObsOpen(o => !o)}
                  >
                    <Icon size={15} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {obsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>
                  {obsOpen && (
                    <ul className="nav-sub">
                      {item.children.map(child => (
                        <li key={child.label}>
                          <NavLink
                            to={child.to}
                            end={child.to === '/observability'}
                            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.label} className="nav-item">
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                >
                  <Icon size={15} />
                  {item.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">SC</div>
          <div className="user-info">
            <div className="name">Sai Charan</div>
            <div className="role">Data Team</div>
          </div>
        </div>
        <div className="dark-mode-toggle">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Moon size={12} />
            <span>Dark Mode</span>
          </div>
          <div className="toggle-switch" />
        </div>
        <div className="sidebar-version">
          © 2024 VITHI. All rights reserved.<br />v2.1.0
        </div>
      </div>
    </aside>
  );
}
