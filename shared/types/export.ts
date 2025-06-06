export interface ExportStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByCategory: Record<string, number>;
  tasksByPriority: Record<string, number>;
  completionRate: number;
}

export interface ExportData {
  tasks: any[];
  stats: ExportStats;
  filters: any;
  generatedAt: string;
  title?: string;
}
