import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, Phone, ListTodo } from "lucide-react";
import type { TaskStats } from "@/lib/types";

export default function DashboardStats() {
  const { data: stats, isLoading } = useQuery<TaskStats>({
    queryKey: ["/api/tasks/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-300 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-12"></div>
              </div>
              <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Attività Oggi",
      value: stats?.total || 0,
      icon: ListTodo,
      color: "bg-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "In Scadenza",
      value: stats?.dueToday || 0,
      icon: Clock,
      color: "bg-orange-500",
      bgColor: "bg-orange-50"
    },
    {
      title: "Completate",
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: "bg-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Clienti Contattati",
      value: stats?.pending || 0,
      icon: Phone,
      color: "bg-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
              <card.icon className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
