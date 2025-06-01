import { tasks, type Task, type InsertTask, type UpdateTask } from "@shared/schema";

export interface IStorage {
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: UpdateTask): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTasksByCategory(category: string): Promise<Task[]>;
  getTasksByStatus(status: string): Promise<Task[]>;
  searchTasks(query: string): Promise<Task[]>;
  getTaskStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    dueToday: number;
  }>;
}

export class MemStorage implements IStorage {
  private tasks: Map<number, Task>;
  private currentId: number;

  constructor() {
    this.tasks = new Map();
    this.currentId = 1;
    this.seedData();
  }

  private seedData() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const seedTasks: Omit<Task, 'id'>[] = [
      {
        title: "Chiamare Maria Bianchi per rinnovo polizza auto",
        description: "Discutere opzioni di rinnovo e nuove coperture disponibili. Cliente interessata a polizza kasko.",
        category: "calls",
        client: "Maria Bianchi", 
        priority: "high",
        status: "pending",
        dueDate: today,
        dueTime: "14:30",
        completed: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Preparare quotazione RC professionale per Studio Legale Verdi",
        description: "Calcolare preventivo per polizza RC professionale avvocati. Massimale richiesto €5.000.000.",
        category: "quotes",
        client: "Studio Legale Verdi",
        priority: "medium", 
        status: "pending",
        dueDate: tomorrow,
        dueTime: "16:00",
        completed: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Controllare stato sinistro auto - Pratica #2024/456",
        description: "Verificare aggiornamenti peritale e comunicare stato al cliente Rossi.",
        category: "claims",
        client: "Marco Rossi",
        priority: "low",
        status: "completed",
        dueDate: today,
        dueTime: "11:30",
        completed: true,
        completedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Archiviare documenti polizza vita cliente Conti",
        description: "Scansionare e archiviare digitalmente tutti i documenti relativi alla nuova polizza vita sottoscritta.",
        category: "documents", 
        client: "Giuseppe Conti",
        priority: "low",
        status: "pending",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        dueTime: "17:00",
        completed: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: "Appuntamento con famiglia Neri per polizza casa",
        description: "Incontro per discutere copertura assicurativa nuova abitazione acquistata. Era previsto per ieri.",
        category: "appointments",
        client: "Famiglia Neri",
        priority: "high",
        status: "overdue",
        dueDate: yesterday,
        dueTime: "15:00",
        completed: false,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    seedTasks.forEach(task => {
      const id = this.currentId++;
      this.tasks.set(id, { ...task, id });
    });
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentId++;
    const now = new Date();
    const task: Task = {
      id,
      title: insertTask.title,
      description: insertTask.description || null,
      category: insertTask.category,
      client: insertTask.client || null,
      priority: insertTask.priority || "medium",
      status: insertTask.status || "pending",
      dueDate: insertTask.dueDate || null,
      dueTime: insertTask.dueTime || null,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updates: UpdateTask): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;

    const updatedTask: Task = {
      ...existingTask,
      ...updates,
      updatedAt: new Date(),
      completedAt: updates.completed === true ? new Date() : 
                   updates.completed === false ? null : existingTask.completedAt,
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getTasksByCategory(category: string): Promise<Task[]> {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.category === category);
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    const allTasks = await this.getTasks();
    return allTasks.filter(task => task.status === status);
  }

  async searchTasks(query: string): Promise<Task[]> {
    const allTasks = await this.getTasks();
    const lowercaseQuery = query.toLowerCase();
    
    return allTasks.filter(task => 
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.description?.toLowerCase().includes(lowercaseQuery) ||
      task.client?.toLowerCase().includes(lowercaseQuery)
    );
  }

  async getTaskStats(): Promise<{
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    dueToday: number;
  }> {
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

import { SQLiteStorage } from './sqlite-storage';
export const storage = new SQLiteStorage();
