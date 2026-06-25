import { z } from 'zod';

export const McpServerStatusSchema = z.enum(['stopped', 'starting', 'running', 'error']);

export type McpServerStatus = z.infer<typeof McpServerStatusSchema>;

export const MCPConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(128),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z.record(z.string(), z.string()).default({}),
  status: McpServerStatusSchema.default('stopped'),
  pid: z.number().int().positive().optional(),
  workspaceRoot: z.string().optional(),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MCPConfig = z.infer<typeof MCPConfigSchema>;
