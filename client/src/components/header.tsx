import { Bell, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { TaskStats } from "@/lib/types";

export default function Header() {
  const { data: stats } = useQuery<TaskStats>({
    queryKey: ["/api/tasks/stats"],
  });

  const overdueCount = stats?.overdue || 0;

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
            <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              {overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {overdueCount}
                </span>
              )}
            </button>
            
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
