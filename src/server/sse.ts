import { Response } from 'express';

interface Client {
  id: string;
  res: Response;
  role?: string;
  userId?: number;
}

const clients: Map<string, Client> = new Map();

export function addSSEClient(id: string, res: Response, role?: string, userId?: number) {
  clients.set(id, { id, res, role, userId });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId: id, timestamp: Date.now() })}\n\n`);

  res.on('close', () => {
    clients.delete(id);
  });
}

export function broadcastRealtimeEvent(event: {
  type: 'STOCK_UPDATE' | 'NEW_ORDER' | 'ORDER_STATUS_CHANGED' | 'PAYMENT_STATUS_CHANGED' | 'NEW_PRODUCT' | 'PRICE_UPDATE';
  data: any;
}) {
  const payload = `data: ${JSON.stringify({ ...event, timestamp: Date.now() })}\n\n`;

  for (const client of clients.values()) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client.id);
    }
  }
}
