/**
 * Google Calendar API Routes
 * Gestisce OAuth flow, configurazione e operazioni di sincronizzazione
 * 
 * @author InsuraTask v1.1 Sprint 4
 * @created 2025-01-25
 */

import { Router, type Request, Response } from 'express';
import { z } from 'zod';
import { googleAuthService } from '../services/googleAuthService';
import { googleCalendarService } from '../services/googleCalendarService';
import { googleCalendarDb as googleCalendarDatabase } from '../services/googleCalendarDatabase';
import { calendarSyncService } from '../services/calendarSyncService';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const authUrlSchema = z.object({
  redirectUri: z.string().url().optional()
});

const authCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional()
});

const syncOptionsSchema = z.object({
  direction: z.enum(['import', 'export', 'bidirectional']).default('bidirectional'),
  conflictResolution: z.enum(['manual', 'keep_newest', 'keep_task', 'keep_event']).default('keep_newest'),
  dryRun: z.boolean().default(false),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }).optional()
});

const calendarConfigSchema = z.object({
  calendarId: z.string().optional(),
  syncEnabled: z.boolean().default(true),
  syncDirection: z.enum(['import', 'export', 'bidirectional']).default('bidirectional')
});

// ============================================================================
// OAUTH FLOW ROUTES
// ============================================================================

/**
 * GET /api/google-calendar/auth-url
 * Genera URL per iniziare OAuth flow
 */
router.get('/auth-url', async (req: Request, res: Response) => {
  try {
    const result = authUrlSchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Parametri non validi',
        errors: result.error.issues
      });
    }

    const authUrl = googleAuthService.getAuthUrl();
    
    res.json({
      success: true,
      data: { authUrl }
    });

  } catch (error) {
    console.error('Errore generazione auth URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore generazione URL autorizzazione',
      error: errorMessage
    });
  }
});

/**
 * POST /api/google-calendar/auth-callback
 * Gestisce callback OAuth e salva tokens
 */
router.post('/auth-callback', async (req: Request, res: Response) => {
  try {
    const result = authCallbackSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Dati callback non validi',
        errors: result.error.issues
      });
    }

    const { code } = result.data;

    // Scambia code per tokens
    const tokens = await googleAuthService.exchangeCodeForTokens(code);
    
    // Recupera info utente per verifica
    const userInfo = await googleAuthService.getUserInfo();
    
    // Recupera calendario primario
    const calendars = await googleCalendarService.getCalendarList();
    const primaryCalendar = calendars.find((cal: any) => cal.primary) || calendars[0];

    // Salva configurazione nel database
    const savedConfig = await googleCalendarDatabase.saveGoogleCalendarConfig({
      userId: 'default',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      tokenExpiresAt: new Date(Date.now() + (3600 * 1000)).toISOString(),
      calendarId: primaryCalendar?.id || 'primary',
      syncEnabled: true,
      syncDirection: 'bidirectional'
    });

    res.json({
      success: true,
      message: 'Autenticazione Google Calendar completata con successo',
      data: {
        userEmail: userInfo.email,
        userName: userInfo.name,
        calendarName: primaryCalendar?.summary || 'Calendario principale',
        calendarsAvailable: calendars.length
      }
    });

  } catch (error) {
    console.error('Errore callback OAuth:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore durante autenticazione',
      error: errorMessage
    });
  }
});

/**
 * DELETE /api/google-calendar/auth
 * Revoca autorizzazione e elimina configurazione
 */
router.delete('/auth', async (req: Request, res: Response) => {
  try {
    const config = googleCalendarDatabase.getGoogleCalendarConfig();
    
    if (config) {
      // Revoca tokens
      try {
        await googleAuthService.revokeTokens(config.accessToken);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
        console.warn('Errore revoca tokens (potrebbero essere già scaduti):', errorMessage);
      }

      // Elimina configurazione dal database
      await googleCalendarDatabase.deleteGoogleCalendarConfig(config.userId);
    }

    res.json({
      success: true,
      message: 'Autorizzazione Google Calendar revocata con successo'
    });

  } catch (error) {
    console.error('Errore revoca autorizzazione:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore durante revoca autorizzazione',
      error: errorMessage
    });
  }
});

// ============================================================================
// CONFIGURATION ROUTES
// ============================================================================

/**
 * GET /api/google-calendar/config
 * Recupera configurazione corrente
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = googleCalendarDatabase.getGoogleCalendarConfig();
    
    if (!config) {
      return res.json({
        success: true,
        data: {
          isConfigured: false,
          syncEnabled: false
        }
      });
    }

    // Non esporre tokens sensibili
    const publicConfig = {
      isConfigured: true,
      syncEnabled: config.syncEnabled,
      syncDirection: config.syncDirection,
      calendarId: config.calendarId,
      lastSyncAt: config.lastSyncAt,
      createdAt: config.createdAt
    };

    res.json({
      success: true,
      data: publicConfig
    });

  } catch (error) {
    console.error('Errore recupero configurazione:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore recupero configurazione',
      error: errorMessage
    });
  }
});

/**
 * PUT /api/google-calendar/config
 * Aggiorna configurazione
 */
router.put('/config', async (req: Request, res: Response) => {
  try {
    const result = calendarConfigSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Dati configurazione non validi',
        errors: result.error.issues
      });
    }

    const config = googleCalendarDatabase.getGoogleCalendarConfig();
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Google Calendar non configurato. Effettua prima l\'autenticazione.'
      });
    }

    // Aggiorna configurazione
    await googleCalendarDatabase.saveGoogleCalendarConfig({
      userId: config.userId,
      accessToken: config.accessToken,
      refreshToken: config.refreshToken,
      tokenExpiresAt: config.tokenExpiresAt,
      calendarId: result.data.calendarId || config.calendarId,
      syncEnabled: result.data.syncEnabled,
      syncDirection: result.data.syncDirection
    });

    res.json({
      success: true,
      message: 'Configurazione aggiornata con successo'
    });

  } catch (error) {
    console.error('Errore aggiornamento configurazione:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore aggiornamento configurazione',
      error: errorMessage
    });
  }
});

/**
 * GET /api/google-calendar/calendars
 * Lista calendari disponibili
 */
router.get('/calendars', async (req: Request, res: Response) => {
  try {
    const config = googleCalendarDatabase.getGoogleCalendarConfig();
    if (!config) {
      return res.status(401).json({
        success: false,
        message: 'Google Calendar non configurato'
      });
    }

    const calendars = await googleCalendarService.getCalendarList();
    
    res.json({
      success: true,
      data: calendars.map((cal: any) => ({
        id: cal.id,
        name: cal.summary,
        description: cal.description,
        primary: cal.primary,
        accessRole: cal.accessRole,
        timeZone: cal.timeZone
      }))
    });

  } catch (error) {
    console.error('Errore recupero calendari:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore recupero calendari',
      error: errorMessage
    });
  }
});

// ============================================================================
// SYNC ROUTES
// ============================================================================

/**
 * POST /api/google-calendar/sync
 * Esegue sincronizzazione completa
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const result = syncOptionsSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Opzioni sync non valide',
        errors: result.error.issues
      });
    }

    const config = googleCalendarDatabase.getGoogleCalendarConfig();
    if (!config || !config.syncEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Sincronizzazione non abilitata'
      });
    }

    const syncResult = await calendarSyncService.performSync(result.data);
    
    res.json({
      success: syncResult.success,
      message: syncResult.success ? 'Sincronizzazione completata' : 'Sincronizzazione completata con errori',
      data: syncResult
    });

  } catch (error) {
    console.error('Errore sincronizzazione:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore durante sincronizzazione',
      error: errorMessage
    });
  }
});

/**
 * GET /api/google-calendar/sync/status
 * Recupera stato sincronizzazione
 */
router.get('/sync/status', async (req: Request, res: Response) => {
  try {
    const status = calendarSyncService.getSyncStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Errore stato sincronizzazione:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore recupero stato sincronizzazione',
      error: errorMessage
    });
  }
});

/**
 * POST /api/google-calendar/sync/task/:id
 * Sincronizza singolo task
 */
router.post('/sync/task/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'ID task non valido'
      });
    }

    const result = await calendarSyncService.syncSingleTask(taskId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Task sincronizzato con successo'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Errore sincronizzazione task'
      });
    }

  } catch (error) {
    console.error('Errore sincronizzazione task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore sincronizzazione task',
      error: errorMessage
    });
  }
});

/**
 * DELETE /api/google-calendar/sync/task/:id
 * Rimuove sincronizzazione di un task
 */
router.delete('/sync/task/:id', async (req: Request, res: Response) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'ID task non valido'
      });
    }

    const result = await calendarSyncService.unsyncTask(taskId);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Sincronizzazione task rimossa con successo'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Errore rimozione sincronizzazione'
      });
    }

  } catch (error) {
    console.error('Errore rimozione sincronizzazione:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore rimozione sincronizzazione',
      error: errorMessage
    });
  }
});

/**
 * GET /api/google-calendar/sync/conflicts
 * Recupera conflitti di sincronizzazione
 */
router.get('/sync/conflicts', async (req: Request, res: Response) => {
  try {
    const conflictedMappings = googleCalendarDatabase.getConflictedMappings();
    const pendingMappings = googleCalendarDatabase.getPendingMappings();
    
    res.json({
      success: true,
      data: {
        conflicts: conflictedMappings,
        pending: pendingMappings,
        total: conflictedMappings.length + pendingMappings.length
      }
    });

  } catch (error) {
    console.error('Errore recupero conflitti:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore recupero conflitti',
      error: errorMessage
    });
  }
});

/**
 * GET /api/google-calendar/audit
 * Recupera log delle operazioni di sync
 */
router.get('/audit', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const auditLogs = googleCalendarDatabase.getRecentAuditLogs(Math.min(limit, 200));
    
    res.json({
      success: true,
      data: auditLogs
    });

  } catch (error) {
    console.error('Errore recupero audit log:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore recupero log operazioni',
      error: errorMessage
    });
  }
});

// ============================================================================
// EVENTS RETRIEVAL ROUTES
// ============================================================================

/**
 * GET /api/google-calendar/events
 * Recupera eventi Google Calendar per data/range
 * Query params:
 * - date: YYYY-MM-DD (eventi per giorno specifico)
 * - startDate & endDate: YYYY-MM-DD (eventi per range)
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const config = googleCalendarDatabase.getGoogleCalendarConfig();
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar non configurato'
      });
    }

    const { date, startDate, endDate } = req.query;

    // Validate parameters
    if (!date && (!startDate || !endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Parametri richiesti: date (YYYY-MM-DD) o startDate/endDate (YYYY-MM-DD)'
      });
    }

    let events;
    if (date && typeof date === 'string') {
      // Single date query
      const startDateTime = date + 'T00:00:00.000Z';
      const endDateTime = date + 'T23:59:59.999Z';
      events = await googleCalendarService.getEvents(
        startDateTime,
        endDateTime,
        config.calendarId || 'primary'
      );
    } else if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
      // Date range query
      const startDateTime = startDate + 'T00:00:00.000Z';
      const endDateTime = endDate + 'T23:59:59.999Z';
      events = await googleCalendarService.getEvents(
        startDateTime,
        endDateTime,
        config.calendarId || 'primary'
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Parametri richiesti: date (YYYY-MM-DD) o startDate/endDate (YYYY-MM-DD)'
      });
    }

    // Transform events to frontend format
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.summary || 'Evento senza titolo',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      description: event.description || '',
      location: event.location || '',
      isAllDay: !event.start?.dateTime, // All-day if no time specified
      source: 'google'
    }));

    res.json({
      success: true,
      data: { events: formattedEvents }
    });

  } catch (error) {
    console.error('Errore recupero eventi Google Calendar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore recupero eventi Google Calendar',
      error: errorMessage
    });
  }
});

// ============================================================================
// UTILITY ROUTES
// ============================================================================

/**
 * POST /api/google-calendar/test-connection
 * Testa la connessione a Google Calendar
 */
router.post('/test-connection', async (req: Request, res: Response) => {
  try {
    const config = googleCalendarDatabase.getGoogleCalendarConfig();
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar non configurato'
      });
    }

    // Testa connessione recuperando info calendario primario
    const calendars = await googleCalendarService.getCalendarList();
    const userInfo = await googleAuthService.getUserInfo();
    
    res.json({
      success: true,
      message: 'Connessione Google Calendar attiva',
      data: {
        userEmail: userInfo.email,
        calendarsCount: calendars.length,
        lastSyncAt: config.lastSyncAt
      }
    });

  } catch (error) {
    console.error('Errore test connessione:', error);
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    res.status(500).json({
      success: false,
      message: 'Errore connessione Google Calendar',
      error: errorMessage
    });
  }
});

export { router as googleCalendarRoutes };
