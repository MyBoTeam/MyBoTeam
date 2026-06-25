import { describe, it, expect } from "vitest";
import { ProviderSchema, ProviderTypeSchema } from "../src/provider.js";

describe("ProviderSchema", () => {
  const validProvider = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Anthropic",
    type: "anthropic",
    config: { apiKey: "test-key" },
    enabled: true,
    createdAt: "2026-06-25T00:00:00Z",
    updatedAt: "2026-06-25T00:00:00Z",
  };

  it("accepts valid provider", () => {
    const result = ProviderSchema.safeParse(validProvider);
    expect(result.success).toBe(true);
  });

  it("accepts provider with baseUrl", () => {
    const result = ProviderSchema.safeParse({
      ...validProvider,
      type: "ollama",
      baseUrl: "http://localhost:11434",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL", () => {
    const result = ProviderSchema.safeParse({
      ...validProvider,
      baseUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("applies defaults", () => {
    const result = ProviderSchema.safeParse(validProvider);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.config).toEqual({ apiKey: "test-key" });
      expect(result.data.enabled).toBe(true);
    }
  });
});

describe("ProviderTypeSchema", () => {
  it("accepts all valid types", () => {
    const types = ["anthropic", "openai", "ollama", "custom"];
    types.forEach((type) => {
      expect(ProviderTypeSchema.safeParse(type).success).toBe(true);
    });
  });
});
