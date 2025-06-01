import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

// Mapping delle categorie per pre-riempire i titoli
const categoryTitles: Record<string, string> = {
  calls: "Chiamata cliente - ",
  quotes: "Preventivo per ",
  claims: "Gestione sinistro - ",
  documents: "Documentazione - ",
  appointments: "Appuntamento con "
};

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
    if (task) {
      // Editing existing task
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
      // New task with preselected data
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
      // New task from scratch
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
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile creare l'attività",
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
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'attività",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category) {
      toast({
        title: "Errore",
        description: "Titolo e categoria sono obbligatori",
        variant: "destructive",
      });
      return;
    }

    if (task) {
      updateTaskMutation.mutate(formData);
    } else {
      createTaskMutation.mutate(formData);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getModalTitle()}
            {preselectedCategory && (
              <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Azione Rapida
              </span>
            )}
            {preselectedDate && (
              <span className="text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
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
          <div>
            <Label htmlFor="title">Titolo Attività *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Inserisci il titolo dell'attività..."
              required
              autoFocus={!preselectedCategory && !preselectedDate}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange("category", value)}
              disabled={!!preselectedCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calls">Chiamata Cliente</SelectItem>
                <SelectItem value="quotes">Preventivo</SelectItem>
                <SelectItem value="claims">Gestione Sinistro</SelectItem>
                <SelectItem value="documents">Documentazione</SelectItem>
                <SelectItem value="appointments">Appuntamento</SelectItem>
              </SelectContent>
            </Select>
            {preselectedCategory && (
              <p className="text-xs text-gray-500 mt-1">
                Categoria preselezionata dall'azione rapida
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => handleInputChange("client", e.target.value)}
              placeholder="Nome del cliente..."
              autoFocus={!!preselectedCategory || !!preselectedDate}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrizione</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descrizione dettagliata dell'attività..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Data</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
                className={preselectedDate ? "ring-2 ring-green-200" : ""}
              />
              {preselectedDate && (
                <p className="text-xs text-green-600 mt-1">
                  Data preselezionata dal calendario
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="dueTime">Ora</Label>
              <Input
                id="dueTime"
                type="time"
                value={formData.dueTime}
                onChange={(e) => handleInputChange("dueTime", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Priorità</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Bassa</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Salvando..." : task ? "Aggiorna Attività" : "Salva Attività"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}