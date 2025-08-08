// src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { BASE_URL } from '@env';

export const useWebSocket = (userId: number, onMessage: (data: any) => void) => {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://${BASE_URL}/messages/${userId}`);
    socketRef.current = ws;

    ws.onopen = () => console.log('WebSocket connected');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.warn('Invalid message received:', event.data);
      }
    };

    ws.onclose = () => console.log('WebSocket closed');

    return () => ws.close();
  }, [userId, onMessage]);

  const sendMessage = (to: number, message: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ to, message }));
    }
  };

  return { sendMessage };
};
