import { Plus } from "lucide-react";
import { useState } from "react";
import Header from "@/components/header";
import DashboardStats from "@/components/dashboard-stats";
import TaskList from "@/components/task-list";
import Sidebar from "@/components/sidebar";
import TaskModal from "@/components/task-modal";
import { Button } from "@/components/ui/button";
import type { Task } from "@shared/schema";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<string | undefined>(undefined); // 🎯 Nuovo stato per categoria preselezionata

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setPreselectedCategory(undefined); // Reset categoria quando modifichiamo
    setIsModalOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setPreselectedCategory(undefined); // Reset categoria per nuova attività normale
    setIsModalOpen(true);
  };

  const handleDateSelect = (date: string | null) => {
    setSelectedDate(date);
  };

  // 🎯 Nuovo handler per le azioni rapide dalla sidebar
  const handleQuickAction = (category: string) => {
    setEditingTask(null); // Assicurati che non stiamo modificando
    setPreselectedCategory(category); // Imposta la categoria
    setIsModalOpen(true); // Apri il modal
  };

  // 🎯 Handler per chiudere il modal e resettare tutto
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setPreselectedCategory(undefined); // Reset categoria quando chiudiamo
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <TaskList 
            onTaskEdit={handleTaskEdit} 
            selectedDate={selectedDate}
          />
          <Sidebar 
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
            onQuickAction={handleQuickAction} // 🎯 Passa l'handler per le azioni rapide
          />
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <Button
        onClick={handleNewTask}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl lg:hidden z-40 bg-blue-600 hover:bg-blue-700"
        size="sm"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal} // 🎯 Usa il nuovo handler che resetta tutto
        task={editingTask}
        preselectedCategory={preselectedCategory} // 🎯 Passa la categoria preselezionata
        preselectedDate={selectedDate || undefined} // 🎯 Converti null a undefined per TypeScript
      />
    </div>
  );
}