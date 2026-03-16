import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompactCurrency, formatCurrency } from '@/shared/lib/format';
import type { GrowthProjectionPoint } from '@/features/dashboard/model/projectionScenario';

interface ProjectionChartProps {
  data: GrowthProjectionPoint[];
  compact?: boolean;
}

export const ProjectionChart = ({ data, compact = false }: ProjectionChartProps) => {
  const height = compact ? '100%' : '100%';

  return (
    <div className={compact ? 'projection-chart projection-chart-compact' : 'projection-chart'}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={compact ? { left: 0, right: 0, top: 6, bottom: 0 } : { left: 12, right: 8, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="projection-revenue" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4e9d73" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#4e9d73" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="projection-profit" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#77a0ca" stopOpacity={0.26} />
              <stop offset="100%" stopColor="#77a0ca" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(84,126,89,0.12)" vertical={false} />

          <XAxis
            dataKey="monthLabel"
            tickLine={false}
            axisLine={false}
            stroke="#6f8577"
            fontSize={compact ? 11 : 12}
          />

          <YAxis
            tickFormatter={(value) => formatCompactCurrency(value)}
            tickLine={false}
            axisLine={false}
            stroke="#6f8577"
            width={compact ? 0 : 56}
            hide={compact}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 14,
              border: '1px solid #d7e2d9',
              background: '#ffffff',
              color: '#244232',
              fontSize: 12,
              boxShadow: '0 16px 28px rgba(18, 42, 28, 0.08)'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'Receita') return [formatCurrency(value), name];
              if (name === 'Custo') return [formatCurrency(value), name];
              if (name === 'Lucro') return [formatCurrency(value), name];
              return [String(value), name];
            }}
            labelFormatter={(label) => `Mês ${label}`}
          />

          <Area type="monotone" dataKey="totalRevenueCents" stroke="#4e9d73" fill="url(#projection-revenue)" strokeWidth={compact ? 2 : 2.4} name="Receita" />
          <Line type="monotone" dataKey="totalCostCents" stroke="#d38c67" strokeWidth={compact ? 1.8 : 2} dot={false} name="Custo" />
          <Area type="monotone" dataKey="totalProfitCents" stroke="#6f95c2" fill="url(#projection-profit)" strokeWidth={compact ? 1.8 : 2.1} name="Lucro" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
