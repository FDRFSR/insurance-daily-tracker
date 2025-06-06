export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  category?: 'call' | 'quote' | 'claim' | 'document' | 'appointment';
  status?: 'pending' | 'completed' | 'overdue';
  priority?: 'low' | 'medium' | 'high';
  clientName?: string;
}

export interface ExportRequest {
  format: 'pdf' | 'excel';
  filters: ExportFilters;
  includeStats?: boolean;
  title?: string;
}

export default {};
