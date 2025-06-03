import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // calls, quotes, claims, documents, appointments
  client: text("client"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // low, medium, high
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, overdue
  dueDate: text("due_date"), // Store as ISO string for simplicity
  dueTime: text("due_time"), // Store as HH:MM format
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const updateTaskSchema = insertTaskSchema.partial();

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Category definitions
export const taskCategories = {
  calls: "Chiamate clienti",
  quotes: "Quotazioni", 
  claims: "Sinistri",
  documents: "Documentazione",
  appointments: "Appuntamenti"
} as const;

export const priorityLevels = {
  low: "Bassa",
  medium: "Media", 
  high: "Alta"
} as const;

export const statusTypes = {
  pending: "In sospeso",
  completed: "Completata",
  overdue: "In ritardo"
} as const;
