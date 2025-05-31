import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, updateTaskSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Get task statistics
  app.get("/api/tasks/stats", async (req, res) => {
    try {
      const stats = await storage.getTaskStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle statistiche" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
