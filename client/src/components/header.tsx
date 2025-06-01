// client/src/components/header.tsx
import { Bell, Shield, Check, X, User, Settings, LogOut, Palette } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser, useUserActions, useUserPreferences } from "@/contexts/UserContext";
import type { TaskStats } from "@/lib/types";
import type { Task } from "@shared/schema";

// Funzione per generare iniziali dal nome
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Funzione per generare colore avatar basato sul nome
const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-red-600', 
    'bg-yellow-600', 'bg-indigo-600', 'bg-pink-600', 'bg-teal-600'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function Header() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<number>>(new Set());
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 🎯 Usa il Context per ottenere i dati utente
  const { user, isLoading: userLoading } = useUser();
  const { logout, changeTheme } = useUserActions();
  const { theme } = useUserPreferences();
  
  const { data: stats } = useQuery<TaskStats>({
    queryKey: ["/api/tasks/stats"],
  });

  // Query per le attività urgenti
  const { data: allUrgentTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks", "status=overdue"],
  });

  const { data: allTodayTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    select: (tasks) => {
      const today = new Date().toISOString().split('T')[0];
      return tasks.filter(task => 
        task.dueDate === today && !task.completed
      );
    }
  });

  // Filtra localmente le notifiche nascoste
  const urgentTasks = allUrgentTasks.filter(task => !dismissedNotifications.has(task.id));
  const todayTasks = allTodayTasks.filter(task => !dismissedNotifications.has(task.id));

  const dismissNotificationMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return Promise.resolve(taskId);
    },
    onSuccess: (taskId) => {
      setDismissedNotifications(prev => {
        const newSet = new Set(prev);
        newSet.add(taskId);
        return newSet;
      });
      
      toast({
        title: "Notifica nascosta",
        description: "La notifica è stata rimossa. L'attività rimane attiva.",
      });
    }
  });

  const overdueCount = urgentTasks.length;
  const totalNotifications = overdueCount + (todayTasks?.length || 0);

  const formatTime = (time: string | null) => {
    if (!time) return "";
    return time;
  };

  const handleDismissNotification = (taskId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    dismissNotificationMutation.mutate(taskId);
  };

  const handleProfileAction = (action: string) => {
    switch (action) {
      case 'profile':
        toast({
          title: "Profilo",
          description: `Profilo di ${user?.name}`,
        });
        break;
      case 'settings':
        toast({
          title: "Impostazioni",
          description: "Funzionalità impostazioni in sviluppo",
        });
        break;
      case 'theme':
        const newTheme = theme === 'light' ? 'dark' : 'light';
        changeTheme(newTheme);
        toast({
          title: "Tema cambiato",
          description: `Tema impostato su ${newTheme === 'light' ? 'chiaro' : 'scuro'}`,
        });
        break;
      case 'logout':
        logout();
        toast({
          title: "Logout effettuato",
          description: "Sei stato disconnesso con successo",
        });
        break;
    }
  };

  // Loading state mentre carica l'utente
  if (userLoading || !user) {
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
            <div className="animate-pulse">
              <div className="w-32 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

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
            {/* Notifications - resta uguale */}
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
            
            {/* 🎯 User Profile Dropdown - Ora completamente dinamico! */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 hover:bg-gray-100 rounded-lg p-2">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className={`w-8 h-8 ${getAvatarColor(user.name)} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-sm font-medium">
                        {getInitials(user.name)}
                      </span>
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-700">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.role}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent className="w-64" align="end">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400">{user.company}</p>
                </div>
                
                <DropdownMenuItem onClick={() => handleProfileAction('profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Il mio profilo</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleProfileAction('settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Impostazioni</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleProfileAction('theme')}>
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Tema: {theme === 'light' ? 'Chiaro' : 'Scuro'}</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => handleProfileAction('logout')}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Esci</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}