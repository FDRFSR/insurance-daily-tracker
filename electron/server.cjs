// electron/server.cjs - Server completo per Electron con tutte le API
const express = require('express');
const path = require('path');
const fs = require('fs');

// Simulazione del storage in memoria (sostituisce SQLite per l'eseguibile)
class ElectronStorage {
  constructor() {
    this.tasks = new Map();
    this.currentId = 1;
    this.initializeWithSampleData();
  }

  initializeWithSampleData() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const sampleTasks = [
      {
        id: this.currentId++,
        title: "Chiamare Maria Bianchi per rinnovo polizza auto",
        description: "Discutere opzioni di rinnovo e nuove coperture disponibili.",
        category: "calls",
        client: "Maria Bianchi",
        priority: "high",
        status: "pending",
        dueDate: today,
        dueTime: "14:30",
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: this.currentId++,
        title: "Preparare quotazione RC professionale",
        description: "Calcolare preventivo per polizza RC professionale avvocati.",
        category: "quotes",
        client: "Studio Legale Verdi",
        priority: "medium",
        status: "pending",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dueTime: "16:00",
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: this.currentId++,
        title: "Appuntamento famiglia Neri - polizza casa",
        description: "Incontro per discutere copertura assicurativa nuova abitazione.",
        category: "appointments",
        client: "Famiglia Neri",
        priority: "high",
        status: "overdue",
        dueDate: yesterday,
        dueTime: "15:00",
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    sampleTasks.forEach(task => {
      this.tasks.set(task.id, task);
    });
  }

  // Converti task per l'output
  taskToOutput(task) {
    return {
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      completedAt: task.completedAt ? new Date(task.completedAt) : null
    };
  }

  async getTasks() {
    return Array.from(this.tasks.values())
      .map(task => this.taskToOutput(task))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTask(id) {
    const task = this.tasks.get(parseInt(id));
    return task ? this.taskToOutput(task) : null;
  }

  async createTask(data) {
    const now = new Date().toISOString();
    const newTask = {
      id: this.currentId++,
      title: data.title,
      description: data.description || null,
      category: data.category,
      client: data.client || null,
      priority: data.priority || "medium",
      status: data.status || "pending",
      dueDate: data.dueDate || null,
      dueTime: data.dueTime || null,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now
    };

    this.tasks.set(newTask.id, newTask);
    return this.taskToOutput(newTask);
  }

  async updateTask(id, updates) {
    const existingTask = this.tasks.get(parseInt(id));
    if (!existingTask) return null;

    const now = new Date().toISOString();
    const updatedTask = {
      ...existingTask,
      ...updates,
      updatedAt: now,
      completedAt: updates.completed === true ? now : 
                   updates.completed === false ? null : existingTask.completedAt
    };

    this.tasks.set(parseInt(id), updatedTask);
    return this.taskToOutput(updatedTask);
  }

  async deleteTask(id) {
    return this.tasks.delete(parseInt(id));
  }

  async getTasksByCategory(category) {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.category === category);
  }

  async getTasksByStatus(status) {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.status === status);
  }

  async searchTasks(query) {
    const allTasks = await this.getTasks();
    const lowercaseQuery = query.toLowerCase();
    
    return allTasks.filter(task => 
      task.title.toLowerCase().includes(lowercaseQuery) ||
      (task.description && task.description.toLowerCase().includes(lowercaseQuery)) ||
      (task.client && task.client.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getTaskStats() {
    const allTasks = await this.getTasks();
    const today = new Date().toISOString().split('T')[0];
    
    return {
      total: allTasks.length,
      pending: allTasks.filter(task => task.status === "pending").length,
      completed: allTasks.filter(task => task.status === "completed").length,
      overdue: allTasks.filter(task => task.status === "overdue").length,
      dueToday: allTasks.filter(task => task.dueDate === today && !task.completed).length,
    };
  }
}

// Valida i dati delle task
function validateTaskData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Il titolo è obbligatorio');
    }
  }

  if (!isUpdate || data.category !== undefined) {
    const validCategories = ['calls', 'quotes', 'claims', 'documents', 'appointments'];
    if (!data.category || !validCategories.includes(data.category)) {
      errors.push('Categoria non valida');
    }
  }

  if (data.priority) {
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(data.priority)) {
      errors.push('Priorità non valida');
    }
  }

  if (data.status) {
    const validStatuses = ['pending', 'completed', 'overdue'];
    if (!validStatuses.includes(data.status)) {
      errors.push('Status non valido');
    }
  }

  return errors;
}

function createElectronServer(staticPath, logger = console.log) {
  const app = express();
  const storage = new ElectronStorage();

  logger('[ElectronServer] Creating server with storage');

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Logging middleware
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      logger(`[ElectronServer] ${req.method} ${req.path}`);
    }
    next();
  });

  // ========== API ROUTES ==========

  // Get task statistics
  app.get('/api/tasks/stats', async (req, res) => {
    try {
      const stats = await storage.getTaskStats();
      res.json(stats);
    } catch (error) {
      logger(`[ElectronServer] Error in /api/tasks/stats: ${error.message}`);
      res.status(500).json({ message: "Errore nel recupero delle statistiche" });
    }
  });

  // Get all tasks with filtering
  app.get('/api/tasks', async (req, res) => {
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
      logger(`[ElectronServer] Error in /api/tasks: ${error.message}`);
      res.status(500).json({ message: "Errore nel recupero delle attività" });
    }
  });

  // Get task by ID
  app.get('/api/tasks/:id', async (req, res) => {
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
      logger(`[ElectronServer] Error in /api/tasks/:id: ${error.message}`);
      res.status(500).json({ message: "Errore nel recupero dell'attività" });
    }
  });

  // Create new task
  app.post('/api/tasks', async (req, res) => {
    try {
      logger(`[ElectronServer] Creating task: ${JSON.stringify(req.body)}`);
      
      const errors = validateTaskData(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ 
          message: "Dati attività non validi",
          errors: errors.join(', ')
        });
      }

      const task = await storage.createTask(req.body);
      logger(`[ElectronServer] Task created successfully: ${task.id}`);
      res.status(201).json(task);
    } catch (error) {
      logger(`[ElectronServer] Error creating task: ${error.message}`);
      res.status(500).json({ message: "Errore nella creazione dell'attività" });
    }
  });

  // Update task
  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID attività non valido" });
      }

      const errors = validateTaskData(req.body, true);
      if (errors.length > 0) {
        return res.status(400).json({ 
          message: "Dati aggiornamento non validi",
          errors: errors.join(', ')
        });
      }

      const updatedTask = await storage.updateTask(id, req.body);
      if (!updatedTask) {
        return res.status(404).json({ message: "Attività non trovata" });
      }

      logger(`[ElectronServer] Task updated: ${id}`);
      res.json(updatedTask);
    } catch (error) {
      logger(`[ElectronServer] Error updating task: ${error.message}`);
      res.status(500).json({ message: "Errore nell'aggiornamento dell'attività" });
    }
  });

  // Delete task
  app.delete('/api/tasks/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID attività non valido" });
      }

      const deleted = await storage.deleteTask(id);
      if (!deleted) {
        return res.status(404).json({ message: "Attività non trovata" });
      }

      logger(`[ElectronServer] Task deleted: ${id}`);
      res.json({ message: "Attività eliminata con successo" });
    } catch (error) {
      logger(`[ElectronServer] Error deleting task: ${error.message}`);
      res.status(500).json({ message: "Errore nell'eliminazione dell'attività" });
    }
  });

  // ========== STATIC FILES ==========

  // Serve static files con headers corretti
  app.use(express.static(staticPath, {
    setHeaders: (res, filePath) => {
      // Assicura che CSS sia servito correttamente
      if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      }
      // Assicura che JS sia servito correttamente
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
      // Permetti cache per assets statici
      if (filePath.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
      }
    }
  }));

  // Fallback per SPA routing
  app.get('*', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    logger(`[ElectronServer] Serving SPA for: ${req.path}`);
    res.sendFile(indexPath);
  });

  // Error handler
  app.use((err, req, res, next) => {
    logger(`[ElectronServer] Error: ${err.message}`);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });

  return app;
}

module.exports = { createElectronServer };