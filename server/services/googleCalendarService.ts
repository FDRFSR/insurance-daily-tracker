import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAuthService } from './googleAuthService.js';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  colorId?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface InsuraTaskEvent {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  category: string;
  priority: string;
  status: string;
}

export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar;
  private authService: GoogleAuthService;

  constructor(authService: GoogleAuthService) {
    this.authService = authService;
    this.calendar = google.calendar({ 
      version: 'v3', 
      auth: authService.getAuthenticatedClient() 
    });
  }

  /**
   * Ottiene lista dei calendari dell'utente
   */
  async getCalendarList(): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('Errore ottenimento lista calendari:', error);
      throw new Error(`Errore Calendar API: ${error}`);
    }
  }

  /**
   * Ottiene calendario primario dell'utente
   */
  async getPrimaryCalendar(): Promise<calendar_v3.Schema$CalendarListEntry | null> {
    try {
      const calendars = await this.getCalendarList();
      return calendars.find(cal => cal.primary) || null;
    } catch (error) {
      console.error('Errore ottenimento calendario primario:', error);
      return null;
    }
  }

  /**
   * Crea evento nel calendario Google
   */
  async createEvent(event: CalendarEvent, calendarId: string = 'primary'): Promise<calendar_v3.Schema$Event> {
    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: event
      });
      
      return response.data;
    } catch (error) {
      console.error('Errore creazione evento:', error);
      throw new Error(`Errore creazione evento: ${error}`);
    }
  }

  /**
   * Aggiorna evento esistente
   */
  async updateEvent(eventId: string, event: Partial<CalendarEvent>, calendarId: string = 'primary'): Promise<calendar_v3.Schema$Event> {
    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: event
      });
      
      return response.data;
    } catch (error) {
      console.error('Errore aggiornamento evento:', error);
      throw new Error(`Errore aggiornamento evento: ${error}`);
    }
  }

  /**
   * Elimina evento dal calendario
   */
  async deleteEvent(eventId: string, calendarId: string = 'primary'): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId
      });
    } catch (error) {
      console.error('Errore eliminazione evento:', error);
      throw new Error(`Errore eliminazione evento: ${error}`);
    }
  }

  /**
   * Ottiene evento specifico
   */
  async getEvent(eventId: string, calendarId: string = 'primary'): Promise<calendar_v3.Schema$Event | null> {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId
      });
      
      return response.data;
    } catch (error) {
      console.error('Errore ottenimento evento:', error);
      return null;
    }
  }

  /**
   * Ottiene eventi in un range di date
   */
  async getEvents(
    timeMin: string, 
    timeMax: string, 
    calendarId: string = 'primary'
  ): Promise<calendar_v3.Schema$Event[]> {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime'
      });
      
      return response.data.items || [];
    } catch (error) {
      console.error('Errore ottenimento eventi:', error);
      throw new Error(`Errore ottenimento eventi: ${error}`);
    }
  }

  /**
   * Converte task InsuraTask in evento Google Calendar
   */
  convertTaskToEvent(task: InsuraTaskEvent): CalendarEvent {
    const startDate = new Date(task.dueDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 ora

    // Mappa categoria a colore
    const categoryColors: { [key: string]: string } = {
      'chiamate': '1', // Blu
      'preventivi': '2', // Verde
      'appuntamenti': '3', // Viola
      'sinistri': '4', // Rosa
      'documenti': '5', // Giallo
      'other': '6' // Arancione
    };

    return {
      summary: task.title,
      description: `${task.description || ''}\n\nCreato da InsuraTask\nPriorità: ${task.priority}\nStato: ${task.status}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Europe/Rome'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Europe/Rome'
      },
      colorId: categoryColors[task.category.toLowerCase()] || categoryColors['other'],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 }, // 1 giorno prima
          { method: 'popup', minutes: 60 }    // 1 ora prima
        ]
      }
    };
  }

  /**
   * Converte evento Google Calendar in task InsuraTask format
   */
  convertEventToTask(event: calendar_v3.Schema$Event): Partial<InsuraTaskEvent> {
    const startDate = event.start?.dateTime || event.start?.date;
    
    // Estrai informazioni dal description se presente
    const description = event.description || '';
    const priorityMatch = description.match(/Priorità:\s*(\w+)/);
    const statusMatch = description.match(/Stato:\s*(\w+)/);
    
    // Mappa colore a categoria
    const colorCategories: { [key: string]: string } = {
      '1': 'chiamate',
      '2': 'preventivi', 
      '3': 'appuntamenti',
      '4': 'sinistri',
      '5': 'documenti',
      '6': 'other'
    };

    return {
      title: event.summary || 'Evento Google Calendar',
      description: description.split('\n\nCreato da InsuraTask')[0] || '', // Rimuovi metadati
      dueDate: startDate || new Date().toISOString(),
      category: colorCategories[event.colorId || '6'] || 'other',
      priority: priorityMatch ? priorityMatch[1] : 'medium',
      status: statusMatch ? statusMatch[1] : 'pending'
    };
  }

  /**
   * Verifica se un evento è stato creato da InsuraTask
   */
  isInsuraTaskEvent(event: calendar_v3.Schema$Event): boolean {
    return (event.description || '').includes('Creato da InsuraTask');
  }

  /**
   * Ottiene tutti gli eventi creati da InsuraTask
   */
  async getInsuraTaskEvents(
    timeMin: string, 
    timeMax: string, 
    calendarId: string = 'primary'
  ): Promise<calendar_v3.Schema$Event[]> {
    try {
      const allEvents = await this.getEvents(timeMin, timeMax, calendarId);
      return allEvents.filter(event => this.isInsuraTaskEvent(event));
    } catch (error) {
      console.error('Errore ottenimento eventi InsuraTask:', error);
      throw error;
    }
  }
}

// Esporta istanza singleton del servizio
import { googleAuthService } from './googleAuthService.js';
export const googleCalendarService = new GoogleCalendarService(googleAuthService);
