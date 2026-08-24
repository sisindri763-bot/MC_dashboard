import { Calendar, RefreshCw, Download, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function PageHeader({ title, subtitle, onRefresh }) {
  const [env, setEnv] = useState('Production');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleExport = () => {
    window.print();
  };

  // Dynamic date range representing live data window
  const dateRangeLabel = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  }, []);

  return (
    <header className="page-header">
      <div className="page-header-left">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="page-header-right">
        {/* Environment Selector */}
        <div className="header-btn">
          <span style={{ color: 'var(--text-secondary)' }}>Environment:</span>
          <select value={env} onChange={e => setEnv(e.target.value)}>
            <option value="Production">Production</option>
            <option value="Staging">Staging</option>
            <option value="Development">Development</option>
          </select>
        </div>

        {/* Date Range Picker */}
        <div className="header-btn" title="Live date range filter">
          <span>{dateRangeLabel}</span>
          <Calendar size={13} style={{ color: 'var(--text-secondary)' }} />
        </div>

        {/* Refresh Button */}
        <button
          className="icon-btn"
          onClick={handleRefresh}
          title="Refresh data"
        >
          <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
        </button>

        {/* Export Button */}
        <button className="export-btn" onClick={handleExport}>
          <Download size={13} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}
