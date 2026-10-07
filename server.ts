import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { initDatabase } from './src/server/db.ts';
import { seedInitialData } from './src/server/seed-data.ts';
import { seedProducts } from './src/server/seed-products.ts';
import { addSSEClient } from './src/server/sse.ts';

import { authRouter } from './src/server/routes/auth.ts';
import { productsRouter } from './src/server/routes/products.ts';
import { cartRouter } from './src/server/routes/cart.ts';
import { ordersRouter } from './src/server/routes/orders.ts';
import { adminRouter } from './src/server/routes/admin.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize Database Schema & Seeds
  initDatabase();
  seedInitialData();
  seedProducts();

  const app = express();
  const PORT = process.env.PORT || 3000;

  // JSON Body parser with 10MB limit for base64 images (visual search & receipt upload)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Real-time Server-Sent Events (SSE)
  app.get('/api/realtime', (req, res) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    addSSEClient(clientId, res);
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api', productsRouter);
  app.use('/api', cartRouter);
  app.use('/api', ordersRouter);
  app.use('/api/admin', adminRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'SKYRA Marine Marketplace', timestamp: Date.now() });
  });

  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production serve static build
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[SKYRA] Server running smoothly on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
