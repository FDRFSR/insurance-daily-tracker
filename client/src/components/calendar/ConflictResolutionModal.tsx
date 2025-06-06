import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, User, FileText, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/types/task';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  calendarId: string;
  calendarName: string;
}

interface SyncConflict {
  id: string;
  type: 'UPDATE_CONFLICT' | 'DELETE_CONFLICT' | 'CREATE_CONFLICT';
  taskId: string;
  googleEventId: string;
  task: Task;
  googleEvent: CalendarEvent;
  conflictReason: string;
  detectedAt: string;
  resolved: boolean;
  changes: {
    field: string;
    taskValue: any;
    googleValue: any;
    conflictDescription: string;
  }[];
}

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResolutionChoice = 'KEEP_TASK' | 'KEEP_GOOGLE' | 'MERGE' | 'SKIP';

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedConflicts, setSelectedConflicts] = useState<Set<string>>(new Set());
  const [resolutions, setResolutions] = useState<Map<string, ResolutionChoice>>(new Map());
  const [resolving, setResolving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conflicts
  const { data: conflicts = [], isLoading, refetch } = useQuery({
    queryKey: ['google-calendar-conflicts'],
    queryFn: async (): Promise<SyncConflict[]> => {
      const response = await fetch('/api/google-calendar/conflicts');
      if (!response.ok) {
        throw new Error('Failed to fetch conflicts');
      }
      return response.json();
    },
    enabled: isOpen,
  });

  // Resolve conflicts mutation
  const resolveConflictsMutation = useMutation({
    mutationFn: async (data: { conflictId: string; resolution: ResolutionChoice }[]) => {
      const response = await fetch('/api/google-calendar/resolve-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutions: data }),
      });

      if (!response.ok) {
        throw new Error('Failed to resolve conflicts');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conflicts Resolved",
        description: `Successfully resolved ${selectedConflicts.size} conflicts`,
      });
      
      // Reset state
      setSelectedConflicts(new Set());
      setResolutions(new Map());
      
      // Refresh data
      refetch();
      queryClient.invalidateQueries({ queryKey: ['google-calendar-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (error) => {
      toast({
        title: "Resolution Failed",
        description: error instanceof Error ? error.message : "Failed to resolve conflicts",
        variant: "destructive",
      });
    },
  });

  const handleResolutionChange = (conflictId: string, resolution: ResolutionChoice) => {
    const newResolutions = new Map(resolutions);
    newResolutions.set(conflictId, resolution);
    setResolutions(newResolutions);
  };

  const handleConflictSelection = (conflictId: string, selected: boolean) => {
    const newSelected = new Set(selectedConflicts);
    if (selected) {
      newSelected.add(conflictId);
    } else {
      newSelected.delete(conflictId);
    }
    setSelectedConflicts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedConflicts.size === conflicts.length) {
      setSelectedConflicts(new Set());
    } else {
      setSelectedConflicts(new Set(conflicts.map(c => c.id)));
    }
  };

  const handleResolveSelected = async () => {
    const selectedResolutions = Array.from(selectedConflicts)
      .map(conflictId => ({
        conflictId,
        resolution: resolutions.get(conflictId) || 'SKIP'
      }))
      .filter(r => r.resolution !== 'SKIP');

    if (selectedResolutions.length === 0) {
      toast({
        title: "No Resolutions Selected",
        description: "Please select resolution choices for the conflicts",
        variant: "destructive",
      });
      return;
    }

    setResolving(true);
    try {
      await resolveConflictsMutation.mutateAsync(selectedResolutions);
    } finally {
      setResolving(false);
    }
  };

  const getConflictTypeIcon = (type: SyncConflict['type']) => {
    switch (type) {
      case 'UPDATE_CONFLICT':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'DELETE_CONFLICT':
        return <X className="h-4 w-4 text-red-500" />;
      case 'CREATE_CONFLICT':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConflictTypeText = (type: SyncConflict['type']) => {
    switch (type) {
      case 'UPDATE_CONFLICT':
        return 'Update Conflict';
      case 'DELETE_CONFLICT':
        return 'Delete Conflict';
      case 'CREATE_CONFLICT':
        return 'Create Conflict';
      default:
        return 'Unknown Conflict';
    }
  };

  const getResolutionButtonVariant = (conflictId: string, choice: ResolutionChoice) => {
    const currentResolution = resolutions.get(conflictId);
    return currentResolution === choice ? 'default' : 'outline';
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const unresolvedConflicts = conflicts.filter(c => !c.resolved);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Sync Conflicts Resolution
          </DialogTitle>
          <DialogDescription>
            Resolve conflicts between InsuraTask and Google Calendar to continue synchronization.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading conflicts...</p>
              </div>
            </div>
          ) : unresolvedConflicts.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Conflicts Found</h3>
                <p className="text-muted-foreground">All tasks and events are synchronized properly.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedConflicts.size === conflicts.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedConflicts.size} of {unresolvedConflicts.length} conflicts selected
                  </span>
                </div>
                <Button
                  onClick={handleResolveSelected}
                  disabled={selectedConflicts.size === 0 || resolving}
                  className="min-w-[120px]"
                >
                  {resolving ? 'Resolving...' : `Resolve Selected (${selectedConflicts.size})`}
                </Button>
              </div>

              {/* Conflicts List */}
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4">
                  {unresolvedConflicts.map((conflict) => (
                    <ConflictCard
                      key={conflict.id}
                      conflict={conflict}
                      isSelected={selectedConflicts.has(conflict.id)}
                      resolution={resolutions.get(conflict.id)}
                      onSelectionChange={(selected) => handleConflictSelection(conflict.id, selected)}
                      onResolutionChange={(resolution) => handleResolutionChange(conflict.id, resolution)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface ConflictCardProps {
  conflict: SyncConflict;
  isSelected: boolean;
  resolution?: ResolutionChoice;
  onSelectionChange: (selected: boolean) => void;
  onResolutionChange: (resolution: ResolutionChoice) => void;
}

const ConflictCard: React.FC<ConflictCardProps> = ({
  conflict,
  isSelected,
  resolution,
  onSelectionChange,
  onResolutionChange,
}) => {
  const getConflictTypeIcon = (type: SyncConflict['type']) => {
    switch (type) {
      case 'UPDATE_CONFLICT':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'DELETE_CONFLICT':
        return <X className="h-4 w-4 text-red-500" />;
      case 'CREATE_CONFLICT':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConflictTypeText = (type: SyncConflict['type']) => {
    switch (type) {
      case 'UPDATE_CONFLICT':
        return 'Update Conflict';
      case 'DELETE_CONFLICT':
        return 'Delete Conflict';
      case 'CREATE_CONFLICT':
        return 'Create Conflict';
      default:
        return 'Unknown Conflict';
    }
  };

  const getResolutionButtonVariant = (choice: ResolutionChoice): "default" | "outline" => {
    return resolution === choice ? 'default' : 'outline';
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  return (
    <Card className={`border-2 ${isSelected ? 'border-primary' : 'border-border'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectionChange(e.target.checked)}
              className="mt-1"
            />
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                {getConflictTypeIcon(conflict.type)}
                {getConflictTypeText(conflict.type)}
              </CardTitle>
              <CardDescription className="mt-1">
                {conflict.conflictReason}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {formatDateTime(conflict.detectedAt)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Comparison View */}
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="changes">Detailed Changes</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* InsuraTask Side */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  InsuraTask
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {conflict.task.title}
                  </div>
                  {conflict.task.description && (
                    <div>
                      <span className="font-medium">Description:</span> {conflict.task.description}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Due Date:</span> {
                      conflict.task.dueDate ? formatDateTime(conflict.task.dueDate) : 'No due date'
                    }
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <Badge variant="outline" className="ml-2">
                      {conflict.task.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Priority:</span> 
                    <Badge variant="outline" className="ml-2">
                      {conflict.task.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Google Calendar Side */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  Google Calendar
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {conflict.googleEvent.title}
                  </div>
                  {conflict.googleEvent.description && (
                    <div>
                      <span className="font-medium">Description:</span> {conflict.googleEvent.description}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Start:</span> {formatDateTime(conflict.googleEvent.startTime)}
                  </div>
                  <div>
                    <span className="font-medium">End:</span> {formatDateTime(conflict.googleEvent.endTime)}
                  </div>
                  {conflict.googleEvent.location && (
                    <div>
                      <span className="font-medium">Location:</span> {conflict.googleEvent.location}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Calendar:</span> 
                    <Badge variant="outline" className="ml-2">
                      {conflict.googleEvent.calendarName}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="changes" className="mt-4">
            <div className="space-y-3">
              {conflict.changes.map((change, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="font-medium text-sm mb-2">{change.field}</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {change.conflictDescription}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-blue-600">Task Value:</span>
                      <div className="mt-1 p-2 bg-blue-50 rounded border">
                        {JSON.stringify(change.taskValue, null, 2)}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-green-600">Google Value:</span>
                      <div className="mt-1 p-2 bg-green-50 rounded border">
                        {JSON.stringify(change.googleValue, null, 2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Resolution Options */}
        <div className="space-y-3">
          <h4 className="font-medium">Choose Resolution:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant={getResolutionButtonVariant('KEEP_TASK')}
              size="sm"
              onClick={() => onResolutionChange('KEEP_TASK')}
              className="justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Keep Task
            </Button>
            <Button
              variant={getResolutionButtonVariant('KEEP_GOOGLE')}
              size="sm"
              onClick={() => onResolutionChange('KEEP_GOOGLE')}
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Keep Google
            </Button>
            <Button
              variant={getResolutionButtonVariant('MERGE')}
              size="sm"
              onClick={() => onResolutionChange('MERGE')}
              className="justify-start"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Merge Both
            </Button>
            <Button
              variant={getResolutionButtonVariant('SKIP')}
              size="sm"
              onClick={() => onResolutionChange('SKIP')}
              className="justify-start"
            >
              <Clock className="h-4 w-4 mr-2" />
              Skip
            </Button>
          </div>
          {resolution && (
            <div className="text-sm text-muted-foreground">
              <strong>Selected:</strong> {
                {
                  'KEEP_TASK': 'Keep InsuraTask version and overwrite Google Calendar',
                  'KEEP_GOOGLE': 'Keep Google Calendar version and overwrite InsuraTask',
                  'MERGE': 'Attempt to merge both versions intelligently',
                  'SKIP': 'Skip this conflict for now'
                }[resolution]
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConflictResolutionModal;
