/**
 * Enhanced Google Calendar Integration with EnhancedCalendar
 * Adds Google Calendar events display to the existing calendar component
 * 
 * @author InsuraTask v1.1 Sprint 4
 * @created 2025-06-06
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  isAllDay: boolean;
  source: 'google';
}

interface CalendarEventsIntegrationProps {
  date: string; // YYYY-MM-DD format
  className?: string;
}

/**
 * Component to display Google Calendar events for a specific date
 * Integrates with the EnhancedCalendar popover content
 */
export function CalendarEventsIntegration({ date, className = '' }: CalendarEventsIntegrationProps) {
  // Check if Google Calendar is configured
  const { data: configData } = useQuery<{success: boolean; data: {isConfigured: boolean; syncEnabled: boolean}}>({
    queryKey: ['/api/google-calendar/config'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch Google Calendar events for the specific date
  const { data: eventsData, isLoading, error } = useQuery<{success: boolean; data: {events: GoogleCalendarEvent[]}}>({
    queryKey: ['/api/google-calendar/events', date],
    queryFn: async () => {
      const response = await fetch(`/api/google-calendar/events?date=${date}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      return response.json();
    },
    enabled: configData?.data?.isConfigured === true,
    refetchInterval: 60000, // Refresh every minute
  });

  const events: GoogleCalendarEvent[] = eventsData?.data?.events || [];
  const isConfigured = configData?.data?.isConfigured === true;

  if (!isConfigured) {
    return null; // Don't show anything if not configured
  }

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">Google Calendar</span>
        </div>
        <div className="text-xs text-gray-500">Caricamento eventi...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-red-700">Google Calendar</span>
        </div>
        <div className="text-xs text-red-500">Errore nel caricamento eventi</div>
      </div>
    );
  }

  if (events.length === 0) {
    return null; // Don't show section if no events
  }

  const formatEventTime = (start: string, end: string, isAllDay: boolean) => {
    if (isAllDay) return 'Tutto il giorno';
    
    const startTime = new Date(start).toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const endTime = new Date(end).toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `${startTime} - ${endTime}`;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">Google Calendar</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {events.length} {events.length === 1 ? 'evento' : 'eventi'}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start space-x-2 p-3 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 transition-all duration-200 border border-blue-100/50 backdrop-blur-sm"
          >
            <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0 shadow-sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {event.title}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatEventTime(event.start, event.end, event.isAllDay)}
                </span>
                {event.location && (
                  <span className="text-xs text-gray-500 truncate max-w-20">
                    📍 {event.location}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {event.description}
                </p>
              )}
            </div>
            <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook to get Google Calendar events for calendar integration
 * Returns events that can be displayed alongside tasks in the calendar grid
 */
export function useGoogleCalendarEvents(dateRange?: { start: string; end: string }) {
  const { data: configData } = useQuery<{success: boolean; data: {isConfigured: boolean; syncEnabled: boolean}}>({
    queryKey: ['/api/google-calendar/config'],
  });

  const { data: eventsData, isLoading } = useQuery<{success: boolean; data: {events: GoogleCalendarEvent[]}}>({
    queryKey: ['/api/google-calendar/events/range', dateRange],
    queryFn: async () => {
      if (!dateRange) return { data: { events: [] } };
      
      const response = await fetch(
        `/api/google-calendar/events?startDate=${dateRange.start}&endDate=${dateRange.end}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      return response.json();
    },
    enabled: configData?.data?.isConfigured === true && !!dateRange,
    refetchInterval: 120000, // Refresh every 2 minutes for range queries
  });

  const events: GoogleCalendarEvent[] = eventsData?.data?.events || [];
  const isConfigured = configData?.data?.isConfigured === true;

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const eventDate = event.start.split('T')[0]; // Get YYYY-MM-DD part
    if (!acc[eventDate]) {
      acc[eventDate] = [];
    }
    acc[eventDate].push(event);
    return acc;
  }, {} as Record<string, GoogleCalendarEvent[]>);

  return {
    eventsByDate,
    isLoading,
    isConfigured,
    totalEvents: events.length
  };
}

/**
 * Calendar event indicator component for calendar grid cells
 * Shows small dots for Google Calendar events
 */
export function GoogleCalendarIndicator({ 
  date, 
  className = '' 
}: { 
  date: string; 
  className?: string; 
}) {
  const { eventsByDate, isConfigured } = useGoogleCalendarEvents();
  
  if (!isConfigured) return null;
  
  const events = eventsByDate[date] || [];
  if (events.length === 0) return null;

  return (
    <div className={`absolute top-0 left-0 ${className}`}>
      <div className="w-2 h-2 bg-blue-400 rounded-full" title={`${events.length} eventi Google Calendar`} />
    </div>
  );
}
