import type { Crop } from '@/entities/agro/crop/types';
import type { CropPlan } from '@/entities/agro/crop-plan/types';
import { calculateProjectionReliability } from '@/entities/agro/crop-plan/services';
import type { DemandChannel } from '@/entities/agro/demand-channel/types';
import { kitchenSensitivity } from '@/entities/agro/demand-channel/services';
import type { Lot } from '@/entities/agro/lot/types';
import { calculateTraceabilityCompleteness } from '@/entities/agro/lot/services';
import type { ChannelMargin, UnitEconomicsRow } from '@/entities/agro/unit-economics/types';
import { calculateAgroReturn } from '@/entities/agro/unit-economics/services';
import type { CostItem } from '@/entities/finance/cost-item/types';
import { calculateRecurringCostSummary } from '@/entities/finance/cost-item/services';
import type { InvestmentContract } from '@/entities/finance/investment-contract/types';
import { calculateInvestmentsSnapshot } from '@/entities/finance/investment-contract/services';
import type { AttentionPoint, DashboardKpi } from '@/entities/finance/kpi/types';
import type { MaintenanceEvent } from '@/entities/finance/maintenance-event/types';
import { calculateMaintenanceInefficiency } from '@/entities/finance/maintenance-event/services';
import type { ImplantationItem } from '@/entities/finance/implantation-item/types';
import { calculateImplantationTotals } from '@/entities/finance/implantation-item/services';
import type { ImplantationProject } from '@/entities/finance/implantation-project/types';
import { groupImplantationByProject } from '@/entities/finance/implantation-project/services';
import type { PurchaseItem } from '@/entities/finance/purchase/types';

export interface FarmDomainSnapshot {
  crops: Crop[];
  cropPlans: CropPlan[];
  channels: DemandChannel[];
  lots: Lot[];
  unitEconomicsRows: UnitEconomicsRow[];
  marginsByChannel: ChannelMargin[];
  costs: CostItem[];
  purchases: PurchaseItem[];
  maintenance: MaintenanceEvent[];
  investments: InvestmentContract[];
  implantation: ImplantationItem[];
  implantationItems: ImplantationItem[];
  implantationProjects: ImplantationProject[];
}

export const calculateDashboardKpi = (snapshot: FarmDomainSnapshot): DashboardKpi => {
  const recurring = calculateRecurringCostSummary(snapshot.costs, snapshot.purchases, snapshot.maintenance);
  const implantation = calculateImplantationTotals(snapshot.implantationItems);
  const investments = calculateInvestmentsSnapshot(snapshot.investments);
  const agroReturn = calculateAgroReturn(snapshot.channels, recurring.monthlyReserveCents, implantation.committedCents);

  const monthlyInflowCents = agroReturn.internalRevenueCents + agroReturn.externalRevenueCents;
  const monthlyOutflowCents = recurring.monthlyReserveCents + investments.monthlyOutflowCents;

  return {
    recurringCostCents: recurring.monthlyReserveCents,
    implantationCommittedCents: implantation.committedCents,
    monthlyInflowCents,
    monthlyOutflowCents,
    projectedBalanceCents: monthlyInflowCents - monthlyOutflowCents,
    agroReturnCents: agroReturn.totalReturnCents,
    paybackMonths: agroReturn.paybackMonths
  };
};

export const buildAttentionPoints = (snapshot: FarmDomainSnapshot): AttentionPoint[] => {
  const points: AttentionPoint[] = [];

  if (snapshot.costs.some((item) => !item.category.trim())) {
    points.push({
      id: 'cost-sem-categoria',
      title: 'Custos sem categoria',
      description: 'Classifique esses custos para não distorcer leitura por centro de custo.',
      severity: 'high'
    });
  }

  const implantationTotals = calculateImplantationTotals(snapshot.implantationItems);
  if (implantationTotals.openCents > 0) {
    points.push({
      id: 'implantacao-aberta',
      title: 'Implantação com valor em aberto',
      description: 'Ainda há itens não fechados na implantação da operação.',
      severity: 'high'
    });
  }

  if (
    snapshot.implantationItems.some((item) => item.quotations.length === 0 || item.quotations.some((entry) => entry.status === 'pendente'))
  ) {
    points.push({
      id: 'cotacao-pendente',
      title: 'Cotação pendente de fechamento',
      description: 'Revise itens com cotações pendentes para reduzir risco de caixa.',
      severity: 'medium'
    });
  }

  const projects = groupImplantationByProject(snapshot.implantationProjects, snapshot.implantationItems);

  if (projects.some((entry) => entry.totals.remainingBudgetCents < 0)) {
    points.push({
      id: 'implantacao-projeto-acima-orcamento',
      title: 'Projeto de implantação acima do orçamento',
      description: 'Existe projeto com total previsto acima da meta definida.',
      severity: 'high'
    });
  }

  if (projects.some((entry) => entry.totals.itemCount === 0)) {
    points.push({
      id: 'implantacao-projeto-sem-itens',
      title: 'Projeto de implantação sem itens',
      description: 'Há projeto criado sem itens vinculados para orçamento.',
      severity: 'medium'
    });
  }

  if (projects.some((entry) => entry.project.budgetTargetCents <= 0)) {
    points.push({
      id: 'implantacao-projeto-sem-orcamento',
      title: 'Projeto de implantação sem orçamento válido',
      description: 'Defina uma meta de orçamento para acompanhar o saldo do projeto.',
      severity: 'medium'
    });
  }

  if (snapshot.maintenance.some((entry) => entry.cadenceType === 'sob_demanda')) {
    points.push({
      id: 'manut-sem-periodicidade',
      title: 'Manutenção corretiva sem periodicidade',
      description: 'Defina reserva para eventos sob demanda e reduzir surpresa de caixa.',
      severity: 'medium'
    });
  }

  if (snapshot.lots.some((entry) => calculateTraceabilityCompleteness(entry).status !== 'completa')) {
    points.push({
      id: 'lote-incompleto',
      title: 'Lote sem rastreabilidade completa',
      description: 'Existem lotes com histórico incompleto de aplicação/colheita.',
      severity: 'high'
    });
  }

  if (snapshot.cropPlans.some((plan) => !snapshot.costs.some((cost) => cost.linkedCropId === plan.cropId))) {
    points.push({
      id: 'cultivo-sem-custo',
      title: 'Cultivo sem custo associado',
      description: 'Associe custos por cultura para melhorar unit economics.',
      severity: 'high'
    });
  }

  if (snapshot.unitEconomicsRows.some((row) => row.costPerKgCents <= 0 && row.costPerUnitCents <= 0)) {
    points.push({
      id: 'preco-produto-indefinido',
      title: 'Preço/custo por produto ainda indefinido',
      description: 'Preencha rendimento e custos para obter margem por canal.',
      severity: 'medium'
    });
  }

  const kitchen = kitchenSensitivity(snapshot.channels);
  if (kitchen.risk !== 'low') {
    points.push({
      id: 'kitchen-transfer-price',
      title: 'Preço de transferência da cozinha sensível',
      description: 'A cozinha está abaixo do preço ideal e pode comprometer retorno.',
      severity: kitchen.risk === 'high' ? 'high' : 'medium'
    });
  }

  if (snapshot.cropPlans.some((plan) => calculateProjectionReliability(plan).status === 'baixa')) {
    points.push({
      id: 'retorno-confiabilidade-baixa',
      title: 'Projeção com baixa confiabilidade',
      description: 'Há planos com dados insuficientes para previsão segura.',
      severity: 'medium'
    });
  }

  if (snapshot.costs.some((item) => item.recurrenceType === 'extraordinario' && item.status === 'ativo')) {
    points.push({
      id: 'custo-extraordinario',
      title: 'Custo extraordinário ativo',
      description: 'Isolar esse custo no cenário extraordinário para não distorcer baseline.',
      severity: 'medium'
    });
  }

  const inefficiency = calculateMaintenanceInefficiency(snapshot.maintenance);
  if (inefficiency.downtimeDaysYear > 20) {
    points.push({
      id: 'downtime-alto',
      title: 'Parada anual elevada',
      description: `Downtime estimado em ${inefficiency.downtimeDaysYear.toFixed(1)} dias por ano.`,
      severity: 'high'
    });
  }

  return points.slice(0, 10);
};
