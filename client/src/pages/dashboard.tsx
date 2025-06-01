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

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleDateSelect = (date: string | null) => {
    setSelectedDate(date);
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
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
      />
    </div>
  );
}