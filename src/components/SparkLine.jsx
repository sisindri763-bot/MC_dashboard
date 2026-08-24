import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

export default function SparkLine({ data = [], color = '#10B981', height = 36 }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <div style={{ height }} />;
  }

  const points = data.map((v, i) => ({
    i,
    v: typeof v === 'object' ? (v.value ?? v.count ?? v.rate ?? 0) : Number(v) || 0
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Tooltip
          contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 11, color: '#0F172A' }}
          itemStyle={{ color: '#0F172A' }}
          formatter={(v) => [typeof v === 'number' ? v.toFixed(1) : v]}
          labelFormatter={() => ''}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
