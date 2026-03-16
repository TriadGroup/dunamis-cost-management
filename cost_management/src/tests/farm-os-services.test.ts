import { describe, expect, it } from 'vitest';
import {
  calculateProductionPlanMetrics,
  calculateImplantationTotals,
  calculateImplantationProjectTotals,
  calculateProductionContinuity,
  calculateQuotationCommercialTotalCents,
  calculateQuotationPaymentGapCents,
  calculateQuotationPaymentPlanTotalCents,
  buildCropCostSelectionDefaults,
  calculateTraceabilityCompleteness,
  calculateUnitEconomics,
  createProductionPlanFromCulture,
  resolveAllocationValueCents,
  type Bed,
  type CostItem,
  type Crop,
  type CropPlan,
  type DemandChannel,
  type Lot
} from '@/entities';

describe('farm os services', () => {
  it('calculates implantation committed vs open', () => {
    const items = [
      {
        id: '1',
        projectId: 'project-1',
        group: 'solo',
        name: 'Solo',
        description: '',
        priority: 'alta',
        quotations: [
          {
            id: 'q1',
            supplier: 'A',
            totalCostCents: 100000,
            freightCents: 10000,
            notes: '',
            source: '',
            status: 'selecionada',
            createdAt: '',
            updatedAt: '',
            paymentMode: 'avista',
            downPaymentCents: 110000,
            installments: 0,
            installmentValueCents: 0,
            firstDueDate: '',
            paymentNotes: ''
          }
        ],
        selectedQuotationId: 'q1',
        paymentMode: 'avista',
        status: 'fechado',
        deadline: '',
        notes: ''
      },
      {
        id: '2',
        projectId: 'project-1',
        group: 'hidraulica',
        name: 'Hidráulica',
        description: '',
        priority: 'alta',
        quotations: [
          {
            id: 'q2',
            supplier: 'B',
            totalCostCents: 200000,
            freightCents: 0,
            notes: '',
            source: '',
            status: 'pendente',
            createdAt: '',
            updatedAt: '',
            paymentMode: 'financiado',
            downPaymentCents: 0,
            installments: 8,
            installmentValueCents: 25000,
            firstDueDate: '',
            paymentNotes: ''
          }
        ],
        selectedQuotationId: null,
        paymentMode: 'financiado',
        status: 'em_cotacao',
        deadline: '',
        notes: ''
      }
    ] as const;

    const totals = calculateImplantationTotals(items as any);
    expect(totals.totalCents).toBe(310000);
    expect(totals.committedCents).toBe(110000);
    expect(totals.openCents).toBe(200000);
  });

  it('calculates quotation commercial, financial and gap totals', () => {
    const quotation = {
      id: 'q-1',
      supplier: 'Fornecedor',
      totalCostCents: 320000,
      freightCents: 40000,
      source: 'WhatsApp',
      notes: '',
      status: 'recebida' as const,
      createdAt: '',
      updatedAt: '',
      paymentMode: 'parcelado' as const,
      downPaymentCents: 60000,
      installments: 3,
      installmentValueCents: 110000,
      firstDueDate: '2026-04-01',
      paymentNotes: ''
    };

    expect(calculateQuotationCommercialTotalCents(quotation)).toBe(360000);
    expect(calculateQuotationPaymentPlanTotalCents(quotation)).toBe(390000);
    expect(calculateQuotationPaymentGapCents(quotation)).toBe(30000);
  });

  it('calculates implantation totals by project', () => {
    const project = {
      id: 'project-1',
      name: 'Horta',
      description: '',
      budgetTargetCents: 500000,
      status: 'planejamento' as const,
      startDate: '',
      targetEndDate: '',
      notes: '',
      createdAt: ''
    };

    const items = [
      {
        id: '1',
        projectId: 'project-1',
        group: 'solo',
        name: 'Mulching',
        description: '',
        priority: 'alta',
        quotations: [
          {
            id: 'q1',
            supplier: 'A',
            totalCostCents: 180000,
            freightCents: 20000,
            notes: '',
            source: '',
            status: 'selecionada',
            createdAt: '',
            updatedAt: '',
            paymentMode: 'parcelado',
            downPaymentCents: 50000,
            installments: 3,
            installmentValueCents: 50000,
            firstDueDate: '',
            paymentNotes: ''
          }
        ],
        selectedQuotationId: 'q1',
        paymentMode: 'parcelado',
        status: 'fechado',
        deadline: '',
        notes: ''
      },
      {
        id: '2',
        projectId: 'project-1',
        group: 'maquinario',
        name: 'Canteiradora',
        description: '',
        priority: 'alta',
        quotations: [
          {
            id: 'q2',
            supplier: 'B',
            totalCostCents: 420000,
            freightCents: 30000,
            notes: '',
            source: '',
            status: 'recebida',
            createdAt: '',
            updatedAt: '',
            paymentMode: 'financiado',
            downPaymentCents: 100000,
            installments: 6,
            installmentValueCents: 60000,
            firstDueDate: '',
            paymentNotes: ''
          }
        ],
        selectedQuotationId: null,
        paymentMode: 'financiado',
        status: 'em_cotacao',
        deadline: '',
        notes: ''
      }
    ];

    const totals = calculateImplantationProjectTotals(project, items as any);
    expect(totals.totalCents).toBe(650000);
    expect(totals.committedCents).toBe(200000);
    expect(totals.openCents).toBe(450000);
    expect(totals.remainingBudgetCents).toBe(-150000);
    expect(totals.itemCount).toBe(2);
    expect(totals.selectedQuotationCount).toBe(1);
  });

  it('calculates bed requirement and rupture risk', () => {
    const crop: Crop = {
      id: 'crop-1',
      name: 'Alface',
      variety: 'Crespa',
      category: 'Folhosa',
      preferredUnits: ['unit', 'box', 'weight'],
      cycleDays: 40,
      productionUnit: 'muda',
      salesUnit: 'unidade',
      purchaseType: 'caixa',
      unitsPerPurchasePack: 200,
      purchasePackCostCents: 82000,
      defaultPlantSpacingCm: 30,
      defaultRowSpacingCm: 25,
      defaultBedWidthM: 1.25,
      defaultBedLengthM: 50,
      unitsPerSalesBox: 12,
      defaultMarkupPct: 35,
      defaultLossRate: 10,
      baseSeedlingCostCents: 410,
      defaultCostSelections: [],
      environmentCompatibility: 'ambos'
    };

    const plan: CropPlan = createProductionPlanFromCulture(crop, {
      id: 'plan-1',
      cropId: 'crop-1',
      targetChannelMix: {},
      bedCount: 1,
      bedLengthM: 50,
      bedWidthM: 1.25,
      areaTotalSqm: 62.5,
      expectedLossRate: 10,
      purchasePackCostCents: 82000,
      unitsPerPurchasePack: 200,
      status: 'ativo'
    });

    const beds: Bed[] = [
      { id: 'b1', name: 'B1', type: 'canteiro_solo', sizeSqm: 10, environment: 'campo_aberto' }
    ];

    const channels: DemandChannel[] = [
      {
        id: 'c1',
        type: 'box',
        name: 'Box',
        priority: 1,
        pricingMode: 'unit',
        demandUnit: 'unidade',
        baselineDemand: 900,
        scenarioDemand: 900,
        enabled: true
      }
    ];

    const continuity = calculateProductionContinuity(plan, beds, channels);
    expect(continuity.requiredBedsNoBreak).toBeGreaterThan(1);
    expect(continuity.ruptureRisk).toBe('high');
  });

  it('calculates horticulture metrics from area and spacing', () => {
    const metrics = calculateProductionPlanMetrics({
      areaTotalSqm: 250,
      bedCount: 4,
      bedLengthM: 50,
      bedWidthM: 1.25,
      plantSpacingCm: 30,
      rowSpacingCm: 25,
      expectedLossRate: 8,
      unitsPerPurchasePack: 200,
      purchasePackCostCents: 82000,
      markupPct: 35,
      unitsPerSalesBox: 12,
      costAllocations: [{
        id: '1',
        sourceType: 'manual',
        sourceId: null,
        label: 'Adubo',
        category: 'Adubo',
        costValueCents: 145000,
        allocationMode: 'total',
        allocatedPerBedCents: 0,
        allocatedPerUnitCents: 0,
        inheritedFromCrop: false,
        enabled: true
      }]
    });

    expect(metrics.bedAreaSqm).toBe(62.5);
    expect(metrics.totalBedsAreaSqm).toBe(250);
    expect(metrics.theoreticalUnits).toBeGreaterThan(3000);
    expect(metrics.viableUnits).toBeLessThan(metrics.theoreticalUnits);
    expect(metrics.packsNeeded).toBe(Math.ceil(metrics.theoreticalUnits / 200));
    expect(metrics.costPerUnitCents).toBeGreaterThan(0);
    expect(metrics.suggestedSalePricePerUnitCents).toBeGreaterThan(metrics.costPerUnitCents);
    expect(metrics.suggestedSalePricePerBoxCents).toBe(metrics.suggestedSalePricePerUnitCents * 12);
  });

  it('builds default crop cost selections from linked farm records', () => {
    const defaults = buildCropCostSelectionDefaults(
      'crop-1',
      [
        {
          id: 'cost-1',
          category: 'Insumos',
          subcategory: 'Solo',
          name: 'Calcário',
          recurrenceType: 'recorrente',
          eventValueCents: 0,
          monthlyEquivalentCents: 45000,
          nextOccurrence: '',
          supplier: '',
          linkedCropId: 'crop-1',
          allocationDriver: 'manual',
          isAppropriable: false,
          notes: '',
          status: 'ativo'
        }
      ],
      [
        {
          id: 'purchase-1',
          name: 'Adubo NPK',
          category: 'Compras',
          subcategory: 'Nutrição',
          supplier: '',
          eventValueCents: 90000,
          monthlyEquivalentCents: 0,
          nextOccurrence: '',
          notes: '',
          status: 'ativo',
          linkedCropId: 'crop-1',
          isStockable: true,
          paymentStatus: 'pago'
        }
      ]
    );

    expect(defaults).toHaveLength(2);
    expect(defaults[0].sourceType).toBe('cost_item');
    expect(defaults[1].sourceType).toBe('purchase_item');
    expect(defaults.every((allocation) => allocation.enabled)).toBe(true);
  });

  it('resolves allocation value from cost and purchase sources', () => {
    const costValue = resolveAllocationValueCents(
      {
        id: 'alloc-cost',
        sourceType: 'cost_item',
        sourceId: 'cost-1',
        label: 'Calcário',
        category: 'Insumos',
        costValueCents: 0,
        allocationMode: 'total',
        allocatedPerBedCents: 0,
        allocatedPerUnitCents: 0,
        inheritedFromCrop: true,
        enabled: true
      },
      [
        {
          id: 'cost-1',
          category: 'Insumos',
          subcategory: 'Solo',
          name: 'Calcário',
          recurrenceType: 'recorrente',
          eventValueCents: 0,
          monthlyEquivalentCents: 45000,
          nextOccurrence: '',
          supplier: '',
          linkedCropId: 'crop-1',
          allocationDriver: 'manual',
          isAppropriable: false,
          notes: '',
          status: 'ativo'
        }
      ],
      []
    );

    const purchaseValue = resolveAllocationValueCents(
      {
        id: 'alloc-purchase',
        sourceType: 'purchase_item',
        sourceId: 'purchase-1',
        label: 'Adubo',
        category: 'Compras',
        costValueCents: 0,
        allocationMode: 'total',
        allocatedPerBedCents: 0,
        allocatedPerUnitCents: 0,
        inheritedFromCrop: true,
        enabled: true
      },
      [],
      [
        {
          id: 'purchase-1',
          name: 'Adubo',
          category: 'Compras',
          subcategory: 'Nutrição',
          supplier: '',
          eventValueCents: 92000,
          monthlyEquivalentCents: 0,
          nextOccurrence: '',
          notes: '',
          status: 'ativo',
          linkedCropId: 'crop-1',
          isStockable: true,
          paymentStatus: 'pago'
        }
      ]
    );

    expect(costValue).toBe(45000);
    expect(purchaseValue).toBe(92000);
  });

  it('calculates traceability completeness', () => {
    const lot: Lot = {
      id: 'lot-1',
      code: 'DNMS-20260306-001',
      cropId: 'crop-1',
      variety: 'Var',
      receivedAt: '2026-03-01',
      quantityReceived: 100,
      quantityPlanted: 90,
      origin: 'Viveiro',
      location: 'Setor A',
      cropPlanId: null,
      areaNodeIds: [],
      stage: 'transplante',
      applicationLogs: [],
      applicationEvents: [],
      harvests: [],
      appropriatedCostCents: 0,
      marketableQuantity: 0,
      discardedQuantity: 0,
      traceabilityStatus: 'incompleta',
      notes: ''
    };

    const summary = calculateTraceabilityCompleteness(lot);
    expect(summary.status).toBe('parcial');
    expect(summary.score).toBeLessThan(90);
  });

  it('calculates cost per unit and margins', () => {
    const crops: Crop[] = [
      {
        id: 'crop-1',
        name: 'Alface',
        variety: 'Crespa',
        category: 'Folhosa',
        preferredUnits: ['unit', 'box', 'weight'],
        cycleDays: 40,
        productionUnit: 'muda',
        salesUnit: 'unidade',
        purchaseType: 'caixa',
        unitsPerPurchasePack: 200,
        purchasePackCostCents: 82000,
        defaultPlantSpacingCm: 30,
        defaultRowSpacingCm: 25,
        defaultBedWidthM: 1.25,
        defaultBedLengthM: 50,
        unitsPerSalesBox: 12,
        defaultMarkupPct: 35,
        defaultLossRate: 8,
        baseSeedlingCostCents: 410,
        defaultCostSelections: [],
        environmentCompatibility: 'ambos'
      }
    ];

    const plans: CropPlan[] = [
      createProductionPlanFromCulture(crops[0], {
        id: 'plan-1',
        cropId: 'crop-1',
        targetChannelMix: {},
        bedCount: 2,
        bedLengthM: 50,
        bedWidthM: 1.25,
        areaTotalSqm: 125,
        expectedLossRate: 8,
        purchasePackCostCents: 82000,
        unitsPerPurchasePack: 200,
        unitsPerSalesBox: 12,
        markupPct: 35,
        costAllocations: [{
          id: 'alloc-1',
          sourceType: 'manual',
          sourceId: null,
          label: 'Adubo',
          category: 'Adubo',
          costValueCents: 50000,
          allocationMode: 'total',
          allocatedPerBedCents: 0,
          allocatedPerUnitCents: 0,
          inheritedFromCrop: false,
          enabled: true
        }],
        status: 'ativo'
      })
    ];

    const costs: CostItem[] = [
      {
        id: 'cost-1',
        category: 'Insumos',
        subcategory: 'Solo',
        name: 'Adubo',
        recurrenceType: 'recorrente',
        eventValueCents: 100000,
        monthlyEquivalentCents: 50000,
        nextOccurrence: '',
        supplier: '',
        linkedCropId: 'crop-1',
        allocationDriver: 'manual',
        isAppropriable: false,
        notes: '',
        status: 'ativo'
      }
    ];

    const channels: DemandChannel[] = [
      {
        id: 'channel-1',
        type: 'box',
        name: 'Box',
        priority: 1,
        pricingMode: 'box',
        demandUnit: 'caixa',
        baselineDemand: 24,
        scenarioDemand: 24,
        acceptedPriceCents: 45000,
        enabled: true
      }
    ];

    const economics = calculateUnitEconomics(crops, plans, costs, [], channels);
    expect(economics.rows[0].totalCostCents).toBeGreaterThan(0);
    expect(economics.rows[0].costPerUnitCents).toBeGreaterThan(0);
    expect(economics.rows[0].suggestedSalePricePerUnitCents).toBeGreaterThan(economics.rows[0].costPerUnitCents);
    expect(economics.marginByChannel[0].marginCents).toBeGreaterThan(0);
  });
});
