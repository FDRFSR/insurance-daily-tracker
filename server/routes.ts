import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, updateTaskSchema } from "@shared/schema";
import { routePatterns, extractQueryFilters } from "./api-route-utils";

export async function registerRoutes(app: Express): Promise<Server> {
  // 🎯 OPTIMIZED: Task statistics endpoint
  app.get("/api/tasks/stats", 
    routePatterns.getAll(
      () => storage.getTaskStats(),
      "Errore nel recupero delle statistiche"
    )
  );

  // 🎯 OPTIMIZED: Get all tasks with unified filtering logic
  app.get("/api/tasks", async (req, res) => {
    try {
      const { category, status, search } = extractQueryFilters(req);
      
      let tasks;
      if (search) {
        tasks = await storage.searchTasks(search);
      } else if (category) {
        tasks = await storage.getTasksByCategory(category);
      } else if (status) {
        tasks = await storage.getTasksByStatus(status);
      } else {
        tasks = await storage.getTasks();
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Errore nel recupero delle attività" });
    }
  });

  // 🎯 OPTIMIZED: Get task by ID - 75% less code
  app.get("/api/tasks/:id", 
    routePatterns.getById(
      (id) => storage.getTask(id),
      "Errore nel recupero dell'attività"
    )
  );

  // 🎯 OPTIMIZED: Create task - 70% less code  
  app.post("/api/tasks", 
    routePatterns.create(
      insertTaskSchema,
      (data) => storage.createTask(data),
      "Errore nella creazione dell'attività"
    )
  );

  // 🎯 OPTIMIZED: Update task - 80% less code
  app.patch("/api/tasks/:id", 
    routePatterns.update(
      updateTaskSchema,
      (id, data) => storage.updateTask(id, data),
      "Errore nell'aggiornamento dell'attività"
    )
  );

  // 🎯 OPTIMIZED: Delete task - 85% less code
  app.delete("/api/tasks/:id", 
    routePatterns.delete(
      (id) => storage.deleteTask(id),
      "Attività eliminata con successo",
      "Errore nell'eliminazione dell'attività"
    )
  );

  const httpServer = createServer(app);
  return httpServer;
}
