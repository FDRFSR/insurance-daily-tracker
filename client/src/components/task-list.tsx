import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Phone, Calculator, FileText, Folder, Calendar, Edit2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Task } from "@shared/schema";
import type { TaskFilters } from "@/lib/types";
import TaskModal from "./task-modal";

const categoryIcons = {
  calls: Phone,
  quotes: Calculator,
  claims: FileText,
  documents: Folder,
  appointments: Calendar
};

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800"
};

const statusLabels = {
  pending: "In sospeso",
  completed: "Completata",
  overdue: "In ritardo"
};

interface TaskListProps {
  onTaskEdit?: (task: Task) => void;
  selectedDate?: string | null;
}

export default function TaskList({ onTaskEdit, selectedDate }: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build query parameters basati direttamente sugli stati
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
    if (searchQuery) params.append("search", searchQuery);
    return params;
  }, [selectedCategory, searchQuery]);

  const { data: allTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", queryParams.toString()],
  });

  // Filtra le task in base alla data selezionata (applicato sui risultati già filtrati)
  const filteredTasks = useMemo(() => {
    let tasks = allTasks;
    
    // Applica il filtro di data se presente
    if (selectedDate) {
      tasks = tasks.filter(task => task.dueDate === selectedDate);
    }
    
    return tasks;
  }, [allTasks, selectedDate]);

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, { 
        completed,
        status: completed ? "completed" : "pending"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'attività",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      toast({
        title: "Successo",
        description: "Attività eliminata con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore", 
        description: "Impossibile eliminare l'attività",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
  };

  const handleTaskToggle = (task: Task) => {
    toggleTaskMutation.mutate({ 
      id: task.id, 
      completed: !task.completed 
    });
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
    onTaskEdit?.(task);
  };

  const handleTaskDelete = (task: Task) => {
    if (confirm("Sei sicuro di voler eliminare questa attività?")) {
      deleteTaskMutation.mutate(task.id);
    }
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time;
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    const taskDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date === today.toISOString().split('T')[0]) {
      return "Oggi";
    } else if (date === tomorrow.toISOString().split('T')[0]) {
      return "Domani";
    } else {
      return taskDate.toLocaleDateString('it-IT');
    }
  };

  const categoryFilters = [
    { key: "all", label: "Tutte", icon: null },
    { key: "calls", label: "Chiamate", icon: Phone },
    { key: "quotes", label: "Preventivi", icon: Calculator },
    { key: "claims", label: "Sinistri", icon: FileText },
    { key: "documents", label: "Documenti", icon: Folder },
    { key: "appointments", label: "Appuntamenti", icon: Calendar }
  ];

  // Determina il titolo in base ai filtri attivi
  const getListTitle = () => {
    if (selectedDate) {
      const dateObj = new Date(selectedDate + 'T00:00:00');
      const today = new Date();
      const isToday = selectedDate === today.toISOString().split('T')[0];
      
      if (isToday) {
        return "Attività di Oggi";
      } else {
        return `Attività del ${dateObj.toLocaleDateString('it-IT')}`;
      }
    }
    return "Attività di Oggi";
  };

  if (isLoading) {
    return (
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
              <div className="flex space-x-4">
                <div className="h-10 bg-gray-300 rounded w-64"></div>
                <div className="h-10 bg-gray-300 rounded w-32"></div>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-4">
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-semibold text-gray-900">{getListTitle()}</h2>
                {selectedDate && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Filtrato per data
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cerca attività o cliente..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <Button onClick={handleNewTask} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Attività
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categoryFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => handleCategoryFilter(filter.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center space-x-1 ${
                    selectedCategory === filter.key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {filter.icon && <filter.icon className="h-3 w-3" />}
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                {selectedDate ? (
                  <div>
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nessuna attività trovata per questa data</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Prova a selezionare un'altra data o rimuovi il filtro
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">Nessuna attività trovata</p>
                )}
              </div>
            ) : (
              filteredTasks.map((task) => {
                const IconComponent = categoryIcons[task.category as keyof typeof categoryIcons];
                const isOverdue = task.status === "overdue";
                
                return (
                  <div
                    key={task.id}
                    className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${
                      isOverdue ? "bg-red-50 border-red-200" : ""
                    } ${task.completed ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleTaskToggle(task)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`text-sm font-medium text-gray-900 ${task.completed ? "line-through" : ""}`}>
                              {task.title}
                            </h3>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium flex items-center space-x-1">
                              {IconComponent && <IconComponent className="h-3 w-3" />}
                              <span>
                                {task.category === "calls" && "Chiamata"}
                                {task.category === "quotes" && "Preventivo"} 
                                {task.category === "claims" && "Sinistro"}
                                {task.category === "documents" && "Documento"}
                                {task.category === "appointments" && "Appuntamento"}
                              </span>
                            </span>
                          </div>
                          
                          {task.description && (
                            <p className={`text-sm text-gray-600 mb-2 ${task.completed ? "line-through" : ""}`}>
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {task.client && (
                              <span className="flex items-center space-x-1">
                                <span>👤</span>
                                <span>{task.client}</span>
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="flex items-center space-x-1">
                                <span>🕒</span>
                                <span>{formatDate(task.dueDate)} {formatTime(task.dueTime)}</span>
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                              {task.priority === "high" && "Alta Priorità"}
                              {task.priority === "medium" && "Media Priorità"}
                              {task.priority === "low" && "Bassa Priorità"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTaskEdit(task)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTaskDelete(task)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
      />
    </>
  );
}