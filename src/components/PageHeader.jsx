import { Calendar, RefreshCw, Download, ChevronDown, Check, X } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';

export default function PageHeader({ title, subtitle, onRefresh, onDateChange }) {
  const [env, setEnv] = useState('Production');
  const [refreshing, setRefreshing] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const popoverRef = useRef(null);

  const presets = [
    { id: 'all', label: 'All Time' },
    { id: '24h', label: 'Last 24 Hours' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
  ];

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setDatePickerOpen(false);
      }
    }
    if (datePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [datePickerOpen]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleExport = () => {
    window.print();
  };

  // Dynamic date range label
  const dateRangeLabel = useMemo(() => {
    const end = new Date();
    if (selectedPreset === 'all') {
      return 'All Recorded History';
    }
    if (selectedPreset === '24h') {
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    }
    if (selectedPreset === '7d') {
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    }
    if (selectedPreset === '30d') {
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `${start.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (customStart && customEnd) {
      return `${customStart} – ${customEnd}`;
    }
    return 'Select Date Range';
  }, [selectedPreset, customStart, customEnd]);

  const handleSelectPreset = (presetId) => {
    setSelectedPreset(presetId);
    setDatePickerOpen(false);
    if (onDateChange) onDateChange(presetId);
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      setSelectedPreset('custom');
      setDatePickerOpen(false);
      if (onDateChange) onDateChange({ start: customStart, end: customEnd });
    }
  };

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

        {/* Interactive Date Range Picker Popover */}
        <div style={{ position: 'relative' }} ref={popoverRef}>
          <button
            type="button"
            className="header-btn"
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onClick={() => setDatePickerOpen(o => !o)}
            title="Click to change date range"
          >
            <span>{dateRangeLabel}</span>
            <Calendar size={14} style={{ color: '#10B981' }} />
            <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
          </button>

          {datePickerOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: 6,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              zIndex: 100, minWidth: 260, padding: 14
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Date Range Presets</span>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setDatePickerOpen(false)}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {presets.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: selectedPreset === p.id ? '#ECFDF5' : 'transparent',
                      color: selectedPreset === p.id ? '#047857' : 'var(--text-primary)'
                    }}
                    onClick={() => handleSelectPreset(p.id)}
                  >
                    <span>{p.label}</span>
                    {selectedPreset === p.id && <Check size={14} color="#10B981" />}
                  </button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Custom Range
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input
                    type="date"
                    className="select-control"
                    style={{ width: '100%', fontSize: 11.5 }}
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                  />
                  <input
                    type="date"
                    className="select-control"
                    style={{ width: '100%', fontSize: 11.5 }}
                    value={customEnd}
                    onChange={e => setCustomEnd(e.target.value)}
                  />
                  <button
                    type="button"
                    className="export-btn"
                    style={{ marginTop: 4, width: '100%', justifyContent: 'center', padding: '6px', fontSize: 12 }}
                    onClick={handleApplyCustom}
                    disabled={!customStart || !customEnd}
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            </div>
          )}
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
