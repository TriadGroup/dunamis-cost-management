import { z } from 'zod';

// --- Crop (Culture) ---
export const CropSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  variety: z.string().min(1),
  category: z.string().min(1),
  preferredUnits: z.array(z.enum(['unit', 'box', 'weight', 'packaging'])).default(['unit', 'box']),
  cycleDays: z.number().int().nonnegative(),
  productionUnit: z.enum(['muda', 'semente', 'unidade', 'kg']),
  salesUnit: z.enum(['unidade', 'kg', 'caixa', 'bandeja', 'maco']),
  purchaseType: z.enum(['unidade', 'caixa', 'bandeja', 'kg']),
  unitsPerPurchasePack: z.number().int().nonnegative(),
  purchasePackCostCents: z.number().int().nonnegative(),
  defaultPlantSpacingCm: z.number().nonnegative(),
  defaultRowSpacingCm: z.number().nonnegative(),
  defaultBedWidthM: z.number().nonnegative(),
  defaultBedLengthM: z.number().nonnegative(),
  unitsPerSalesBox: z.number().int().nonnegative(),
  defaultMarkupPct: z.number().nonnegative(),
  defaultLossRate: z.number().nonnegative(),
  baseSeedlingCostCents: z.number().int().nonnegative(),
  defaultCostSelections: z.array(z.any()).default([]), // Flexible for cultivation allocations
  environmentCompatibility: z.enum(['campo', 'protegido', 'ambos']),
  notes: z.string().optional().default('')
});

// --- Bed ---
export const BedSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().optional(),
  areaSqm: z.number().nonnegative(),
  locationId: z.string().uuid().optional(),
  notes: z.string().optional().default('')
});

// --- Crop Plan ---
export const CropPlanSchema = z.object({
  id: z.string().uuid(),
  cropId: z.string().uuid(),
  seasonLabel: z.string().min(1),
  areaTotalSqm: z.number().nonnegative(),
  bedCount: z.number().int().nonnegative(),
  bedLengthM: z.number().nonnegative(),
  bedWidthM: z.number().nonnegative(),
  plantSpacingCm: z.number().nonnegative(),
  rowSpacingCm: z.number().nonnegative(),
  cycleDays: z.number().int().nonnegative(),
  expectedLossRate: z.number().nonnegative(),
  purchasePackType: z.enum(['unidade', 'caixa', 'bandeja', 'kg']),
  unitsPerPurchasePack: z.number().int().nonnegative(),
  purchasePackCostCents: z.number().int().nonnegative(),
  salesUnit: z.enum(['unidade', 'kg', 'caixa', 'bandeja', 'maco']),
  unitsPerSalesBox: z.number().int().nonnegative(),
  markupPct: z.number().nonnegative(),
  staggeredProduction: z.boolean().default(true),
  targetChannelMix: z.record(z.string(), z.number()).default({}),
  costAllocations: z.array(z.any()).default([]),
  notes: z.string().optional().default(''),
  status: z.enum(['rascunho', 'ativo', 'concluido', 'cancelado']),
  plannedOnly: z.boolean().default(true)
});

export type CropInput = z.infer<typeof CropSchema>;
export type BedInput = z.infer<typeof BedSchema>;
export type CropPlanInput = z.infer<typeof CropPlanSchema>;
