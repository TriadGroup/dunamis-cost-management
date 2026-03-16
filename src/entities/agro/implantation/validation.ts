import { z } from 'zod';

// --- Price/Payment Mode ---
export const PaymentModeSchema = z.enum(['avista', 'parcelado', 'financiamento', 'outro']);

// --- Quotation ---
export const QuotationSchema = z.object({
  id: z.string().uuid(),
  supplier: z.string().min(1),
  totalCostCents: z.number().int().nonnegative(),
  freightCents: z.number().int().nonnegative(),
  source: z.string().min(1).default('Manual'),
  notes: z.string().optional().default(''),
  status: z.enum(['recebida', 'selecionada', 'recusada', 'expirada']).default('recebida'),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  paymentMode: PaymentModeSchema,
  downPaymentCents: z.number().int().nonnegative(),
  installments: z.number().int().nonnegative(),
  installmentValueCents: z.number().int().nonnegative(),
  firstDueDate: z.string().optional().default(''),
  paymentNotes: z.string().optional().default('')
});

// --- Implantation Item ---
export const ImplantationItemSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  group: z.enum(['solo', 'irrigacao', 'estrutura', 'maquinario', 'tecnologia', 'legal', 'mão_de_obra', 'outros']),
  name: z.string().min(1),
  description: z.string().optional().default(''),
  priority: z.enum(['baixa', 'media', 'alta', 'critica']).default('media'),
  quotations: z.array(QuotationSchema).default([]),
  selectedQuotationId: z.string().uuid().nullable().default(null),
  paymentMode: PaymentModeSchema,
  status: z.enum(['em_cotacao', 'negociando', 'adquirido', 'instalado', 'cancelado']).default('em_cotacao'),
  deadline: z.string().optional().default(''),
  notes: z.string().optional().default('')
});

// --- Implantation Project ---
export const ImplantationProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional().default(''),
  budgetTargetCents: z.number().int().nonnegative(),
  status: z.enum(['planejamento', 'execucao', 'pausado', 'concluido', 'cancelado']).default('planejamento'),
  startDate: z.string().optional().default(''),
  targetEndDate: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  createdAt: z.string().min(1)
});

export type QuotationInput = z.infer<typeof QuotationSchema>;
export type ImplantationItemInput = z.infer<typeof ImplantationItemSchema>;
export type ImplantationProjectInput = z.infer<typeof ImplantationProjectSchema>;
export type PaymentMode = z.infer<typeof PaymentModeSchema>;
