import { z } from 'zod';

export const CostAllocationLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  originType: z.enum(['movimentacao_estoque', 'uso_estoque', 'aplicacao', 'mao_de_obra', 'maquinario', 'custo_indireto', 'outros']),
  originId: z.string().uuid().nullable(),
  targetType: z.enum(['lote', 'plano', 'area', 'global']),
  targetId: z.string().uuid().nullable(),
  cropId: z.string().uuid().nullable(),
  cropPlanId: z.string().uuid().nullable(),
  productionLotId: z.string().uuid().nullable(),
  areaNodeId: z.string().nullable(),
  channelId: z.string().uuid().nullable(),
  driver: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  occurredAt: z.string().min(1),
  notes: z.string().optional().default('')
});

export type CostAllocationLedgerEntryInput = z.infer<typeof CostAllocationLedgerEntrySchema>;
