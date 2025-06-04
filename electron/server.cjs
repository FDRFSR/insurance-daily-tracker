// electron-server.cjs - Server completo per Electron con tutte le API
const express = require('express');
const path = require('path');
const fs = require('fs');
const { ElectronSQLiteStorage } = require('./electron-sqlite-storage.cjs');

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
  
  // Usa SQLite Storage invece dello storage in-memory
  const storage = new ElectronSQLiteStorage(logger);

  logger('[ElectronServer] Creating server with SQLite storage');

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

  // Aggiungi tracking dello stato di chiusura
  let isClosing = false;

  // Crea una funzione per creare server con gestione della chiusura
  const createServerWithCleanup = (port = 0, host = 'localhost') => {
    const server = app.listen(port, host);
    
    // Aggiungi gestione della chiusura
    server.on('close', () => {
      if (!isClosing) {
        isClosing = true;
        logger('[ElectronServer] Server shutting down - closing database connections');
        
        // Forza la chiusura di tutte le connessioni al database
        try {
          // Chiudi esplicitamente il database prima della chiusura del server
          storage.close();
        } catch (err) {
          logger(`[ElectronServer] Error closing database: ${err.message}`);
        }
      }
    });
    
    // Aggiungi funzione di chiusura migliorata
    const originalClose = server.close;
    server.close = function(callback) {
      logger('[ElectronServer] Server close requested');
      isClosing = true;
      
      // Chiudi connessioni al database prima
      try {
        storage.close();
      } catch (e) {
        logger(`[ElectronServer] Error closing database during server shutdown: ${e.message}`);
      }
      
      // Poi chiudi il server
      return originalClose.call(this, callback);
    };
    
    return server;
  };
  
  // Esponi funzione per creare server
  app.createServer = createServerWithCleanup;

  return app;
}

module.exports = { createElectronServer };