import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, GitBranch, Database, Network,
  AlertTriangle, Shield, BarChart2, Bell, FileText, Settings,
  ChevronDown, ChevronRight, Moon
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
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
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const isPipelines = location.pathname.startsWith('/pipelines');

  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <div className="sidebar-logo">
        <div className={`sidebar-logo-icon ${isPipelines ? 'emerald' : ''}`}>
          <Database size={16} color="#FFFFFF" />
        </div>
        <div className="sidebar-logo-text">
          <h1>VITHI</h1>
          <span>Data Observability</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <ul>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            if (item.children) {
              const isChildActive = item.children.some(c => location.pathname === c.to);
              return (
                <li key={item.label} className="nav-item">
                  <button
                    className={`nav-link ${isChildActive ? 'active' : ''}`}
                    onClick={() => setObsOpen(o => !o)}
                  >
                    <Icon size={16} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {obsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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

            const isEmeraldActive = isPipelines && item.to === '/pipelines';

            return (
              <li key={item.label} className="nav-item">
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    'nav-link' + (isActive ? (isEmeraldActive ? ' active emerald' : ' active') : '')
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">SC</div>
          <div className="user-info">
            <div className="name">Sai Charan</div>
            <div className="role">Data Team</div>
          </div>
        </div>

        {/* Dark Mode interactive Switch */}
        <div className="dark-mode-toggle">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Moon size={13} />
            <span>Dark Mode</span>
          </div>
          <div
            className={`toggle-switch ${isDark ? 'on' : ''}`}
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          />
        </div>

        <div className="sidebar-version">
          © 2024 VITHI. All rights reserved.<br />v2.1.0
        </div>
      </div>
    </aside>
  );
}
