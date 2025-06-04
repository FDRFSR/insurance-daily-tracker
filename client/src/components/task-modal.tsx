import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Calendar, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Task } from "@shared/schema";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  preselectedCategory?: string;
  preselectedDate?: string;
}

interface TaskFormData {
  title: string;
  description: string;
  category: string;
  client: string;
  priority: string;
  dueDate: string;
  dueTime: string;
}

const categoryTitles: Record<string, string> = {
  calls: "Chiamata cliente - ",
  quotes: "Preventivo per ",
  claims: "Gestione sinistro - ",
  documents: "Documentazione - ",
  appointments: "Appuntamento con "
};

const categoryOptions = [
  { value: "calls", label: "Chiamata Cliente" },
  { value: "quotes", label: "Preventivo" },
  { value: "claims", label: "Gestione Sinistro" },
  { value: "documents", label: "Documentazione" },
  { value: "appointments", label: "Appuntamento" }
];

const priorityOptions = [
  { value: "low", label: "Bassa" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" }
];

interface SimpleSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function SimpleSelect({ value, onValueChange, options, placeholder, disabled, className }: SimpleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const firstOption = dropdownRef.current.querySelector('[role="option"]') as HTMLElement;
      firstOption?.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          flex h-10 w-full items-center justify-between rounded-md border border-gray-300 
          bg-white px-3 py-2 text-sm text-left
          hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200
          disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder || 'Seleziona...'}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{ zIndex: 1000 }}
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`
                w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50
                flex items-center justify-between
                ${value === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}
              `}
              role="option"
              aria-selected={value === option.value}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskModal({ 
  isOpen, 
  onClose, 
  task, 
  preselectedCategory, 
  preselectedDate 
}: TaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    category: "",
    client: "",
    priority: "medium",
    dueDate: "",
    dueTime: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || "",
          category: task.category,
          client: task.client || "",
          priority: task.priority,
          dueDate: task.dueDate || "",
          dueTime: task.dueTime || "",
        });
      } else if (preselectedCategory || preselectedDate) {
        setFormData({
          title: preselectedCategory ? (categoryTitles[preselectedCategory] || "") : "",
          description: "",
          category: preselectedCategory || "",
          client: "",
          priority: "medium",
          dueDate: preselectedDate || "",
          dueTime: "",
        });
      } else {
        setFormData({
          title: "",
          description: "",
          category: "",
          client: "",
          priority: "medium",
          dueDate: "",
          dueTime: "",
        });
      }
    }
  }, [task, preselectedCategory, preselectedDate, isOpen]);

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      return apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      toast({
        title: "Successo",
        description: "Attività creata con successo",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Impossibile creare l'attività",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      return apiRequest("PATCH", `/api/tasks/${task!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/stats"] });
      toast({
        title: "Successo",
        description: "Attività aggiornata con successo",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.message || "Impossibile aggiornare l'attività",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Errore",
        description: "Il titolo è obbligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Errore",
        description: "La categoria è obbligatoria",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      client: formData.client.trim(),
    };

    if (task) {
      updateTaskMutation.mutate(submitData);
    } else {
      createTaskMutation.mutate(submitData);
    }
  };

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createTaskMutation.isPending || updateTaskMutation.isPending;

  const getModalTitle = () => {
    if (task) return "Modifica Attività";
    
    if (preselectedCategory) {
      const categoryNames = {
        calls: "Nuova Chiamata Cliente",
        quotes: "Nuovo Preventivo",
        claims: "Nuovo Sinistro",
        documents: "Nuova Documentazione",
        appointments: "Nuovo Appuntamento"
      };
      return categoryNames[preselectedCategory as keyof typeof categoryNames] || "Nuova Attività";
    }
    
    if (preselectedDate) {
      const dateObj = new Date(preselectedDate);
      const formattedDate = dateObj.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      return `Nuova Attività - ${formattedDate}`;
    }
    
    return "Nuova Attività";
  };

  const formatSelectedDate = () => {
    if (!preselectedDate) return null;
    const dateObj = new Date(preselectedDate);
    return dateObj.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            {getModalTitle()}
            {preselectedCategory && (
              <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                Azione Rapida
              </span>
            )}
            {preselectedDate && (
              <span className="text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded-md flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Dal Calendario
              </span>
            )}
          </DialogTitle>
          {preselectedDate && (
            <p className="text-sm text-gray-600 mt-1">
              Attività programmata per {formatSelectedDate()}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Titolo Attività *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Inserisci il titolo dell'attività..."
              required
              autoFocus={!preselectedCategory && !preselectedDate}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">
              Categoria *
            </Label>
            <SimpleSelect
              value={formData.category}
              onValueChange={(value) => handleInputChange("category", value)}
              options={categoryOptions}
              placeholder="Seleziona categoria"
              disabled={!!preselectedCategory}
              className="w-full"
            />
            {preselectedCategory && (
              <p className="text-xs text-gray-500 mt-1">
                Categoria preselezionata dall'azione rapida
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="client" className="text-sm font-medium text-gray-700">
              Cliente
            </Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => handleInputChange("client", e.target.value)}
              placeholder="Nome del cliente..."
              autoFocus={!!preselectedCategory || !!preselectedDate}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descrizione
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descrizione dettagliata dell'attività..."
              rows={3}
              className="w-full resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
                Data
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
                className={`w-full ${preselectedDate ? 'ring-2 ring-green-200 border-green-300' : ''}`}
              />
              {preselectedDate && (
                <p className="text-xs text-green-600 mt-1">
                  Data preselezionata dal calendario
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueTime" className="text-sm font-medium text-gray-700">
                Ora
              </Label>
              <Input
                id="dueTime"
                type="time"
                value={formData.dueTime}
                onChange={(e) => handleInputChange("dueTime", e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
              Priorità
            </Label>
            <SimpleSelect
              value={formData.priority}
              onValueChange={(value) => handleInputChange("priority", value)}
              options={priorityOptions}
              className="w-full"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
              className="px-6"
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.title.trim() || !formData.category} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isLoading ? "Salvando..." : task ? "Aggiorna Attività" : "Salva Attività"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}