import { z } from 'zod';

export const DaemonEventTypeSchema = z.enum([
  'agent.started',
  'agent.stopped',
  'agent.error',
  'task.created',
  'task.updated',
  'task.completed',
  'task.failed',
  'mcp.started',
  'mcp.stopped',
  'mcp.error',
  'system.ready',
  'system.shutdown',
]);

export type DaemonEventType = z.infer<typeof DaemonEventTypeSchema>;

export const DaemonEventSchema = z.object({
  id: z.string().uuid(),
  type: DaemonEventTypeSchema,
  source: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
  timestamp: z.string().datetime(),
});

export type DaemonEvent = z.infer<typeof DaemonEventSchema>;
