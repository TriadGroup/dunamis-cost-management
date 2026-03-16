import { z } from 'zod';

// --- Application Log ---
export const ApplicationLogSchema = z.object({
  id: z.string().uuid(),
  lotId: z.string().uuid(),
  productName: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1),
  appliedAt: z.string().min(1),
  responsible: z.string().min(1),
  notes: z.string().optional().default('')
});

// --- Harvest ---
export const HarvestDestinationBreakdownSchema = z.object({
  channelId: z.string().uuid(),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1),
  valueCents: z.number().int().nonnegative()
});

export const HarvestSchema = z.object({
  id: z.string().uuid(),
  lotId: z.string().uuid(),
  harvestedAt: z.string().min(1),
  grossQuantity: z.number().nonnegative(),
  marketableQuantity: z.number().nonnegative(),
  lossQuantity: z.number().nonnegative(),
  unit: z.string().min(1),
  destinationChannel: z.string().optional(),
  destinationBreakdown: z.array(HarvestDestinationBreakdownSchema).default([]),
  quantity: z.number().nonnegative().optional(), // Legacy support
  soldValueCents: z.number().int().nonnegative().optional(),
  internalTransferValueCents: z.number().int().nonnegative().optional()
});

// --- Lot ---
export const LotSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  cropId: z.string().uuid(),
  cropPlanId: z.string().uuid().nullable(),
  variety: z.string().min(1),
  receivedAt: z.string().min(1),
  quantityReceived: z.number().nonnegative(),
  quantityPlanted: z.number().nonnegative(),
  origin: z.string().min(1),
  location: z.string().min(1),
  areaNodeIds: z.array(z.string()).default([]),
  stage: z.enum(['germinacao', 'bercario', 'transplante', 'vegetativo', 'colheita', 'pos_colheita']),
  applicationLogs: z.array(ApplicationLogSchema).default([]),
  applicationEvents: z.array(z.any()).optional(), // Flexible for now
  harvests: z.array(HarvestSchema).default([]),
  appropriatedCostCents: z.number().int().nonnegative().default(0),
  marketableQuantity: z.number().nonnegative().default(0),
  discardedQuantity: z.number().nonnegative().default(0),
  traceabilityStatus: z.enum(['incompleta', 'parcial', 'completa']),
  notes: z.string().optional().default('')
});

export type ApplicationLogInput = z.infer<typeof ApplicationLogSchema>;
export type HarvestInput = z.infer<typeof HarvestSchema>;
export type LotInput = z.infer<typeof LotSchema>;
