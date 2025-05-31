import { useState } from "react";
import { ChevronLeft, ChevronRight, Phone, Calculator, FileText, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [currentMonth, setCurrentMonth] = useState("Gennaio 2024");

  const handlePreviousMonth = () => {
    // Month navigation logic would go here
    console.log("Previous month");
  };

  const handleNextMonth = () => {
    // Month navigation logic would go here
    console.log("Next month");
  };

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

  // Calendar days - simplified static calendar
  const calendarDays = [
    { day: "29", isCurrentMonth: false },
    { day: "30", isCurrentMonth: false },
    { day: "31", isCurrentMonth: false },
    { day: "1", isCurrentMonth: true },
    { day: "2", isCurrentMonth: true },
    { day: "3", isCurrentMonth: true },
    { day: "4", isCurrentMonth: true },
    { day: "5", isCurrentMonth: true },
    { day: "6", isCurrentMonth: true },
    { day: "7", isCurrentMonth: true },
    { day: "8", isCurrentMonth: true },
    { day: "9", isCurrentMonth: true },
    { day: "10", isCurrentMonth: true },
    { day: "11", isCurrentMonth: true },
    { day: "12", isCurrentMonth: true },
    { day: "13", isCurrentMonth: true },
    { day: "14", isCurrentMonth: true },
    { day: "15", isCurrentMonth: true, isToday: true },
    { day: "16", isCurrentMonth: true, hasEvent: true },
    { day: "17", isCurrentMonth: true },
    { day: "18", isCurrentMonth: true },
    { day: "19", isCurrentMonth: true, hasEvent: true, isOverdue: true },
    { day: "20", isCurrentMonth: true },
    { day: "21", isCurrentMonth: true },
    { day: "22", isCurrentMonth: true },
    { day: "23", isCurrentMonth: true },
    { day: "24", isCurrentMonth: true },
    { day: "25", isCurrentMonth: true }
  ];

  return (
    <div className="space-y-6">
      {/* Calendar Widget */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendario</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h4 className="font-medium text-gray-900">{currentMonth}</h4>
            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-xs text-center">
            {["L", "M", "M", "G", "V", "S", "D"].map(day => (
              <div key={day} className="p-2 text-gray-500 font-medium">{day}</div>
            ))}
            
            {calendarDays.map((date, index) => (
              <div
                key={index}
                className={`p-2 text-center cursor-pointer relative ${
                  date.isToday
                    ? "bg-blue-600 text-white rounded font-medium"
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
