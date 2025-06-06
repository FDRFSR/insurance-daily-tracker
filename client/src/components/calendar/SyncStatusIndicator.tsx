import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle, AlertTriangle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface SyncStatus {
  isConnected: boolean;
  lastSyncTime: string | null;
  syncInProgress: boolean;
  conflictsCount: number;
  nextSyncTime: string | null;
  totalTasks: number;
  syncedTasks: number;
  errors: string[];
}

interface SyncProgress {
  current: number;
  total: number;
  status: string;
}

const SyncStatusIndicator: React.FC = () => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current sync status
  const { data: syncStatus, isLoading, error, refetch } = useQuery({
    queryKey: ['google-calendar-sync-status'],
    queryFn: async (): Promise<SyncStatus> => {
      const response = await fetch('/api/google-calendar/status');
      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }
      return response.json();
    },
    refetchInterval: autoSyncEnabled ? 30000 : false, // Poll every 30 seconds when auto-sync is on
    refetchIntervalInBackground: false
  });

  // Check for Google Calendar configuration
  const { data: isConfigured } = useQuery({
    queryKey: ['google-calendar-configured'],
    queryFn: async (): Promise<boolean> => {
      try {
        const response = await fetch('/api/google-calendar/config');
        return response.ok;
      } catch {
        return false;
      }
    },
    refetchInterval: 60000 // Check every minute
  });

  // Manual sync trigger
  const handleManualSync = async () => {
    try {
      setSyncProgress({ current: 0, total: 100, status: 'Initializing sync...' });
      
      const response = await fetch('/api/google-calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      // Simulate progress updates
      const progressSteps = [
        { progress: 20, status: 'Fetching Google Calendar events...' },
        { progress: 40, status: 'Synchronizing tasks...' },
        { progress: 60, status: 'Resolving conflicts...' },
        { progress: 80, status: 'Updating mappings...' },
        { progress: 100, status: 'Sync completed!' }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSyncProgress({ 
          current: step.progress, 
          total: 100, 
          status: step.status 
        });
      }

      toast({
        title: "Sync Completed",
        description: "Calendar synchronization completed successfully",
      });

      // Refresh status and invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['google-calendar-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });

    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSyncProgress(null);
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    try {
      const response = await fetch('/api/google-calendar/test-connection');
      if (response.ok) {
        toast({
          title: "Connection Test Successful",
          description: "Google Calendar connection is working properly",
        });
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Unable to connect to Google Calendar",
        variant: "destructive",
      });
    }
  };

  const getSyncStatusIcon = () => {
    if (!isConfigured) {
      return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
    
    if (isLoading || syncProgress) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }

    if (error || !syncStatus?.isConnected) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    if (syncStatus.conflictsCount > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }

    if (syncStatus.syncInProgress) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }

    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getSyncStatusText = () => {
    if (!isConfigured) {
      return 'Not configured';
    }
    
    if (isLoading) {
      return 'Checking status...';
    }

    if (error) {
      return 'Connection error';
    }

    if (syncProgress) {
      return syncProgress.status;
    }

    if (!syncStatus?.isConnected) {
      return 'Disconnected';
    }

    if (syncStatus.syncInProgress) {
      return 'Syncing...';
    }

    if (syncStatus.conflictsCount > 0) {
      return `${syncStatus.conflictsCount} conflicts`;
    }

    if (syncStatus.lastSyncTime) {
      const lastSync = new Date(syncStatus.lastSyncTime);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - lastSync.getTime()) / 60000);
      
      if (diffMinutes < 1) {
        return 'Just synced';
      } else if (diffMinutes < 60) {
        return `Synced ${diffMinutes}m ago`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        return `Synced ${diffHours}h ago`;
      }
    }

    return 'Ready to sync';
  };

  const getSyncStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (!isConfigured || error || !syncStatus?.isConnected) {
      return 'destructive';
    }
    if (syncStatus?.conflictsCount > 0) {
      return 'outline';
    }
    return 'default';
  };

  const formatNextSyncTime = (nextSyncTime: string | null) => {
    if (!nextSyncTime) return 'Manual sync only';
    
    const nextSync = new Date(nextSyncTime);
    const now = new Date();
    const diffMinutes = Math.floor((nextSync.getTime() - now.getTime()) / 60000);
    
    if (diffMinutes < 1) {
      return 'Next sync: Now';
    } else if (diffMinutes < 60) {
      return `Next sync: ${diffMinutes}m`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `Next sync: ${diffHours}h`;
    }
  };

  if (!isConfigured) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="cursor-help">
              <WifiOff className="h-3 w-3 mr-1" />
              Google Calendar not configured
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Set up Google Calendar integration to enable sync</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Sync Status Badge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={getSyncStatusVariant()} className="cursor-help">
              {getSyncStatusIcon()}
              <span className="ml-1">{getSyncStatusText()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-sm">
              {syncStatus && (
                <>
                  <p><strong>Connection:</strong> {syncStatus.isConnected ? 'Connected' : 'Disconnected'}</p>
                  <p><strong>Tasks synced:</strong> {syncStatus.syncedTasks}/{syncStatus.totalTasks}</p>
                  {syncStatus.conflictsCount > 0 && (
                    <p className="text-yellow-600"><strong>Conflicts:</strong> {syncStatus.conflictsCount}</p>
                  )}
                  {syncStatus.nextSyncTime && (
                    <p><strong>{formatNextSyncTime(syncStatus.nextSyncTime)}</strong></p>
                  )}
                  {syncStatus.errors.length > 0 && (
                    <p className="text-red-600"><strong>Errors:</strong> {syncStatus.errors.length}</p>
                  )}
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Progress Bar (shown during sync) */}
      {syncProgress && (
        <div className="flex items-center gap-2 min-w-[200px]">
          <Progress value={syncProgress.current} className="flex-1" />
          <span className="text-xs text-muted-foreground">
            {syncProgress.current}%
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualSync}
                disabled={syncProgress !== null || syncStatus?.syncInProgress}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${syncProgress || syncStatus?.syncInProgress ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manual sync</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTestConnection}
                className="h-8 w-8 p-0"
              >
                <Wifi className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Test connection</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Conflicts Count Badge */}
      {syncStatus?.conflictsCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="cursor-help">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {syncStatus.conflictsCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to resolve sync conflicts</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
