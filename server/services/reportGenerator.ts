import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ExportData, ExportStats } from '../../shared/types/export';
import { Task } from '../../shared/schema';

export class ReportGenerator {
  /**
   * Genera report PDF con branding e layout professionale
   */
  static generatePDF(data: ExportData): Buffer {
    const doc = new jsPDF();
    
    // Header con branding
    doc.setFontSize(20);
    doc.setTextColor(34, 197, 94); // Verde InsuraTask
    doc.text('🛡️ InsuraTask', 20, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(data.title || 'Report Attività', 20, 35);
    
    // Info generazione
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generato il: ${new Date(data.generatedAt).toLocaleString('it-IT')}`, 20, 45);
    
    let yPosition = 60;
    
    // Sezione Statistiche
    if (data.stats) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('📊 Statistiche Generali', 20, yPosition);
      yPosition += 10;
      
      const statsData = [
        ['Totale Attività', data.stats.totalTasks.toString()],
        ['Completate', data.stats.completedTasks.toString()],
        ['In Scadenza', data.stats.overdueTasks.toString()],
        ['Tasso Completamento', `${data.stats.completionRate.toFixed(1)}%`],
      ];
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Metrica', 'Valore']],
        body: statsData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: 20 },
        tableWidth: 80,
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Sezione Attività
    if (data.tasks && data.tasks.length > 0) {
      doc.setFontSize(14);
      doc.text('📋 Dettaglio Attività', 20, yPosition);
      yPosition += 10;
      
      const tasksData = data.tasks.map((task: Task) => [
        task.title,
        this.getCategoryLabel(task.category),
        this.getPriorityLabel(task.priority),
        this.getStatusLabel(task.status),
        task.dueDate ? new Date(task.dueDate).toLocaleDateString('it-IT') : '-',
        task.client || 'N/A',
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Titolo', 'Categoria', 'Priorità', 'Stato', 'Scadenza', 'Cliente']],
        body: tasksData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: 20 },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 30 },
        },
      });
    }
    
    return Buffer.from(doc.output('arraybuffer'));
  }
  
  /**
   * Genera report Excel con formattazione e filtri
   */
  static generateExcel(data: ExportData): Buffer {
    const workbook = XLSX.utils.book_new();
    
    // Foglio Statistiche
    if (data.stats) {
      const statsData = [
        ['📊 Statistiche InsuraTask', ''],
        ['Generato il:', new Date(data.generatedAt).toLocaleString('it-IT')],
        [''],
        ['Metrica', 'Valore'],
        ['Totale Attività', data.stats.totalTasks],
        ['Completate', data.stats.completedTasks],
        ['In Scadenza', data.stats.overdueTasks],
        ['Tasso Completamento', `${data.stats.completionRate.toFixed(1)}%`],
        [''],
        ['Categorie', ''],
        ...Object.entries(data.stats.tasksByCategory).map(([cat, count]) => [
          this.getCategoryLabel(cat as any), count
        ]),
        [''],
        ['Priorità', ''],
        ...Object.entries(data.stats.tasksByPriority).map(([pri, count]) => [
          this.getPriorityLabel(pri as any), count
        ]),
      ];
      
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiche');
    }
    
    // Foglio Attività
    if (data.tasks && data.tasks.length > 0) {
      const tasksData = [
        ['Titolo', 'Descrizione', 'Categoria', 'Priorità', 'Stato', 'Scadenza', 'Cliente', 'Creato'],
        ...data.tasks.map((task: Task) => [
          task.title,
          task.description || '',
          this.getCategoryLabel(task.category),
          this.getPriorityLabel(task.priority),
          this.getStatusLabel(task.status),
          task.dueDate ? new Date(task.dueDate).toLocaleDateString('it-IT') : '-',
          task.client || '',
          new Date(task.createdAt).toLocaleDateString('it-IT'),
        ])
      ];
      
      const tasksSheet = XLSX.utils.aoa_to_sheet(tasksData);
      
      // Formattazione header
      const range = XLSX.utils.decode_range(tasksSheet['!ref']!);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!tasksSheet[cellAddr]) continue;
        tasksSheet[cellAddr].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: '22C55E' } }
        };
      }
      
      XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Attività');
    }
    
    return Buffer.from(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }));
  }
  
  private static getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'call': '📞 Chiamata',
      'quote': '💰 Preventivo',
      'claim': '📋 Sinistro',
      'document': '📄 Documento',
      'appointment': '📅 Appuntamento',
    };
    return labels[category] || category;
  }
  
  private static getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'low': '🟢 Bassa',
      'medium': '🟡 Media',
      'high': '🔴 Alta',
    };
    return labels[priority] || priority;
  }
  
  private static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': '⏳ In Attesa',
      'completed': '✅ Completata',
      'overdue': '⚠️ In Ritardo',
    };
    return labels[status] || status;
  }
}
