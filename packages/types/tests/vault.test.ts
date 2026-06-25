import { describe, it, expect } from "vitest";
import { VaultEntrySchema, VaultEntryTypeSchema } from "../src/vault.js";

describe("VaultEntrySchema", () => {
  const validEntry = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    key: "anthropic-api-key",
    type: "api_key",
    encryptedValue: "encrypted-data",
    iv: "initialization-vector",
    salt: "salt-value",
    metadata: { provider: "anthropic" },
    createdAt: "2026-06-25T00:00:00Z",
    updatedAt: "2026-06-25T00:00:00Z",
  };

  it("accepts valid entry", () => {
    const result = VaultEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("accepts entry without metadata", () => {
    const result = VaultEntrySchema.safeParse({
      ...validEntry,
      metadata: undefined,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata).toEqual({});
    }
  });

  it("rejects empty key", () => {
    const result = VaultEntrySchema.safeParse({
      ...validEntry,
      key: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = VaultEntrySchema.safeParse({
      ...validEntry,
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("VaultEntryTypeSchema", () => {
  it("accepts all valid types", () => {
    const types = ["api_key", "oauth_token", "credential", "secret"];
    types.forEach((type) => {
      expect(VaultEntryTypeSchema.safeParse(type).success).toBe(true);
    });
  });
});
