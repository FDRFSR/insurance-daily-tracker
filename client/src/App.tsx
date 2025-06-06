// client/src/App.tsx
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/UserContext";
import DashboardOverviewPage from "@/pages/DashboardOverviewPage";
import TasksPage from "@/pages/TasksPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardOverviewPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 🎯 UserProvider wrappa tutta l'app per condividere lo stato utente */}
      <UserProvider>
        <TooltipProvider>
          {/* Navigazione temporanea */}
          <nav className="w-full bg-white shadow-sm mb-2 px-4 py-2 flex gap-4 rounded-xl">
            <a href="/" className="font-medium text-blue-700 hover:underline">Panoramica</a>
            <a href="/tasks" className="font-medium text-blue-700 hover:underline">Attività</a>
          </nav>
          <Toaster />
          <Router />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;