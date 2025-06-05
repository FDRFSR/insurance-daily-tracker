import { useState, useEffect } from "react";
import { 
  Phone, 
  Calculator, 
  FileText, 
  Calendar, 
  Users, 
  Clock,
  Plus,
  Zap,
  BarChart3,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  action: () => void;
  shortcut?: string;
  category?: string;
}

interface QuickActionsProps {
  onQuickAction?: (category: string) => void;
}

export default function QuickActions({ onQuickAction }: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'new-call',
      title: 'Nuova Chiamata',
      description: 'Registra una chiamata cliente',
      icon: Phone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      action: () => onQuickAction?.('Chiamate'),
      shortcut: 'Ctrl+N',
      category: 'Chiamate'
    },
    {
      id: 'new-quote',
      title: 'Nuovo Preventivo',
      description: 'Crea un preventivo personalizzato',
      icon: Calculator,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      action: () => onQuickAction?.('Preventivi'),
      shortcut: 'Ctrl+Q',
      category: 'Preventivi'
    },
    {
      id: 'schedule-appointment',
      title: 'Programma Appuntamento',
      description: 'Pianifica un incontro con il cliente',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      action: () => onQuickAction?.('Appuntamenti'),
      shortcut: 'Ctrl+A',
      category: 'Appuntamenti'
    },
    {
      id: 'client-lookup',
      title: 'Cerca Cliente',
      description: 'Trova informazioni cliente',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      action: () => onQuickAction?.('Clienti'),
      shortcut: 'Ctrl+F',
      category: 'Clienti'
    },
    {
      id: 'claim-report',
      title: 'Nuovo Sinistro',
      description: 'Registra un nuovo sinistro',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
      action: () => onQuickAction?.('Sinistri'),
      shortcut: 'Ctrl+S',
      category: 'Sinistri'
    },
    {
      id: 'time-tracking',
      title: 'Traccia Tempo',
      description: 'Avvia tracking temporale attività',
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      action: () => onQuickAction?.('Amministrazione'),
      shortcut: 'Ctrl+T',
      category: 'Amministrazione'
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const action = quickActions.find(a => {
          const key = a.shortcut?.split('+')[1].toLowerCase();
          return key === event.key.toLowerCase();
        });
        if (action) {
          event.preventDefault();
          action.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickActions, onQuickAction]);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Azioni Rapide</h3>
            <p className="text-sm text-gray-600">Accelera il tuo workflow</p>
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

      <div className={`grid gap-3 transition-all duration-300 ${
        isExpanded ? 'grid-cols-1' : 'grid-cols-2'
      }`}>
        {quickActions.slice(0, isExpanded ? quickActions.length : 4).map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`
              ${action.bgColor} 
              rounded-xl p-4 text-left transition-all duration-200 
              transform hover:scale-[1.02] hover:shadow-sm
              border border-transparent hover:border-gray-200
              group
            `}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.icon className={`h-4 w-4 ${action.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {action.title}
                </h4>
                {isExpanded && (
                  <>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {action.description}
                    </p>
                    {action.shortcut && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-white/60 text-xs font-mono text-gray-500 border">
                          {action.shortcut}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {!isExpanded && quickActions.length > 4 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(true)}
            className="w-full text-gray-600 hover:text-gray-800"
          >
            Visualizza altre {quickActions.length - 4} azioni
          </Button>
        </div>
      )}

      {/* Floating shortcut panel */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <div className="flex items-center space-x-2 mb-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">Suggerimento</span>
        </div>
        <p className="text-xs text-blue-700">
          Usa le scorciatoie da tastiera per velocizzare il tuo lavoro. 
          Premi <kbd className="px-1 py-0.5 bg-white rounded text-xs">?</kbd> per vedere tutte le scorciatoie.
        </p>
      </div>
    </div>
  );
}
