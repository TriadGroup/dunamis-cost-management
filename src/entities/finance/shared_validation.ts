import { z } from 'zod';

// --- Investment ---
export const InvestmentContractSchema = z.object({
  id: z.string().uuid(),
  assetName: z.string().min(1),
  assetCategory: z.string().min(1),
  modality: z.enum(['financiamento', 'recurso_proprio', 'consorcio', 'outro']).default('financiamento'),
  assetValueCents: z.number().int().nonnegative(),
  downPaymentCents: z.number().int().nonnegative(),
  installments: z.number().int().nonnegative(),
  monthlyInstallmentCents: z.number().int().nonnegative(),
  totalCommittedCents: z.number().int().nonnegative(),
  expectedMonthlyReturnCents: z.number().int().nonnegative(),
  paybackMonths: z.number().int().nonnegative().nullable(),
  notes: z.string().optional().default(''),
  status: z.enum(['ativo', 'liquidado', 'suspenso', 'cancelado']).default('ativo')
});

export type InvestmentContractInput = z.infer<typeof InvestmentContractSchema>;
