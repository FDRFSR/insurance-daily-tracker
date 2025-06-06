// cronService.ts - Template scheduling service
import cron from 'node-cron';

// Local type definition to avoid import issues
interface RecurrenceConfig {
  type: 'daily' | 'weekly' | 'monthly';
  time?: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

interface TemplateService {
  getActiveTemplates(): Promise<Array<{ id: number; recurrenceConfig?: RecurrenceConfig }>>;
  executeTemplate(id: number): Promise<{ task: any }>;
}

interface CronJob {
  id: number;
  task: cron.ScheduledTask;
  config: RecurrenceConfig;
}

class CronService {
  private jobs: Map<number, CronJob> = new Map();
  private templateService?: TemplateService;

  /**
   * Imposta il servizio template per evitare dipendenze circolari
   */
  setTemplateService(service: TemplateService): void {
    this.templateService = service;
  }

  /**
   * Inizializza il servizio cron e carica i template attivi
   */
  async initialize(): Promise<void> {
    console.log('🕐 Initializing template cron service...');
    
    if (!this.templateService) {
      console.warn('⚠️ Template service not set, skipping initialization');
      return;
    }
    
    try {
      const activeTemplates = await this.templateService.getActiveTemplates();
      
      for (const template of activeTemplates) {
        if (template.recurrenceConfig) {
          await this.scheduleTemplate(template.id, template.recurrenceConfig);
        }
      }
      
      console.log(`✅ Initialized ${this.jobs.size} scheduled templates`);
    } catch (error) {
      console.error('❌ Failed to initialize cron service:', error);
    }
  }

  /**
   * Pianifica l'esecuzione di un template
   */
  async scheduleTemplate(templateId: number, config: RecurrenceConfig): Promise<void> {
    // Rimuovi il job esistente se presente
    await this.unscheduleTemplate(templateId);

    const cronExpression = this.buildCronExpression(config);
    
    console.log(`⏰ Scheduling template ${templateId} with pattern: ${cronExpression}`);
    
    const task = cron.schedule(cronExpression, async () => {
      try {
        console.log(`🔄 Executing scheduled template ${templateId}`);
        if (this.templateService) {
          const result = await this.templateService.executeTemplate(templateId);
          console.log(`✅ Template ${templateId} executed: ${result.task.title}`);
        }
      } catch (error) {
        console.error(`❌ Failed to execute template ${templateId}:`, error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Rome'
    });

    this.jobs.set(templateId, {
      id: templateId,
      task,
      config
    });
  }

  /**
   * Annulla la pianificazione di un template
   */
  async unscheduleTemplate(templateId: number): Promise<void> {
    const job = this.jobs.get(templateId);
    if (job) {
      job.task.stop();
      this.jobs.delete(templateId);
      console.log(`⏹️ Unscheduled template ${templateId}`);
    }
  }

  /**
   * Ottiene informazioni sui job attivi
   */
  getActiveJobs(): { templateId: number; config: RecurrenceConfig; cronExpression: string }[] {
    return Array.from(this.jobs.values()).map(job => ({
      templateId: job.id,
      config: job.config,
      cronExpression: this.buildCronExpression(job.config)
    }));
  }

  /**
   * Costruisce un'espressione cron dalla configurazione di ricorrenza
   */
  private buildCronExpression(config: RecurrenceConfig): string {
    const { type, time = '09:00', daysOfWeek, dayOfMonth } = config;
    const [hour, minute] = time.split(':').map(Number);

    switch (type) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      
      case 'weekly':
        const dow = daysOfWeek?.[0] || 1; // Default lunedì
        return `${minute} ${hour} * * ${dow}`;
      
      case 'monthly':
        const dom = dayOfMonth || 1; // Default primo del mese
        return `${minute} ${hour} ${dom} * *`;
      
      default:
        throw new Error(`Unsupported recurrence type: ${type}`);
    }
  }

  /**
   * Ferma tutti i job e pulisce il servizio
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down cron service...');
    
    Array.from(this.jobs.values()).forEach(job => {
      job.task.stop();
    });
    
    this.jobs.clear();
    console.log('✅ Cron service shut down');
  }
}

// Istanza singleton del servizio
export const cronService = new CronService();
