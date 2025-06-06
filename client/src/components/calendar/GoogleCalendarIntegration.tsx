import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SyncStatusIndicator from './SyncStatusIndicator';
import GoogleCalendarSetup from './GoogleCalendarSetup';
import CalendarSyncSettings from './CalendarSyncSettings';
import ConflictResolutionModal from './ConflictResolutionModal';

interface GoogleCalendarIntegrationProps {
  className?: string;
}

const GoogleCalendarIntegration: React.FC<GoogleCalendarIntegrationProps> = ({ className }) => {
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Check if Google Calendar has conflicts
  const { data: conflictsData } = useQuery({
    queryKey: ['google-calendar-conflicts'],
    queryFn: async () => {
      const response = await fetch('/api/google-calendar/conflicts');
      if (!response.ok) return { data: [] };
      return response.json();
    },
    refetchInterval: 60000, // Check every minute
  });

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Google Calendar Integration
            </div>
            <div className="flex items-center gap-2">
              <SyncStatusIndicator />
              {conflictsData?.data?.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConflictModal(true)}
                  className="text-yellow-600 border-yellow-300"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {conflictsData.data.length} Conflicts
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            Sincronizza le tue attività con Google Calendar per un migliore coordinamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="setup" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Setup
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Sincronizzazione
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="setup" className="mt-6">
              <GoogleCalendarSetup />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6">
              <CalendarSyncSettings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
      />
    </div>
  );
};

export default GoogleCalendarIntegration;
