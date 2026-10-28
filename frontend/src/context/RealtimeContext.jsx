import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastContext';
import { storageService } from '../services/storageService';

const RealtimeContext = createContext({
  isConnected: false,
  lastEvent: null,
  lastUpdated: Date.now(),
  refresh: async () => {}
});

export function RealtimeProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const { showToast } = useToast();

  const refresh = async () => {
    try {
      await storageService.syncFromBackend();
      setLastUpdated(Date.now());
    } catch (err) {
      console.warn('Realtime refresh sync failed:', err);
    }
  };

  useEffect(() => {
    // Open native browser EventSource connection to backend SSE endpoint
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    const handleEvent = async (type, eventData, getToastMessage, toastType, toastTitle) => {
      try {
        const data = JSON.parse(eventData);
        // Sync latest records from PostgreSQL
        await storageService.syncFromBackend();
        
        // Notify subscribers of the real-time update
        setLastEvent({ type, payload: data.payload, timestamp: Date.now() });
        setLastUpdated(Date.now());

        if (getToastMessage) {
          showToast(
            getToastMessage(data.payload),
            toastType || 'info',
            toastTitle
          );
        }
      } catch (err) {
        console.error(`Error handling ${type} event:`, err);
      }
    };

    // 1. Live Schedule Applied by Coordinator
    eventSource.addEventListener('SCHEDULE_APPLIED', (e) => {
      handleEvent(
        'SCHEDULE_APPLIED',
        e.data,
        (payload) => `Drive schedule applied! ${payload.count || 0} sessions synced with zero conflicts.`,
        'success',
        'Live Schedule Applied'
      );
    });

    // 2. Automated Dynamic Repair Triggered
    eventSource.addEventListener('SCHEDULE_REPAIRED', (e) => {
      handleEvent(
        'SCHEDULE_REPAIRED',
        e.data,
        (payload) => {
          const reason = payload.type === 'ROOM_OUTAGE' ? 'Chamber Outage' : 'Faculty Callout';
          return `${reason} repaired: ${payload.displacedCount || 0} sessions adjusted with 0 hard violations.`;
        },
        'warning',
        'Automated Schedule Repair'
      );
    });

    // 3. Schedule Rolled Back
    eventSource.addEventListener('SCHEDULE_ROLLEDBACK', (e) => {
      handleEvent(
        'SCHEDULE_ROLLEDBACK',
        e.data,
        (payload) => `Administrative rollback completed for ${payload.count || 0} sessions.`,
        'info',
        'Schedule Rolled Back'
      );
    });

    // 4. Candidate Self-Booked Slot
    eventSource.addEventListener('INTERVIEW_BOOKED', (e) => {
      handleEvent(
        'INTERVIEW_BOOKED',
        e.data,
        (payload) => `${payload.candidateName} confirmed slot for ${payload.date} at ${payload.startTime}.`,
        'info',
        'Candidate Slot Reserved'
      );
    });

    // 5. Interviewer Scorecard Submitted
    eventSource.addEventListener('EVALUATION_SUBMITTED', (e) => {
      handleEvent(
        'EVALUATION_SUBMITTED',
        e.data,
        (payload) => `Evaluation recorded for ${payload.candidateName} (${payload.recommendation}, score: ${payload.score}/100).`,
        'success',
        'Scorecard Submitted'
      );
    });

    return () => {
      eventSource.close();
    };
  }, [showToast]);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, lastUpdated, refresh }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => useContext(RealtimeContext);
