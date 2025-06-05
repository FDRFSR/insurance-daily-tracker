import Database from 'better-sqlite3';
import { type Task, type InsertTask, type UpdateTask } from "@shared/schema";
import { type IStorage } from './storage';
import path from 'path';
import fs from 'fs';

export class SQLiteStorage implements IStorage {
  private db: Database.Database;

  constructor(dbPath = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.config', 'insuratask', 'tasks.db')) {
    // Crea il database nella cartella utente (~/.config/insuratask/tasks.db)
    const fullPath = path.resolve(dbPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(fullPath);
    // Abilita WAL mode per migliori performance
    this.db.pragma('journal_mode = WAL');
    
    this.initDatabase();
    this.seedData();
  }

  private initDatabase() {
    // Crea la tabella tasks se non esiste
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
        completed BOOLEAN NOT NULL DEFAULT 0,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
  }

  private seedData() {
    // Controlla se ci sono già dati
    const count = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
    if (count.count > 0) return; // Già popolato

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        title: "Controllare stato sinistro auto - Pratica #2024/456",
        description: "Verificare aggiornamenti peritale e comunicare stato al cliente Rossi.",
        category: "claims",
        client: "Marco Rossi",
        priority: "low",
        status: "completed",
        due_date: today,
        due_time: "11:30",
        completed: 1,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        title: "Archiviare documenti polizza vita cliente Conti",
        description: "Scansionare e archiviare digitalmente tutti i documenti relativi alla nuova polizza vita sottoscritta.",
        category: "documents", 
        client: "Giuseppe Conti",
        priority: "low",
        status: "pending",
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        due_time: "17:00",
        completed: 0,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Inserisci i dati di esempio
    const insertStmt = this.db.prepare(`
      INSERT INTO tasks (title, description, category, client, priority, status, due_date, due_time, completed, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const task of seedTasks) {
      insertStmt.run(
        task.title, task.description, task.category, task.client, 
        task.priority, task.status, task.due_date, task.due_time,
        task.completed, task.completed_at, task.created_at, task.updated_at
      );
    }
  }

  private rowToTask(row: any): Task {
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

  async getTasks(): Promise<Task[]> {
    const rows = this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    return rows.map(row => this.rowToTask(row));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return row ? this.rowToTask(row) : undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO tasks (title, description, category, client, priority, status, due_date, due_time, completed, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      insertTask.title,
      insertTask.description || null,
      insertTask.category,
      insertTask.client || null,
      insertTask.priority || 'medium',
      insertTask.status || 'pending',
      insertTask.dueDate || null,
      insertTask.dueTime || null,
      0, // completed = false
      null, // completed_at
      now,
      now
    );

    const newTask = await this.getTask(result.lastInsertRowid as number);
    if (!newTask) throw new Error('Failed to create task');
    return newTask;
  }

  async updateTask(id: number, updates: UpdateTask): Promise<Task | undefined> {
    const existingTask = await this.getTask(id);
    if (!existingTask) return undefined;

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
  }

  async deleteTask(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async getTasksByCategory(category: string): Promise<Task[]> {
    const rows = this.db.prepare('SELECT * FROM tasks WHERE category = ? ORDER BY created_at DESC').all(category);
    return rows.map(row => this.rowToTask(row));
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    const rows = this.db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC').all(status);
    return rows.map(row => this.rowToTask(row));
  }

  async searchTasks(query: string): Promise<Task[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    const rows = this.db.prepare(`
      SELECT * FROM tasks 
      WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(client) LIKE ?
      ORDER BY created_at DESC
    `).all(searchTerm, searchTerm, searchTerm);
    
    return rows.map(row => this.rowToTask(row));
  }

  async getTaskStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    dueToday: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const total = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
    const pending = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('pending') as { count: number };
    const completed = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('completed') as { count: number };
    const overdue = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE status = ?').get('overdue') as { count: number };
    const dueToday = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE due_date = ? AND completed = 0').get(today) as { count: number };

    return {
      total: total.count,
      pending: pending.count,
      completed: completed.count,
      overdue: overdue.count,
      dueToday: dueToday.count,
    };
  }

  // Metodo per chiudere la connessione al database
  close() {
    this.db.close();
  }
}

// Esporta l'istanza da usare nell'app
export const storage = new SQLiteStorage();
