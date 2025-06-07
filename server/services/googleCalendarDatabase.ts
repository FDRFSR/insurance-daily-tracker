/**
 * Google Calendar Database Service
 * Gestisce le tabelle e operazioni database per l'integrazione Google Calendar
 * 
 * @author InsuraTask v1.1 Sprint 4
 * @created 2025-01-25
 */

import { storage } from '../sqlite-storage';
import Database from 'better-sqlite3';

export interface GoogleCalendarConfig {
  id?: number;
  userId: string;
  accessToken: string;
  refreshToken: string | null; // Può essere null se non fornito da Google
  tokenExpiresAt: string; // ISO string
  calendarId?: string;
  syncEnabled: boolean;
  lastSyncAt?: string; // ISO string
  syncDirection: 'import' | 'export' | 'bidirectional';
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskCalendarMapping {
  id?: number;
  taskId: number;
  googleEventId: string;
  calendarId: string;
  lastSyncedAt: string; // ISO string
  syncStatus: 'synced' | 'conflict' | 'pending';
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarSyncAudit {
  id?: number;
  operation: 'create' | 'update' | 'delete' | 'sync';
  entityType: 'task' | 'event';
  entityId: string;
  details: string; // JSON details
  success: boolean;
  errorMessage?: string;
  timestamp: string; // ISO string
}

export class GoogleCalendarDatabase {
  private db: Database.Database;

  constructor() {
    this.db = storage.getDatabase();
    this.initGoogleCalendarTables();
  }

  /**
   * Inizializza le tabelle per Google Calendar integration
   */
  private initGoogleCalendarTables(): void {
    // Tabella configurazione Google Calendar
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS google_calendar_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'default',
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expires_at TEXT NOT NULL,
        calendar_id TEXT,
        sync_enabled BOOLEAN NOT NULL DEFAULT 1,
        last_sync_at TEXT,
        sync_direction TEXT NOT NULL DEFAULT 'bidirectional',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(user_id)
      )
    `);

    // Tabella mapping task ↔ eventi Google Calendar
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_calendar_mapping (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        google_event_id TEXT NOT NULL,
        calendar_id TEXT NOT NULL,
        last_synced_at TEXT NOT NULL DEFAULT (datetime('now')),
        sync_status TEXT NOT NULL DEFAULT 'synced',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
        UNIQUE(task_id, google_event_id)
      )
    `);

    // Tabella audit log per sync operations
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS calendar_sync_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // Indici per performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_task_calendar_mapping_task_id ON task_calendar_mapping(task_id);
      CREATE INDEX IF NOT EXISTS idx_task_calendar_mapping_google_event_id ON task_calendar_mapping(google_event_id);
      CREATE INDEX IF NOT EXISTS idx_calendar_sync_audit_timestamp ON calendar_sync_audit(timestamp);
      CREATE INDEX IF NOT EXISTS idx_calendar_sync_audit_entity ON calendar_sync_audit(entity_type, entity_id);
    `);

    // Migrazione per rendere refresh_token nullable (compatibilità retroattiva)
    try {
      // Verifica se la colonna refresh_token ha constraint NOT NULL
      const tableInfo = this.db.prepare("PRAGMA table_info(google_calendar_config)").all() as any[];
      const refreshTokenColumn = tableInfo.find(col => col.name === 'refresh_token');
      
      if (refreshTokenColumn && refreshTokenColumn.notnull === 1) {
        console.log('🔄 Migrating google_calendar_config table to make refresh_token nullable...');
        
        // Backup dei dati esistenti
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS google_calendar_config_backup AS 
          SELECT * FROM google_calendar_config;
        `);
        
        // Ricrea la tabella con refresh_token nullable
        this.db.exec(`DROP TABLE google_calendar_config;`);
        
        this.db.exec(`
          CREATE TABLE google_calendar_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL DEFAULT 'default',
            access_token TEXT NOT NULL,
            refresh_token TEXT,
            token_expires_at TEXT NOT NULL,
            calendar_id TEXT,
            sync_enabled BOOLEAN NOT NULL DEFAULT 1,
            last_sync_at TEXT,
            sync_direction TEXT NOT NULL DEFAULT 'bidirectional',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(user_id)
          );
        `);
        
        // Ripristina i dati
        this.db.exec(`
          INSERT INTO google_calendar_config 
          SELECT * FROM google_calendar_config_backup;
        `);
        
        // Rimuovi backup
        this.db.exec(`DROP TABLE google_calendar_config_backup;`);
        
        console.log('✅ Migration completed successfully');
      }
    } catch (error) {
      console.log('⚠️ Migration skipped or not needed:', error);
    }
  }

  // ============================================================================
  // GOOGLE CALENDAR CONFIG OPERATIONS
  // ============================================================================

  /**
   * Salva o aggiorna la configurazione Google Calendar
   */
  async saveGoogleCalendarConfig(config: Omit<GoogleCalendarConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<GoogleCalendarConfig> {
    const now = new Date().toISOString();

    // Controlla se esiste già configurazione per l'utente
    const existing = this.db.prepare(`
      SELECT * FROM google_calendar_config WHERE user_id = ?
    `).get(config.userId) as GoogleCalendarConfig | undefined;

    if (existing) {
      // Update esistente
      const stmt = this.db.prepare(`
        UPDATE google_calendar_config 
        SET access_token = ?, refresh_token = ?, token_expires_at = ?, 
            calendar_id = ?, sync_enabled = ?, sync_direction = ?, updated_at = ?
        WHERE user_id = ?
      `);

      stmt.run(
        config.accessToken,
        config.refreshToken,
        config.tokenExpiresAt,
        config.calendarId || null,
        config.syncEnabled ? 1 : 0,
        config.syncDirection,
        now,
        config.userId
      );

      return this.getGoogleCalendarConfig(config.userId)!;
    } else {
      // Insert nuovo
      const stmt = this.db.prepare(`
        INSERT INTO google_calendar_config 
        (user_id, access_token, refresh_token, token_expires_at, calendar_id, sync_enabled, sync_direction, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        config.userId,
        config.accessToken,
        config.refreshToken,
        config.tokenExpiresAt,
        config.calendarId || null,
        config.syncEnabled ? 1 : 0,
        config.syncDirection,
        now,
        now
      );

      return this.getGoogleCalendarConfig(config.userId)!;
    }
  }

  /**
   * Recupera la configurazione Google Calendar per un utente
   */
  getGoogleCalendarConfig(userId: string = 'default'): GoogleCalendarConfig | null {
    const row = this.db.prepare(`
      SELECT * FROM google_calendar_config WHERE user_id = ?
    `).get(userId) as any;

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      tokenExpiresAt: row.token_expires_at,
      calendarId: row.calendar_id,
      syncEnabled: Boolean(row.sync_enabled),
      lastSyncAt: row.last_sync_at,
      syncDirection: row.sync_direction,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Aggiorna i token Google
   */
  async updateGoogleTokens(userId: string, accessToken: string, refreshToken: string, expiresAt: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE google_calendar_config 
      SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = ?
      WHERE user_id = ?
    `);

    stmt.run(accessToken, refreshToken, expiresAt, new Date().toISOString(), userId);
  }

  /**
   * Aggiorna il timestamp dell'ultima sincronizzazione
   */
  async updateLastSyncTime(userId: string = 'default'): Promise<void> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE google_calendar_config 
      SET last_sync_at = ?, updated_at = ?
      WHERE user_id = ?
    `);

    stmt.run(now, now, userId);
  }

  /**
   * Elimina la configurazione Google Calendar
   */
  async deleteGoogleCalendarConfig(userId: string = 'default'): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM google_calendar_config WHERE user_id = ?`);
    const result = stmt.run(userId);
    return result.changes > 0;
  }

  // ============================================================================
  // TASK ↔ CALENDAR MAPPING OPERATIONS
  // ============================================================================

  /**
   * Crea un mapping tra task InsuraTask e evento Google Calendar
   */
  async createTaskCalendarMapping(mapping: Omit<TaskCalendarMapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskCalendarMapping> {
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO task_calendar_mapping 
      (task_id, google_event_id, calendar_id, last_synced_at, sync_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      mapping.taskId,
      mapping.googleEventId,
      mapping.calendarId,
      mapping.lastSyncedAt,
      mapping.syncStatus,
      now,
      now
    );

    return this.getTaskCalendarMapping(result.lastInsertRowid as number)!;
  }

  /**
   * Recupera mapping per task ID
   */
  getTaskCalendarMappingByTaskId(taskId: number): TaskCalendarMapping | null {
    const row = this.db.prepare(`
      SELECT * FROM task_calendar_mapping WHERE task_id = ?
    `).get(taskId) as any;

    return row ? this.rowToTaskCalendarMapping(row) : null;
  }

  /**
   * Recupera mapping per Google Event ID
   */
  getTaskCalendarMappingByEventId(googleEventId: string): TaskCalendarMapping | null {
    const row = this.db.prepare(`
      SELECT * FROM task_calendar_mapping WHERE google_event_id = ?
    `).get(googleEventId) as any;

    return row ? this.rowToTaskCalendarMapping(row) : null;
  }

  /**
   * Recupera mapping per ID
   */
  getTaskCalendarMapping(id: number): TaskCalendarMapping | null {
    const row = this.db.prepare(`
      SELECT * FROM task_calendar_mapping WHERE id = ?
    `).get(id) as any;

    return row ? this.rowToTaskCalendarMapping(row) : null;
  }

  /**
   * Aggiorna stato sync del mapping
   */
  async updateTaskCalendarMappingStatus(taskId: number, syncStatus: TaskCalendarMapping['syncStatus']): Promise<void> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE task_calendar_mapping 
      SET sync_status = ?, last_synced_at = ?, updated_at = ?
      WHERE task_id = ?
    `);

    stmt.run(syncStatus, now, now, taskId);
  }

  /**
   * Elimina mapping
   */
  async deleteTaskCalendarMapping(taskId: number): Promise<boolean> {
    const stmt = this.db.prepare(`DELETE FROM task_calendar_mapping WHERE task_id = ?`);
    const result = stmt.run(taskId);
    return result.changes > 0;
  }

  /**
   * Recupera tutti i mapping con conflitti
   */
  getConflictedMappings(): TaskCalendarMapping[] {
    const rows = this.db.prepare(`
      SELECT * FROM task_calendar_mapping WHERE sync_status = 'conflict'
      ORDER BY last_synced_at DESC
    `).all() as any[];

    return rows.map(row => this.rowToTaskCalendarMapping(row));
  }

  /**
   * Recupera tutti i mapping pending
   */
  getPendingMappings(): TaskCalendarMapping[] {
    const rows = this.db.prepare(`
      SELECT * FROM task_calendar_mapping WHERE sync_status = 'pending'
      ORDER BY last_synced_at DESC
    `).all() as any[];

    return rows.map(row => this.rowToTaskCalendarMapping(row));
  }

  // ============================================================================
  // AUDIT LOG OPERATIONS
  // ============================================================================

  /**
   * Registra operazione di sync nell'audit log
   */
  async logSyncOperation(audit: Omit<CalendarSyncAudit, 'id' | 'timestamp'>): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO calendar_sync_audit 
      (operation, entity_type, entity_id, details, success, error_message, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      audit.operation,
      audit.entityType,
      audit.entityId,
      audit.details,
      audit.success ? 1 : 0,
      audit.errorMessage || null,
      new Date().toISOString()
    );
  }

  /**
   * Recupera audit log recenti
   */
  getRecentAuditLogs(limit: number = 50): CalendarSyncAudit[] {
    const rows = this.db.prepare(`
      SELECT * FROM calendar_sync_audit 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(limit) as any[];

    return rows.map(row => this.rowToCalendarSyncAudit(row));
  }

  /**
   * Recupera audit log per entity specifica
   */
  getAuditLogsForEntity(entityType: string, entityId: string): CalendarSyncAudit[] {
    const rows = this.db.prepare(`
      SELECT * FROM calendar_sync_audit 
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY timestamp DESC
    `).all(entityType, entityId) as any[];

    return rows.map(row => this.rowToCalendarSyncAudit(row));
  }

  /**
   * Pulisce audit log più vecchi di N giorni
   */
  async cleanupAuditLogs(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
    const stmt = this.db.prepare(`
      DELETE FROM calendar_sync_audit WHERE timestamp < ?
    `);
    const result = stmt.run(cutoffDate);
    return result.changes;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Converte row database in TaskCalendarMapping
   */
  private rowToTaskCalendarMapping(row: any): TaskCalendarMapping {
    return {
      id: row.id,
      taskId: row.task_id,
      googleEventId: row.google_event_id,
      calendarId: row.calendar_id,
      lastSyncedAt: row.last_synced_at,
      syncStatus: row.sync_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Converte row database in CalendarSyncAudit
   */
  private rowToCalendarSyncAudit(row: any): CalendarSyncAudit {
    return {
      id: row.id,
      operation: row.operation,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: row.details,
      success: Boolean(row.success),
      errorMessage: row.error_message,
      timestamp: row.timestamp
    };
  }

  /**
   * Verifica se Google Calendar è configurato
   */
  isGoogleCalendarConfigured(userId: string = 'default'): boolean {
    const config = this.getGoogleCalendarConfig(userId);
    return config !== null && config.syncEnabled;
  }

  /**
   * Recupera statistiche sync
   */
  getSyncStats(): {
    totalMappings: number;
    syncedMappings: number;
    conflictedMappings: number;
    pendingMappings: number;
    lastSyncTime: string | null;
  } {
    const totalMappings = this.db.prepare(`SELECT COUNT(*) as count FROM task_calendar_mapping`).get() as { count: number };
    const syncedMappings = this.db.prepare(`SELECT COUNT(*) as count FROM task_calendar_mapping WHERE sync_status = 'synced'`).get() as { count: number };
    const conflictedMappings = this.db.prepare(`SELECT COUNT(*) as count FROM task_calendar_mapping WHERE sync_status = 'conflict'`).get() as { count: number };
    const pendingMappings = this.db.prepare(`SELECT COUNT(*) as count FROM task_calendar_mapping WHERE sync_status = 'pending'`).get() as { count: number };
    
    const lastSyncRow = this.db.prepare(`SELECT last_sync_at FROM google_calendar_config WHERE user_id = 'default'`).get() as { last_sync_at: string } | undefined;

    return {
      totalMappings: totalMappings.count,
      syncedMappings: syncedMappings.count,
      conflictedMappings: conflictedMappings.count,
      pendingMappings: pendingMappings.count,
      lastSyncTime: lastSyncRow?.last_sync_at || null
    };
  }
}

// Esporta istanza singleton
export const googleCalendarDb = new GoogleCalendarDatabase();
