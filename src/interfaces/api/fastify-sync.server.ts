import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { handleSyncIngest } from './controllers/sync-ingest.controller.js';

export function createFastifySyncServer(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: 'info',
    },
  });

  void app.register(cors, {
    origin: '*',
  });

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  // Inbound Terminal Sync Ingestion Endpoint
  app.post('/v1/sync/ingest', handleSyncIngest);

  return app;
}
