import { z } from 'zod';

export const DemandChannelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['interno', 'varejo', 'atacado', 'industria', 'resíduo']),
  priority: z.number().int().nonnegative(),
  baselineDemand: z.number().nonnegative().default(0),
  scenarioDemand: z.number().nonnegative().default(0),
  defaultMarkupPct: z.number().nonnegative().default(30),
  notes: z.string().optional().default('')
});

export type DemandChannelInput = z.infer<typeof DemandChannelSchema>;
