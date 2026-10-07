import React, { createContext, useContext, useEffect, useState } from 'react';

export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: number;
}

interface RealtimeContextType {
  isConnected: boolean;
  lastEvent: RealtimeEvent | null;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastEvent: null,
});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/realtime');

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            setLastEvent(parsed);
          } catch (err) {
            console.error('Error parsing SSE event', err);
          }
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource?.close();
          retryTimeout = setTimeout(connectSSE, 4000);
        };
      } catch (err) {
        setIsConnected(false);
        retryTimeout = setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    return () => {
      clearTimeout(retryTimeout);
      eventSource?.close();
    };
  }, []);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
