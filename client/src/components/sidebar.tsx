import { useState } from "react";
import { ChevronLeft, ChevronRight, Phone, Calculator, FileText, Cog, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { Task } from "@shared/schema";

interface SidebarProps {
  onDateSelect?: (date: string | null) => void;
  selectedDate?: string | null;
  onQuickAction?: (category: string) => void;
}

export default function Sidebar({ onDateSelect, selectedDate, onQuickAction }: SidebarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Fetch tasks using TanStack Query
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  const currentMonthName = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const handleDateClick = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    
    // Costruisci la data nel formato YYYY-MM-DD
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // getMonth() ritorna 0-11
    const clickedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Se clicchiamo sulla stessa data, la deseleziona
    if (onDateSelect) {
      onDateSelect(clickedDate === selectedDate ? null : clickedDate);
    }
  };

  const isDateSelected = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth || !selectedDate) return false;
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dateToCheck = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    return selectedDate === dateToCheck;
  };

  // Helper per formattare la data in YYYY-MM-DD in locale (no UTC)
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Genera dinamicamente i giorni del calendario
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const dayOfWeek = (firstDay.getDay() + 6) % 7;
    startDate.setDate(firstDay.getDate() - dayOfWeek);
    const days = [];
    const today = new Date();
    const currentDay = new Date(startDate);
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDay.getMonth() === month;
      const isToday = currentDay.toDateString() === today.toDateString();
      // Usa la funzione helper per evitare problemi di fuso orario
      const formattedDate = formatLocalDate(currentDay);
      const tasksForDate = allTasks.filter(task => task.dueDate === formattedDate);
      const hasEvent = tasksForDate.length > 0;
      const hasOverdue = tasksForDate.some(task => task.status === "overdue");
      days.push({
        day: currentDay.getDate(),
        isCurrentMonth,
        isToday,
        hasEvent,
        isOverdue: hasOverdue,
        tasksForDate
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  // Mappa le categorie alle chiavi utilizzate nel backend
  const quickActions = [
    {
      title: "Chiamata Cliente",
      description: "Programma una chiamata",
      icon: Phone,
      color: "bg-blue-50 hover:bg-blue-100",
      iconColor: "bg-blue-600",
      category: "calls"
    },
    {
      title: "Nuovo Preventivo", 
      description: "Crea un preventivo",
      icon: Calculator,
      color: "bg-green-50 hover:bg-green-100",
      iconColor: "bg-green-600",
      category: "quotes"
    },
    {
      title: "Gestisci Sinistro",
      description: "Segui una pratica",
      icon: FileText,
      color: "bg-red-50 hover:bg-red-100", 
      iconColor: "bg-red-600",
      category: "claims"
    },
    {
      title: "Attività Amministrativa",
      description: "Documenti e pratiche",
      icon: Cog,
      color: "bg-orange-50 hover:bg-orange-100",
      iconColor: "bg-orange-600",
      category: "documents"
    },
    {
      title: "Crea Appuntamento",
      description: "Aggiungi un appuntamento in agenda",
      icon: Calendar,
      color: "bg-purple-50 hover:bg-purple-100",
      iconColor: "bg-purple-600",
      category: "appointments"
    }
  ];

  // Handler per le azioni rapide
  const handleQuickAction = (category: string) => {
    if (onQuickAction) {
      onQuickAction(category);
    }
  };

  // Calcola i clienti recenti dinamicamente dalle task
  const recentClientsMap = new Map<string, { name: string; lastContact: string; initials: string; color: string }>();
  const now = new Date();
  [...allTasks]
    .filter(task => task.client && task.client.trim() !== "")
    .sort((a, b) => new Date(b.dueDate || b.createdAt).getTime() - new Date(a.dueDate || a.createdAt).getTime())
    .forEach(task => {
      if (!recentClientsMap.has(task.client!)) {
        // Calcola tempo trascorso dall'ultima attività
        const lastDate = new Date(task.dueDate || task.createdAt);
        const diffMs = now.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        let lastContact = "Oggi";
        if (diffDays === 1) lastContact = "Ieri";
        else if (diffDays > 1) lastContact = `${diffDays} giorni fa`;
        // Iniziali
        const initials = task.client!.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        // Colore avatar (semplice hash su nome)
        const palette = ["from-blue-400 to-blue-600","from-green-400 to-green-600","from-purple-400 to-purple-600","from-red-400 to-red-600","from-yellow-400 to-yellow-600"];
        const color = palette[task.client!.charCodeAt(0) % palette.length];
        recentClientsMap.set(task.client!, {
          name: task.client!,
          lastContact,
          initials,
          color
        });
      }
    });
  const recentClients = Array.from(recentClientsMap.values()).slice(0, 5);

  // Funzione per ottenere i colori in base alla categoria
  const getCategoryColor = (category: string, status: string) => {
    if (status === 'overdue') return 'bg-red-500';
    
    switch (category) {
      case 'calls': return 'bg-blue-500';
      case 'quotes': return 'bg-green-500';
      case 'claims': return 'bg-red-500';
      case 'documents': return 'bg-yellow-500';
      case 'appointments': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <aside className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col gap-6">
      {/* Calendar Widget */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendario</h3>
        {selectedDate && (
          <div className="mb-3 p-2 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              📅 Filtrando per: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('it-IT')}
            </p>
            <button 
              onClick={() => onDateSelect?.(null)}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Rimuovi filtro
            </button>
          </div>
        )}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h4 className="font-medium text-gray-900">{currentMonthName}</h4>
            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-xs text-center">
            {["L", "M", "M", "G", "V", "S", "D"].map((day, index) => (
              <div key={`day-header-${index}`} className="p-2 text-gray-500 font-medium">{day}</div>
            ))}
            
            {calendarDays.map((date, index) => (
              <div
                key={index}
                onClick={() => handleDateClick(date.day, date.isCurrentMonth)}
                className={`
                  p-2 text-center cursor-pointer relative transition-colors
                  ${date.isToday
                    ? "bg-blue-600 text-white rounded font-medium"
                    : isDateSelected(date.day, date.isCurrentMonth)
                    ? "bg-blue-100 text-blue-800 rounded font-medium"
                    : date.isCurrentMonth
                    ? "text-gray-900 hover:bg-gray-100 rounded"
                    : "text-gray-400"
                  }
                `}
              >
                {date.day}
                
                {/* Event indicators */}
                {date.hasEvent && date.isCurrentMonth && (
                  <div className="absolute bottom-0.5 left-0 right-0 flex justify-center space-x-0.5">
                    {date.tasksForDate.slice(0, 3).map((task, i) => (
                      <div 
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(task.category, task.status)}`}
                      />
                    ))}
                    {date.tasksForDate.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
        <div className="space-y-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.category)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${action.color} hover:scale-[1.02] transform transition-transform`}
            >
              <div className={`w-8 h-8 ${action.iconColor} rounded-lg flex items-center justify-center`}>
                <action.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">{action.title}</div>
                <div className="text-xs text-gray-600">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Clients */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Clienti Recenti</h3>
        <div className="space-y-3">
          {recentClients.length === 0 ? (
            <div className="text-gray-400 text-sm">Nessun cliente recente</div>
          ) : (
            recentClients.map((client, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
              >
                <div className={`w-8 h-8 bg-gradient-to-br ${client.color} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-xs font-medium">{client.initials}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{client.name}</div>
                  <div className="text-xs text-gray-600">Ultima attività: {client.lastContact}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}