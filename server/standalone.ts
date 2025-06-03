import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";
import { storage } from "./sqlite-storage";
import { insertTaskSchema, updateTaskSchema } from "../shared/schema";
import { fromZodError } from "zod-validation-error";

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

// Serve static files utility 
function serveStatic(app: express.Express) {
  // Per standalone builds, usiamo __dirname che funziona in CommonJS
  const currentDir = __dirname;
  
  // Possibili percorsi per i file statici
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

  // SPA fallback
  app.use("*", (_req, res) => {
    const indexFile = path.resolve(distPath!, "index.html");
    res.sendFile(indexFile);
  });
}

// Register API routes
async function registerRoutes(app: express.Express): Promise<Server> {
  // Get task statistics - must be before the /:id route
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

// Start the server
startServer();