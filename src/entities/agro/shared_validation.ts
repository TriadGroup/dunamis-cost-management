import { z } from 'zod';

// --- Labor ---
export const LaborRecordSchema = z.object({
  id: z.string().uuid(),
  date: z.string().min(1),
  teamName: z.string().min(1),
  taskName: z.string().min(1),
  cropId: z.string().uuid().nullable(),
  cropPlanId: z.string().uuid().nullable(),
  productionLotId: z.string().uuid().nullable(),
  areaNodeIds: z.array(z.string()).default([]),
  hoursWorked: z.number().nonnegative(),
  hourlyCostCents: z.number().int().nonnegative(),
  totalCostCents: z.number().int().nonnegative(),
  notes: z.string().optional().default('')
});

// --- Maintenance ---
export const MaintenanceEventSchema = z.object({
  id: z.string().uuid(),
  assetName: z.string().min(1),
  category: z.string().min(1),
  maintenanceType: z.enum(['corretiva', 'preventiva', 'preditiva', 'melhoria']).default('preventiva'),
  cadenceType: z.enum(['eventual', 'recorrente']).default('eventual'),
  interval: z.string().optional().default(''),
  costPerEventCents: z.number().int().nonnegative(),
  downtimeDays: z.number().nonnegative(),
  nextDate: z.string().optional().default(''),
  annualEquivalentCents: z.number().int().nonnegative(),
  monthlyReserveCents: z.number().int().nonnegative(),
  impact: z.string().optional().default(''),
  recommendation: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  status: z.enum(['ativo', 'suspenso', 'pago', 'cancelado']).default('ativo')
});

// --- Field Operations ---
export const ApplicationEventSchema = z.object({
  id: z.string().uuid(),
  inventoryLotId: z.string().uuid().nullable(),
  stockMovementId: z.string().uuid().nullable(),
  productId: z.string().uuid().nullable(),
  cropId: z.string().uuid().nullable(),
  cropPlanId: z.string().uuid().nullable(),
  productionLotId: z.string().uuid().nullable(),
  areaNodeIds: z.array(z.string()).default([]),
  cropStage: z.enum(['germinacao', 'bercario', 'transplante', 'vegetativo', 'colheita', 'pos_colheita']).default('vegetativo'),
  quantityApplied: z.number().nonnegative(),
  unit: z.string().min(1),
  appliedAreaSqm: z.number().nonnegative(),
  doseDescription: z.string().optional().default(''),
  appliedAt: z.string().min(1),
  responsible: z.string().optional().default(''),
  equipmentName: z.string().optional().default(''),
  weatherNotes: z.string().optional().default(''),
  notes: z.string().optional().default('')
});

export const LossEventSchema = z.object({
  id: z.string().uuid(),
  date: z.string().min(1),
  cause: z.enum(['praga', 'doenca', 'clima', 'manejo', 'vencimento', 'outro']).default('outro'),
  sourceType: z.enum(['estoque', 'producao', 'comercial']).default('estoque'),
  sourceId: z.string().uuid().nullable(),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1),
  estimatedCostCents: z.number().int().nonnegative(),
  notes: z.string().optional().default('')
});

// --- Equipment Usage ---
export const EquipmentUsageRecordSchema = z.object({
  id: z.string().uuid(),
  assetName: z.string().min(1),
  operationName: z.string().min(1),
  date: z.string().min(1),
  cropId: z.string().uuid().nullable(),
  cropPlanId: z.string().uuid().nullable(),
  areaNodeIds: z.array(z.string()).default([]),
  hoursUsed: z.number().nonnegative(),
  areaCoveredSqm: z.number().nonnegative(),
  fuelCostCents: z.number().int().nonnegative(),
  usageCostCents: z.number().int().nonnegative(),
  notes: z.string().optional().default('')
});

export type LaborRecordInput = z.infer<typeof LaborRecordSchema>;
export type MaintenanceEventInput = z.infer<typeof MaintenanceEventSchema>;
export type ApplicationEventInput = z.infer<typeof ApplicationEventSchema>;
export type LossEventInput = z.infer<typeof LossEventSchema>;
export type EquipmentUsageRecordInput = z.infer<typeof EquipmentUsageRecordSchema>;
