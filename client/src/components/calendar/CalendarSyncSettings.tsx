/**
 * Calendar Sync Settings Component
 * Gestisce configurazione opzioni di sincronizzazione Google Calendar
 * 
 * @author InsuraTask v1.1 Sprint 4
 * @created 2025-01-25
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, RefreshCw, AlertCircle, Calendar, Settings2, ArrowLeftRight, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface GoogleCalendarConfig {
  isConfigured: boolean;
  syncEnabled: boolean;
  syncDirection: 'import' | 'export' | 'bidirectional';
  calendarId: string;
  lastSyncAt: string | null;
  createdAt: string;
}

interface CalendarInfo {
  id: string;
  name: string;
  description?: string;
  primary: boolean;
  accessRole: string;
  timeZone: string;
}

interface SyncOptions {
  direction: 'import' | 'export' | 'bidirectional';
  conflictResolution: 'manual' | 'keep_newest' | 'keep_task' | 'keep_event';
  dryRun: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export default function CalendarSyncSettings() {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncDirection, setSyncDirection] = useState<'import' | 'export' | 'bidirectional'>('bidirectional');
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('primary');
  const [conflictResolution, setConflictResolution] = useState<'manual' | 'keep_newest' | 'keep_task' | 'keep_event'>('keep_newest');
  const [hasChanges, setHasChanges] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch current configuration
  const { data: config, isLoading: configLoading } = useQuery<{ data: GoogleCalendarConfig }>({
    queryKey: ['/api/google-calendar/config'],
  });

  // Fetch available calendars
  const { data: calendarsData, isLoading: calendarsLoading } = useQuery<{ data: CalendarInfo[] }>({
    queryKey: ['/api/google-calendar/calendars'],
    enabled: config?.data?.isConfigured || false,
  });

  // Update local state when config changes
  useEffect(() => {
    if (config?.data) {
      setSyncEnabled(config.data.syncEnabled);
      setSyncDirection(config.data.syncDirection);
      setSelectedCalendarId(config.data.calendarId || 'primary');
      setHasChanges(false);
    }
  }, [config]);

  // Track changes
  useEffect(() => {
    if (config?.data) {
      const changed = 
        syncEnabled !== config.data.syncEnabled ||
        syncDirection !== config.data.syncDirection ||
        selectedCalendarId !== config.data.calendarId;
      setHasChanges(changed);
    }
  }, [syncEnabled, syncDirection, selectedCalendarId, config]);

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (updateData: Partial<GoogleCalendarConfig>) => {
      const response = await fetch('/api/google-calendar/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error('Failed to update configuration');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Configurazione salvata con successo');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/config'] });
    },
    onError: (error: Error) => {
      toast.error('Errore salvataggio configurazione: ' + error.message);
    }
  });

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async (options: SyncOptions) => {
      const response = await fetch('/api/google-calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (!response.ok) throw new Error('Sync failed');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Sincronizzazione completata: ${data.data.tasksCreated + data.data.eventsCreated} elementi sincronizzati`);
      } else {
        toast.warning(`Sincronizzazione completata con ${data.data.errors.length} errori`);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/google-calendar/config'] });
    },
    onError: (error: Error) => {
      toast.error('Errore durante sincronizzazione: ' + error.message);
    }
  });

  const handleSaveSettings = () => {
    updateConfigMutation.mutate({
      syncEnabled,
      syncDirection,
      calendarId: selectedCalendarId,
    });
  };

  const handleManualSync = (direction: 'import' | 'export' | 'bidirectional') => {
    syncMutation.mutate({
      direction,
      conflictResolution,
      dryRun: false,
    });
  };

  if (configLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Impostazioni Sincronizzazione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Caricamento impostazioni...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config?.data?.isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Impostazioni Sincronizzazione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Google Calendar non è configurato. Completa prima la configurazione nella sezione Setup.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Impostazioni Sincronizzazione
          </CardTitle>
          <CardDescription>
            Configura come e quando sincronizzare le attività con Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sync Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Sincronizzazione Automatica</Label>
              <div className="text-sm text-muted-foreground">
                Abilita o disabilita la sincronizzazione con Google Calendar
              </div>
            </div>
            <Switch
              checked={syncEnabled}
              onCheckedChange={setSyncEnabled}
            />
          </div>

          {syncEnabled && (
            <>
              {/* Calendar Selection */}
              <div className="space-y-2">
                <Label>Calendario di Destinazione</Label>
                <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona calendario" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendarsLoading ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Caricamento calendari...
                      </SelectItem>
                    ) : (
                      calendarsData?.data?.map((calendar) => (
                        <SelectItem key={calendar.id} value={calendar.id}>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {calendar.name}
                            {calendar.primary && (
                              <Badge variant="secondary" className="text-xs">Principale</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  Calendario Google dove verranno sincronizzate le attività
                </div>
              </div>

              {/* Sync Direction */}
              <div className="space-y-3">
                <Label>Direzione Sincronizzazione</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card 
                    className={`cursor-pointer transition-colors ${
                      syncDirection === 'bidirectional' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSyncDirection('bidirectional')}
                  >
                    <CardContent className="p-4 text-center">
                      <ArrowLeftRight className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Bidirezionale</div>
                      <div className="text-xs text-muted-foreground">
                        Sync automatico in entrambe le direzioni
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer transition-colors ${
                      syncDirection === 'import' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSyncDirection('import')}
                  >
                    <CardContent className="p-4 text-center">
                      <Download className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Solo Import</div>
                      <div className="text-xs text-muted-foreground">
                        Da Google Calendar a InsuraTask
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer transition-colors ${
                      syncDirection === 'export' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setSyncDirection('export')}
                  >
                    <CardContent className="p-4 text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-medium">Solo Export</div>
                      <div className="text-xs text-muted-foreground">
                        Da InsuraTask a Google Calendar
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Conflict Resolution */}
              <div className="space-y-2">
                <Label>Risoluzione Conflitti</Label>
                <Select value={conflictResolution} onValueChange={(value: any) => setConflictResolution(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep_newest">Mantieni il più recente</SelectItem>
                    <SelectItem value="keep_task">Priorità alle attività InsuraTask</SelectItem>
                    <SelectItem value="keep_event">Priorità agli eventi Google Calendar</SelectItem>
                    <SelectItem value="manual">Risoluzione manuale</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  Come gestire i conflitti quando la stessa attività/evento è modificata in entrambi i sistemi
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          {hasChanges && (
            <Button 
              onClick={handleSaveSettings}
              disabled={updateConfigMutation.isPending}
              className="w-full"
            >
              {updateConfigMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salva Impostazioni
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Manual Sync Card */}
      {syncEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Sincronizzazione Manuale
            </CardTitle>
            <CardDescription>
              Esegui una sincronizzazione immediata invece di aspettare quella automatica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => handleManualSync('bidirectional')}
                disabled={syncMutation.isPending}
                className="flex flex-col h-auto py-4"
              >
                <ArrowLeftRight className="h-6 w-6 mb-2" />
                <span className="font-medium">Sync Completo</span>
                <span className="text-xs text-muted-foreground">Bidirezionale</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleManualSync('import')}
                disabled={syncMutation.isPending}
                className="flex flex-col h-auto py-4"
              >
                <Download className="h-6 w-6 mb-2" />
                <span className="font-medium">Import</span>
                <span className="text-xs text-muted-foreground">Da Google Calendar</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleManualSync('export')}
                disabled={syncMutation.isPending}
                className="flex flex-col h-auto py-4"
              >
                <Upload className="h-6 w-6 mb-2" />
                <span className="font-medium">Export</span>
                <span className="text-xs text-muted-foreground">A Google Calendar</span>
              </Button>
            </div>

            {syncMutation.isPending && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Sincronizzazione in corso...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Info */}
      {config.data.lastSyncAt && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              Ultima sincronizzazione: {new Date(config.data.lastSyncAt).toLocaleString('it-IT')}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
