import { useEffect, useMemo, useState } from 'react';
import {
  activeCultureTemplates,
  createProductionPlanFromCulture,
  normalizeCultivationCostAllocation,
  resolveAllocationValueCents,
  type Crop,
  type CropPurchaseType,
  type CropUnitType,
  type CultivationCostAllocation,
  type CultureTemplate,
  type CultureTemplateCategory
} from '@/entities';
import { useFinanceStore } from '@/app/store/useFinanceStore';
import { useOnboardingStore } from '@/app/store/useOnboardingStore';
import { useOptionCatalogStore } from '@/app/store/useOptionCatalogStore';
import { useProductionPlanningStore } from '@/app/store/useProductionPlanningStore';
import { usePurchasesStore } from '@/app/store/usePurchasesStore';
import { useUiPreferencesStore } from '@/app/store/useUiPreferencesStore';
import { fieldUnitMeta, formatCurrency, formatNumber } from '@/shared/lib/format';
import {
  CenterModal,
  ContextHelp,
  CreatableSelect,
  DetailCard,
  ExecutiveCard,
  InspectorDrawer,
  MoneyField,
  NumberField,
  SearchBar,
  SmartEmptyState,
  StatusChip,
  WizardModal
} from '@/shared/ui';

type DrawerMode = 'plan' | 'detail' | null;

const categoryOptions: CultureTemplateCategory[] = ['Folhosa', 'Erva / tempero', 'Raiz', 'Fruto', 'Flor / inflorescência', 'Brassica / crucífera', 'Outro'];

const unitOptions: Array<{ value: CropUnitType; label: string }> = [
  { value: 'muda', label: 'Muda' },
  { value: 'unidade', label: 'Unidade' },
  { value: 'cabeca', label: 'Cabeça' },
  { value: 'pe', label: 'Pé' },
  { value: 'maco', label: 'Maço' },
  { value: 'caixa', label: 'Caixa' },
  { value: 'bandeja', label: 'Bandeja' },
  { value: 'kg', label: 'Kg' },
  { value: 'outro', label: 'Outro' }
];

const purchaseTypeOptions: Array<{ value: CropPurchaseType; label: string }> = [
  { value: 'caixa', label: 'Caixa' },
  { value: 'bandeja', label: 'Bandeja' },
  { value: 'saco', label: 'Saco' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'unidade', label: 'Unidade' },
  { value: 'kg_semente', label: 'Kg de semente' },
  { value: 'outro', label: 'Outro' }
];

const costModeOptions: Array<{ value: CultivationCostAllocation['allocationMode']; label: string }> = [
  { value: 'total', label: 'Total' },
  { value: 'per_bed', label: 'Por canteiro' },
  { value: 'per_unit', label: 'Por unidade' }
];

const cultureStepIds = ['cultura', 'compra', 'espacamento', 'venda', 'custos_base', 'revisao'] as const;
const planStepIds = ['cultura', 'area', 'capacidade', 'perda', 'custos', 'venda', 'revisao'] as const;

const toMoneyField = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

const purchaseTypeLabel = (value: CropPurchaseType): string => {
  switch (value) {
    case 'caixa':
      return 'caixa';
    case 'bandeja':
      return 'bandeja';
    case 'saco':
      return 'saco';
    case 'pacote':
      return 'pacote';
    case 'unidade':
      return 'unidade';
    case 'kg_semente':
      return 'kg de semente';
    default:
      return 'formato personalizado';
  }
};

const unitTypeLabel = (value: CropUnitType): string => {
  switch (value) {
    case 'muda':
      return 'muda';
    case 'unidade':
      return 'unidade';
    case 'cabeca':
      return 'cabeça';
    case 'pe':
      return 'pé';
    case 'caixa':
      return 'caixa';
    case 'bandeja':
      return 'bandeja';
    case 'maco':
      return 'maço';
    case 'kg':
      return 'kg';
    default:
      return 'item';
  }
};

const supportsSalesBundle = (value: CropUnitType): boolean => value === 'caixa' || value === 'bandeja' || value === 'maco';

const salesBundleLabel = (value: CropUnitType): string | null => {
  switch (value) {
    case 'caixa':
      return 'Unidades por caixa';
    case 'bandeja':
      return 'Unidades por bandeja';
    case 'maco':
      return 'Unidades por maço';
    default:
      return null;
  }
};

const salesBundleMetricTitle = (value: CropUnitType): string | null => {
  switch (value) {
    case 'caixa':
      return 'Venda por caixa';
    case 'bandeja':
      return 'Venda por bandeja';
    case 'maco':
      return 'Venda por maço';
    default:
      return null;
  }
};

interface MoneyTextInputProps {
  cents: number;
  onCommit: (nextValueCents: number) => void;
}

const MoneyTextInput = ({ cents, onCommit }: MoneyTextInputProps) => <MoneyField valueCents={cents} onChange={onCommit} />;

const buildCulturePreview = (draft: ReturnType<typeof useProductionPlanningStore.getState>['cultureDraft']) => {
  const derivedSeedlingCostCents =
    draft.baseSeedlingCostCents > 0
      ? draft.baseSeedlingCostCents
      : Math.round(draft.purchasePackCostCents / Math.max(1, draft.unitsPerPurchasePack));

  const previewCrop: Crop = {
    id: 'preview-culture',
    name: draft.name.trim() || 'Nova cultura',
    variety: draft.variety.trim() || 'Padrão',
    category: draft.category.trim() || 'Folhosa',
    preferredUnits: draft.salesUnit === 'kg' ? ['unit', 'weight', 'box'] : ['unit', 'box', 'weight'],
    cycleDays: draft.cycleDays,
    productionUnit: draft.productionUnit,
    salesUnit: draft.salesUnit,
    purchaseType: draft.purchaseType,
    unitsPerPurchasePack: draft.unitsPerPurchasePack,
    purchasePackCostCents: draft.purchasePackCostCents,
    defaultPlantSpacingCm: draft.defaultPlantSpacingCm,
    defaultRowSpacingCm: draft.defaultRowSpacingCm,
    defaultBedWidthM: draft.defaultBedWidthM,
    defaultBedLengthM: draft.defaultBedLengthM,
    unitsPerSalesBox: draft.unitsPerSalesBox,
    defaultMarkupPct: draft.defaultMarkupPct,
    defaultLossRate: draft.defaultLossRate,
    baseSeedlingCostCents: derivedSeedlingCostCents,
    defaultCostSelections: draft.defaultCostSelections,
    environmentCompatibility: draft.environmentCompatibility,
    notes: draft.notes
  };

  const previewPlan = createProductionPlanFromCulture(previewCrop, {
    id: 'preview-plan',
    cropId: previewCrop.id,
    bedCount: 1,
    bedLengthM: draft.defaultBedLengthM,
    bedWidthM: draft.defaultBedWidthM,
    areaTotalSqm: draft.defaultBedLengthM * draft.defaultBedWidthM,
    expectedLossRate: draft.defaultLossRate,
    purchasePackCostCents: draft.purchasePackCostCents,
    unitsPerPurchasePack: draft.unitsPerPurchasePack,
    salesUnit: draft.salesUnit,
    unitsPerSalesBox: draft.unitsPerSalesBox,
    markupPct: draft.defaultMarkupPct,
    costAllocations: draft.defaultCostSelections,
    status: 'rascunho'
  });

  return { previewCrop, previewPlan, derivedSeedlingCostCents };
};

const applyTemplateToDraft = (template: CultureTemplate): Partial<ReturnType<typeof useProductionPlanningStore.getState>['cultureDraft']> => ({
  name: template.name,
  variety: template.variant,
  category: template.category,
  cycleDays: template.cycleDays,
  productionUnit: template.productionUnitDefault,
  salesUnit: template.salesUnitDefault,
  purchaseType: template.purchaseTypeDefault,
  unitsPerPurchasePack: template.unitsPerPurchasePack,
  purchasePackCostCents: template.seedCostCents > 0 ? template.seedCostCents * template.unitsPerPurchasePack : 0,
  defaultPlantSpacingCm: template.spacingBetweenPlantsCm,
  defaultRowSpacingCm: template.spacingBetweenRowsCm,
  defaultBedLengthM: template.bedLengthDefaultM,
  defaultBedWidthM: template.bedWidthDefaultM,
  unitsPerSalesBox: template.unitsPerSalesBox,
  defaultMarkupPct: template.recommendedMarkupPct,
  defaultLossRate: template.defaultLossRate,
  baseSeedlingCostCents: template.seedCostCents,
  defaultCostSelections: [],
  notes: ''
});

interface SelectableCostSource {
  id: string;
  sourceType: 'cost_item' | 'purchase_item';
  sourceId: string;
  label: string;
  category: string;
  helper: string;
  costValueCents: number;
}

const buildAllocationFromSource = (source: SelectableCostSource, inheritedFromCrop: boolean): CultivationCostAllocation =>
  normalizeCultivationCostAllocation({
    id: crypto.randomUUID(),
    sourceType: source.sourceType,
    sourceId: source.sourceId,
    label: source.label,
    category: source.category,
    costValueCents: source.costValueCents,
    allocationMode: 'total',
    inheritedFromCrop,
    enabled: true
  });

const calculateAllocationTotalForPlan = (allocation: CultivationCostAllocation, bedCount: number, viableUnits: number) => {
  const normalized = normalizeCultivationCostAllocation(allocation);
  if (!normalized.enabled) return 0;

  if (normalized.allocationMode === 'per_bed') {
    return normalized.allocatedPerBedCents * Math.max(1, bedCount);
  }

  if (normalized.allocationMode === 'per_unit') {
    return normalized.allocatedPerUnitCents * Math.max(1, viableUnits);
  }

  return normalized.costValueCents;
};

export const ProductionPlanningModule = () => {
  const optionCatalog = useOptionCatalogStore((state) => state.options);
  const addCatalogOption = useOptionCatalogStore((state) => state.addOption);
  const executiveMode = useUiPreferencesStore((state) => state.executiveMode);
  const crops = useProductionPlanningStore((state) => state.crops);
  const plans = useProductionPlanningStore((state) => state.plans);
  const cultureDraft = useProductionPlanningStore((state) => state.cultureDraft);
  const draft = useProductionPlanningStore((state) => state.draft);
  const costItems = useFinanceStore((state) => state.costItems);
  const updateCostItem = useFinanceStore((state) => state.updateCostItem);
  const purchases = usePurchasesStore((state) => state.purchases);
  const updatePurchase = usePurchasesStore((state) => state.updatePurchase);
  const setCultureDraft = useProductionPlanningStore((state) => state.setCultureDraft);
  const setCultureDefaultCostSelections = useProductionPlanningStore((state) => state.setCultureDefaultCostSelections);
  const toggleCultureDefaultCostSelection = useProductionPlanningStore((state) => state.toggleCultureDefaultCostSelection);
  const clearCultureDraft = useProductionPlanningStore((state) => state.clearCultureDraft);
  const addCultureFromDraft = useProductionPlanningStore((state) => state.addCultureFromDraft);
  const setDraft = useProductionPlanningStore((state) => state.setDraft);
  const setPlanCostAllocations = useProductionPlanningStore((state) => state.setPlanCostAllocations);
  const togglePlanCostAllocation = useProductionPlanningStore((state) => state.togglePlanCostAllocation);
  const addManualPlanCostAllocation = useProductionPlanningStore((state) => state.addManualPlanCostAllocation);
  const hydratePlanCostsFromCrop = useProductionPlanningStore((state) => state.hydratePlanCostsFromCrop);
  const replaceCultureCostsFromLinkedSources = useProductionPlanningStore((state) => state.replaceCultureCostsFromLinkedSources);
  const clearDraft = useProductionPlanningStore((state) => state.clearDraft);
  const addPlanFromDraft = useProductionPlanningStore((state) => state.addPlanFromDraft);
  const updatePlan = useProductionPlanningStore((state) => state.updatePlan);
  const startTour = useOnboardingStore((state) => state.startTour);

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedOverviewCropId, setSelectedOverviewCropId] = useState<string>('');
  const [planStepIndex, setPlanStepIndex] = useState(0);
  const [planError, setPlanError] = useState('');
  const [cultureModalOpen, setCultureModalOpen] = useState(false);
  const [cultureStepIndex, setCultureStepIndex] = useState(0);
  const [cultureError, setCultureError] = useState('');
  const [useTemplateMode, setUseTemplateMode] = useState(true);
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedCultureSourceId, setSelectedCultureSourceId] = useState('');
  const [selectedPlanSourceId, setSelectedPlanSourceId] = useState('');
  const [costBreakdownOpen, setCostBreakdownOpen] = useState(false);

  const selectedOverviewCrop = crops.find((crop) => crop.id === selectedOverviewCropId) ?? null;
  const selectedOverviewCropLabel = selectedOverviewCrop
    ? `${selectedOverviewCrop.name}${selectedOverviewCrop.variety ? ` • ${selectedOverviewCrop.variety}` : ''}`
    : '';
  const selectedDraftCrop = crops.find((crop) => crop.id === draft.cropId) ?? null;
  const selectedTemplate = activeCultureTemplates.find((template) => template.id === selectedTemplateId) ?? null;
  const culturePreview = useMemo(() => buildCulturePreview(cultureDraft), [cultureDraft]);
  const isCultureUnitPurchase = cultureDraft.purchaseType === 'unidade';
  const isPlanUnitPurchase = draft.purchasePackType === 'unidade';
  const cultureSalesBundleLabel = salesBundleLabel(cultureDraft.salesUnit);
  const planSalesBundleLabel = salesBundleLabel(draft.salesUnit);
  const cultureSalesBundleMetric = salesBundleMetricTitle(cultureDraft.salesUnit);
  const planSalesBundleMetric = salesBundleMetricTitle(draft.salesUnit);
  const cropCategoryOptions = useMemo(
    () => optionCatalog['crop-category'] ?? categoryOptions.map((entry) => ({ value: entry, label: entry })),
    [optionCatalog]
  );

  const allCostSources = useMemo<SelectableCostSource[]>(
    () => [
      ...costItems.map((item) => ({
        id: `cost_item:${item.id}`,
        sourceType: 'cost_item' as const,
        sourceId: item.id,
        label: item.name,
        category: item.category,
        helper: item.subcategory,
        costValueCents: item.eventValueCents > 0 ? item.eventValueCents : item.monthlyEquivalentCents
      })),
      ...purchases.map((item) => ({
        id: `purchase_item:${item.id}`,
        sourceType: 'purchase_item' as const,
        sourceId: item.id,
        label: item.name,
        category: item.category,
        helper: item.subcategory,
        costValueCents: item.eventValueCents > 0 ? item.eventValueCents : item.monthlyEquivalentCents
      }))
    ],
    [costItems, purchases]
  );

  const cultureSelectableSources = useMemo(() => {
    const selectedKeys = new Set(cultureDraft.defaultCostSelections.map((allocation) => `${allocation.sourceType}:${allocation.sourceId}`));
    return allCostSources.filter((source) => !selectedKeys.has(`${source.sourceType}:${source.sourceId}`));
  }, [allCostSources, cultureDraft.defaultCostSelections]);

  const planSelectableSources = useMemo(() => {
    const selectedKeys = new Set(draft.costAllocations.map((allocation) => `${allocation.sourceType}:${allocation.sourceId}`));
    return allCostSources.filter((source) => !selectedKeys.has(`${source.sourceType}:${source.sourceId}`));
  }, [allCostSources, draft.costAllocations]);

  const templateMatches = useMemo(() => {
    const query = templateSearch.toLowerCase();
    return activeCultureTemplates.filter((template) => {
      return (
        template.name.toLowerCase().includes(query) ||
        template.variant.toLowerCase().includes(query) ||
        template.category.toLowerCase().includes(query)
      );
    });
  }, [templateSearch]);

  const draftPreview = useMemo(() => {
    if (!selectedDraftCrop) return null;
    const resolvedCostAllocations = draft.costAllocations.map((allocation) =>
      normalizeCultivationCostAllocation({
        ...allocation,
        costValueCents: resolveAllocationValueCents(normalizeCultivationCostAllocation(allocation), costItems, purchases)
      })
    );
    return createProductionPlanFromCulture(selectedDraftCrop, {
      id: 'draft-preview',
      cropId: selectedDraftCrop.id,
      areaTotalSqm: draft.areaTotalSqm,
      bedCount: draft.bedCount,
      bedLengthM: draft.bedLengthM,
      bedWidthM: draft.bedWidthM,
      plantSpacingCm: draft.plantSpacingCm,
      rowSpacingCm: draft.rowSpacingCm,
      cycleDays: draft.cycleDays,
      expectedLossRate: draft.expectedLossRate,
      purchasePackType: draft.purchasePackType,
      unitsPerPurchasePack: draft.unitsPerPurchasePack,
      purchasePackCostCents: draft.purchasePackCostCents,
      salesUnit: draft.salesUnit,
      unitsPerSalesBox: draft.unitsPerSalesBox,
      markupPct: draft.markupPct,
      staggeredProduction: draft.staggeredProduction,
      targetChannelMix: draft.targetChannelMix,
      costAllocations: resolvedCostAllocations,
      notes: draft.notes,
      status: draft.status
    });
  }, [costItems, draft, purchases, selectedDraftCrop]);

  const resolvedPlans = useMemo(
    () =>
      plans.map((plan) => {
        const crop = crops.find((item) => item.id === plan.cropId);
        if (!crop) return plan;

        const resolvedCostAllocations = plan.costAllocations.map((allocation) =>
          normalizeCultivationCostAllocation({
            ...allocation,
            costValueCents: resolveAllocationValueCents(normalizeCultivationCostAllocation(allocation), costItems, purchases)
          })
        );

        return createProductionPlanFromCulture(crop, {
          ...plan,
          costAllocations: resolvedCostAllocations
        });
      }),
    [costItems, crops, plans, purchases]
  );

  const selectedResolvedPlan = resolvedPlans.find((plan) => plan.id === selectedPlanId) ?? null;

  useEffect(() => {
    if (!crops.length) {
      setSelectedOverviewCropId('');
      return;
    }

    if (!selectedOverviewCropId || !crops.some((crop) => crop.id === selectedOverviewCropId)) {
      setSelectedOverviewCropId(crops[0].id);
    }
  }, [crops, selectedOverviewCropId]);

  const overviewPlans = useMemo(
    () => resolvedPlans.filter((plan) => plan.cropId === selectedOverviewCropId),
    [resolvedPlans, selectedOverviewCropId]
  );

  const overviewCostPerUnitCents = useMemo(() => {
    if (overviewPlans.length > 0) {
      return Math.round(overviewPlans.reduce((acc, plan) => acc + plan.costPerUnitCents, 0) / overviewPlans.length);
    }

    return selectedOverviewCrop?.baseSeedlingCostCents ?? 0;
  }, [overviewPlans, selectedOverviewCrop]);

  const overviewSuggestedSaleCents = useMemo(() => {
    if (overviewPlans.length > 0) {
      return Math.round(
        overviewPlans.reduce((acc, plan) => acc + plan.suggestedSalePricePerUnitCents, 0) / overviewPlans.length
      );
    }

    if (!selectedOverviewCrop) return 0;
    return Math.round(selectedOverviewCrop.baseSeedlingCostCents * (1 + selectedOverviewCrop.defaultMarkupPct / 100));
  }, [overviewPlans, selectedOverviewCrop]);

  const selectedOverviewBreakdowns = useMemo(
    () =>
      overviewPlans.map((plan) => {
        const inheritedCostsCents = plan.costAllocations
          .filter((allocation) => allocation.inheritedFromCrop)
          .reduce((acc, allocation) => acc + calculateAllocationTotalForPlan(allocation, plan.bedCount, plan.viableUnits), 0);
        const manualCostsCents = plan.costAllocations
          .filter((allocation) => allocation.sourceType === 'manual' && !allocation.inheritedFromCrop)
          .reduce((acc, allocation) => acc + calculateAllocationTotalForPlan(allocation, plan.bedCount, plan.viableUnits), 0);
        const linkedPlanCostsCents = plan.costAllocations
          .filter((allocation) => allocation.sourceType !== 'manual' && !allocation.inheritedFromCrop)
          .reduce((acc, allocation) => acc + calculateAllocationTotalForPlan(allocation, plan.bedCount, plan.viableUnits), 0);

        return {
          plan,
          purchaseCostCents: plan.packsNeeded * plan.purchasePackCostCents,
          inheritedCostsCents,
          manualCostsCents,
          linkedPlanCostsCents
        };
      }),
    [overviewPlans]
  );

  const cropCardSummaries = useMemo(
    () =>
      crops.map((crop) => {
        const cropPlans = resolvedPlans.filter((plan) => plan.cropId === crop.id);
        const totalAreaSqm = cropPlans.reduce((acc, plan) => acc + plan.areaTotalSqm, 0);
        const allocatedValueCents = cropPlans.length
          ? Math.round(cropPlans.reduce((acc, plan) => acc + plan.costPerUnitCents, 0) / cropPlans.length)
          : crop.baseSeedlingCostCents;

        return {
          crop,
          varietyLabel: crop.variety.trim() || 'Variedade base',
          cycleAndArea:
            cropPlans.length > 0
              ? `${crop.cycleDays} dias • ${formatNumber(totalAreaSqm, 2)} m² em plantio`
              : `${crop.cycleDays} dias • ${formatNumber(crop.defaultBedLengthM * crop.defaultBedWidthM, 2)} m² por canteiro`,
          allocatedValueLabel:
            allocatedValueCents > 0
              ? `${formatCurrency(allocatedValueCents)} por ${unitTypeLabel(crop.productionUnit)}`
              : `Sem valor por ${unitTypeLabel(crop.productionUnit)}`
        };
      }),
    [crops, resolvedPlans]
  );

  const openCultureWizard = () => {
    clearCultureDraft();
    setCultureModalOpen(true);
    setCultureStepIndex(0);
    setCultureError('');
    setUseTemplateMode(true);
    setTemplateSearch('');
    setSelectedTemplateId('');
    setSelectedCultureSourceId('');
  };

  const openPlanWizard = (cropId?: string) => {
    const nextCropId = cropId ?? crops[0]?.id;
    if (nextCropId) {
      replaceCultureCostsFromLinkedSources(nextCropId);
    }
    clearDraft(nextCropId);
    if (nextCropId) {
      hydratePlanCostsFromCrop(nextCropId);
    }
    setPlanStepIndex(0);
    setPlanError('');
    setDrawerMode('plan');
    setSelectedPlanSourceId('');
  };

  const handleCultureSalesUnitChange = (salesUnit: CropUnitType) => {
    setCultureDraft({
      salesUnit,
      unitsPerSalesBox: supportsSalesBundle(salesUnit) ? Math.max(1, cultureDraft.unitsPerSalesBox || 12) : 0
    });
  };

  const handlePlanSalesUnitChange = (salesUnit: CropUnitType) => {
    setDraft({
      salesUnit,
      unitsPerSalesBox: supportsSalesBundle(salesUnit) ? Math.max(1, draft.unitsPerSalesBox || 12) : 0
    });
  };

  const addSourceToCultureDefaults = () => {
    const source = cultureSelectableSources.find((item) => item.id === selectedCultureSourceId);
    if (!source) return;
    setCultureDefaultCostSelections([...cultureDraft.defaultCostSelections, buildAllocationFromSource(source, true)]);
    setSelectedCultureSourceId('');
  };

  const addSourceToPlan = () => {
    const source = planSelectableSources.find((item) => item.id === selectedPlanSourceId);
    if (!source) return;
    setPlanCostAllocations([...draft.costAllocations, buildAllocationFromSource(source, false)]);
    setSelectedPlanSourceId('');
  };

  const applyTemplate = (template: CultureTemplate) => {
    setSelectedTemplateId(template.id);
    setCultureDraft(applyTemplateToDraft(template));
    setCultureError('');
  };

  const validateCultureStep = (stepId: (typeof cultureStepIds)[number]): string | null => {
    if (stepId === 'cultura') {
      if (!cultureDraft.name.trim()) return 'Defina o nome da cultura.';
      if (!cultureDraft.category.trim()) return 'Escolha a categoria.';
      if (cultureDraft.cycleDays <= 0) return 'Informe o ciclo médio em dias.';
      if (!cultureDraft.productionUnit) return 'Escolha a unidade de produção.';
      if (!cultureDraft.salesUnit) return 'Escolha a unidade de venda.';
      return null;
    }

    if (stepId === 'compra') {
      if (!cultureDraft.purchaseType) return 'Escolha como a cultura é comprada.';
      if (cultureDraft.purchaseType !== 'unidade' && cultureDraft.unitsPerPurchasePack <= 0) return 'Informe quantas unidades vêm por embalagem.';
      if (cultureDraft.purchasePackCostCents < 0) return 'Revise o custo da embalagem.';
      return null;
    }

    if (stepId === 'espacamento') {
      if (cultureDraft.defaultPlantSpacingCm <= 0) return 'Informe o espaçamento entre plantas.';
      if (cultureDraft.defaultRowSpacingCm <= 0) return 'Informe o espaçamento entre linhas.';
      if (cultureDraft.defaultBedLengthM <= 0) return 'Informe o comprimento do canteiro.';
      if (cultureDraft.defaultBedWidthM <= 0) return 'Informe a largura do canteiro.';
      return null;
    }

    if (stepId === 'venda') {
      if (!cultureDraft.salesUnit) return 'Escolha a unidade principal de venda.';
      if (cultureDraft.defaultMarkupPct < 0) return 'Revise a margem.';
      if (cultureDraft.defaultLossRate < 0) return 'Revise a perda esperada.';
      return null;
    }

    return null;
  };

  const goToNextCultureStep = () => {
    const currentStepId = cultureStepIds[cultureStepIndex];
    const error = validateCultureStep(currentStepId);
    if (error) {
      setCultureError(error);
      return;
    }

    setCultureError('');
    setCultureStepIndex((index) => Math.min(index + 1, cultureStepIds.length - 1));
  };

  const goToPreviousCultureStep = () => {
    setCultureError('');
    setCultureStepIndex((index) => Math.max(index - 1, 0));
  };

  const saveCultureDraft = () => {
    setCultureModalOpen(false);
    setCultureError('');
  };

  const createCulture = () => {
    const error = validateCultureStep('custos_base') || validateCultureStep('venda');
    if (error) {
      setCultureError(error);
      return;
    }

    const cropId = addCultureFromDraft();
    if (!cropId) {
      setCultureError('Não foi possível salvar a cultura. Revise os campos principais.');
      return;
    }

    cultureDraft.defaultCostSelections.forEach((allocation) => {
      if (allocation.sourceType === 'cost_item' && allocation.sourceId) {
        updateCostItem(allocation.sourceId, { linkedCropId: cropId });
      }

      if (allocation.sourceType === 'purchase_item' && allocation.sourceId) {
        updatePurchase(allocation.sourceId, { linkedCropId: cropId });
      }
    });

    setCultureModalOpen(false);
    setCultureStepIndex(0);
    setCultureError('');
    clearDraft(cropId);
  };

  const createPlan = () => {
    const error = validatePlanStep('revisao');
    if (error) {
      setPlanError(error);
      return;
    }
    const planId = addPlanFromDraft();
    if (!planId) return;
    setDrawerMode(null);
    setSelectedPlanId(planId);
  };

  const cultureSteps = [
    {
      id: 'cultura',
      title: 'Cultura',
      content: (
        <div className="page-stack">
          <div className="template-mode-row">
            <button type="button" className={useTemplateMode ? 'filter-pill is-active' : 'filter-pill'} onClick={() => setUseTemplateMode(true)}>
              Usar modelo
            </button>
            <button type="button" className={!useTemplateMode ? 'filter-pill is-active' : 'filter-pill'} onClick={() => setUseTemplateMode(false)}>
              Começar do zero
            </button>
          </div>

          {useTemplateMode && (
            <div className="page-stack">
              <SearchBar value={templateSearch} onChange={setTemplateSearch} placeholder="Buscar cultura base" />

              <div className="template-grid">
                {templateMatches.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className={selectedTemplateId === template.id ? 'template-card is-active' : 'template-card'}
                    onClick={() => applyTemplate(template)}
                  >
                    <span>{template.name}</span>
                    <strong>{template.variant}</strong>
                    <small>{template.category} · {template.cycleDays} dias</small>
                  </button>
                ))}
              </div>

              {selectedTemplate && (
                <div className="executive-grid">
                  <ExecutiveCard title="Plantas/canteiro" value={selectedTemplate.plantsPerBed ? formatNumber(selectedTemplate.plantsPerBed, 0) : '--'} helper="Base do planejamento" tone="info" />
                  <ExecutiveCard title="Produção semanal" value={selectedTemplate.weeklyProductionEstimate ? formatNumber(selectedTemplate.weeklyProductionEstimate, 0) : '--'} helper="Base do planejamento" tone="neutral" />
                  <ExecutiveCard title="Custo base" value={selectedTemplate.totalEstimatedCostCents > 0 ? formatCurrency(selectedTemplate.totalEstimatedCostCents) : 'Sem custo'} helper="Por unidade" tone="warning" />
                </div>
              )}
            </div>
          )}

          <div className="section-grid-2">
            <label>
              Nome da cultura
              <input className="input-dark" value={cultureDraft.name} onChange={(event) => setCultureDraft({ name: event.target.value })} />
            </label>
            <label>
              Variante
              <input className="input-dark" value={cultureDraft.variety} onChange={(event) => setCultureDraft({ variety: event.target.value })} />
            </label>
            <label>
              Categoria
              <CreatableSelect
                value={cultureDraft.category}
                options={cropCategoryOptions}
                placeholder="Escolha a categoria"
                onChange={(value) => setCultureDraft({ category: value })}
                onCreate={(label) => addCatalogOption('crop-category', label, label)}
                createLabel="Criar categoria"
              />
            </label>
            <label>
              Ciclo (dias)
              <NumberField value={cultureDraft.cycleDays} onChange={(event) => setCultureDraft({ cycleDays: Number(event.target.value || 0) })} suffix="dias" />
            </label>
            <label>
              Unidade principal de produção
              <select className="select-dark" value={cultureDraft.productionUnit} onChange={(event) => setCultureDraft({ productionUnit: event.target.value as CropUnitType })}>
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          <label>
            Unidade principal de venda
            <select className="select-dark" value={cultureDraft.salesUnit} onChange={(event) => handleCultureSalesUnitChange(event.target.value as CropUnitType)}>
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
              </select>
            </label>
          </div>
        </div>
      )
    },
    {
      id: 'compra',
      title: 'Compra',
      content: (
        <div className="section-grid-2">
          <label>
            Tipo de compra
            <select className="select-dark" value={cultureDraft.purchaseType} onChange={(event) => setCultureDraft({ purchaseType: event.target.value as CropPurchaseType })}>
              {purchaseTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {isCultureUnitPurchase ? (
            <InlineMetric label="Compra unitária" value="1 unidade por compra" />
          ) : (
            <label>
              Unidades por embalagem
              <NumberField
                value={cultureDraft.unitsPerPurchasePack}
                onChange={(event) => setCultureDraft({ unitsPerPurchasePack: Number(event.target.value || 0) })}
                suffix={unitTypeLabel(cultureDraft.productionUnit)}
              />
            </label>
          )}
          {!isCultureUnitPurchase && (
            <label>
              Custo por embalagem
              <MoneyTextInput cents={cultureDraft.purchasePackCostCents} onCommit={(nextValueCents) => setCultureDraft({ purchasePackCostCents: nextValueCents })} />
            </label>
          )}
          <label>
            {isCultureUnitPurchase ? 'Custo por unidade' : `Custo da ${cultureDraft.purchaseType}`}
            <MoneyTextInput
              cents={cultureDraft.baseSeedlingCostCents}
              onCommit={(nextValueCents) => setCultureDraft({ baseSeedlingCostCents: nextValueCents })}
            />
          </label>
          {!isCultureUnitPurchase && (
            <InlineMetric label="Cruzamento automático" value={`${toMoneyField(cultureDraft.baseSeedlingCostCents)} x ${cultureDraft.unitsPerPurchasePack || 0} = ${toMoneyField(cultureDraft.purchasePackCostCents)}`} />
          )}
        </div>
      )
    },
    {
      id: 'espacamento',
      title: 'Espaçamento',
      content: (
        <div className="section-grid-2">
          <label>
            Entre plantas (cm)
            <NumberField value={cultureDraft.defaultPlantSpacingCm} onChange={(event) => setCultureDraft({ defaultPlantSpacingCm: Number(event.target.value || 0) })} suffix={fieldUnitMeta.spacing} />
          </label>
          <label>
            Entre linhas (cm)
            <NumberField value={cultureDraft.defaultRowSpacingCm} onChange={(event) => setCultureDraft({ defaultRowSpacingCm: Number(event.target.value || 0) })} suffix={fieldUnitMeta.spacing} />
          </label>
          <label>
            Comprimento do canteiro (m)
            <NumberField step="0.01" value={cultureDraft.defaultBedLengthM} onChange={(event) => setCultureDraft({ defaultBedLengthM: Number(event.target.value || 0) })} suffix={fieldUnitMeta.bedLength} />
          </label>
          <label>
            Largura do canteiro (m)
            <NumberField step="0.01" value={cultureDraft.defaultBedWidthM} onChange={(event) => setCultureDraft({ defaultBedWidthM: Number(event.target.value || 0) })} suffix={fieldUnitMeta.bedWidth} />
          </label>
          <InlineMetric label="Área do canteiro" value={`${formatNumber(culturePreview.previewPlan.bedAreaSqm, 2)} m²`} />
          <InlineMetric label="Plantas por canteiro" value={formatNumber(culturePreview.previewPlan.theoreticalUnits, 0)} />
        </div>
      )
    },
    {
      id: 'venda',
      title: 'Venda',
      content: (
        <div className="section-grid-2">
          <label>
            Unidade de venda
            <select className="select-dark" value={cultureDraft.salesUnit} onChange={(event) => handleCultureSalesUnitChange(event.target.value as CropUnitType)}>
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {cultureSalesBundleLabel && (
            <label>
              {cultureSalesBundleLabel}
              <NumberField value={cultureDraft.unitsPerSalesBox} onChange={(event) => setCultureDraft({ unitsPerSalesBox: Number(event.target.value || 0) })} suffix={unitTypeLabel(cultureDraft.productionUnit)} />
            </label>
          )}
          <label>
            Lucro pretendido (%)
            <NumberField value={cultureDraft.defaultMarkupPct} onChange={(event) => setCultureDraft({ defaultMarkupPct: Number(event.target.value || 0) })} suffix={fieldUnitMeta.percent} />
          </label>
          <label>
            Perda esperada (%)
            <NumberField value={cultureDraft.defaultLossRate} onChange={(event) => setCultureDraft({ defaultLossRate: Number(event.target.value || 0) })} suffix={fieldUnitMeta.percent} />
          </label>
          <label className="span-2">
            Observações
            <input className="input-dark" value={cultureDraft.notes} onChange={(event) => setCultureDraft({ notes: event.target.value })} />
          </label>
        </div>
      )
    },
    {
      id: 'custos_base',
      title: 'Custos base',
      content: (
        <div className="page-stack">
          <div className="section-grid-2">
            <label>
              Adicionar custo da fazenda
              <select className="select-dark" value={selectedCultureSourceId} onChange={(event) => setSelectedCultureSourceId(event.target.value)}>
                <option value="">Escolha um custo ou compra</option>
                {cultureSelectableSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label} · {source.category}
                  </option>
                ))}
              </select>
            </label>
            <div className="action-row" style={{ alignItems: 'end' }}>
              <button type="button" className="ghost-btn" onClick={addSourceToCultureDefaults} disabled={!selectedCultureSourceId}>
                Adicionar custo
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() =>
                  setCultureDefaultCostSelections([
                    ...cultureDraft.defaultCostSelections,
                    normalizeCultivationCostAllocation({
                      id: crypto.randomUUID(),
                      sourceType: 'manual',
                      sourceId: null,
                      label: 'Custo manual',
                      category: 'Manual',
                      costValueCents: 0,
                      allocationMode: 'total',
                      inheritedFromCrop: true,
                      enabled: true
                    })
                  ])
                }
              >
                Custo manual
              </button>
            </div>
          </div>

          {cultureDraft.defaultCostSelections.length === 0 ? (
            <SmartEmptyState
              title="Nenhum custo ligado a esta cultura"
              description={`Você pode continuar só com o custo da ${cultureDraft.purchaseType} ou incluir custos e compras da fazenda.`}
              action={<button type="button" className="ghost-btn" onClick={() => setCultureStepIndex(cultureStepIds.indexOf('revisao'))}>Continuar sem custo base</button>}
            />
          ) : (
            <div className="table-lite-wrap">
              <table className="table-lite">
                <thead>
                  <tr>
                    <th>Entra</th>
                    <th>Origem</th>
                    <th>Modo</th>
                    <th>Valor</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cultureDraft.defaultCostSelections.map((allocation) => (
                    <tr key={allocation.id}>
                      <td>
                        <button type="button" className={allocation.enabled ? 'ghost-btn is-active' : 'ghost-btn'} onClick={() => toggleCultureDefaultCostSelection(allocation.id)}>
                          {allocation.enabled ? 'Sim' : 'Não'}
                        </button>
                      </td>
                      <td>
                        <strong>{allocation.label}</strong>
                        <div>{allocation.sourceType === 'manual' ? 'Manual' : allocation.sourceType === 'cost_item' ? 'Custo' : 'Compra'}</div>
                      </td>
                      <td>
                        <select
                          className="select-dark"
                          value={allocation.allocationMode}
                          onChange={(event) =>
                            setCultureDefaultCostSelections(
                              cultureDraft.defaultCostSelections.map((item) =>
                                item.id === allocation.id
                                  ? normalizeCultivationCostAllocation({ ...item, allocationMode: event.target.value as CultivationCostAllocation['allocationMode'] })
                                  : item
                              )
                            )
                          }
                        >
                          {costModeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <MoneyTextInput
                          cents={allocation.costValueCents}
                          onCommit={(nextValueCents) =>
                            setCultureDefaultCostSelections(
                              cultureDraft.defaultCostSelections.map((item) =>
                                item.id === allocation.id
                                  ? normalizeCultivationCostAllocation({ ...item, costValueCents: nextValueCents })
                                  : item
                              )
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => setCultureDefaultCostSelections(cultureDraft.defaultCostSelections.filter((item) => item.id !== allocation.id))}
                        >
                          Tirar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'revisao',
      title: 'Revisão',
      content: (
        <div className="page-stack">
          <div className="executive-grid">
            <ExecutiveCard title="Capacidade/canteiro" value={formatNumber(culturePreview.previewPlan.theoreticalUnits, 0)} helper={cultureDraft.productionUnit} tone="info" />
            <ExecutiveCard title={`Custo da ${cultureDraft.purchaseType}`} value={formatCurrency(culturePreview.derivedSeedlingCostCents)} helper="Base de compra" tone="warning" />
            <ExecutiveCard title="Venda sugerida" value={formatCurrency(culturePreview.previewPlan.suggestedSalePricePerUnitCents)} helper={unitTypeLabel(cultureDraft.salesUnit)} tone="positive" />
            {cultureSalesBundleMetric && (
              <ExecutiveCard
                title={cultureSalesBundleMetric}
                value={cultureDraft.unitsPerSalesBox > 0 ? formatCurrency(culturePreview.previewPlan.suggestedSalePricePerBoxCents) : 'Sem embalagem'}
                helper={cultureDraft.unitsPerSalesBox > 0 ? `${cultureDraft.unitsPerSalesBox} por ${unitTypeLabel(cultureDraft.salesUnit)}` : 'Opcional'}
                tone="neutral"
              />
            )}
            <ExecutiveCard title="Custos base" value={String(cultureDraft.defaultCostSelections.filter((item) => item.enabled).length)} helper="Entram no cálculo" tone="info" />
          </div>
        </div>
      )
    }
  ];

  const validatePlanStep = (stepId: (typeof planStepIds)[number]): string | null => {
    if (stepId === 'cultura' && !draft.cropId) return 'Escolha a cultura do plano.';
    if (stepId === 'area') {
      if (draft.bedCount <= 0) return 'Informe quantos canteiros entram no plano.';
      if (draft.bedLengthM <= 0 || draft.bedWidthM <= 0) return 'Revise as medidas do canteiro.';
      return null;
    }
    if (stepId === 'perda' && draft.expectedLossRate < 0) return 'Revise a perda esperada.';
    if (stepId === 'custos') {
      if (draft.purchasePackType !== 'unidade' && draft.unitsPerPurchasePack <= 0) return 'Informe quantas unidades vêm por embalagem.';
      if (draft.purchasePackCostCents < 0) return isPlanUnitPurchase ? 'Revise o custo por unidade.' : 'Revise o custo da embalagem.';
      return null;
    }
    if (stepId === 'venda' && draft.markupPct < 0) return 'Revise o lucro pretendido.';
    return null;
  };

  const goToNextPlanStep = () => {
    const currentStepId = planStepIds[planStepIndex];
    const error = validatePlanStep(currentStepId);
    if (error) {
      setPlanError(error);
      return;
    }
    setPlanError('');
    setPlanStepIndex((index) => Math.min(index + 1, planStepIds.length - 1));
  };

  const goToPreviousPlanStep = () => {
    setPlanError('');
    setPlanStepIndex((index) => Math.max(index - 1, 0));
  };

  const planSteps = [
    {
      id: 'cultura',
      title: 'Cultura',
      content: (
        <div className="section-grid-2">
          <label>
            Cultura
            <select className="select-dark" value={draft.cropId} onChange={(event) => setDraft({ cropId: event.target.value })}>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>{crop.name}</option>
              ))}
            </select>
          </label>
          <InlineMetric
            label="Compra"
            value={
              selectedDraftCrop
                ? selectedDraftCrop.purchaseType === 'unidade'
                  ? 'Compra unitária'
                  : `${purchaseTypeLabel(selectedDraftCrop.purchaseType)} • ${selectedDraftCrop.unitsPerPurchasePack}`
                : '--'
            }
          />
          <InlineMetric label="Venda" value={selectedDraftCrop ? unitTypeLabel(selectedDraftCrop.salesUnit) : '--'} />
          <InlineMetric label="Ciclo" value={selectedDraftCrop ? `${selectedDraftCrop.cycleDays} dias` : '--'} />
        </div>
      )
    },
    {
      id: 'area',
      title: 'Espaço',
      content: (
        <div className="section-grid-2">
          <label title="Quanto espaço você tem disponível no total?" data-tour="plan-area-input">
            Área de cultivo (m²)
            <NumberField step="0.01" value={draft.areaTotalSqm} onChange={(event) => setDraft({ areaTotalSqm: Number(event.target.value || 0) })} suffix={fieldUnitMeta.area} />
          </label>
          <label title="Quantos canteiros você vai dedicar a este plantio?" data-tour="plan-bed-input">
            Número de canteiros
            <NumberField value={draft.bedCount} onChange={(event) => setDraft({ bedCount: Number(event.target.value || 0) })} suffix="un." />
          </label>
          <label title="Medida padrão do seu canteiro.">
            Comprimento (m)
            <NumberField step="0.01" value={draft.bedLengthM} onChange={(event) => setDraft({ bedLengthM: Number(event.target.value || 0) })} suffix={fieldUnitMeta.bedLength} />
          </label>
          <label title="Largura padrão do seu canteiro.">
            Largura (m)
            <NumberField step="0.01" value={draft.bedWidthM} onChange={(event) => setDraft({ bedWidthM: Number(event.target.value || 0) })} suffix={fieldUnitMeta.bedWidth} />
          </label>
        </div>
      )
    },
    {
      id: 'capacidade',
      title: 'Cálculo',
      content: draftPreview ? (
        <div className="executive-grid" data-tour="plan-calculation-results">
          <ExecutiveCard title="Cabe por canteiro" value={formatNumber(draftPreview.theoreticalUnits / Math.max(1, draftPreview.bedCount), 0)} helper={unitTypeLabel(draftPreview.salesUnit)} tone="info" />
          <ExecutiveCard title="Área total usada" value={`${formatNumber(draftPreview.areaTotalSqm, 2)} m²`} helper={`${draftPreview.bedCount} canteiro(s)`} tone="neutral" />
          <ExecutiveCard title="O que pedir" value={`${draftPreview.packsNeeded}`} helper={`${purchaseTypeLabel(draftPreview.purchasePackType)}(s)`} tone="warning" />
          <ExecutiveCard title="Vai sobrar" value={formatNumber(draftPreview.remainingUnitsFromPacks, 0)} helper="mudas/sementes" tone="positive" />
        </div>
      ) : (
        <SmartEmptyState title="Cálculo automático" description="Preencha as medidas para o sistema calcular quanto cabe." />
      )
    },
    {
      id: 'perda',
      title: 'Perda',
      content: draftPreview ? (
        <div className="section-grid-2">
          <label title="Percentual esperado entre plantio e colheita.">
            Perda esperada (%)
            <NumberField value={draft.expectedLossRate} onChange={(event) => setDraft({ expectedLossRate: Number(event.target.value || 0) })} suffix={fieldUnitMeta.percent} />
          </label>
          <InlineMetric label="Unidades brutas" value={formatNumber(draftPreview.theoreticalUnits, 0)} />
          <InlineMetric label="Plantas boas" value={formatNumber(draftPreview.viableUnits, 0)} />
          <InlineMetric label="Custo por unidade" value={draftPreview.costPerUnitCents > 0 ? formatCurrency(draftPreview.costPerUnitCents) : 'Faltam custos'} />
        </div>
      ) : null
    },
    {
      id: 'custos',
      title: 'Custos',
      content: (
        <div className="page-stack">
          <div className="section-grid-2">
            <label>
              {isPlanUnitPurchase ? 'Custo por unidade' : 'Custo da embalagem'}
              <MoneyTextInput cents={draft.purchasePackCostCents} onCommit={(nextValueCents) => setDraft({ purchasePackCostCents: nextValueCents })} />
            </label>
            {isPlanUnitPurchase ? (
              <InlineMetric label="Compra unitária" value="1 unidade por compra" />
            ) : (
              <label>
                Unidades por embalagem
                <NumberField value={draft.unitsPerPurchasePack} onChange={(event) => setDraft({ unitsPerPurchasePack: Number(event.target.value || 0) })} suffix={unitTypeLabel(selectedDraftCrop?.productionUnit ?? 'unidade')} />
              </label>
            )}
          </div>

          <div className="section-grid-2">
            <label>
              Adicionar custo da fazenda
              <select className="select-dark" value={selectedPlanSourceId} onChange={(event) => setSelectedPlanSourceId(event.target.value)}>
                <option value="">Escolha um custo ou compra</option>
                {planSelectableSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.label} · {source.category}
                  </option>
                ))}
              </select>
            </label>
            <div className="action-row" style={{ alignItems: 'end' }}>
              <button type="button" className="ghost-btn" onClick={addSourceToPlan} disabled={!selectedPlanSourceId}>
                Adicionar custo
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  if (!draft.cropId) return;
                  replaceCultureCostsFromLinkedSources(draft.cropId);
                  hydratePlanCostsFromCrop(draft.cropId);
                }}
                disabled={!draft.cropId}
              >
                Puxar da cultura
              </button>
              <button type="button" className="ghost-btn" onClick={addManualPlanCostAllocation}>
                Custo manual
              </button>
            </div>
          </div>

          {draft.costAllocations.length === 0 ? (
            <SmartEmptyState
              title="Nenhum custo adicional entrou neste plano"
              description="Selecione custos da cultura ou adicione um custo manual para refinar o custo por unidade."
              action={<button type="button" className="cta-btn" onClick={addManualPlanCostAllocation}>Adicionar custo ao plano</button>}
            />
          ) : (
            <div className="table-lite-wrap">
              <table className="table-lite">
                <thead>
                  <tr>
                    <th>Entra</th>
                    <th>Origem</th>
                    <th>Modo</th>
                    <th>Valor</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {draft.costAllocations.map((allocation) => {
                    const sourceMissing =
                      allocation.sourceType !== 'manual' &&
                      !allCostSources.some((source) => source.sourceType === allocation.sourceType && source.sourceId === allocation.sourceId);

                    return (
                      <tr key={allocation.id}>
                        <td>
                          <button type="button" className={allocation.enabled ? 'ghost-btn is-active' : 'ghost-btn'} onClick={() => togglePlanCostAllocation(allocation.id)}>
                            {allocation.enabled ? 'Sim' : 'Não'}
                          </button>
                        </td>
                        <td>
                          <strong>{allocation.label}</strong>
                          <div>
                            {sourceMissing
                              ? 'Origem removida'
                              : allocation.sourceType === 'manual'
                                ? 'Manual'
                                : allocation.sourceType === 'cost_item'
                                  ? allocation.inheritedFromCrop
                                    ? 'Custo herdado da cultura'
                                    : 'Custo da fazenda'
                                  : allocation.inheritedFromCrop
                                    ? 'Compra herdada da cultura'
                                    : 'Compra da fazenda'}
                          </div>
                        </td>
                        <td>
                          <select
                            className="select-dark"
                            value={allocation.allocationMode}
                            onChange={(event) =>
                              setPlanCostAllocations(
                                draft.costAllocations.map((item) =>
                                  item.id === allocation.id
                                    ? normalizeCultivationCostAllocation({ ...item, allocationMode: event.target.value as CultivationCostAllocation['allocationMode'] })
                                    : item
                                )
                              )
                            }
                          >
                            {costModeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <MoneyTextInput
                            cents={allocation.costValueCents}
                            onCommit={(nextValueCents) =>
                              setPlanCostAllocations(
                                draft.costAllocations.map((item) =>
                                  item.id === allocation.id
                                    ? normalizeCultivationCostAllocation({ ...item, costValueCents: nextValueCents })
                                    : item
                                )
                              )
                            }
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => setPlanCostAllocations(draft.costAllocations.filter((item) => item.id !== allocation.id))}
                          >
                            Tirar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'venda',
      title: 'Venda',
      content: draftPreview ? (
        <div className="section-grid-2">
          <label>
            Unidade de venda
            <select className="select-dark" value={draft.salesUnit} onChange={(event) => handlePlanSalesUnitChange(event.target.value as CropUnitType)}>
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Lucro pretendido (%)
            <NumberField value={draft.markupPct} onChange={(event) => setDraft({ markupPct: Number(event.target.value || 0) })} suffix={fieldUnitMeta.percent} />
          </label>
          {planSalesBundleLabel && (
            <label>
              {planSalesBundleLabel}
              <NumberField value={draft.unitsPerSalesBox} onChange={(event) => setDraft({ unitsPerSalesBox: Number(event.target.value || 0) })} suffix={unitTypeLabel(selectedDraftCrop?.productionUnit ?? 'unidade')} />
            </label>
          )}
          <InlineMetric label="Venda sugerida" value={draftPreview.suggestedSalePricePerUnitCents > 0 ? formatCurrency(draftPreview.suggestedSalePricePerUnitCents) : 'Faltam custos'} />
          {planSalesBundleMetric && (
            <InlineMetric label={planSalesBundleMetric} value={draftPreview.unitsPerSalesBox > 0 ? formatCurrency(draftPreview.suggestedSalePricePerBoxCents) : 'Sem embalagem'} />
          )}
          <InlineMetric label="Lucro por unidade" value={draftPreview.estimatedProfitPerUnitCents > 0 ? formatCurrency(draftPreview.estimatedProfitPerUnitCents) : 'Sem margem'} />
        </div>
      ) : null
    },
    {
      id: 'revisao',
      title: 'Impacto',
      content: draftPreview ? (
        <div className="page-stack">
          <div className="executive-grid">
            <ExecutiveCard title="Área usada" value={`${formatNumber(draftPreview.areaTotalSqm, 2)} m²`} helper={`${draftPreview.bedCount} canteiro(s)`} tone="neutral" />
            <ExecutiveCard title="Mudas" value={formatNumber(draftPreview.theoreticalUnits, 0)} helper={`${draftPreview.packsNeeded} ${purchaseTypeLabel(draftPreview.purchasePackType)}(s)`} tone="warning" />
            <ExecutiveCard title="Plantas boas" value={formatNumber(draftPreview.viableUnits, 0)} helper={`Perda ${draftPreview.expectedLossRate}%`} tone="info" />
            <ExecutiveCard title="Custo por unidade" value={draftPreview.costPerUnitCents > 0 ? formatCurrency(draftPreview.costPerUnitCents) : 'Faltam custos'} helper="Base do plano" tone="warning" />
            <ExecutiveCard title="Venda sugerida" value={draftPreview.suggestedSalePricePerUnitCents > 0 ? formatCurrency(draftPreview.suggestedSalePricePerUnitCents) : 'Faltam dados'} helper={unitTypeLabel(draftPreview.salesUnit)} tone="positive" />
            <ExecutiveCard title="Custo por canteiro" value={draftPreview.costPerBedCents > 0 ? formatCurrency(draftPreview.costPerBedCents) : 'Faltam custos'} helper="Custo distribuído" tone="neutral" />
          </div>
          <button type="button" className="cta-btn" onClick={createPlan}>Salvar plano</button>
        </div>
      ) : null
    }
  ];

  const activeCultureStepId = cultureStepIds[cultureStepIndex];
  const activePlanStepId = planStepIds[planStepIndex];

  const activeCultureStep = cultureSteps.find((step) => step.id === activeCultureStepId) ?? cultureSteps[0];

  return (
    <div className="page-stack">
      <DetailCard
        eyebrow="Horticultura"
        title="Culturas e planos"
        subtitle="Peça pouco, calcule muito."
        action={
          <div className="action-row production-header-actions">
            {crops.length > 0 && (
              <label className="inline-select-field production-header-select">
                <span>Cultura foco</span>
                <select
                  className="select-dark"
                  value={selectedOverviewCropId}
                  onChange={(event) => setSelectedOverviewCropId(event.target.value)}
                >
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name} {crop.variety ? `· ${crop.variety}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {selectedOverviewCrop && (
              <button type="button" className="ghost-btn" onClick={() => setCostBreakdownOpen(true)}>
                Como calculamos
              </button>
            )}
            <button type="button" className="ghost-btn" onClick={openCultureWizard} data-tour="new-culture-btn">Nova cultura</button>
            <button type="button" className="cta-btn" onClick={() => openPlanWizard()} disabled={crops.length === 0} data-tour="new-plan-btn">Novo plano</button>
          </div>
        }
      >
        <div className="executive-grid">
          <ExecutiveCard title="Culturas" value={String(crops.length)} helper="Cadastros prontos" tone="info" />
          <ExecutiveCard title="Modelos" value={String(activeCultureTemplates.length)} helper="Banco inicial" tone="neutral" />
          <ExecutiveCard
            title="Custo por unidade"
            value={overviewCostPerUnitCents > 0 ? formatCurrency(overviewCostPerUnitCents) : 'Sem custo'}
            helper={
              selectedOverviewCrop
                ? overviewPlans.length > 0
                  ? `Da cultura ${selectedOverviewCropLabel} • por ${unitTypeLabel(selectedOverviewCrop.productionUnit)}`
                  : `${selectedOverviewCropLabel} • base da cultura`
                : 'Escolha a cultura'
            }
            tone="warning"
          />
          <ExecutiveCard
            title="Venda sugerida"
            value={overviewSuggestedSaleCents > 0 ? formatCurrency(overviewSuggestedSaleCents) : 'Sem preço'}
            helper={
              selectedOverviewCrop
                ? overviewPlans.length > 0
                  ? `Da cultura ${selectedOverviewCropLabel} • por ${unitTypeLabel(selectedOverviewCrop.salesUnit)}`
                  : `${selectedOverviewCropLabel} • lucro aplicado`
                : 'Escolha a cultura'
            }
            tone="positive"
          />
        </div>
      </DetailCard>

      <DetailCard eyebrow="Base" title="Culturas criadas" action={crops.length > 0 ? <button type="button" className="ghost-btn" onClick={openCultureWizard}>Criar cultura</button> : undefined}>
        {crops.length === 0 ? (
          <SmartEmptyState
            title="Criar primeira cultura"
            description="Comece de um modelo real ou monte do zero."
            action={<button type="button" className="cta-btn" onClick={openCultureWizard} data-tour="new-culture-btn">Criar primeira cultura</button>}
          />
        ) : (
          <div className="executive-grid">
            {cropCardSummaries.map(({ crop, varietyLabel, cycleAndArea, allocatedValueLabel }) => (
              <button key={crop.id} type="button" className="summary-mini-card accent-ops" onClick={() => openPlanWizard(crop.id)}>
                <span>{crop.name}</span>
                <strong>{varietyLabel}</strong>
                <small>{cycleAndArea}</small>
                <small>{allocatedValueLabel}</small>
              </button>
            ))}
          </div>
        )}
      </DetailCard>

      <DetailCard
        eyebrow="Operação"
        title="Planos de produção"
        action={plans.length > 0 ? <button type="button" className="cta-btn" onClick={() => openPlanWizard()} disabled={crops.length === 0}>Criar plano</button> : undefined}
      >
        {crops.length === 0 ? (
          <SmartEmptyState
            title="Crie uma cultura antes"
            description="O plano precisa de uma cultura para puxar compra, espaçamento e venda."
            action={<button type="button" className="cta-btn" onClick={openCultureWizard}>Criar primeira cultura</button>}
          />
        ) : plans.length === 0 ? (
          <SmartEmptyState
            title="Criar plano de produção"
            description="Escolha a cultura, informe área ou canteiros e deixe os cálculos automáticos fecharem o resto."
            action={<button type="button" className="cta-btn" onClick={() => openPlanWizard()} data-tour="new-plan-btn">Criar primeiro plano</button>}
          />
        ) : (
          <div className="table-lite-wrap">
            <table className="table-lite">
              <thead>
                <tr>
                  <th>Cultura</th>
                  <th className="hidden sm:table-cell">
                    <span className="table-help-label">
                      Plantas boas
                      <ContextHelp text="Quantidade que deve sobrar para vender depois de descontar a perda esperada do plantio." />
                    </span>
                  </th>
                  <th className="hidden md:table-cell">
                    <span className="table-help-label">
                      Custo/unidade
                      <ContextHelp text="Quanto custa cada planta boa depois de dividir o custo total do plano pela quantidade de plantas boas." />
                    </span>
                  </th>
                  <th className="hidden lg:table-cell">
                      <span className="table-help-label">
                        Venda sugerida
                        <ContextHelp text="Preço sugerido por unidade depois de aplicar o lucro pretendido sobre o custo." />
                      </span>
                    </th>
                  {!executiveMode && (
                    <th className="hidden lg:table-cell">
                      <span className="table-help-label">
                        Canteiros
                        <ContextHelp text="Quantidade de canteiros que este plano usa na operação." />
                      </span>
                    </th>
                  )}
                  {!executiveMode && (
                    <th className="hidden lg:table-cell">
                      <span className="table-help-label">
                        Embalagem
                        <ContextHelp text="Preço sugerido da embalagem de venda, calculado a partir do preço por unidade e da quantidade usada em cada formato de saída." />
                      </span>
                    </th>
                  )}
                  <th className="text-right" style={{ width: '1%' }} />
                </tr>
              </thead>
              <tbody>
                {resolvedPlans.map((plan) => {
                  const crop = crops.find((item) => item.id === plan.cropId);
                  return (
                    <tr key={plan.id}>
                      <td>
                        <strong>{crop?.name || 'Cultura'}</strong>
                        {!executiveMode && <div>{plan.cycleDays} dias</div>}
                      </td>
                      <td className="hidden sm:table-cell">{formatNumber(plan.viableUnits, 0)}</td>
                      <td className="hidden md:table-cell">{plan.costPerUnitCents > 0 ? formatCurrency(plan.costPerUnitCents) : 'Faltam custos'}</td>
                      <td className="hidden lg:table-cell">{plan.suggestedSalePricePerUnitCents > 0 ? formatCurrency(plan.suggestedSalePricePerUnitCents) : 'Faltam dados'}</td>
                      {!executiveMode && <td className="hidden lg:table-cell">{plan.bedCount}</td>}
                      {!executiveMode && <td className="hidden lg:table-cell">{supportsSalesBundle(plan.salesUnit) && plan.unitsPerSalesBox > 0 ? formatCurrency(plan.suggestedSalePricePerBoxCents) : 'Sem embalagem'}</td>}
                      <td className="text-right w-[1%]">
                        <button
                          type="button"
                          className="ghost-btn"
                          style={{ width: 'auto', minHeight: '32px', padding: '6px 14px', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            setSelectedPlanId(plan.id);
                            setDrawerMode('detail');
                          }}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DetailCard>

      {!executiveMode && (
        <DetailCard eyebrow="Ajuda" title="Como ler este módulo">
          <div className="drawer-chip-wrap">
            <StatusChip label="Ciclo = dias até colher" tone="info" />
            <StatusChip label="Plantas boas = o que sobra após a perda" tone="medium" />
            <StatusChip label="Custo/unidade = custo total dividido pelas plantas boas" tone="low" />
          </div>
        </DetailCard>
      )}

      <CenterModal
        open={costBreakdownOpen}
        title="Como calculamos"
        subtitle={selectedOverviewCrop ? `Leitura do custo por unidade para ${selectedOverviewCropLabel}.` : 'Escolha uma cultura para ver a decomposição.'}
        onClose={() => setCostBreakdownOpen(false)}
        footer={
          <div className="wizard-footer">
            <span className="modal-note">Cada plano divide o custo total pelas plantas boas.</span>
            <div className="wizard-actions">
              <button type="button" className="ghost-btn" onClick={() => setCostBreakdownOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        }
      >
        {!selectedOverviewCrop ? (
          <SmartEmptyState title="Escolha uma cultura" description="Selecione a cultura no topo para abrir a decomposição." />
        ) : overviewPlans.length === 0 ? (
          <div className="page-stack">
            <ExecutiveCard title={`Custo da ${selectedOverviewCrop.purchaseType}`} value={selectedOverviewCrop.baseSeedlingCostCents > 0 ? formatCurrency(selectedOverviewCrop.baseSeedlingCostCents) : 'Sem custo'} helper="Base da cultura" tone="warning" />
            <ExecutiveCard title="Venda sugerida" value={overviewSuggestedSaleCents > 0 ? formatCurrency(overviewSuggestedSaleCents) : 'Sem preço'} helper="Lucro padrão" tone="positive" />
          </div>
        ) : (
          <div className="page-stack">
            {selectedOverviewBreakdowns.map(({ plan, purchaseCostCents, inheritedCostsCents, manualCostsCents, linkedPlanCostsCents }) => (
              <article key={plan.id} className="detail-card tone-neutral">
                <div className="cost-card-head">
                  <div>
                    <h4 className="cost-card-title">{selectedOverviewCropLabel}</h4>
                    <p className="cost-card-meta">{plan.bedCount} canteiro(s) · {formatNumber(plan.viableUnits, 0)} plantas boas</p>
                  </div>
                  <StatusChip label={plan.status} tone={plan.status === 'ativo' ? 'low' : 'medium'} />
                </div>
                <div className="cost-metric-row" style={{ marginTop: 14 }}>
                  <div className="cost-metric">
                    <span>Custo da {selectedOverviewCrop.purchaseType}</span>
                    <strong>{formatCurrency(purchaseCostCents)}</strong>
                  </div>
                  <div className="cost-metric">
                    <span>Custos herdados</span>
                    <strong>{formatCurrency(inheritedCostsCents)}</strong>
                  </div>
                  <div className="cost-metric">
                    <span>Custos do plano</span>
                    <strong>{formatCurrency(linkedPlanCostsCents + manualCostsCents)}</strong>
                  </div>
                  <div className="cost-metric">
                    <span>Total</span>
                    <strong>{formatCurrency(plan.costTotalCents)}</strong>
                  </div>
                  <div className="cost-metric">
                    <span>Por unidade</span>
                    <strong>{formatCurrency(plan.costPerUnitCents)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </CenterModal>

      <WizardModal
        open={cultureModalOpen}
        title={activeCultureStep.title}
        subtitle="Assistente guiado para cadastrar uma cultura base."
        steps={cultureSteps}
        activeStepId={activeCultureStepId}
        onStepChange={(stepId) => setCultureStepIndex(cultureStepIds.indexOf(stepId as (typeof cultureStepIds)[number]))}
        onClose={() => setCultureModalOpen(false)}
        onBack={goToPreviousCultureStep}
        onNext={goToNextCultureStep}
        onSubmit={createCulture}
        onSaveDraft={saveCultureDraft}
        backDisabled={cultureStepIndex === 0}
        error={cultureError}
        submitLabel="Concluir cultura"
        onHelp={() => startTour('culture-wizard')}
      />

      <WizardModal
        open={drawerMode === 'plan'}
        title="Novo plano de produção"
        subtitle="Defina área, compra, perda e venda com cálculo automático."
        steps={
          crops.length === 0
            ? [
                {
                  id: 'vazio',
                  title: 'Plano',
                  content: (
                    <SmartEmptyState
                      title="Sem cultura ainda"
                      description="Crie a primeira cultura para abrir o plano."
                      action={
                        <button
                          type="button"
                          className="cta-btn"
                          onClick={() => {
                            setDrawerMode(null);
                            openCultureWizard();
                          }}
                        >
                          Criar cultura
                        </button>
                      }
                    />
                  )
                }
              ]
            : planSteps
        }
        activeStepId={crops.length === 0 ? 'vazio' : activePlanStepId}
        onStepChange={(stepId) => setPlanStepIndex(planStepIds.indexOf(stepId as (typeof planStepIds)[number]))}
        onClose={() => setDrawerMode(null)}
        onBack={goToPreviousPlanStep}
        onNext={goToNextPlanStep}
        onSubmit={createPlan}
        onSaveDraft={() => setDrawerMode(null)}
        backDisabled={planStepIndex === 0 || crops.length === 0}
        nextDisabled={crops.length === 0}
        submitLabel="Salvar plano"
        error={planError}
        onHelp={() => startTour('plan-wizard')}
      />

      <InspectorDrawer open={drawerMode === 'detail' && Boolean(selectedResolvedPlan)} title="Detalhe do plano" onClose={() => setDrawerMode(null)}>
        {selectedResolvedPlan && (
          <div className="page-stack">
            <div className="action-row">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  const refreshedAllocations = [
                    ...costItems
                      .filter((item) => item.linkedCropId === selectedResolvedPlan.cropId)
                      .map((item) =>
                        buildAllocationFromSource(
                          {
                            id: `cost_item:${item.id}`,
                            sourceType: 'cost_item',
                            sourceId: item.id,
                            label: item.name,
                            category: item.category,
                            helper: item.subcategory,
                            costValueCents: item.eventValueCents > 0 ? item.eventValueCents : item.monthlyEquivalentCents
                          },
                          true
                        )
                      ),
                    ...purchases
                      .filter((item) => item.linkedCropId === selectedResolvedPlan.cropId)
                      .map((item) =>
                        buildAllocationFromSource(
                          {
                            id: `purchase_item:${item.id}`,
                            sourceType: 'purchase_item',
                            sourceId: item.id,
                            label: item.name,
                            category: item.category,
                            helper: item.subcategory,
                            costValueCents: item.eventValueCents > 0 ? item.eventValueCents : item.monthlyEquivalentCents
                          },
                          true
                        )
                      ),
                    ...selectedResolvedPlan.costAllocations
                      .filter((allocation) => !allocation.inheritedFromCrop)
                      .map((allocation) => normalizeCultivationCostAllocation({ ...allocation, inheritedFromCrop: false }))
                  ];

                  updatePlan(selectedResolvedPlan.id, { costAllocations: refreshedAllocations });
                }}
              >
                Puxar custos da cultura
              </button>
            </div>
            <div className="executive-grid">
              <ExecutiveCard title="Custo por unidade" value={selectedResolvedPlan.costPerUnitCents > 0 ? formatCurrency(selectedResolvedPlan.costPerUnitCents) : 'Faltam custos'} tone="warning" />
              <ExecutiveCard title="Venda sugerida" value={selectedResolvedPlan.suggestedSalePricePerUnitCents > 0 ? formatCurrency(selectedResolvedPlan.suggestedSalePricePerUnitCents) : 'Faltam dados'} tone="positive" />
              <ExecutiveCard title="Plantas boas" value={formatNumber(selectedResolvedPlan.viableUnits, 0)} helper={`${selectedResolvedPlan.expectedLossRate}% de perda`} tone="info" />
            </div>

            <label title="Percentual previsto de perda entre plantio e colheita.">
              Perda esperada (%)
              <NumberField value={selectedResolvedPlan.expectedLossRate} onChange={(event) => updatePlan(selectedResolvedPlan.id, { expectedLossRate: Number(event.target.value || 0) })} suffix={fieldUnitMeta.percent} />
            </label>
            <label title="Lucro aplicado no plano.">
              Lucro (%)
              <NumberField value={selectedResolvedPlan.markupPct} onChange={(event) => updatePlan(selectedResolvedPlan.id, { markupPct: Number(event.target.value || 0) })} suffix={fieldUnitMeta.percent} />
            </label>
            {salesBundleLabel(selectedResolvedPlan.salesUnit) && (
              <label title="Quantidade usada na embalagem de venda.">
                {salesBundleLabel(selectedResolvedPlan.salesUnit)}
                <NumberField value={selectedResolvedPlan.unitsPerSalesBox} onChange={(event) => updatePlan(selectedResolvedPlan.id, { unitsPerSalesBox: Number(event.target.value || 0) })} suffix={unitTypeLabel(crops.find((crop) => crop.id === selectedResolvedPlan.cropId)?.productionUnit ?? 'unidade')} />
              </label>
            )}

            <div className="drawer-chip-wrap">
              <StatusChip label={`${selectedResolvedPlan.bedCount} canteiro(s)`} tone="info" />
              <StatusChip label={`${formatNumber(selectedResolvedPlan.theoreticalUnits, 0)} brutas`} tone="medium" />
              <StatusChip label={`${selectedResolvedPlan.packsNeeded} ${purchaseTypeLabel(selectedResolvedPlan.purchasePackType)}(s)`} tone="low" />
            </div>
          </div>
        )}
      </InspectorDrawer>
    </div>
  );
};

interface InlineMetricProps {
  label: string;
  value: string;
}

const InlineMetric = ({ label, value }: InlineMetricProps) => (
  <div className="summary-mini-card accent-home">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);
