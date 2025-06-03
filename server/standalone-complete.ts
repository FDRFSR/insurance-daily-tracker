import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import Database from 'better-sqlite3';
import { z } from "zod";

// Logging utility
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Zod schemas inline (copied from shared/schema.ts)
const insertTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["calls", "quotes", "claims", "documents", "appointments"]),
  client: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["pending", "completed", "overdue"]).default("pending"),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
});

const updateTaskSchema = insertTaskSchema.partial().extend({
  completed: z.boolean().optional(),
});

type Task = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  client: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  dueTime: string | null;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type InsertTask = z.infer<typeof insertTaskSchema>;
type UpdateTask = z.infer<typeof updateTaskSchema>;

// SQLite Storage Implementation (copied and simplified)
class StandaloneStorage {
  private db: Database.Database;

  constructor(dbPath = 'tasks.db') {
    const fullPath = path.resolve(process.cwd(), dbPath);
    this.db = new Database(fullPath);
    
    this.db.pragma('journal_mode = WAL');
    this.initDatabase();
    this.seedData();
  }

  private initDatabase() {
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
    const count = this.db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
    if (count.count > 0) return;

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
      }
    ];

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
      0,
      null,
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
typeof updates.completed === 'boolean' ? (updates.completed ? 1 : 0) : (existingTask.completed ? 1 : 0),
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

  close() {
    this.db.close();
  }
}

// Create storage instance
const storage = new StandaloneStorage();

// Simple validation error formatter
function fromZodError(error: z.ZodError): { message: string } {
  const messages = error.issues.map(issue => 
    `${issue.path.join('.')}: ${issue.message}`
  );
  return { message: messages.join(', ') };
}

// Serve static files utility 
function serveStatic(app: express.Express) {
  const currentDir = __dirname;
  
  const possiblePaths = [
    path.resolve(currentDir, "public"),
    path.resolve(currentDir, "..", "public"), 
    path.resolve(process.cwd(), "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "dist-pkg", "public"),
  ];

  let distPath: string | null = null;
  
  log("Searching for static files...", "static");
  
  for (const testPath of possiblePaths) {
    log(`Testing path: ${testPath}`, "static");
    if (fs.existsSync(testPath)) {
      const indexPath = path.join(testPath, "index.html");
      if (fs.existsSync(indexPath)) {
        distPath = testPath;
        log(`Found static files at: ${testPath}`, "static");
        break;
      } else {
        log(`Directory exists but no index.html: ${testPath}`, "static");
      }
    }
  }

  if (!distPath) {
    const errorMsg = `Could not find static files. Tried: ${possiblePaths.join(", ")}`;
    log(errorMsg, "static");
    throw new Error(errorMsg);
  }

  log(`Serving static files from: ${distPath}`, "static");

  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    const indexFile = path.resolve(distPath!, "index.html");
    res.sendFile(indexFile);
  });
}

// Register API routes
async function registerRoutes(app: express.Express): Promise<Server> {
  // Get task statistics
  app.get("/api/tasks/stats", async (req, res) => {
    try {
      const stats = await storage.getTaskStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle statistiche" });
    }
  });

  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const { category, status, search } = req.query;
      
      let tasks;
      if (search && typeof search === 'string') {
        tasks = await storage.searchTasks(search);
      } else if (category && typeof category === 'string') {
        tasks = await storage.getTasksByCategory(category);
      } else if (status && typeof status === 'string') {
        tasks = await storage.getTasksByStatus(status);
      } else {
        tasks = await storage.getTasks();
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle attività" });
    }
  });

  // Get task by ID
  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID attività non valido" });
      }
      
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Attività non trovata" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero dell'attività" });
    }
  });

  // Create new task
  app.post("/api/tasks", async (req, res) => {
    try {
      const result = insertTaskSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Dati attività non validi",
          errors: validationError.message 
        });
      }

      const task = await storage.createTask(result.data);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Errore nella creazione dell'attività" });
    }
  });

  // Update task
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID attività non valido" });
      }

      const result = updateTaskSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: "Dati aggiornamento non validi",
          errors: validationError.message 
        });
      }

      const updatedTask = await storage.updateTask(id, result.data);
      if (!updatedTask) {
        return res.status(404).json({ message: "Attività non trovata" });
      }

      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Errore nell'aggiornamento dell'attività" });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID attività non valido" });
      }

      const deleted = await storage.deleteTask(id);
      if (!deleted) {
        return res.status(404).json({ message: "Attività non trovata" });
      }

      res.json({ message: "Attività eliminata con successo" });
    } catch (error) {
      res.status(500).json({ message: "Errore nell'eliminazione dell'attività" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Main application startup
async function startServer() {
  try {
    log("Starting InsuraTask server (standalone mode)");
    
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Request logging
    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse: Record<string, any> | undefined = undefined;

      const originalResJson = res.json;
      res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
      };

      res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (capturedJsonResponse) {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          }

          if (logLine.length > 80) {
            logLine = logLine.slice(0, 79) + "…";
          }

          log(logLine);
        }
      });

      next();
    });

    // Register API routes
    const server = await registerRoutes(app);

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      log(`Error ${status}: ${message}`, "error");
    });

    // Serve static files (production mode)
    serveStatic(app);

    // Start server
    const port = process.env.PORT || 5000;
    server.listen({
      port: Number(port),
      host: "0.0.0.0",
    }, () => {
      log(`InsuraTask serving on port ${port}`);
      log(`Open http://localhost:${port} in your browser`);
    });

  } catch (error) {
    log(`Failed to start server: ${error}`, "error");
    console.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down gracefully');
  storage.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down gracefully');
  storage.close();
  process.exit(0);
});

// Start the server
startServer();