import { z } from 'zod';

export const CostItemSchema = z.object({
  id: z.string().uuid(),
  category: z.string().min(1),
  subcategory: z.string().min(1),
  name: z.string().min(1),
  recurrenceType: z.enum(['eventual', 'recorrente']),
  eventValueCents: z.number().int().nonnegative(),
  monthlyEquivalentCents: z.number().int().nonnegative(),
  nextOccurrence: z.string().optional().default(''),
  supplier: z.string().optional().default(''),
  linkedCostCenter: z.string().optional().default(''),
  allocationDriver: z.enum(['manual', 'por_area', 'por_tempo', 'por_quantidade_aplicada']).default('manual'),
  isAppropriable: z.boolean().default(false),
  notes: z.string().optional().default(''),
  status: z.enum(['ativo', 'suspenso', 'pago', 'cancelado']).default('ativo')
});

export type CostItemInput = z.infer<typeof CostItemSchema>;
