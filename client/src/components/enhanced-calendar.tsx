import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Task } from "@shared/schema";

interface EnhancedCalendarProps {
  onDateClick?: (date: string) => void;
  onTaskClick?: (task: Task) => void;
}

export default function EnhancedCalendar({ onDateClick, onTaskClick }: EnhancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Fetch tasks from API
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Memoized calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    // Get first day of month and how many days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
    
    // Get previous month's last days
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    
    const days = [];
    
    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      days.push({
        day: day.toString(),
        date: date.toISOString().split('T')[0],
        isCurrentMonth: false,
        isToday: false,
        isPast: date < today,
        tasks: []
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      // Filter tasks for this date
      const dayTasks = allTasks.filter(task => task.dueDate === dateStr);
      
      days.push({
        day: day.toString(),
        date: dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isPast: date < today,
        tasks: dayTasks
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days = 42
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        day: day.toString(),
        date: date.toISOString().split('T')[0],
        isCurrentMonth: false,
        isToday: false,
        isPast: date < today,
        tasks: []
      });
    }
    
    return days;
  }, [currentDate, allTasks]);

  const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ];

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    onDateClick?.(date);
  };

  const getTaskTypeColor = (category: string, status: string) => {
    if (status === 'overdue') return 'bg-red-500';
    if (status === 'completed') return 'bg-green-500';
    
    switch (category) {
      case 'calls': return 'bg-blue-500';
      case 'quotes': return 'bg-green-500';
      case 'claims': return 'bg-red-500';
      case 'documents': return 'bg-yellow-500';
      case 'appointments': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'high') return <AlertTriangle className="w-3 h-3" />;
    if (priority === 'medium') return <Clock className="w-3 h-3" />;
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <Button variant="ghost" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 text-xs text-center">
          {["L", "M", "M", "G", "V", "S", "D"].map((day, index) => (
            <div key={index} className="p-2 text-gray-500 font-medium">{day}</div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarData.map((dayData, index) => {
            const hasEvents = dayData.tasks.length > 0;
            const hasOverdue = dayData.tasks.some(task => task.status === 'overdue');
            const hasHighPriority = dayData.tasks.some(task => task.priority === 'high');
            
            return (
              <Popover key={index}>
                <PopoverTrigger asChild>
                  <div
                    className={`
                      relative p-2 h-10 text-center cursor-pointer text-sm rounded transition-all
                      ${dayData.isToday 
                        ? "bg-blue-600 text-white font-bold" 
                        : dayData.isCurrentMonth
                        ? "text-gray-900 hover:bg-gray-100"
                        : "text-gray-400"
                      }
                      ${hasEvents && dayData.isCurrentMonth ? "ring-2 ring-blue-200" : ""}
                      ${hasOverdue ? "ring-red-300" : ""}
                    `}
                    onClick={() => handleDayClick(dayData.date, dayData.isCurrentMonth)}
                  >
                    <span className="relative z-10">{dayData.day}</span>
                    
                    {/* Event indicators */}
                    {hasEvents && dayData.isCurrentMonth && (
                      <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-0.5">
                        {dayData.tasks.slice(0, 3).map((task, taskIndex) => (
                          <div
                            key={taskIndex}
                            className={`w-1.5 h-1.5 rounded-full ${getTaskTypeColor(task.category, task.status)}`}
                            title={task.title}
                          />
                        ))}
                        {dayData.tasks.length > 3 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" title={`+${dayData.tasks.length - 3} more`} />
                        )}
                      </div>
                    )}
                    
                    {/* Priority indicator */}
                    {hasHighPriority && dayData.isCurrentMonth && (
                      <div className="absolute top-0 right-0 text-red-500">
                        <AlertTriangle className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </PopoverTrigger>
                
                {/* Popover with day details */}
                {hasEvents && (
                  <PopoverContent className="w-80 p-3" align="center">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">
                          {new Date(dayData.date).toLocaleDateString('it-IT', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDateClick?.(dayData.date)}
                          className="h-6 px-2 text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Aggiungi
                        </Button>
                      </div>
                      
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {dayData.tasks.map((task, taskIndex) => (
                          <div
                            key={taskIndex}
                            className="flex items-start space-x-2 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={() => onTaskClick?.(task)}
                          >
                            <div className={`w-3 h-3 rounded-full mt-0.5 ${getTaskTypeColor(task.category, task.status)}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {task.title}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                {task.dueTime && (
                                  <span className="text-xs text-gray-500">
                                    {task.dueTime}
                                  </span>
                                )}
                                {task.client && (
                                  <span className="text-xs text-gray-500">
                                    {task.client}
                                  </span>
                                )}
                                <Badge 
                                  variant={task.status === 'overdue' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {task.status === 'overdue' ? 'In ritardo' : 
                                   task.status === 'completed' ? 'Completata' : 
                                   task.priority === 'high' ? 'Alta' : 
                                   task.priority === 'medium' ? 'Media' : 'Bassa'}
                                </Badge>
                              </div>
                            </div>
                            {getPriorityIcon(task.priority)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                )}
              </Popover>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Chiamate</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Preventivi</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Sinistri</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Documenti</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Appuntamenti</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}