import { useRef } from 'react';
import { Card } from '@/shared/ui/Card';
import { toCents } from '@/shared/lib/format';
import { useAppStore, useDashboardData } from '@/app/store/useAppStore';
import { KpiCards } from './KpiCards';
import { ProjectionChart } from './ProjectionChart';
import { exportCsv, exportPdf } from '@/features/exports/exporters';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const DashboardPanel = () => {
  const { data, projection, snapshot } = useDashboardData();
  const actions = useAppStore((state) => state.actions);
  const dashboardRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4" ref={dashboardRef} id="dashboard-export">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-4xl text-fern-900">Dunamis Farm Finance Command</h1>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-xl border border-fern-900/20 px-3 py-2 text-sm text-fern-900"
            onClick={() => downloadBlob(exportCsv(data), 'dunamis_finance.csv')}
          >
            Exportar CSV
          </button>
          <button
            className="rounded-xl border border-fern-900/20 px-3 py-2 text-sm text-fern-900"
            onClick={async () => {
              if (!dashboardRef.current) return;
              const blob = await exportPdf(dashboardRef.current);
              downloadBlob(blob, 'dunamis_dashboard.pdf');
            }}
          >
            Exportar PDF
          </button>
          <button className="rounded-xl bg-fern-800 px-3 py-2 text-sm font-semibold text-fern-50" onClick={actions.lock}>
            Bloquear
          </button>
        </div>
      </div>

      <Card className="space-y-3" title="Controles de cenario" subtitle="Ajuste receita prevista e reserva de caixa">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm text-fern-900">
            Receita prevista manual (BRL)
            <input
              type="number"
              min={0}
              value={data.expectedRevenueCents / 100}
              onChange={(event) => actions.updateExpectedRevenue(toCents(Number(event.target.value || 0)))}
              className="w-full rounded-lg border border-fern-900/20 px-2 py-2"
            />
          </label>
          <label className="space-y-1 text-sm text-fern-900">
            Reserva de caixa (BRL)
            <input
              type="number"
              min={0}
              value={data.cashReserveCents / 100}
              onChange={(event) => actions.updateCashReserve(toCents(Number(event.target.value || 0)))}
              className="w-full rounded-lg border border-fern-900/20 px-2 py-2"
            />
          </label>
        </div>
      </Card>

      <KpiCards snapshot={snapshot} />

      <Card title="Projecao 12 meses" subtitle="Base (sem sliders) vs Ajustado (sliders ativos)">
        <ProjectionChart data={projection} />
      </Card>
    </div>
  );
};
