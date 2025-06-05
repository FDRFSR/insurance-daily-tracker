import { useState, useEffect } from "react";
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

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isExpanded, setIsExpanded] = useState(false);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.length;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-600" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{unreadCount}</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Notifiche</h3>
            <p className="text-sm text-gray-600">{unreadCount} non lette</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-gray-600"
        >
          {isExpanded ? 'Riduci' : 'Espandi'}
        </Button>
      </div>

      <div className={`space-y-3 transition-all duration-300 ${isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-60 overflow-hidden'}`}>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nessuna notifica</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="bg-gray-50 rounded-lg p-4 transition-all duration-200 hover:bg-gray-100 group">
              <div className="flex items-start space-x-3">
                <NotificationIcon type={notification.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatTimeAgo(notification.timestamp)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {notification.action && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={notification.action.onClick}
                      className="mt-3"
                    >
                      {notification.action.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotifications([])}
            className="w-full text-gray-600 hover:text-gray-800"
          >
            Cancella tutte
          </Button>
        </div>
      )}
    </div>
  );
}
