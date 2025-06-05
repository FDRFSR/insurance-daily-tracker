import { useQuery } from "@tanstack/react-query";
import { BarChart3, PieChart, Activity, Clock } from "lucide-react";
import type { TaskStats } from "@/lib/types";

// Mock data per demo - in futuro potrà essere sostituito con dati reali dall'API
const mockWeeklyData = [
  { day: 'Lun', completed: 8, total: 10 },
  { day: 'Mar', completed: 12, total: 15 },
  { day: 'Mer', completed: 6, total: 8 },
  { day: 'Gio', completed: 9, total: 12 },
  { day: 'Ven', completed: 7, total: 10 },
  { day: 'Sab', completed: 4, total: 5 },
  { day: 'Dom', completed: 3, total: 4 }
];

const mockCategoryData = [
  { category: 'Chiamate', count: 12, color: 'bg-blue-500' },
  { category: 'Preventivi', count: 8, color: 'bg-green-500' },
  { category: 'Sinistri', count: 5, color: 'bg-red-500' },
  { category: 'Documenti', count: 7, color: 'bg-purple-500' },
  { category: 'Appuntamenti', count: 3, color: 'bg-orange-500' }
];

// Componente per grafico a barre settimanale
const WeeklyBarChart = () => {
  const maxTotal = Math.max(...mockWeeklyData.map(d => d.total));
  
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Attività Settimanali</h3>
          <p className="text-sm text-gray-600">Completate vs Totali</p>
        </div>
        <BarChart3 className="h-6 w-6 text-blue-600" />
      </div>
      
      <div className="space-y-4">
        {mockWeeklyData.map((data, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-8 text-sm font-medium text-gray-600">{data.day}</div>
            <div className="flex-1 flex items-center space-x-2">
              {/* Barra totale */}
              <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                {/* Barra completate */}
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${(data.completed / data.total) * 100}%` }}
                ></div>
                {/* Indicatore del totale */}
                <div 
                  className="absolute top-0 right-0 w-1 h-full bg-gray-400"
                  style={{ right: `${100 - (data.total / maxTotal) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 min-w-fit">
                {data.completed}/{data.total}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Media completamento</span>
          <span className="font-semibold text-green-600">
            {Math.round((mockWeeklyData.reduce((acc, d) => acc + (d.completed / d.total), 0) / mockWeeklyData.length) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// Componente per distribuzione per categoria
const CategoryDistribution = () => {
  const total = mockCategoryData.reduce((acc, item) => acc + item.count, 0);
  
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Distribuzione Attività</h3>
          <p className="text-sm text-gray-600">Per categoria</p>
        </div>
        <PieChart className="h-6 w-6 text-purple-600" />
      </div>
      
      <div className="space-y-4">
        {mockCategoryData.map((item, index) => {
          const percentage = (item.count / total) * 100;
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{item.category}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all duration-500 ease-in-out`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 min-w-fit">{item.count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Totale attività</span>
          <span className="font-semibold text-blue-600">{total}</span>
        </div>
      </div>
    </div>
  );
};

// Componente per metriche di performance
const PerformanceMetrics = () => {
  const { data: stats } = useQuery<TaskStats>({
    queryKey: ["/api/tasks/stats"],
  });

  const metrics = [
    {
      title: "Tempo Medio",
      value: "2.5h",
      change: "+12%",
      trend: "up" as const,
      icon: Clock,
      color: "text-blue-600"
    },
    {
      title: "Efficienza",
      value: "85%",
      change: "+5%", 
      trend: "up" as const,
      icon: Activity,
      color: "text-green-600"
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
          <p className="text-sm text-gray-600">Metriche chiave</p>
        </div>
        <Activity className="h-6 w-6 text-green-600" />
      </div>
      
      <div className="space-y-6">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{metric.title}</p>
                <p className="text-xs text-gray-500">Ultimo aggiornamento</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{metric.value}</p>
              <p className={`text-xs ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {metric.change}
              </p>
            </div>
          </div>
        ))}
        
        {/* Grafico a linee semplificato */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex justify-between items-end h-16 space-x-1">
            {[40, 65, 45, 80, 60, 75, 85].map((height, index) => (
              <div key={index} className="flex-1 flex flex-col justify-end">
                <div 
                  className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-500"
                  style={{ height: `${height}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>7g fa</span>
            <span>Oggi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <WeeklyBarChart />
      <CategoryDistribution />
      <PerformanceMetrics />
    </div>
  );
}

export { WeeklyBarChart, CategoryDistribution, PerformanceMetrics };
