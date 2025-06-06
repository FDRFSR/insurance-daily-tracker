import { Plus, Download } from "lucide-react";
import { useState } from "react";
import TaskList from "@/components/task-list";
import TaskModal from "@/components/task-modal";
import { Button } from "@/components/ui/button";
import type { Task } from "@shared/schema";
import Sidebar from "@/components/sidebar"; // Assumendo che la sidebar con il calendario sia utile qui
import { ExportModal } from "@/components/export/ExportModal";

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(""); // Potrebbe essere gestito globalmente o passato come prop

  // Unified modal handler
  const openModal = (task: Task | null = null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleTaskEdit = (task: Task) => openModal(task);
  const handleNewTask = () => openModal();
  const handleDateSelect = (date: string | null) => setSelectedDate(date);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  // Funzione per aggiornare la searchQuery, se gestita localmente
  // const handleSearch = (query: string) => setSearchQuery(query);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header della Pagina Attività (opzionale, potrebbe essere parte di un AppHeader globale) */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gestione Attività</h1>
        {/* Input di ricerca potrebbe andare qui o nell'AppHeader */}
        {/* <input 
          type="text" 
          placeholder="Cerca attività..." 
          value={searchQuery} 
          onChange={(e) => handleSearch(e.target.value)}
          className="p-2 border rounded"
        /> */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Esporta
          </Button>
          <Button onClick={handleNewTask}>
            <Plus className="h-5 w-5 mr-2" />
            Nuova Attività
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Lista delle attività */}
        <div className="xl:col-span-3 space-y-6">
          <TaskList 
            onTaskEdit={handleTaskEdit} 
            selectedDate={selectedDate}
            searchQuery={searchQuery} // Passa la searchQuery alla TaskList
          />
        </div>
        
        {/* Sidebar con calendario */}
        <div className="xl:col-span-1">
          <div className="sticky top-6 space-y-6">
            <Sidebar 
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
              // Potremmo voler rimuovere gli "Insights Rapidi" da questa sidebar
              // se la sidebar diventa più generica per la navigazione/calendario
            />
          </div>
        </div>
      </div>

      {/* Modal attività */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
        preselectedDate={selectedDate || undefined}
      />
      
      {/* Modal Export */}
      <ExportModal
        open={isExportModalOpen}
        onOpenChange={setIsExportModalOpen}
      />
    </div>
  );
}
