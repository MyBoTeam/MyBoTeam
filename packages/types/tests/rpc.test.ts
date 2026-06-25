import { describe, it, expect } from "vitest";
import {
  RpcMethodSchema,
  RpcRequestSchema,
  RpcResponseSchema,
} from "../src/rpc.js";

describe("RpcMethodSchema", () => {
  it("accepts all valid methods", () => {
    const methods = [
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
    ];
    methods.forEach((method) => {
      expect(RpcMethodSchema.safeParse(method).success).toBe(true);
    });
  });
});

describe("RpcRequestSchema", () => {
  const validRequest = {
    jsonrpc: "2.0" as const,
    id: "1",
    method: "agent.list" as const,
    params: { limit: 10 },
  };

  it("accepts valid request", () => {
    const result = RpcRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it("accepts request without params", () => {
    const result = RpcRequestSchema.safeParse({
      jsonrpc: "2.0",
      id: 1,
      method: "status.get",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.params).toEqual({});
    }
  });

  it("rejects invalid jsonrpc version", () => {
    const result = RpcRequestSchema.safeParse({
      ...validRequest,
      jsonrpc: "1.0",
    });
    expect(result.success).toBe(false);
  });
});

describe("RpcResponseSchema", () => {
  it("accepts success response", () => {
    const result = RpcResponseSchema.safeParse({
      jsonrpc: "2.0",
      id: "1",
      result: { agents: [] },
    });
    expect(result.success).toBe(true);
  });

  it("accepts error response", () => {
    const result = RpcResponseSchema.safeParse({
      jsonrpc: "2.0",
      id: "1",
      error: {
        code: -32600,
        message: "Invalid Request",
      },
    });
    expect(result.success).toBe(true);
  });
});
