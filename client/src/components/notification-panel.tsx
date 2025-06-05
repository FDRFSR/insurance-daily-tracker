import { Bell, CheckCircle, Clock, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Mock notifications per demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Scadenza Imminente',
    message: 'La polizza di Mario Rossi scade tra 3 giorni',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    action: {
      label: 'Visualizza',
      onClick: () => console.log('Visualizza polizza')
    }
  },
  {
    id: '2',
    type: 'success',
    title: 'Chiamata Completata',
    message: 'Contatto con successo con Maria Bianchi',
    timestamp: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: '3',
    type: 'info',
    title: 'Nuovo Preventivo',
    message: 'Richiesta preventivo auto da Giovanni Verdi',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    action: {
      label: 'Prepara',
      onClick: () => console.log('Prepara preventivo')
    }
  }
];

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    info: Bell,
    error: AlertTriangle
  };
  
  const colors = {
    success: "text-green-600",
    warning: "text-orange-600", 
    info: "text-blue-600",
    error: "text-red-600"
  };
  
  const Icon = icons[type];
  return <Icon className={`h-5 w-5 ${colors[type]}`} />;
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ora';
  if (diffInMinutes < 60) return `${diffInMinutes}m fa`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h fa`;
  return `${Math.floor(diffInMinutes / 1440)}g fa`;
};
