import Handlebars from 'handlebars';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { storage } from '../sqlite-storage.js';
import type { Template, InsertTemplate, TemplateInstance, TemplateContext } from '@shared/types/template';

// Registra helper Handlebars per date italiane
Handlebars.registerHelper('formatDate', (date: string, formatStr: string = 'dd/MM/yyyy') => {
  return format(new Date(date), formatStr, { locale: it });
});

Handlebars.registerHelper('monthName', (date: string) => {
  return format(new Date(date), 'MMMM', { locale: it });
});

export class TemplateService {
  /**
   * Ottiene accesso al database
   */
  private get db() {
    return storage.getDatabase();
  }
  /**
   * Crea un nuovo template
   */
  async createTemplate(data: InsertTemplate): Promise<Template> {
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO templates (
        name, category, title_template, description_template, 
        priority, recurrence_config, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.name,
      data.category,
      data.titleTemplate,
      data.descriptionTemplate || null,
      data.priority,
      JSON.stringify(data.recurrenceConfig),
      data.isActive ? 1 : 0,
      now,
      now
    );

    return this.getTemplate(result.lastInsertRowid as number);
  }

  /**
   * Ottiene tutti i templates
   */
  async getTemplates(): Promise<Template[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM templates ORDER BY created_at DESC
    `);
    
    const rows = stmt.all() as any[];
    return rows.map(this.mapTemplateRow);
  }

  /**
   * Ottiene un template per ID
   */
  async getTemplate(id: number): Promise<Template> {
    const stmt = this.db.prepare(`
      SELECT * FROM templates WHERE id = ?
    `);
    
    const row = stmt.get(id) as any;
    if (!row) {
      throw new Error(`Template with id ${id} not found`);
    }
    
    return this.mapTemplateRow(row);
  }

  /**
   * Aggiorna un template
   */
  async updateTemplate(id: number, updates: Partial<InsertTemplate>): Promise<Template> {
    const existing = await this.getTemplate(id);
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      UPDATE templates 
      SET name = ?, category = ?, title_template = ?, description_template = ?,
          priority = ?, recurrence_config = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `);
    
    stmt.run(
      updates.name ?? existing.name,
      updates.category ?? existing.category,
      updates.titleTemplate ?? existing.titleTemplate,
      updates.descriptionTemplate ?? existing.descriptionTemplate,
      updates.priority ?? existing.priority,
      JSON.stringify(updates.recurrenceConfig ?? existing.recurrenceConfig),
      (updates.isActive ?? existing.isActive) ? 1 : 0,
      now,
      id
    );

    return this.getTemplate(id);
  }

  /**
   * Elimina un template
   */
  async deleteTemplate(id: number): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM templates WHERE id = ?`);
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      throw new Error(`Template with id ${id} not found`);
    }
  }

  /**
   * Attiva/disattiva un template
   */
  async toggleTemplate(id: number, isActive: boolean): Promise<Template> {
    const stmt = this.db.prepare(`
      UPDATE templates SET is_active = ?, updated_at = ? WHERE id = ?
    `);
    
    stmt.run(isActive ? 1 : 0, new Date().toISOString(), id);
    return this.getTemplate(id);
  }

  /**
   * Esegue un template creando una task
   */
  async executeTemplate(id: number, context: Record<string, any> = {}): Promise<{ task: any; instance: TemplateInstance }> {
    const template = await this.getTemplate(id);
    
    // Prepara il contesto con variabili predefinite
    const today = new Date();
    const fullContext = {
      date: format(today, 'dd/MM/yyyy', { locale: it }),
      month: format(today, 'MMMM', { locale: it }),
      year: format(today, 'yyyy'),
      day: format(today, 'dd'),
      week: format(today, 'w'),
      ...context
    };

    // Compila i template
    const titleCompiled = Handlebars.compile(template.titleTemplate);
    const descriptionCompiled = template.descriptionTemplate ? 
      Handlebars.compile(template.descriptionTemplate) : null;

    const title = titleCompiled(fullContext);
    const description = descriptionCompiled ? descriptionCompiled(fullContext) : undefined;

    // Crea la task
    const task = await storage.createTask({
      title,
      description,
      category: template.category,
      priority: template.priority,
      status: 'pending',
      client: (fullContext as TemplateContext).client_name || (fullContext as TemplateContext).client
    });

    // Registra l'istanza del template
    const instance = await this.createTemplateInstance({
      templateId: template.id,
      taskId: task.id,
      scheduledDate: today.toISOString().split('T')[0],
      executedAt: new Date().toISOString()
    });

    return { task, instance };
  }

  /**
   * Ottiene i templates attivi per la pianificazione
   */
  async getActiveTemplates(): Promise<Template[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM templates WHERE is_active = 1
    `);
    
    const rows = stmt.all() as any[];
    return rows.map(this.mapTemplateRow);
  }

  /**
   * Crea un'istanza di template
   */
  async createTemplateInstance(data: {
    templateId: number;
    taskId?: number;
    scheduledDate: string;
    executedAt?: string;
  }): Promise<TemplateInstance> {
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO template_instances (
        template_id, task_id, scheduled_date, executed_at, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.templateId,
      data.taskId || null,
      data.scheduledDate,
      data.executedAt || null,
      now
    );

    return this.getTemplateInstance(result.lastInsertRowid as number);
  }

  /**
   * Ottiene un'istanza di template
   */
  async getTemplateInstance(id: number): Promise<TemplateInstance> {
    const stmt = this.db.prepare(`
      SELECT * FROM template_instances WHERE id = ?
    `);
    
    const row = stmt.get(id) as any;
    if (!row) {
      throw new Error(`Template instance with id ${id} not found`);
    }
    
    return {
      id: row.id,
      templateId: row.template_id,
      taskId: row.task_id,
      scheduledDate: row.scheduled_date,
      executedAt: row.executed_at,
      createdAt: new Date(row.created_at)
    };
  }

  /**
   * Ottiene le istanze per un template
   */
  async getTemplateInstances(templateId: number): Promise<TemplateInstance[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM template_instances WHERE template_id = ? ORDER BY scheduled_date DESC
    `);
    
    const rows = stmt.all(templateId) as any[];
    return rows.map(row => ({
      id: row.id,
      templateId: row.template_id,
      taskId: row.task_id,
      scheduledDate: row.scheduled_date,
      executedAt: row.executed_at,
      createdAt: new Date(row.created_at)
    }));
  }

  /**
   * Mappa una riga del database a un oggetto Template
   */
  private mapTemplateRow(row: any): Template {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      titleTemplate: row.title_template,
      descriptionTemplate: row.description_template,
      priority: row.priority,
      recurrenceConfig: JSON.parse(row.recurrence_config),
      isActive: row.is_active === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

// Istanza singleton del servizio
export const templateService = new TemplateService();
