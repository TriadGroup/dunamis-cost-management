import { useEffect, useMemo, useState } from 'react';
import { ProjectionChart } from '@/features/dashboard/ProjectionChart';
import {
  buildDefaultProjectionScenario,
  buildGrowthProjectionSeries,
  buildProjectionMilestones,
  summarizeGrowthProjection,
  type GrowthProjectionBaseline,
  type GrowthProjectionScenario
} from '@/features/dashboard/model/projectionScenario';
import { formatCompactCurrency, formatCurrency, formatNumber } from '@/shared/lib/format';
import { CenterModal, DetailCard, FilterPills, NumberField, SmartEmptyState } from '@/shared/ui';

interface GrowthProjectionCardProps {
  baseline: GrowthProjectionBaseline | null;
  onGoToPlanning: () => void;
}

const horizonOptions = [
  { id: '3', label: '3 meses' },
  { id: '6', label: '6 meses' },
  { id: '12', label: '12 meses' }
];

export const GrowthProjectionCard = ({ baseline, onGoToPlanning }: GrowthProjectionCardProps) => {
  const [selectedHorizon, setSelectedHorizon] = useState('6');
  const [modalOpen, setModalOpen] = useState(false);
  const [scenario, setScenario] = useState<GrowthProjectionScenario | null>(baseline ? buildDefaultProjectionScenario(baseline) : null);

  useEffect(() => {
    if (!baseline) {
      setScenario(null);
      return;
    }

    setScenario(buildDefaultProjectionScenario(baseline));
  }, [baseline]);

  const safeScenario = useMemo(() => {
    if (!baseline) return null;
    return scenario ?? buildDefaultProjectionScenario(baseline);
  }, [baseline, scenario]);

  const fullSeries = useMemo(() => {
    if (!baseline || !safeScenario) return [];
    return buildGrowthProjectionSeries(baseline, safeScenario, 12);
  }, [baseline, safeScenario]);

  const milestones = useMemo(() => {
    if (!baseline || !safeScenario) return null;
    return buildProjectionMilestones(baseline, safeScenario, [3, 6, 12]);
  }, [baseline, safeScenario]);

  const visibleSummary = milestones?.[Number(selectedHorizon)] ?? null;
  const visibleSeries = fullSeries.slice(0, Number(selectedHorizon));
  const fullSummary = useMemo(() => summarizeGrowthProjection(fullSeries, 12), [fullSeries]);

  if (!baseline) {
    return (
      <DetailCard
        eyebrow="Projeção"
        title="Veja 3, 6 e 12 meses"
        subtitle="Assim que houver área e cultura, o sistema começa a simular crescimento, custo e lucro."
      >
        <SmartEmptyState
          title="Monte a base para projetar"
          description="Defina a cultura, a área e o preço sugerido para liberar a projeção da fazenda."
          action={
            <button type="button" className="cta-btn" onClick={onGoToPlanning}>
              Montar projeção
            </button>
          }
        />
      </DetailCard>
    );
  }

  return (
    <>
      <DetailCard
        className="projection-card-shell"
        eyebrow="Projeção"
        title="3, 6 e 12 meses"
        subtitle={`Simule o crescimento de ${baseline.cropName} com base na área plantada, custo e preço por ${baseline.unitLabel}.`}
        action={<FilterPills activeId={selectedHorizon} onChange={setSelectedHorizon} options={horizonOptions} />}
      >
        <div className="projection-card-stack">
          <div className="projection-inline-metrics">
            <article className="projection-inline-metric">
              <span>Receita</span>
              <strong>{visibleSummary ? formatCompactCurrency(visibleSummary.totalRevenueCents) : 'R$ 0'}</strong>
            </article>
            <article className="projection-inline-metric">
              <span>Custo</span>
              <strong>{visibleSummary ? formatCompactCurrency(visibleSummary.totalCostCents) : 'R$ 0'}</strong>
            </article>
            <article className="projection-inline-metric is-profit">
              <span>Lucro</span>
              <strong>{visibleSummary ? formatCompactCurrency(visibleSummary.totalProfitCents) : 'R$ 0'}</strong>
            </article>
            <article className="projection-inline-metric">
              <span>Margem</span>
              <strong>{visibleSummary ? `${formatNumber(visibleSummary.averageMarginPct, 1)}%` : '0%'}</strong>
            </article>
          </div>

          <button type="button" className="projection-chart-button" onClick={() => setModalOpen(true)} aria-label="Abrir simulador de projeção">
            <div className="projection-chart-head">
              <div>
                <span className="projection-chart-eyebrow">Se crescer nesse ritmo</span>
                <strong>{visibleSummary ? `${formatNumber(visibleSummary.finalAreaSqm, 0)} m² no fim do período` : 'Sem projeção'}</strong>
              </div>
              <small>Clique para ajustar</small>
            </div>
            <ProjectionChart data={visibleSeries} compact />
          </button>
        </div>
      </DetailCard>

      <CenterModal
        open={modalOpen}
        title="Simular crescimento da fazenda"
        subtitle="Ajuste área, crescimento, perda, custo e preço para ver 3, 6 e 12 meses."
        onClose={() => setModalOpen(false)}
        footer={
          <div className="projection-modal-footer">
            <button type="button" className="ghost-btn" onClick={() => setScenario(buildDefaultProjectionScenario(baseline))}>
              Voltar ao base
            </button>
            <button type="button" className="cta-btn" onClick={() => setModalOpen(false)}>
              Fechar simulação
            </button>
          </div>
        }
      >
        <div className="projection-modal-stack">
          <div className="projection-kpi-grid">
            <article className="projection-kpi-card">
              <span>Total em 12 meses</span>
              <strong>{formatCurrency(fullSummary.totalRevenueCents)}</strong>
              <small>Receita acumulada</small>
            </article>
            <article className="projection-kpi-card">
              <span>Custo em 12 meses</span>
              <strong>{formatCurrency(fullSummary.totalCostCents)}</strong>
              <small>Base do ciclo e da expansão</small>
            </article>
            <article className="projection-kpi-card is-profit">
              <span>Lucro em 12 meses</span>
              <strong>{formatCurrency(fullSummary.totalProfitCents)}</strong>
              <small>{`${formatNumber(fullSummary.averageMarginPct, 1)}% de margem média`}</small>
            </article>
            <article className="projection-kpi-card">
              <span>Área final</span>
              <strong>{`${formatNumber(fullSummary.finalAreaSqm, 0)} m²`}</strong>
              <small>{`${formatNumber(fullSummary.finalMonthlyUnits, 0)} ${baseline.unitLabel} por mês no final`}</small>
            </article>
          </div>

          <div className="projection-base-strip">
            <span>{`${formatNumber(baseline.baseAreaSqm, 0)} m² hoje`}</span>
            <span>{`${formatNumber(baseline.baseMonthlyUnits, 0)} ${baseline.unitLabel}/mês`}</span>
            <span>{`${baseline.baseBeds} canteiro(s)`}</span>
            <span>{`${baseline.baseCycleDays} dias por ciclo`}</span>
            <span>{`${formatCurrency(baseline.baseCostPerUnitCents)} custo/${baseline.unitLabel}`}</span>
            <span>{`${formatCurrency(baseline.basePricePerUnitCents)} venda/${baseline.unitLabel}`}</span>
          </div>

          <div className="projection-input-grid">
            <label>
              <span>Área plantada inicial</span>
              <NumberField
                value={safeScenario?.startingAreaSqm ?? 0}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...(current ?? buildDefaultProjectionScenario(baseline)),
                    startingAreaSqm: Number(event.target.value || 0)
                  }))
                }
                suffix="m²"
              />
            </label>

            <label>
              <span>Crescimento por mês</span>
              <NumberField
                value={safeScenario?.monthlyGrowthPct ?? 0}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...(current ?? buildDefaultProjectionScenario(baseline)),
                    monthlyGrowthPct: Number(event.target.value || 0)
                  }))
                }
                suffix="%"
              />
            </label>

            <label>
              <span>Ganho de produtividade</span>
              <NumberField
                value={safeScenario?.productivityGainPct ?? 0}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...(current ?? buildDefaultProjectionScenario(baseline)),
                    productivityGainPct: Number(event.target.value || 0)
                  }))
                }
                suffix="%"
              />
            </label>

            <label>
              <span>Perda esperada</span>
              <NumberField
                value={safeScenario?.expectedLossRate ?? 0}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...(current ?? buildDefaultProjectionScenario(baseline)),
                    expectedLossRate: Number(event.target.value || 0)
                  }))
                }
                suffix="%"
              />
            </label>

            <label>
              <span>Reajuste de custo</span>
              <NumberField
                value={safeScenario?.costAdjustmentPct ?? 0}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...(current ?? buildDefaultProjectionScenario(baseline)),
                    costAdjustmentPct: Number(event.target.value || 0)
                  }))
                }
                suffix="%"
              />
            </label>

            <label>
              <span>Reajuste de venda</span>
              <NumberField
                value={safeScenario?.priceAdjustmentPct ?? 0}
                onChange={(event) =>
                  setScenario((current) => ({
                    ...(current ?? buildDefaultProjectionScenario(baseline)),
                    priceAdjustmentPct: Number(event.target.value || 0)
                  }))
                }
                suffix="%"
              />
            </label>
          </div>

          <div className="projection-modal-chart-card">
            <div className="projection-modal-chart-head">
              <div>
                <span>Evolução mês a mês</span>
                <strong>Receita, custo e lucro</strong>
              </div>
              <small>12 meses</small>
            </div>
            <ProjectionChart data={fullSeries} />
          </div>

          <div className="projection-breakdown-list">
            {fullSeries.map((point) => (
              <article key={point.monthIndex} className="projection-breakdown-row">
                <div>
                  <strong>{point.monthLabel}</strong>
                  <small>{`${formatNumber(point.areaSqm, 0)} m² · ${formatNumber(point.units, 0)} ${baseline.unitLabel}`}</small>
                </div>
                <div>
                  <span>Receita</span>
                  <strong>{formatCurrency(point.totalRevenueCents)}</strong>
                </div>
                <div>
                  <span>Custo</span>
                  <strong>{formatCurrency(point.totalCostCents)}</strong>
                </div>
                <div>
                  <span>Lucro</span>
                  <strong>{formatCurrency(point.totalProfitCents)}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </CenterModal>
    </>
  );
};
