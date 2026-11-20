import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const syncIngestPayloadSchema = z.object({
  events: z.array(
    z.object({
      id: z.number().int().optional(),
      entityName: z.string(),
      entityId: z.string(),
      operation: z.enum(['INSERT', 'UPDATE', 'VOID']),
      payloadJson: z.string(),
      createdAt: z.string(),
    })
  ),
});

export async function handleSyncIngest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const parseResult = syncIngestPayloadSchema.safeParse(request.body);
  if (!parseResult.success) {
    void reply.status(400).send({
      error: 'Invalid sync payload structure',
      details: parseResult.error.format(),
    });
    return;
  }

  const { events } = parseResult.data;
  const acknowledgedIds: number[] = [];

  // In production, each event is upserted into Central Cloud PostgreSQL:
  // e.g., INSERT INTO sales ... ON CONFLICT (id) DO NOTHING;
  for (const event of events) {
    if (event.id) {
      acknowledgedIds.push(event.id);
    }
  }

  void reply.status(200).send({
    success: true,
    processedCount: events.length,
    acknowledgedIds,
  });
}
