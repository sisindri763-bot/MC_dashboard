import { Calendar, RefreshCw, Download } from 'lucide-react';

export default function PageHeader({ title, subtitle, children }) {
  const now = new Date();
  const formatted = now.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="page-header">
      <div className="page-header-left">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-header-right">
        {children}
        <div className="env-select">
          <select>
            <option>Production</option>
            <option>Staging</option>
            <option>Development</option>
          </select>
        </div>
        <div className="date-btn">
          <Calendar size={14} />
          <span style={{ fontSize: 12 }}>{formatted}</span>
        </div>
        <button className="icon-btn" title="Refresh">
          <RefreshCw size={14} />
        </button>
        <button className="export-btn">
          <Download size={14} />
          Export
        </button>
      </div>
    </div>
  );
}
