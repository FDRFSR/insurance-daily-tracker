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

// Templates schema
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  titleTemplate: text("title_template").notNull(),
  descriptionTemplate: text("description_template"),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  recurrenceConfig: text("recurrence_config"), // JSON string
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Template instances (tasks generated from templates)
export const templateInstances = pgTable("template_instances", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => templates.id),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

// Template schemas
export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTemplateSchema = insertTemplateSchema.partial();

// Recurrence configuration schema
export const recurrenceConfigSchema = z.object({
  type: z.enum(["daily", "weekly", "monthly"]),
  interval: z.number().min(1).default(1), // Every X days/weeks/months
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // For weekly: 0=Sunday, 6=Saturday
  dayOfMonth: z.number().min(1).max(31).optional(), // For monthly
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default("09:00"), // HH:MM format
  endDate: z.string().optional(), // ISO date string
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type UpdateTemplate = z.infer<typeof updateTemplateSchema>;
export type RecurrenceConfig = z.infer<typeof recurrenceConfigSchema>;
export type TemplateInstance = typeof templateInstances.$inferSelect;

// Google Calendar integration schema
export const googleCalendarConfig = pgTable("google_calendar_config", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().default("default"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"), // Nullable - Google può non fornirlo in alcuni casi
  tokenExpiresAt: timestamp("token_expires_at").notNull(),
  calendarId: text("calendar_id"), // Primary calendar ID
  syncEnabled: boolean("sync_enabled").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncDirection: varchar("sync_direction", { length: 20 }).notNull().default("bidirectional"), // 'import', 'export', 'bidirectional'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Mapping between InsuraTask tasks and Google Calendar events
export const taskCalendarMapping = pgTable("task_calendar_mapping", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  googleEventId: text("google_event_id").notNull(),
  calendarId: text("calendar_id").notNull(),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  syncStatus: varchar("sync_status", { length: 20 }).notNull().default("synced"), // 'synced', 'conflict', 'pending'
});

// Google Calendar schemas
export const insertGoogleCalendarConfigSchema = createInsertSchema(googleCalendarConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateGoogleCalendarConfigSchema = insertGoogleCalendarConfigSchema.partial();

export const insertTaskCalendarMappingSchema = createInsertSchema(taskCalendarMapping).omit({
  id: true,
  lastSyncedAt: true,
});

export type GoogleCalendarConfig = typeof googleCalendarConfig.$inferSelect;
export type InsertGoogleCalendarConfig = z.infer<typeof insertGoogleCalendarConfigSchema>;
export type UpdateGoogleCalendarConfig = z.infer<typeof updateGoogleCalendarConfigSchema>;
export type TaskCalendarMapping = typeof taskCalendarMapping.$inferSelect;
export type InsertTaskCalendarMapping = z.infer<typeof insertTaskCalendarMappingSchema>;
