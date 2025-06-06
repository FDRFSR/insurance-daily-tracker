/**
 * Calendar Sync Service
 * Gestisce la sincronizzazione bidirezionale tra InsuraTask e Google Calendar
 * Include conflict resolution e logic di sync intelligente
 * 
 * @author InsuraTask v1.1 Sprint 4
 * @created 2025-01-25
 */

import { googleCalendarDb as googleCalendarDatabase, GoogleCalendarConfig, TaskCalendarMapping } from './googleCalendarDatabase';
import { googleCalendarService, type CalendarEvent } from './googleCalendarService';
import { storage } from '../sqlite-storage';
import { type Task, type InsertTask, type UpdateTask } from '@shared/schema';

export interface SyncResult {
  success: boolean;
  tasksCreated: number;
  tasksUpdated: number;
  tasksDeleted: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  conflicts: ConflictItem[];
  errors: string[];
}

export interface ConflictItem {
  type: 'task_event_mismatch' | 'duplicate_mapping' | 'deleted_entity';
  taskId?: number;
  eventId?: string;
  description: string;
  suggestedAction: 'keep_task' | 'keep_event' | 'merge' | 'delete_mapping';
}

export interface SyncOptions {
  direction: 'import' | 'export' | 'bidirectional';
  conflictResolution: 'manual' | 'keep_newest' | 'keep_task' | 'keep_event';
  dryRun?: boolean;
  dateRange?: {
    start: string; // ISO date
    end: string;   // ISO date
  };
}

export class CalendarSyncService {
  /**
   * Esegue la sincronizzazione completa
   */
  async performSync(options: SyncOptions = { 
    direction: 'bidirectional', 
    conflictResolution: 'keep_newest' 
  }): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      tasksCreated: 0,
      tasksUpdated: 0,
      tasksDeleted: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      conflicts: [],
      errors: []
    };

    try {
      // Verifica configurazione Google Calendar
      const config = googleCalendarDatabase.getGoogleCalendarConfig();
      if (!config || !config.syncEnabled) {
        throw new Error('Google Calendar non configurato o sync disabilitato');
      }

      // Log inizio sync
      await googleCalendarDatabase.createSyncAudit({
        operation: 'full_sync',
        direction: options.direction,
        status: 'running',
        details: JSON.stringify({ options }),
        errorMessage: null
      });

      // Esegue sync in base alla direzione
      if (options.direction === 'import' || options.direction === 'bidirectional') {
        await this.syncFromGoogleCalendar(result, options, config);
      }

      if (options.direction === 'export' || options.direction === 'bidirectional') {
        await this.syncToGoogleCalendar(result, options, config);
      }

      // Rileva e gestisce conflitti
      await this.detectAndResolveConflicts(result, options);

      // Aggiorna timestamp ultima sync
      if (!options.dryRun) {
        await googleCalendarDatabase.updateGoogleCalendarConfig(config.id, {
          lastSyncAt: new Date().toISOString()
        });
      }

      result.success = result.errors.length === 0;

      // Log risultato sync
      await googleCalendarDatabase.createSyncAudit({
        operation: 'full_sync',
        direction: options.direction,
        status: result.success ? 'completed' : 'error',
        details: JSON.stringify(result),
        errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null
      });

      return result;

    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      result.errors.push(`Errore sync: ${errorMessage}`);
      
      await googleCalendarDatabase.createSyncAudit({
        operation: 'full_sync',
        direction: options.direction,
        status: 'error',
        details: JSON.stringify({ error: errorMessage }),
        errorMessage
      });

      return result;
    }
  }

  /**
   * Importa eventi da Google Calendar e crea task InsuraTask
   */
  private async syncFromGoogleCalendar(
    result: SyncResult, 
    options: SyncOptions, 
    config: GoogleCalendarConfig
  ): Promise<void> {
    try {
      // Recupera eventi da Google Calendar
      const calendarId = config.calendarId || 'primary';
      let events = await googleCalendarService.getEvents(calendarId);

      // Filtra eventi creati da InsuraTask per evitare duplicati
      events = events.filter((event: CalendarEvent) => !this.isInsuraTaskEvent(event));

      // Applica filtro data se specificato
      if (options.dateRange) {
        events = events.filter((event: CalendarEvent) => {
          if (!event.start?.dateTime) return false;
          const eventDate = event.start.dateTime;
          return eventDate >= options.dateRange!.start && eventDate <= options.dateRange!.end;
        });
      }

      for (const event of events) {
        try {
          // Controlla se esiste già mapping
          const existingMapping = googleCalendarDatabase.getTaskCalendarMappingByEventId(event.id!);
          
          if (existingMapping) {
            // Aggiorna task esistente se evento è più recente
            await this.updateTaskFromEvent(event, existingMapping, result, options);
          } else {
            // Crea nuovo task
            await this.createTaskFromEvent(event, calendarId, result, options);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
          result.errors.push(`Errore import evento ${event.id}: ${errorMessage}`);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      result.errors.push(`Errore sync from Google Calendar: ${errorMessage}`);
    }
  }

  /**
   * Esporta task InsuraTask come eventi Google Calendar
   */
  private async syncToGoogleCalendar(
    result: SyncResult, 
    options: SyncOptions, 
    config: GoogleCalendarConfig
  ): Promise<void> {
    try {
      // Recupera tutti i task InsuraTask
      let tasks = await storage.getTasks();

      // Applica filtro data se specificato
      if (options.dateRange) {
        tasks = tasks.filter(task => {
          if (!task.dueDate) return false;
          return task.dueDate >= options.dateRange!.start && task.dueDate <= options.dateRange!.end;
        });
      }

      const calendarId = config.calendarId || 'primary';

      for (const task of tasks) {
        try {
          // Controlla se esiste già mapping
          const existingMapping = googleCalendarDatabase.getTaskCalendarMappingByTaskId(task.id);
          
          if (existingMapping) {
            // Aggiorna evento esistente se task è più recente
            await this.updateEventFromTask(task, existingMapping, result, options);
          } else {
            // Crea nuovo evento
            await this.createEventFromTask(task, calendarId, result, options);
          }

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
          result.errors.push(`Errore export task ${task.id}: ${errorMessage}`);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      result.errors.push(`Errore sync to Google Calendar: ${errorMessage}`);
    }
  }

  /**
   * Crea nuovo task da evento Google Calendar
   */
  private async createTaskFromEvent(
    event: CalendarEvent, 
    calendarId: string, 
    result: SyncResult, 
    options: SyncOptions
  ): Promise<void> {
    if (!event.summary || this.isInsuraTaskEvent(event)) return;

    const taskData = this.convertEventToTaskData(event);
    
    if (!options.dryRun) {
      const newTask = await storage.createTask(taskData);
      
      // Crea mapping
      await googleCalendarDatabase.createTaskCalendarMapping({
        taskId: newTask.id,
        googleEventId: event.id!,
        calendarId: calendarId,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'synced'
      });
    }

    result.tasksCreated++;
  }

  /**
   * Aggiorna task esistente da evento Google Calendar
   */
  private async updateTaskFromEvent(
    event: CalendarEvent, 
    mapping: TaskCalendarMapping, 
    result: SyncResult, 
    options: SyncOptions
  ): Promise<void> {
    const task = await storage.getTask(mapping.taskId);
    if (!task) {
      // Task eliminato, rimuovi mapping
      await googleCalendarDatabase.deleteTaskCalendarMapping(mapping.taskId);
      return;
    }

    // Logica di aggiornamento basata su conflictResolution
    if (options.conflictResolution === 'keep_task') {
      return; // Mantieni sempre task
    }

    const taskUpdates = this.convertEventToTaskUpdate(event);
    
    if (!options.dryRun) {
      await storage.updateTask(task.id, taskUpdates);
      
      await googleCalendarDatabase.updateTaskCalendarMapping(mapping.taskId, {
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'synced'
      });
    }

    result.tasksUpdated++;
  }

  /**
   * Crea nuovo evento da task InsuraTask
   */
  private async createEventFromTask(
    task: Task, 
    calendarId: string, 
    result: SyncResult, 
    options: SyncOptions
  ): Promise<void> {
    if (!task.dueDate) return; // Skip task senza data

    const eventData = this.convertTaskToEventData(task);
    
    if (!options.dryRun) {
      const newEvent = await googleCalendarService.createEvent(calendarId, eventData);
      
      // Crea mapping
      await googleCalendarDatabase.createTaskCalendarMapping({
        taskId: task.id,
        googleEventId: newEvent.id!,
        calendarId: calendarId,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'synced'
      });
    }

    result.eventsCreated++;
  }

  /**
   * Aggiorna evento esistente da task InsuraTask
   */
  private async updateEventFromTask(
    task: Task, 
    mapping: TaskCalendarMapping, 
    result: SyncResult, 
    options: SyncOptions
  ): Promise<void> {
    try {
      // Recupera evento esistente
      const existingEvent = await googleCalendarService.getEvent(mapping.calendarId, mapping.googleEventId);
      if (!existingEvent) {
        // Evento eliminato, rimuovi mapping
        await googleCalendarDatabase.deleteTaskCalendarMapping(mapping.taskId);
        return;
      }

      // Logica di aggiornamento basata su conflictResolution
      if (options.conflictResolution === 'keep_event') {
        return; // Mantieni sempre evento
      }

      const eventUpdates = this.convertTaskToEventData(task);
      
      if (!options.dryRun) {
        await googleCalendarService.updateEvent(mapping.calendarId, mapping.googleEventId, eventUpdates);
        
        await googleCalendarDatabase.updateTaskCalendarMapping(mapping.taskId, {
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'synced'
        });
      }

      result.eventsUpdated++;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      result.errors.push(`Errore aggiornamento evento ${mapping.googleEventId}: ${errorMessage}`);
    }
  }

  /**
   * Rileva e risolve conflitti di sincronizzazione
   */
  private async detectAndResolveConflicts(result: SyncResult, options: SyncOptions): Promise<void> {
    const conflictedMappings = googleCalendarDatabase.getConflictedMappings();
    
    for (const mapping of conflictedMappings) {
      try {
        const task = await storage.getTask(mapping.taskId);
        let event: CalendarEvent | null = null;
        
        try {
          event = await googleCalendarService.getEvent(mapping.calendarId, mapping.googleEventId);
        } catch {
          event = null;
        }

        if (!task && !event) {
          // Entrambi eliminati, rimuovi mapping
          await googleCalendarDatabase.deleteTaskCalendarMapping(mapping.taskId);
          continue;
        }

        if (!task) {
          // Task eliminato, rimuovi evento o mapping
          const conflict: ConflictItem = {
            type: 'deleted_entity',
            eventId: mapping.googleEventId,
            description: `Task ${mapping.taskId} eliminato ma evento ${mapping.googleEventId} esiste ancora`,
            suggestedAction: 'delete_mapping'
          };
          result.conflicts.push(conflict);
          
          if (options.conflictResolution !== 'manual') {
            await googleCalendarDatabase.deleteTaskCalendarMapping(mapping.taskId);
          }
          continue;
        }

        if (!event) {
          // Evento eliminato, rimuovi mapping
          await googleCalendarDatabase.deleteTaskCalendarMapping(mapping.taskId);
          continue;
        }

        // Conflitto task/evento esistenti
        const conflict: ConflictItem = {
          type: 'task_event_mismatch',
          taskId: task.id,
          eventId: event.id || undefined,
          description: `Conflitto tra task ${task.id} ed evento ${event.id}`,
          suggestedAction: 'keep_task'
        };
        result.conflicts.push(conflict);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
        result.errors.push(`Errore risoluzione conflitto mapping ${mapping.id}: ${errorMessage}`);
      }
    }
  }

  /**
   * Verifica se un evento è stato creato da InsuraTask
   */
  private isInsuraTaskEvent(event: CalendarEvent): boolean {
    // Controlla se description contiene marker InsuraTask
    const description = event.description || '';
    return description.includes('[InsuraTask]') || 
           description.includes('Created by InsuraTask') ||
           event.summary?.startsWith('InsuraTask -') || false;
  }

  /**
   * Converte evento Google Calendar in dati task InsuraTask
   */
  private convertEventToTaskData(event: CalendarEvent): InsertTask {
    const dueDateTime = event.start?.dateTime || '';
    const [dueDate, dueTime] = dueDateTime.split('T');
    
    return {
      title: event.summary,
      description: event.description || null,
      category: this.mapGoogleColorToCategory(event.colorId),
      client: null,
      priority: 'medium',
      status: 'pending',
      dueDate: dueDate,
      dueTime: dueTime ? dueTime.substring(0, 5) : null, // HH:MM format
      completed: false
    };
  }

  /**
   * Converte evento Google Calendar in aggiornamenti task
   */
  private convertEventToTaskUpdate(event: CalendarEvent): Partial<UpdateTask> {
    const dueDateTime = event.start?.dateTime || '';
    const [dueDate, dueTime] = dueDateTime.split('T');
    
    return {
      title: event.summary,
      description: event.description || null,
      dueDate: dueDate,
      dueTime: dueTime ? dueTime.substring(0, 5) : null,
    };
  }

  /**
   * Converte task InsuraTask in dati evento Google Calendar
   */
  private convertTaskToEventData(task: Task): CalendarEvent {
    const startDateTime = task.dueDate + (task.dueTime ? `T${task.dueTime}:00` : 'T09:00:00');
    const endDateTime = task.dueDate + (task.dueTime ? `T${task.dueTime}:00` : 'T10:00:00');
    
    return {
      summary: task.title,
      description: `${task.description || ''}\n\n[InsuraTask - ID: ${task.id}]`,
      start: {
        dateTime: startDateTime,
        timeZone: 'Europe/Rome'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Europe/Rome'
      },
      colorId: this.mapCategoryToGoogleColor(task.category)
    };
  }

  /**
   * Mappa colore Google Calendar a categoria InsuraTask
   */
  private mapGoogleColorToCategory(colorId?: string): string {
    const colorMap: Record<string, string> = {
      '1': 'lavender',
      '2': 'sage', 
      '3': 'grape',
      '4': 'flamingo',
      '5': 'banana',
      '6': 'tangerine',
      '7': 'peacock',
      '8': 'graphite',
      '9': 'blueberry',
      '10': 'basil',
      '11': 'tomato'
    };
    
    return colorMap[colorId || ''] || 'default';
  }

  /**
   * Mappa categoria InsuraTask a colore Google Calendar
   */
  private mapCategoryToGoogleColor(category: string): string {
    const categoryMap: Record<string, string> = {
      'lavender': '1',
      'sage': '2',
      'grape': '3', 
      'flamingo': '4',
      'banana': '5',
      'tangerine': '6',
      'peacock': '7',
      'graphite': '8',
      'blueberry': '9',
      'basil': '10',
      'tomato': '11',
      'default': '1'
    };
    
    return categoryMap[category] || '1';
  }

  /**
   * Sincronizza un singolo task
   */
  async syncSingleTask(taskId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const task = await storage.getTask(taskId);
      if (!task) {
        return { success: false, error: 'Task non trovato' };
      }

      const config = googleCalendarDatabase.getGoogleCalendarConfig();
      if (!config || !config.syncEnabled) {
        return { success: false, error: 'Google Calendar non configurato' };
      }

      const calendarId = config.calendarId || 'primary';
      const existingMapping = googleCalendarDatabase.getTaskCalendarMappingByTaskId(taskId);

      if (existingMapping) {
        // Aggiorna evento esistente
        const eventUpdates = this.convertTaskToEventData(task);
        await googleCalendarService.updateEvent(existingMapping.calendarId, existingMapping.googleEventId, eventUpdates);
        await googleCalendarDatabase.updateTaskCalendarMapping(taskId, {
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'synced'
        });
      } else {
        // Crea nuovo evento
        if (!task.dueDate) {
          return { success: false, error: 'Task deve avere una data per essere sincronizzato' };
        }
        
        const eventData = this.convertTaskToEventData(task);
        const newEvent = await googleCalendarService.createEvent(calendarId, eventData);
        
        await googleCalendarDatabase.createTaskCalendarMapping({
          taskId: task.id,
          googleEventId: newEvent.id!,
          calendarId: calendarId,
          lastSyncedAt: new Date().toISOString(),
          syncStatus: 'synced'
        });
      }

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Rimuove sincronizzazione di un task (elimina evento e mapping)
   */
  async unsyncTask(taskId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const mapping = googleCalendarDatabase.getTaskCalendarMappingByTaskId(taskId);
      if (!mapping) {
        return { success: true }; // Già non sincronizzato
      }

      // Elimina evento da Google Calendar
      try {
        await googleCalendarService.deleteEvent(mapping.calendarId, mapping.googleEventId);
      } catch {
        // Evento potrebbe essere già eliminato, continua
      }

      // Rimuovi mapping
      await googleCalendarDatabase.deleteTaskCalendarMapping(taskId);

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Recupera stato sincronizzazione
   */
  getSyncStatus(): {
    isConfigured: boolean;
    isEnabled: boolean;
    lastSyncTime: string | null;
    stats: ReturnType<typeof googleCalendarDatabase.getSyncStats>;
  } {
    const config = googleCalendarDatabase.getGoogleCalendarConfig();
    const stats = googleCalendarDatabase.getSyncStats();

    return {
      isConfigured: config !== null,
      isEnabled: config?.syncEnabled || false,
      lastSyncTime: config?.lastSyncAt || null,
      stats
    };
  }
}

// Esporta istanza singleton
export const calendarSyncService = new CalendarSyncService();
