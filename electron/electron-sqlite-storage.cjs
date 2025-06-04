// electron-sqlite-storage.cjs
// Implementazione persistente di storage per Electron usando SQLite
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

class ElectronSQLiteStorage {
  constructor(logger = console.log) {
    this.logger = logger;
    this.db = null;
    this.initializeDatabase();
  }

  initializeDatabase() {
    try {
      // Crea la directory di dati nella cartella utente
      const userDataPath = this.getUserDataPath();
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }

      // Percorso del file del database
      const dbPath = path.join(userDataPath, 'insuratask.db');
      this.logger(`[ElectronSQLiteStorage] Database path: ${dbPath}`);

      // Inizializza il database
      this.db = new Database(dbPath, { 
        verbose: process.env.NODE_ENV === 'development' ? 
          this.logger : undefined 
      });
      
      // Ottimizzazioni database
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('temp_store = MEMORY');
      this.db.pragma('cache_size = 10000');
      
      // Crea la tabella se non esiste
      this.createTasksTable();
      
      // Popola con dati di esempio se è vuoto
      this.seedDataIfEmpty();
      
      this.logger(`[ElectronSQLiteStorage] ✅ Database initialized successfully`);
    } catch (error) {
      this.logger(`[ElectronSQLiteStorage] ❌ Database initialization failed: ${error.message}`);
      throw new Error(`Failed to initialize database: ${error.message}`);
    }
  }

  getUserDataPath() {
    // Gestisce i percorsi in modo diverso per dev/prod e per sistema operativo
    const { app } = require('electron');
    const isPackaged = app.isPackaged;

    if (isPackaged) {
      // In produzione, usa la directory userData di Electron
      return app.getPath('userData');
    } else {
      // In sviluppo, usa una directory locale
      return path.join(process.cwd(), 'data');
    }
  }

  createTasksTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        client TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'pending',
        due_date TEXT,
        due_time TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }

  seedDataIfEmpty() {
    const count = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get();
    if (count.count === 0) {
      this.logger(`[ElectronSQLiteStorage] Seeding initial data...`);
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const now = new Date().toISOString();
      
      const seedTasks = [
        {
          title: "Chiamare Maria Bianchi per rinnovo polizza auto",
          description: "Discutere opzioni di rinnovo e nuove coperture disponibili. Cliente interessata a polizza kasko.",
          category: "calls",
          client: "Maria Bianchi", 
          priority: "high",
          status: "pending",
          due_date: today,
          due_time: "14:30",
          completed: 0,
          completed_at: null,
          created_at: now,
          updated_at: now
        },
        {
          title: "Preparare quotazione RC professionale per Studio Legale Verdi",
          description: "Calcolare preventivo per polizza RC professionale avvocati. Massimale richiesto €5.000.000.",
          category: "quotes",
          client: "Studio Legale Verdi",
          priority: "medium", 
          status: "pending",
          due_date: tomorrow,
          due_time: "16:00",
          completed: 0,
          completed_at: null,
          created_at: now,
          updated_at: now
        },
        {
          title: "Appuntamento con famiglia Neri per polizza casa",
          description: "Incontro per discutere copertura assicurativa nuova abitazione acquistata. Era previsto per ieri.",
          category: "appointments",
          client: "Famiglia Neri",
          priority: "high",
          status: "overdue",
          due_date: yesterday,
          due_time: "15:00",
          completed: 0,
          completed_at: null,
          created_at: now,
          updated_at: now
        }
      ];
      
      // Prepara statement di inserimento
      const insertStmt = this.db.prepare(`
        INSERT INTO tasks (
          title, description, category, client, priority, status, 
          due_date, due_time, completed, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Inserisci i dati di esempio all'interno di una transazione
      const insertMany = this.db.transaction((tasks) => {
        for (const task of tasks) {
          insertStmt.run(
            task.title, task.description, task.category, task.client,
            task.priority, task.status, task.due_date, task.due_time,
            task.completed, task.completed_at, task.created_at, task.updated_at
          );
        }
      });
      
      insertMany(seedTasks);
      this.logger(`[ElectronSQLiteStorage] ✅ Seeded ${seedTasks.length} initial tasks`);
    }
  }

  // Converti row SQLite in oggetto task
  rowToTask(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description || null,
      category: row.category,
      client: row.client || null,
      priority: row.priority,
      status: row.status,
      dueDate: row.due_date || null,
      dueTime: row.due_time || null,
      completed: Boolean(row.completed),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // API methods
  async getTasks() {
    try {
      const rows = this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
      return rows.map(row => this.rowToTask(row));
    } catch (error) {
      this.logger(`[ElectronSQLiteStorage] Error in getTasks: ${error.message}`);
      throw error;
    }
  }

  async getTask(id) {
    try {
      const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
      return row ? this.rowToTask(row) : null;
    } catch (error) {
      this.logger(`[ElectronSQLiteStorage] Error in getTask: ${error.message}`);
      throw error;
    }
  }

  async createTask(data) {
    try {
      const now = new Date().toISOString();
      
      const stmt = this.db.prepare(`
        INSERT INTO tasks (
          title, description, category, client, priority, status, 
          due_date, due_time, completed, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        data.title,
        data.description || null,
        data.category,
        data.client || null,
        data.priority || 'medium',
        data.status || 'pending',
        data.dueDate || null,
        data.dueTime || null,
        0, // completed = false
        null, // completed_at
        now,
        now
      );
      
      const newTask = await this.getTask(result.lastInsertRowid);
      return newTask;
    } catch (error) {
      this.logger(`[ElectronSQLiteStorage] Error in createTask: ${error.message}`);
      throw error;
    }
  }

  async updateTask(id, updates) {
    try {
      const existingTask = await this.getTask(id);
      if (!existingTask) return null;
      
      const now = new Date().toISOString();
      const completedAt = updates.completed === true ? now : 
                         updates.completed === false ? null : 
                         existingTask.completedAt?.toISOString() || null;
      
      const stmt = this.db.prepare(`
        UPDATE tasks 
        SET title = ?, description = ?, category = ?, client = ?, priority = ?, 
            status = ?, due_date = ?, due_time = ?, completed = ?, completed_at = ?, updated_at = ?
        WHERE id = ?
      `);
      
      stmt.run(
        updates.title ?? existingTask.title,
        updates.description ?? existingTask.description,
        updates.category ?? existingTask.category,
        updates.client ?? existingTask.client,
        updates.priority ?? existingTask.priority,
        updates.status ?? existingTask.status,
        updates.dueDate ?? existingTask.dueDate,
        updates.dueTime ?? existingTask.dueTime,
        updates.completed !== undefined ? (updates.completed ? 1 : 0) : (existingTask.completed ? 1 : 0),
        completedAt,
        now,
        id
      );
      
      return await this.getTask(id);
    } catch (error) {
      this.logger(`[ElectronSQLiteStorage] Error in updateTask: ${error.message}`);
      throw error;
    }
  }

  async deleteTask(id) {
    try {
      const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (error) {
      this.logger(`[ElectronSQLiteStorage] Error in deleteTask: ${error.message}`);
      throw error;
    }
  }

  async getTasksByCategory(category) {
    try {
      const rows = this.db.prepare(
        'SELECT * FROM tasks WHERE category = ? ORDER BY created_at DESC'
      ).all(category);
      
      return rows.map(row => this.rowToTask(row));
    } catch (error) {
      this.logger(`[ElectronSQLiteStorage] Error in getTasksByCategory: ${error.message}`);
      throw error;
    }
  }

  async getTasksByStatus(status) {
    try {
      const rows = this.db.prepare(
        'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC'
      ).all(status);
      
      return rows.map(row => this.rowToTask(row));
    } catch (error) {
      this.logger(`[ElectronSQLiteStorage] Error in getTasksByStatus: ${error.message}`);
      throw error;
    }
  }

  async searchTasks(query) {
    try {
      const searchTerm = `%${query.toLowerCase()}%`;
      
      const rows = this.db.prepare(`
        SELECT * FROM tasks 
        WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(client) LIKE ?
        ORDER BY created_at DESC
      `).all(searchTerm, searchTerm, searchTerm);
      
      return rows.map(row => this.rowToTask(row));
    } catch (error) {
      this.logger(`[ElectronSQLiteStorage] Error in searchTasks: ${error.message}`);
      throw error;
    }
  }

  async getTaskStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const total = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get();
      const pending = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('pending');
      const completed = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('completed');
      const overdue = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('overdue');
      const dueToday = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE due_date = ? AND completed = 0').get(today);
      
      return {
        total: total.count,
        pending: pending.count,
        completed: completed.count,
        overdue: overdue.count,
        dueToday: dueToday.count,
      };
    } catch (error) {
      this.logger(`[ElectronSQLiteStorage] Error in getTaskStats: ${error.message}`);
      throw error;
    }
  }

  // Close the database connection
  close() {
    try {
      if (this.db) {
        this.db.close();
        this.logger('[ElectronSQLiteStorage] Database connection closed');
      }
    } catch (error) {
      this.logger(`[ElectronSQLiteStorage] Error closing database: ${error.message}`);
    }
  }
}

module.exports = { ElectronSQLiteStorage };