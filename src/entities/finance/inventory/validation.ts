import { z } from 'zod';

// --- Inventory Product ---
export const InventoryProductCategorySchema = z.enum([
  'adubo',
  'defensivo',
  'corretivo',
  'semente',
  'muda',
  'embalagem',
  'combustivel',
  'outro'
]);

export const InventoryProductSchema = z.object({
  id: z.string().uuid().or(z.string().regex(/^setup-/)),
  name: z.string().min(1, 'Nome é obrigatório'),
  commercialName: z.string().optional().default(''),
  category: InventoryProductCategorySchema,
  defaultUnit: z.string().min(1, 'Unidade padrão é obrigatória'),
  density: z.number().nonnegative().optional(),
  activeIngredient: z.string().optional(),
  notes: z.string().optional().default(''),
  active: z.boolean().default(true)
});

// --- Inventory Lot ---
export const InventoryLotStatusSchema = z.enum(['ativo', 'parcial', 'encerrado', 'vencido']);

export const InventoryLotSchema = z.object({
  id: z.string().uuid().or(z.string().regex(/^EST-/)), // Allow generated codes or UUIDs
  productId: z.string().min(1, 'ID do produto é obrigatório'),
  purchaseId: z.string().nullable().optional(),
  code: z.string().min(1, 'Código do lote é obrigatório'),
  receivedAt: z.string().min(1, 'Data de recebimento é obrigatória'),
  quantityReceived: z.number().nonnegative(),
  quantityAvailable: z.number().nonnegative(),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  unitCostCents: z.number().int().nonnegative(),
  expirationDate: z.string().optional().default(''),
  locationName: z.string().min(1, 'Localização é obrigatória'),
  status: InventoryLotStatusSchema,
  notes: z.string().optional().default('')
});

// --- Stock Movement ---
export const StockMovementTypeSchema = z.enum([
  'entrada',
  'transferencia',
  'reserva',
  'uso',
  'aplicacao',
  'perda',
  'ajuste',
  'devolucao'
]);

export const StockMovementTargetTypeSchema = z.enum(['cultura', 'plano', 'lote', 'area', 'geral']);

export const StockMovementSchema = z.object({
  id: z.string().uuid(),
  inventoryLotId: z.string().min(1, 'ID do lote é obrigatório'),
  movementType: StockMovementTypeSchema,
  quantity: z.number().nonnegative(),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  occurredAt: z.string().min(1, 'Data da ocorrência é obrigatória'),
  targetType: StockMovementTargetTypeSchema,
  targetId: z.string().nullable().optional(),
  reason: z.string().optional().default(''),
  notes: z.string().optional().default('')
});

export type InventoryProductInput = z.infer<typeof InventoryProductSchema>;
export type InventoryLotInput = z.infer<typeof InventoryLotSchema>;
export type StockMovementInput = z.infer<typeof StockMovementSchema>;
