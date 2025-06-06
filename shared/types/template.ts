// Template types for InsuraTask v1.1
import { z } from "zod";

// Template placeholder variables
export const templateVariables = {
  CLIENT_NAME: "{{client_name}}",
  DATE: "{{date}}",
  TIME: "{{time}}",
  WEEK_START: "{{week_start}}",
  WEEK_END: "{{week_end}}",
  MONTH: "{{month}}",
  YEAR: "{{year}}",
  DAY_NAME: "{{day_name}}",
} as const;

// Template categories (same as task categories)
export const templateCategories = {
  calls: "Chiamate clienti",
  quotes: "Quotazioni", 
  claims: "Sinistri",
  documents: "Documentazione",
  appointments: "Appuntamenti"
} as const;

// Recurrence types
export const recurrenceTypes = {
  daily: "Ogni giorno",
  weekly: "Ogni settimana",
  monthly: "Ogni mese"
} as const;

// Days of week for weekly recurrence
export const daysOfWeek = {
  0: "Domenica",
  1: "Lunedì", 
  2: "Martedì",
  3: "Mercoledì",
  4: "Giovedì",
  5: "Venerdì",
  6: "Sabato"
} as const;

// Recurrence configuration interface
export interface RecurrenceConfig {
  type: "daily" | "weekly" | "monthly";
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  time: string; // HH:MM format
  endDate?: string;
}

// Base template interface
export interface Template {
  id: number;
  name: string;
  category: string;
  titleTemplate: string;
  descriptionTemplate?: string;
  priority: string;
  recurrenceConfig?: RecurrenceConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Template creation interface
export interface InsertTemplate {
  name: string;
  category: string;
  titleTemplate: string;
  descriptionTemplate?: string;
  priority: string;
  recurrenceConfig?: RecurrenceConfig;
  isActive?: boolean;
}

// Template instance interface
export interface TemplateInstance {
  id: number;
  templateId: number;
  taskId?: number;
  scheduledDate: string;
  executedAt?: string;
  createdAt: Date;
}

// Template form schema
export const templateFormSchema = z.object({
  name: z.string().min(1, "Nome template richiesto").max(100),
  description: z.string().optional(),
  category: z.enum(["calls", "quotes", "claims", "documents", "appointments"]),
  titleTemplate: z.string().min(1, "Titolo template richiesto").max(200),
  descriptionTemplate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  recurrenceConfig: z.object({
    type: z.enum(["daily", "weekly", "monthly"]),
    interval: z.number().min(1).max(365),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endDate: z.string().optional(),
  }).optional(),
  isActive: z.boolean().default(true),
});

export type TemplateFormData = z.infer<typeof templateFormSchema>;

// Template execution context
export interface TemplateContext {
  client_name?: string;
  client?: string;
  date: string; // ISO date
  time: string; // HH:MM
  week_start?: string;
  week_end?: string;
  month: string;
  year: string;
  day: string;
  week: string;
  day_name: string;
  [key: string]: string | undefined;
}

// Template execution result
export interface TemplateExecutionResult {
  title: string;
  description?: string;
  category: string;
  priority: string;
  dueDate: string;
  dueTime: string;
  client?: string;
}

// Template manager view types
export interface TemplateListItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  recurrenceType?: string;
  nextExecution?: string;
  createdAt: string;
  lastGenerated?: string;
  instanceCount: number;
}

// Cron job status
export interface CronJobStatus {
  templateId: number;
  jobId: string;
  isRunning: boolean;
  nextRun: string;
  lastRun?: string;
  error?: string;
}
