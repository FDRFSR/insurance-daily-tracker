import { ExportRequest, ExportFilters } from '../types/export';

export interface ExportPreview {
  tasksCount: number;
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    tasksByCategory: Record<string, number>;
    tasksByPriority: Record<string, number>;
    completionRate: number;
  };
  sampleTasks: any[];
}

export class ExportService {
  /**
   * Genera anteprima dei dati da esportare
   */
  static async getExportPreview(filters: ExportFilters): Promise<ExportPreview> {
    const response = await fetch('/api/export/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filters }),
    });
    
    if (!response.ok) {
      throw new Error('Errore nel caricamento anteprima');
    }
    
    return response.json();
  }
  
  /**
   * Esporta i dati nel formato specificato
   */
  static async exportData(request: ExportRequest): Promise<void> {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error('Errore durante l\'esportazione');
    }
    
    // Scarica il file
    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
      : `export.${request.format === 'pdf' ? 'pdf' : 'xlsx'}`;
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
