import { z } from 'zod';

export const PurchaseStatusSchema = z.enum(['ativo', 'pausado', 'encerrado', 'pendente']);
export const PurchasePaymentStatusSchema = z.enum(['pendente', 'parcial', 'pago']);

export const PurchaseItemSchema = z.object({
  id: z.string().uuid().or(z.string().regex(/^setup-/)), // Allow both UUIDs and legacy setup IDs
  name: z.string().min(1, 'Nome é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  subcategory: z.string().default('Geral'),
  supplier: z.string().optional().default(''),
  eventValueCents: z.number().int().nonnegative(),
  monthlyEquivalentCents: z.number().int().nonnegative().default(0),
  nextOccurrence: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  status: PurchaseStatusSchema.default('ativo'),
  linkedCropId: z.string().uuid().optional(),
  linkedBedId: z.string().uuid().optional(),
  linkedLotId: z.string().uuid().optional(),
  linkedChannelId: z.string().uuid().optional(),
  linkedCostCenter: z.string().optional(),
  receivedAt: z.string().optional().default(''),
  receivedQuantity: z.number().nonnegative().optional(),
  receivedUnit: z.string().optional(),
  inventoryProductId: z.string().uuid().optional(),
  isStockable: z.boolean().default(true),
  paymentStatus: PurchasePaymentStatusSchema.default('pendente'),
  workspace_id: z.string().uuid().optional() // Mandatory in DB, but might be attached by sync queue
});

export type PurchaseItemInput = z.infer<typeof PurchaseItemSchema>;
