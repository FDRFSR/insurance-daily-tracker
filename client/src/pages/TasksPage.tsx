import { useState } from "react";
import TaskList from "@/components/task-list";
import TaskModal from "@/components/task-modal";
import type { Task } from "@shared/schema";
import EnhancedCalendar from "@/components/enhanced-calendar";
import GoogleCalendarIntegration from "@/components/calendar/GoogleCalendarIntegration";

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const openModal = (task: Task | null = null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleTaskEdit = (task: Task) => openModal(task);
  const handleDateSelect = (date: string) => {
    // Toggle behavior: if clicking the same date, deselect it
    setSelectedDate(selectedDate === date ? null : date);
  };
  
  const handleDateTaskCreate = (date: string) => {
    // Open task modal with preselected date
    setSelectedDate(date);
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header della Pagina Attività */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gestione Attività</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Lista delle attività */}
        <div className="xl:col-span-3 space-y-6">
          <TaskList 
            onTaskEdit={handleTaskEdit} 
            selectedDate={selectedDate}
            searchQuery={searchQuery}
          />
        </div>
         {/* Sidebar con calendario e Google Calendar Integration */}
        <div className="xl:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* Enhanced Calendar con Google Calendar Integration */}
            <EnhancedCalendar 
              onDateClick={handleDateSelect}
              onTaskClick={handleTaskEdit}
            />

            {/* Google Calendar Integration */}
            <GoogleCalendarIntegration className="mt-6" />
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
    </div>
  );
}
