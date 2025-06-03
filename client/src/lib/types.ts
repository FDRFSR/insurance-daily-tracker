export interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  dueToday: number;
}

export interface TaskFilters {
  category?: string;
  status?: string;
  search?: string;
}

export const categoryIcons = {
  calls: "phone",
  quotes: "calculator", 
  claims: "file-medical-alt",
  documents: "folder",
  appointments: "calendar-alt"
} as const;

export const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800", 
  low: "bg-blue-100 text-blue-800"
} as const;

export const statusColors = {
  pending: "bg-gray-100 text-gray-800",
  completed: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800"
} as const;
