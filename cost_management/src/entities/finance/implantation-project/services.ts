import type { ImplantationItem } from '@/entities/finance/implantation-item/types';
import { calculateImplantationItemCommittedValueCents, calculateImplantationItemTotalCents } from '@/entities/finance/implantation-item/services';
import type { ImplantationProject, ImplantationProjectGroup, ImplantationProjectTotals } from '@/entities/finance/implantation-project/types';

const money = (value: number): number => Math.max(0, Math.round(Number.isFinite(value) ? value : 0));

export const calculateImplantationProjectTotals = (
  project: ImplantationProject,
  items: ImplantationItem[]
): ImplantationProjectTotals => {
  const scopedItems = items.filter((item) => item.projectId === project.id);
  const totalCents = scopedItems.reduce((acc, item) => acc + calculateImplantationItemTotalCents(item), 0);
  const committedCents = scopedItems.reduce((acc, item) => acc + calculateImplantationItemCommittedValueCents(item), 0);

  return {
    budgetTargetCents: money(project.budgetTargetCents),
    totalCents,
    committedCents,
    openCents: Math.max(0, totalCents - committedCents),
    remainingBudgetCents: money(project.budgetTargetCents) - totalCents,
    itemCount: scopedItems.length,
    selectedQuotationCount: scopedItems.filter((item) => Boolean(item.selectedQuotationId)).length
  };
};

export const groupImplantationByProject = (
  projects: ImplantationProject[],
  items: ImplantationItem[]
): ImplantationProjectGroup[] => {
  return projects.map((project) => {
    const scopedItems = items.filter((item) => item.projectId === project.id);
    return {
      project,
      totals: calculateImplantationProjectTotals(project, items),
      items: scopedItems
    };
  });
};
