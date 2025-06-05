import { Plus, BarChart3, Calendar, Filter, Search, Zap, Phone, Calculator, FileText, Users, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import Header from "@/components/header";
import DashboardStats from "@/components/dashboard-stats";
import DashboardCharts from "@/components/dashboard-charts";
import NotificationPanel from "@/components/notification-panel";
import TaskList from "@/components/task-list";
import Sidebar from "@/components/sidebar";
import TaskModal from "@/components/task-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Task } from "@shared/schema";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeShortcut, setActiveShortcut] = useState<string | null>(null);

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setPreselectedCategory(undefined);
    setIsModalOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setPreselectedCategory(undefined);
    setIsModalOpen(true);
  };

  const handleDateSelect = (date: string | null) => {
    setSelectedDate(date);
  };

  const handleQuickAction = (category: string) => {
    setEditingTask(null);
    setPreselectedCategory(category);
    setIsModalOpen(true);
    
    // Visual feedback for keyboard shortcuts
    setActiveShortcut(category);
    setTimeout(() => setActiveShortcut(null), 300);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setPreselectedCategory(undefined);
  };

  // Keyboard shortcuts for quick actions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            handleQuickAction('Chiamate');
            break;
          case 'q':
            event.preventDefault();
            handleQuickAction('Preventivi');
            break;
          case 'a':
            event.preventDefault();
            handleQuickAction('Appuntamenti');
            break;
          case 's':
            event.preventDefault();
            handleQuickAction('Sinistri');
            break;
          case 't':
            event.preventDefault();
            handleQuickAction('Amministrazione');
            break;
          case 'f':
            event.preventDefault();
            handleQuickAction('Clienti');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <Header />
      
      {/* Container principale con padding migliorato */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Sezione statistiche migliorata */}
        <DashboardStats />

        {/* Sezione grafici avanzati */}
        {showAnalytics && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Analytics Avanzate</h2>
            </div>
            <DashboardCharts />
          </div>
        )}

        {/* Barra di controlli migliorata */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-gray-900">Le Tue Attività</h2>
              {selectedDate && (
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {new Date(selectedDate).toLocaleDateString('it-IT', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {/* Barra di ricerca */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca attività..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              {/* Pulsanti di controllo */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="hidden sm:flex items-center space-x-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </Button>
              
              <Button
                onClick={handleNewTask}
                className="hidden sm:flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span>Nuova Attività</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Layout principale migliorato */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Lista delle attività - occupa più spazio */}
          <div className="xl:col-span-3 space-y-6">
            <TaskList 
              onTaskEdit={handleTaskEdit} 
              selectedDate={selectedDate}
              searchQuery={searchQuery}
            />
          </div>
          
          {/* Sidebar migliorata */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 space-y-6">
              <Sidebar 
                onDateSelect={handleDateSelect}
                selectedDate={selectedDate}
                onQuickAction={handleQuickAction}
              />
              
              {/* Pannello notifiche */}
              <NotificationPanel />
              
              {/* Azioni rapide */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Azioni Rapide</h3>
                    <p className="text-sm text-gray-600">Accelera il tuo workflow</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleQuickAction('Chiamate')}
                    className={`bg-blue-50 hover:bg-blue-100 rounded-xl p-4 text-left transition-all duration-200 transform hover:scale-[1.02] hover:shadow-sm border border-transparent hover:border-gray-200 group ${
                      activeShortcut === 'Chiamate' ? 'ring-2 ring-blue-300 bg-blue-100' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Phone className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">Nuova Chiamata</h4>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('Preventivi')}
                    className={`bg-green-50 hover:bg-green-100 rounded-xl p-4 text-left transition-all duration-200 transform hover:scale-[1.02] hover:shadow-sm border border-transparent hover:border-gray-200 group ${
                      activeShortcut === 'Preventivi' ? 'ring-2 ring-green-300 bg-green-100' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calculator className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">Preventivo</h4>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('Appuntamenti')}
                    className={`bg-purple-50 hover:bg-purple-100 rounded-xl p-4 text-left transition-all duration-200 transform hover:scale-[1.02] hover:shadow-sm border border-transparent hover:border-gray-200 group ${
                      activeShortcut === 'Appuntamenti' ? 'ring-2 ring-purple-300 bg-purple-100' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Calendar className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">Appuntamento</h4>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('Sinistri')}
                    className={`bg-red-50 hover:bg-red-100 rounded-xl p-4 text-left transition-all duration-200 transform hover:scale-[1.02] hover:shadow-sm border border-transparent hover:border-gray-200 group ${
                      activeShortcut === 'Sinistri' ? 'ring-2 ring-red-300 bg-red-100' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">Sinistro</h4>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('Clienti')}
                    className={`bg-orange-50 hover:bg-orange-100 rounded-xl p-4 text-left transition-all duration-200 transform hover:scale-[1.02] hover:shadow-sm border border-transparent hover:border-gray-200 group ${
                      activeShortcut === 'Clienti' ? 'ring-2 ring-orange-300 bg-orange-100' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">Cliente</h4>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('Amministrazione')}
                    className={`bg-indigo-50 hover:bg-indigo-100 rounded-xl p-4 text-left transition-all duration-200 transform hover:scale-[1.02] hover:shadow-sm border border-transparent hover:border-gray-200 group ${
                      activeShortcut === 'Amministrazione' ? 'ring-2 ring-indigo-300 bg-indigo-100' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Clock className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">Traccia Tempo</h4>
                      </div>
                    </div>
                  </button>
                </div>
                
                {/* Suggerimento scorciatoie con animazione migliorata */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center">
                      <BarChart3 className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-blue-900">Scorciatoie Tastiera</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-white rounded-md text-xs font-mono shadow-sm border border-gray-200">Ctrl+N</kbd> 
                      <span>Chiamata</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-white rounded-md text-xs font-mono shadow-sm border border-gray-200">Ctrl+Q</kbd> 
                      <span>Preventivo</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-white rounded-md text-xs font-mono shadow-sm border border-gray-200">Ctrl+A</kbd> 
                      <span>Appuntamento</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-white rounded-md text-xs font-mono shadow-sm border border-gray-200">Ctrl+S</kbd> 
                      <span>Sinistro</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-white rounded-md text-xs font-mono shadow-sm border border-gray-200">Ctrl+F</kbd> 
                      <span>Cliente</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-white rounded-md text-xs font-mono shadow-sm border border-gray-200">Ctrl+T</kbd> 
                      <span>Tempo</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Widget analytics aggiuntivo quando attivo */}
              {showAnalytics && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    Insights Rapidi
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Produttività</span>
                      <span className="text-sm font-medium text-green-600">+15%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tempo Medio</span>
                      <span className="text-sm font-medium text-blue-600">2.5h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Efficienza</span>
                      <span className="text-sm font-medium text-purple-600">85%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button migliorato per mobile */}
      <div className="fixed bottom-6 right-6 xl:hidden z-50">
        <div className="flex flex-col items-end space-y-3">
          {/* Pulsante Analytics per mobile */}
          <Button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="w-12 h-12 rounded-full shadow-lg bg-gray-600 hover:bg-gray-700 transition-all duration-200"
            size="sm"
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
          
          {/* Pulsante principale */}
          <Button
            onClick={handleNewTask}
            className="w-16 h-16 rounded-full shadow-xl hover:shadow-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-110"
            size="sm"
          >
            <Plus className="h-7 w-7" />
          </Button>
        </div>
      </div>

      {/* Modal attività */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
        preselectedCategory={preselectedCategory}
        preselectedDate={selectedDate || undefined}
      />
    </div>
  );
}