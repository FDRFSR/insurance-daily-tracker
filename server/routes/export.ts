import express from 'express';
import { ExportRequest } from '../../shared/schemas/export';
import { ReportGenerator } from '../services/reportGenerator';
import { ExportData, ExportStats } from '../../shared/types/export';
import { Task } from '../../shared/schema';
import { storage } from '../storage';

const router = express.Router();

/**
 * POST /api/export
 * Genera export PDF o Excel delle attività
 */
router.post('/', async (req, res) => {
  try {
    const exportRequest = ExportRequest.parse(req.body);
    
    // Recupera le attività filtrate
    const allTasks = await storage.getTasks();
    const filteredTasks = filterTasks(allTasks, exportRequest.filters);
    
    // Genera statistiche
    const stats = generateStats(filteredTasks);
    
    // Prepara i dati per Export
    const exportData: ExportData = {
      tasks: filteredTasks,
      stats,
      filters: exportRequest.filters,
      generatedAt: new Date().toISOString(),
      title: exportRequest.title,
    };
    
    // Genera il report nel formato richiesto
    let buffer: Buffer;
    let contentType: string;
    let filename: string;
    
    if (exportRequest.format === 'pdf') {
      buffer = ReportGenerator.generatePDF(exportData);
      contentType = 'application/pdf';
      filename = `insuratask-report-${new Date().toISOString().split('T')[0]}.pdf`;
    } else {
      buffer = ReportGenerator.generateExcel(exportData);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `insuratask-report-${new Date().toISOString().split('T')[0]}.xlsx`;
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Errore durante la generazione del report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/export/preview
 * Genera anteprima dei dati da esportare
 */
router.post('/preview', async (req, res) => {
  try {
    const { filters } = req.body;
    
    const allTasks = await storage.getTasks();
    const filteredTasks = filterTasks(allTasks, filters);
    const stats = generateStats(filteredTasks);
    
    res.json({
      tasksCount: filteredTasks.length,
      stats,
      sampleTasks: filteredTasks.slice(0, 5), // Prime 5 attività come anteprima
    });
    
  } catch (error) {
    console.error('Export preview error:', error);
    res.status(500).json({ 
      error: 'Errore durante la generazione dell\'anteprima'
    });
  }
});

function filterTasks(tasks: Task[], filters: any): Task[] {
  return tasks.filter(task => {
    // Filtro per data inizio
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      if (task.dueDate && new Date(task.dueDate) < startDate) return false;
    }
    
    // Filtro per data fine
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      if (task.dueDate && new Date(task.dueDate) > endDate) return false;
    }
    
    // Filtro per categoria
    if (filters.category && task.category !== filters.category) {
      return false;
    }
    
    // Filtro per stato
    if (filters.status && task.status !== filters.status) {
      return false;
    }
    
    // Filtro per priorità
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    
    // Filtro per nome cliente
    if (filters.clientName && task.clientName) {
      const searchTerm = filters.clientName.toLowerCase();
      if (!task.clientName.toLowerCase().includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });
}

function generateStats(tasks: Task[]): ExportStats {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length;
  
  const tasksByCategory: Record<string, number> = {};
  const tasksByPriority: Record<string, number> = {};
  
  tasks.forEach(task => {
    tasksByCategory[task.category] = (tasksByCategory[task.category] || 0) + 1;
    tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
  });
  
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  return {
    totalTasks,
    completedTasks,
    overdueTasks,
    tasksByCategory,
    tasksByPriority,
    completionRate,
  };
}

export { router as exportRouter };
