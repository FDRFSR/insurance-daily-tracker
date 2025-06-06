// client/src/App.tsx
import React from 'react';
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/contexts/UserContext";
import DashboardOverviewPage from "@/pages/DashboardOverviewPage";
import TasksPage from "@/pages/TasksPage";
import { TemplatesPage } from "@/pages/templates";
import NotFound from "@/pages/not-found";
import FileUploader from './components/attachments/FileUploader';
import AttachmentList from './components/attachments/AttachmentList';

function AttachmentsDemo() {
  const [lastUpload, setLastUpload] = React.useState<any>(null);
  const [taskId, setTaskId] = React.useState('demo-task-1');
  return (
    <div style={{ padding: 24 }}>
      <h2>Demo Allegati per Task</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Task ID:&nbsp;</label>
        <input value={taskId} onChange={e => setTaskId(e.target.value)} style={{ padding: 4 }} />
      </div>
      <FileUploader taskId={taskId} onUploadSuccess={setLastUpload} />
      {lastUpload && (
        <div style={{ color: 'green' }}>File caricato: {lastUpload.originalname}</div>
      )}
      <AttachmentList taskId={taskId} />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardOverviewPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/attachments-demo" component={AttachmentsDemo} />
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
            <a href="/templates" className="font-medium text-blue-700 hover:underline">Templates</a>
            <a href="/attachments-demo" className="font-medium text-blue-700 hover:underline">Allegati</a>
          </nav>
          <Toaster />
          <Router />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;