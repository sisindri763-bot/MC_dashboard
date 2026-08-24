import { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Clock, Database } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import PageHeader from '../components/PageHeader';

const TOOLTIP_STYLE = {
  contentStyle: { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  itemStyle: { color: '#0F172A' },
  labelStyle: { color: '#64748B', fontWeight: 600 },
};

const METRICS_CHART_DATA = [
  { name: 'Orders_Load', rowsIn: 1240, rowsOut: 1240, duration: 751 },
  { name: 'Customer_Sync', rowsIn: 456, rowsOut: 450, duration: 1085 },
  { name: 'Sales_Daily', rowsIn: 2150, rowsOut: 2150, duration: 502 },
  { name: 'Inventory_Update', rowsIn: 812, rowsOut: 810, duration: 942 },
  { name: 'Payments_Proc', rowsIn: 230, rowsOut: 180, duration: 192 },
  { name: 'Product_Cat', rowsIn: 145, rowsOut: 145, duration: 378 },
  { name: 'Mktg_Events', rowsIn: 678, rowsOut: 660, duration: 1365 },
  { name: 'User_Activity', rowsIn: 1050, rowsOut: 1050, duration: 665 },
];

export default function Metrics() {
  return (
    <div className="fade-in">
      <PageHeader
        title="Metrics"
        subtitle="Calculated observability metrics across all pipelines."
      />

      <div className="page-body">
        {/* 2 Charts */}
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Rows Processed (Thousands)</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={METRICS_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="rowsIn" name="Rows In" fill="#6366F1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="rowsOut" name="Rows Out" fill="#10B981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Execution Duration (Seconds)</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={METRICS_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="duration" name="Duration (s)" fill="#F59E0B" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metrics Table */}
        <div className="card mt-4">
          <div className="card-header">
            <span className="card-title">Pipeline Metrics Detail</span>
          </div>

          <div className="table-wrapper">
            <table className="vithi-table">
              <thead>
                <tr>
                  <th>Pipeline</th>
                  <th>Source System</th>
                  <th>Rows In</th>
                  <th>Rows Out</th>
                  <th>Drop Rate</th>
                  <th>Avg. Duration</th>
                  <th>Throughput</th>
                </tr>
              </thead>
              <tbody>
                {METRICS_CHART_DATA.map((p, i) => {
                  const drop = ((p.rowsIn - p.rowsOut) / p.rowsIn * 100).toFixed(1);
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>Production Cluster</td>
                      <td style={{ fontWeight: 600 }}>{(p.rowsIn * 1000).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>{(p.rowsOut * 1000).toLocaleString()}</td>
                      <td style={{ color: Number(drop) > 0 ? '#EF4444' : '#10B981', fontWeight: 600 }}>
                        {drop}%
                      </td>
                      <td>{p.duration}s</td>
                      <td style={{ color: '#6366F1', fontWeight: 600 }}>
                        {Math.round((p.rowsOut * 1000) / Math.max(p.duration, 1))} rows/s
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
