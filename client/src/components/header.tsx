import { Bell, Shield, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TaskStats } from "@/lib/types";
import type { Task } from "@shared/schema";

export default function Header() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: stats } = useQuery<TaskStats>({
    queryKey: ["/api/tasks/stats"],
  });

  // Query per le attività in scadenza e in ritardo (filtrate)
  const { data: urgentTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks", "status=overdue"],
    select: (tasks) => {
      // Filtra le notifiche nascoste
      return tasks.filter(task => !dismissedNotifications.has(task.id));
    }
  });

  const { data: todayTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    select: (tasks) => {
      const today = new Date().toISOString().split('T')[0];
      return tasks.filter(task => 
        task.dueDate === today && 
        !task.completed && 
        !dismissedNotifications.has(task.id) // Filtra anche qui
      );
    }
  });

  // State per tenere traccia delle notifiche nascoste
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<number>>(new Set());

  // Mutation per nascondere le notifiche (senza completare l'attività)
  const dismissNotificationMutation = useMutation({
    mutationFn: async (taskId: number) => {
      // Nascondiamo la notifica solo localmente
      return Promise.resolve(taskId);
    },
    onSuccess: (taskId) => {
      // Aggiungi l'ID alle notifiche nascoste
      setDismissedNotifications(prev => new Set([...prev, taskId]));
      
      toast({
        title: "Notifica nascosta",
        description: "La notifica è stata rimossa. L'attività rimane attiva.",
      });
    }
  });

  const overdueCount = stats?.overdue || 0;
  const totalNotifications = overdueCount + (todayTasks?.length || 0);

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time;
  };

  const handleDismissNotification = (taskId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    dismissNotificationMutation.mutate(taskId);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="text-white h-4 w-4" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">InsuraTask</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalNotifications}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifiche</h3>
                  {totalNotifications > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Clicca ✕ per nascondere la notifica
                    </p>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {urgentTasks.length === 0 && todayTasks.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      Nessuna notifica
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {/* Attività in ritardo */}
                      {urgentTasks.map((task) => (
                        <div key={`overdue-${task.id}`} className="p-3 hover:bg-red-50 group">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                              <p className="text-xs text-red-600 font-medium">IN RITARDO</p>
                              {task.client && (
                                <p className="text-xs text-gray-600">Cliente: {task.client}</p>
                              )}
                            </div>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                onClick={(e) => handleDismissNotification(task.id, e)}
                                title="Nascondi notifica"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Attività di oggi */}
                      {todayTasks.map((task) => (
                        <div key={`today-${task.id}`} className="p-3 hover:bg-orange-50 group">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                              <p className="text-xs text-orange-600 font-medium">
                                OGGI {formatTime(task.dueTime)}
                              </p>
                              {task.client && (
                                <p className="text-xs text-gray-600">Cliente: {task.client}</p>
                              )}
                            </div>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                onClick={(e) => handleDismissNotification(task.id, e)}
                                title="Nascondi notifica"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">MR</span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                Marco Rossi
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}