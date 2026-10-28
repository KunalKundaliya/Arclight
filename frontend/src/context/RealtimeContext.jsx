import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastContext';
import { storageService } from '../services/storageService';

const RealtimeContext = createContext({ isConnected: false });

export function RealtimeProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Open native browser EventSource connection to backend SSE endpoint
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    // 1. Live Schedule Applied by Coordinator
    eventSource.addEventListener('SCHEDULE_APPLIED', (e) => {
      try {
        const data = JSON.parse(e.data);
        storageService.syncFromBackend();
        showToast(
          `Drive schedule applied! ${data.payload.count || 0} sessions synced with zero conflicts.`,
          'success',
          'Live Schedule Applied'
        );
      } catch (err) {
        console.error('Error handling SCHEDULE_APPLIED event:', err);
      }
    });

    // 2. Automated Dynamic Repair Triggered
    eventSource.addEventListener('SCHEDULE_REPAIRED', (e) => {
      try {
        const data = JSON.parse(e.data);
        storageService.syncFromBackend();
        const reason = data.payload.type === 'ROOM_OUTAGE' ? 'Chamber Outage' : 'Faculty Callout';
        showToast(
          `${reason} repaired: ${data.payload.displacedCount || 0} sessions adjusted with 0 hard violations.`,
          'warning',
          'Automated Schedule Repair'
        );
      } catch (err) {
        console.error('Error handling SCHEDULE_REPAIRED event:', err);
      }
    });

    // 3. Schedule Rolled Back
    eventSource.addEventListener('SCHEDULE_ROLLEDBACK', (e) => {
      try {
        const data = JSON.parse(e.data);
        storageService.syncFromBackend();
        showToast(
          `Administrative rollback completed for ${data.payload.count || 0} sessions.`,
          'info',
          'Schedule Rolled Back'
        );
      } catch (err) {
        console.error('Error handling SCHEDULE_ROLLEDBACK event:', err);
      }
    });

    // 4. Candidate Self-Booked Slot
    eventSource.addEventListener('INTERVIEW_BOOKED', (e) => {
      try {
        const data = JSON.parse(e.data);
        storageService.syncFromBackend();
        showToast(
          `${data.payload.candidateName} confirmed slot for ${data.payload.date} at ${data.payload.startTime}.`,
          'info',
          'Candidate Slot Reserved'
        );
      } catch (err) {
        console.error('Error handling INTERVIEW_BOOKED event:', err);
      }
    });

    // 5. Interviewer Scorecard Submitted
    eventSource.addEventListener('EVALUATION_SUBMITTED', (e) => {
      try {
        const data = JSON.parse(e.data);
        storageService.syncFromBackend();
        showToast(
          `Evaluation recorded for ${data.payload.candidateName} (${data.payload.recommendation}, score: ${data.payload.score}/100).`,
          'success',
          'Scorecard Submitted'
        );
      } catch (err) {
        console.error('Error handling EVALUATION_SUBMITTED event:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [showToast]);

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => useContext(RealtimeContext);
