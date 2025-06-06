import { z } from 'zod';

export const ExportFormat = z.enum(['pdf', 'excel']);

export const ExportFilters = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.enum(['call', 'quote', 'claim', 'document', 'appointment']).optional(),
  status: z.enum(['pending', 'completed', 'overdue']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  clientName: z.string().optional(),
});

export const ExportRequest = z.object({
  format: ExportFormat,
  filters: ExportFilters,
  includeStats: z.boolean().default(true),
  title: z.string().optional(),
});

export type ExportFormat = z.infer<typeof ExportFormat>;
export type ExportFilters = z.infer<typeof ExportFilters>;
export type ExportRequest = z.infer<typeof ExportRequest>;
