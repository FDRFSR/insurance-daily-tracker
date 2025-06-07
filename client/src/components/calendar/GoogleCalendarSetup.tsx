/**
 * Google Calendar Setup Component
 * Gestisce OAuth flow e configurazione iniziale account Google
 * 
 * @author InsuraTask v1.1 Sprint 4
 * @created 2025-01-25
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Calendar, User, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface GoogleCalendarConfig {
  isConfigured: boolean;
  syncEnabled: boolean;
  syncDirection: 'import' | 'export' | 'bidirectional';
  calendarId: string;
  lastSyncAt: string | null;
  createdAt: string;
}

interface AuthCallbackData {
  userEmail: string;
  userName: string;
  calendarName: string;
  calendarsAvailable: number;
}

export default function GoogleCalendarSetup() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch current configuration
  const { data: config, isLoading } = useQuery<{ data: GoogleCalendarConfig }>({
    queryKey: ['/api/google-calendar/config'],
    refetchInterval: 5000, // Refresh every 5 seconds during auth flow
  });

  // Auth URL mutation
  const authUrlMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/google-calendar/auth-url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data.authUrl) {
        // Open Google OAuth in new window
        const authWindow = window.open(
          data.data.authUrl,
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Monitor auth window
        const checkAuthWindow = setInterval(() => {
          try {
            if (authWindow?.closed) {
              clearInterval(checkAuthWindow);
              setIsAuthenticating(false);
              // Refresh config to check if auth was successful
              queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/config'] });
            }
          } catch (error) {
            // Window may be cross-origin, ignore errors
          }
        }, 1000);
      }
    },
    onError: (error: Error) => {
      toast.error('Errore durante avvio autenticazione: ' + error.message);
      setIsAuthenticating(false);
    }
  });

  // Revoke authorization mutation
  const revokeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/google-calendar/auth', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to revoke authorization');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Autorizzazione Google Calendar revocata con successo');
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/config'] });
    },
    onError: (error: Error) => {
      toast.error('Errore durante revoca autorizzazione: ' + error.message);
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/google-calendar/test-connection', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Connection test failed');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Connessione attiva - ${data.data.calendarsCount} calendari disponibili`);
      }
    },
    onError: (error: Error) => {
      toast.error('Test connessione fallito: ' + error.message);
    }
  });

  const handleStartAuth = () => {
    setIsAuthenticating(true);
    authUrlMutation.mutate();
  };

  const handleRevokeAuth = () => {
    revokeMutation.mutate();
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Caricamento configurazione...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isConfigured = config?.data?.isConfigured || false;
  const syncEnabled = config?.data?.syncEnabled || false;

  return (
    <div className="space-y-6">
      {/* Main Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Integration
          </CardTitle>
          <CardDescription>
            Sincronizza le tue attività InsuraTask con Google Calendar per una gestione unificata
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConfigured ? (
            // Not configured - show setup
            <div className="space-y-4">
              <Alert className="border-blue-200/50 bg-blue-50/30 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Google Calendar non è ancora configurato. Clicca il pulsante sotto per iniziare il processo di autenticazione.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-medium">Cosa succederà:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Autenticazione sicura con il tuo account Google
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Accesso ai tuoi calendari Google
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Sincronizzazione bidirezionale delle attività
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Gestione automatica conflitti e duplicati
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleStartAuth}
                disabled={isAuthenticating || authUrlMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 shadow-lg transition-all duration-200"
                size="lg"
              >
                {isAuthenticating || authUrlMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Avvio autenticazione...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Connetti Google Calendar
                  </>
                )}
              </Button>

              {isAuthenticating && (
                <Alert className="border-blue-200/50 bg-blue-50/30 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Una finestra di autenticazione Google si è aperta. Completa l'autorizzazione e torna qui.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            // Configured - show status and options
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50/80 to-green-50/40 border border-green-200/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900 dark:text-green-100">
                      Google Calendar Connesso
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Sincronizzazione {syncEnabled ? 'attiva' : 'disattivata'}
                    </div>
                  </div>
                </div>
                <Badge variant={syncEnabled ? 'default' : 'secondary'} className="border-0 shadow-sm">
                  {syncEnabled ? 'Attivo' : 'Disattivato'}
                </Badge>
              </div>

              {/* Configuration Details */}
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Direzione sync:</span>
                  <Badge variant="outline">
                    {config?.data?.syncDirection === 'bidirectional' ? 'Bidirezionale' :
                     config?.data?.syncDirection === 'import' ? 'Solo Import' : 
                     config?.data?.syncDirection === 'export' ? 'Solo Export' : 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ultimo sync:</span>
                  <span>
                    {config?.data?.lastSyncAt 
                      ? new Date(config.data.lastSyncAt).toLocaleString('it-IT')
                      : 'Mai eseguito'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Configurato il:</span>
                  <span>
                    {config?.data?.createdAt 
                      ? new Date(config.data.createdAt).toLocaleDateString('it-IT')
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testConnectionMutation.isPending}
                >
                  {testConnectionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      Test Connessione
                    </>
                  )}
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleRevokeAuth}
                  disabled={revokeMutation.isPending}
                >
                  {revokeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Revocando...
                    </>
                  ) : (
                    'Disconnetti'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {!isConfigured && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configurazione Google Cloud Console</CardTitle>
            <CardDescription>
              Prima di procedere, assicurati di aver configurato un progetto Google Cloud Console
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Passaggi richiesti:</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Vai su <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                  <li>Crea un nuovo progetto o seleziona uno esistente</li>
                  <li>Abilita la Google Calendar API</li>
                  <li>Crea credenziali OAuth 2.0 Client ID</li>
                  <li>Aggiungi http://localhost:3000 come origine autorizzata</li>
                  <li>Configura le variabili d'ambiente nel server</li>
                </ol>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Variabili d'ambiente richieste:</strong><br />
                  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
