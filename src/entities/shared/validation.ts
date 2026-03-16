import { z } from 'zod';

export const OptionCatalogEntrySchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1)
});

export const OptionCatalogSchema = z.record(z.string(), z.array(OptionCatalogEntrySchema));

export type OptionCatalogEntryInput = z.infer<typeof OptionCatalogEntrySchema>;
