import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

export default function SparkLine({ data = [], color = '#6C63FF', height = 36 }) {
  const points = Array.isArray(data) && data.length > 0
    ? data.map((v, i) => ({ i, v: typeof v === 'object' ? (v.value ?? v.count ?? 0) : v }))
    : Array.from({ length: 10 }, (_, i) => ({ i, v: 50 + Math.random() * 30 }));

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
          contentStyle={{ background: '#1E2130', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, fontSize: 11 }}
          itemStyle={{ color: '#E8EAF6' }}
          formatter={(v) => [typeof v === 'number' ? v.toFixed(1) : v]}
          labelFormatter={() => ''}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
