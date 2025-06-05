import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, Phone, ListTodo, TrendingUp, Users, Calendar, AlertTriangle } from "lucide-react";
import type { TaskStats } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Componente per il grafico di progresso circolare
const CircularProgress = ({ percentage, size = 60, strokeWidth = 4 }: { percentage: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-600 transition-all duration-500 ease-in-out"
        />
      </svg>
      <span className="absolute text-sm font-semibold text-gray-700">
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

// Componente per mini chart trend
const TrendIndicator = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  const colors = {
    up: 'text-green-500',
    down: 'text-red-500',
    stable: 'text-gray-400'
  };
  
  return (
    <div className={`flex items-center text-xs ${colors[trend]}`}>
      <TrendingUp className={`h-3 w-3 mr-1 ${trend === 'down' ? 'rotate-180' : ''} ${trend === 'stable' ? 'rotate-90' : ''}`} />
      <span>{trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '0%'}</span>
    </div>
  );
};

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery<TaskStats>({
    queryKey: ["/api/tasks/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6 mb-8">
        {/* Skeleton per la card principale */}
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-6 bg-gray-300 rounded w-48"></div>
              <div className="h-10 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          </div>
        </div>
        
        {/* Skeleton per le card delle statistiche */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                  <div className="h-8 bg-gray-300 rounded w-12"></div>
                </div>
                <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalTasks = stats?.total || 0;
  const completedTasks = stats?.completed || 0;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const statCards = [
    {
      title: "Attività Oggi",
      value: stats?.total || 0,
      icon: ListTodo,
      color: "bg-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      trend: 'up' as const
    },
    {
      title: "In Scadenza",
      value: stats?.dueToday || 0,
      icon: Clock,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-500",
      trend: 'down' as const
    },
    {
      title: "Completate",
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: "bg-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      trend: 'up' as const
    },
    {
      title: "In Attesa",
      value: stats?.pending || 0,
      icon: AlertTriangle,
      color: "bg-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      trend: 'stable' as const
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6 mb-8">
        {/* Card principale con overview */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium text-blue-100">Benvenuto nella tua Dashboard</h2>
                <h3 className="text-3xl font-bold">Produttività Oggi</h3>
              </div>
              <div className="flex items-center space-x-8">
                <div>
                  <p className="text-sm text-blue-200">Tasso di Completamento</p>
                  <p className="text-2xl font-bold">{Math.round(completionRate)}%</p>
                </div>
                <div>
                  <p className="text-sm text-blue-200">Attività Gestite</p>
                  <p className="text-2xl font-bold">{totalTasks}</p>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
              <CircularProgress percentage={completionRate} size={80} strokeWidth={6} />
            </div>
          </div>
        </div>

        {/* Grid delle statistiche dettagliate */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {statCards.map((card, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 flex flex-col items-center gap-2 transition-all duration-150 cursor-pointer hover:shadow-lg">
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                    </div>
                    <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                      <card.icon className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <span>
                  {(() => {
                    switch (card.title) {
                      case "Attività Oggi":
                        return "Numero totale di attività pianificate per oggi.";
                      case "In Scadenza":
                        return "Attività che scadono oggi e richiedono attenzione immediata.";
                      case "Completate":
                        return "Attività completate fino ad ora.";
                      case "Clienti Contattati":
                        return "Numero di clienti contattati di recente.";
                      default:
                        return card.title;
                    }
                  })()}
                </span>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Widget aggiuntivi */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick stats */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Attività Settimanali</h4>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Lunedì</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-blue-500 rounded-full"></div>
                  </div>
                  <span className="text-xs text-gray-500">6/8</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Martedì</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-green-500 rounded-full"></div>
                  </div>
                  <span className="text-xs text-gray-500">8/8</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Oggi</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-orange-500 rounded-full"></div>
                  </div>
                  <span className="text-xs text-gray-500">{completedTasks}/{totalTasks}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance widget */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Performance</h4>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <CircularProgress percentage={completionRate} size={60} />
                <p className="text-sm text-gray-600 mt-2">Efficienza Giornaliera</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">{completedTasks}</p>
                  <p className="text-xs text-gray-500">Completate</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-600">{totalTasks - completedTasks}</p>
                  <p className="text-xs text-gray-500">Rimanenti</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Azioni Rapide</h4>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors duration-200 group">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 group-hover:text-blue-700">Nuova Chiamata</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors duration-200 group">
                <div className="flex items-center space-x-3">
                  <ListTodo className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900 group-hover:text-green-700">Nuova Attività</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors duration-200 group">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900 group-hover:text-purple-700">Programma Follow-up</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
