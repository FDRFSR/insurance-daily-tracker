import { useState } from "react";
import { ChevronLeft, ChevronRight, Phone, Calculator, FileText, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onDateSelect?: (date: string | null) => void;
  selectedDate?: string | null;
}

export default function Sidebar({ onDateSelect, selectedDate }: SidebarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // Genera dinamicamente i giorni del calendario
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primo giorno del mese
    const firstDay = new Date(year, month, 1);
    // Ultimo giorno del mese
    const lastDay = new Date(year, month + 1, 0);
    
    // Trova il lunedì della settimana del primo giorno (1 = lunedì, 0 = domenica)
    const startDate = new Date(firstDay);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Converti domenica=0 a domenica=6
    startDate.setDate(firstDay.getDate() - dayOfWeek);
    
    const days = [];
    const today = new Date();
    const currentDay = new Date(startDate);
    
    // Genera 42 giorni (6 settimane x 7 giorni)
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDay.getMonth() === month;
      const isToday = currentDay.toDateString() === today.toDateString();
      
      days.push({
        day: currentDay.getDate(),
        isCurrentMonth,
        isToday,
        hasEvent: false, // Qui potresti aggiungere logica per eventi reali
        isOverdue: false
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const quickActions = [
    {
      title: "Chiamata Cliente",
      description: "Programma una chiamata",
      icon: Phone,
      color: "bg-blue-50 hover:bg-blue-100",
      iconColor: "bg-blue-600"
    },
    {
      title: "Nuovo Preventivo", 
      description: "Crea un preventivo",
      icon: Calculator,
      color: "bg-green-50 hover:bg-green-100",
      iconColor: "bg-green-600"
    },
    {
      title: "Gestisci Sinistro",
      description: "Segui una pratica",
      icon: FileText,
      color: "bg-red-50 hover:bg-red-100", 
      iconColor: "bg-red-600"
    },
    {
      title: "Attività Amministrativa",
      description: "Documenti e pratiche",
      icon: Cog,
      color: "bg-orange-50 hover:bg-orange-100",
      iconColor: "bg-orange-600"
    }
  ];

  const recentClients = [
    {
      name: "Mario Bianchi",
      initials: "MB",
      lastContact: "Ultima chiamata: ieri",
      color: "from-blue-400 to-blue-600"
    },
    {
      name: "Famiglia Verdi",
      initials: "FV", 
      lastContact: "Preventivo: 2 giorni fa",
      color: "from-green-400 to-green-600"
    },
    {
      name: "Laura Neri",
      initials: "LN",
      lastContact: "Sinistro: 1 settimana fa", 
      color: "from-purple-400 to-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
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
                className={`p-2 text-center cursor-pointer relative transition-colors ${
                  date.isToday
                    ? "bg-blue-600 text-white rounded font-medium"
                    : isDateSelected(date.day, date.isCurrentMonth)
                    ? "bg-blue-100 text-blue-800 rounded font-medium"
                    : date.isCurrentMonth
                    ? "text-gray-900 hover:bg-gray-100 rounded"
                    : "text-gray-400"
                }`}
              >
                {date.day}
                {date.hasEvent && (
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                    date.isOverdue ? "bg-red-500" : "bg-orange-500"
                  }`}></div>
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
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${action.color}`}
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
          {recentClients.map((client, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              <div className={`w-8 h-8 bg-gradient-to-br ${client.color} rounded-full flex items-center justify-center`}>
                <span className="text-white text-xs font-medium">{client.initials}</span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{client.name}</div>
                <div className="text-xs text-gray-600">{client.lastContact}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}