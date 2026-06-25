import { z } from "zod";

export const RpcMethodSchema = z.enum([
  "agent.create",
  "agent.update",
  "agent.delete",
  "agent.list",
  "agent.get",
  "agent.start",
  "agent.stop",
  "task.create",
  "task.update",
  "task.list",
  "task.get",
  "mcp.start",
  "mcp.stop",
  "mcp.list",
  "vault.set",
  "vault.get",
  "vault.delete",
  "vault.list",
  "settings.get",
  "settings.set",
  "status.get",
]);

export type RpcMethod = z.infer<typeof RpcMethodSchema>;

export const RpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]),
  method: RpcMethodSchema,
  params: z.record(z.string(), z.unknown()).default({}),
});

export type RpcRequest = z.infer<typeof RpcRequestSchema>;

export const RpcResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number()]),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number().int(),
      message: z.string(),
      data: z.unknown().optional(),
    })
    .optional(),
});

export type RpcResponse = z.infer<typeof RpcResponseSchema>;
