import { BarChart3, ListTodo, Users } from "lucide-react";
import Header from "@/components/header";
import DashboardStats from "@/components/dashboard-stats";
import DashboardCharts from "@/components/dashboard-charts";
import { useQuery } from "@tanstack/react-query";
import type { Task } from "@shared/schema";

interface RecentTask {
  title: string;
  dueDate: string;
}
interface RecentClient {
  name: string;
  initials: string;
  lastContact: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getLastContact(dateStr: string) {
  if (!dateStr) return "-";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Oggi";
  if (diffDays === 1) return "Ieri";
  return `${diffDays} giorni fa`;
}

export default function DashboardOverviewPage() {
  // Recupera tutte le task
  const { data: allTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  // Attività recenti: ultime 5 completate o in scadenza
  const recentTasks: RecentTask[] = allTasks
    .filter((t) => t.completed || t.status === "overdue" || t.status === "pending")
    .sort((a, b) => {
      // Più recenti prima (per completate: completedAt, altrimenti dueDate)
      const dateA = new Date(a.completedAt || a.dueDate || a.createdAt);
      const dateB = new Date(b.completedAt || b.dueDate || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5)
    .map((t) => ({
      title: t.title,
      dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-",
    }));

  // Clienti recenti: ultimi 5 clienti unici per data attività
  const clientMap = new Map<string, { name: string; lastContact: string; initials: string }>();
  allTasks
    .filter((t) => t.client && t.client.trim() !== "")
    .sort((a, b) => {
      // Più recenti prima (per attività del cliente)
      const dateA = new Date(a.dueDate || a.createdAt);
      const dateB = new Date(b.dueDate || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    })
    .forEach((t) => {
      if (!clientMap.has(t.client!)) {
        const lastContactDate = t.dueDate || t.createdAt;
        clientMap.set(t.client!, {
          name: t.client!,
          initials: getInitials(t.client!),
          lastContact: getLastContact(typeof lastContactDate === "string" ? lastContactDate : lastContactDate.toISOString()),
        });
      }
    });
  const recentClients: RecentClient[] = Array.from(clientMap.values()).slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <Header />
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* Sezione statistiche principali */}
        <section aria-labelledby="stats-heading">
          <h1 id="stats-heading" className="sr-only">Statistiche principali</h1>
          <DashboardStats />
        </section>
        <hr className="my-2 border-gray-200" />
        {/* Sezione analytics avanzate */}
        <section aria-labelledby="analytics-heading" className="space-y-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h2 id="analytics-heading" className="text-lg font-semibold text-gray-900 tracking-tight">Analytics Avanzate</h2>
          </div>
          <DashboardCharts />
        </section>
        <hr className="my-2 border-gray-200" />

        <section aria-label="Riepiloghi rapidi" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attività Recenti */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[180px]">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                <ListTodo className="h-5 w-5 text-blue-600" />
              </span>
              <h2 id="recent-tasks-heading" className="text-lg font-semibold text-gray-900">Attività Recenti Chiave</h2>
              <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700 font-medium">{recentTasks.length}</span>
            </div>
            {recentTasks.length === 0 ? (
              <p className="text-gray-400 text-sm">Nessuna attività recente da mostrare.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentTasks.map((task, idx) => (
                  <li key={idx} className="py-2 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-medium text-gray-800">{task.title}</span>
                    <span className="ml-auto text-xs text-gray-500">{task.dueDate}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Clienti Recenti */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col min-h-[180px]">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </span>
              <h2 id="recent-clients-heading" className="text-lg font-semibold text-gray-900">Clienti Recenti</h2>
              <span className="ml-2 px-2 py-0.5 text-xs rounded bg-purple-50 text-purple-700 font-medium">{recentClients.length}</span>
            </div>
            {recentClients.length === 0 ? (
              <p className="text-gray-400 text-sm">Nessun cliente recente da mostrare.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentClients.map((client, idx) => (
                  <li key={idx} className="py-2 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-bold">
                      {client.initials}
                    </span>
                    <span className="font-medium text-gray-800">{client.name}</span>
                    <span className="ml-auto text-xs text-gray-500">{client.lastContact}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
