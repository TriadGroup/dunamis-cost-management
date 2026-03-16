import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ProjectionPoint } from '@/entities/finance/types';
import { formatCurrency } from '@/shared/lib/format';

interface ProjectionChartProps {
  data: ProjectionPoint[];
}

export const ProjectionChart = ({ data }: ProjectionChartProps) => {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 20, right: 10, top: 10, bottom: 0 }}>
          <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#244f2d" />
          <YAxis
            tickFormatter={(value) => `${Math.round(value / 100000) / 10}k`}
            tickLine={false}
            axisLine={false}
            stroke="#244f2d"
          />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #d6ebd7', fontSize: 12 }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Line dataKey="baseBalanceCents" stroke="#776d40" strokeWidth={2} dot={false} name="Base" />
          <Line dataKey="adjustedBalanceCents" stroke="#244f2d" strokeWidth={3} dot={false} name="Ajustado" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
