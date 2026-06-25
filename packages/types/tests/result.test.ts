import { describe, it, expect } from "vitest";
import { ResultSchema, ok, err, isOk, isErr } from "../src/result.js";

describe("Result helpers", () => {
  it("creates ok result", () => {
    const result = ok({ name: "test" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ name: "test" });
    }
  });

  it("creates err result", () => {
    const result = err({ code: "E001", message: "Something failed" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("E001");
      expect(result.error.message).toBe("Something failed");
    }
  });

  it("isOk returns true for ok result", () => {
    const result = ok("value");
    expect(isOk(result)).toBe(true);
  });

  it("isOk returns false for err result", () => {
    const result = err({ code: "E001", message: "error" });
    expect(isOk(result)).toBe(false);
  });

  it("isErr returns true for err result", () => {
    const result = err({ code: "E001", message: "error" });
    expect(isErr(result)).toBe(true);
  });

  it("isErr returns false for ok result", () => {
    const result = ok("value");
    expect(isErr(result)).toBe(false);
  });
});

describe("ResultSchema", () => {
  const schema = ResultSchema(
    require("zod").z.object({
      name: require("zod").z.string(),
    })
  );

  it("validates ok result", () => {
    const result = schema.safeParse({ ok: true, value: { name: "test" } });
    expect(result.success).toBe(true);
  });

  it("validates err result", () => {
    const result = schema.safeParse({
      ok: false,
      error: { code: "E001", message: "error" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid ok result", () => {
    const result = schema.safeParse({ ok: true, value: { invalid: true } });
    expect(result.success).toBe(false);
  });

  it("rejects invalid err result", () => {
    const result = schema.safeParse({ ok: false, error: { missing: true } });
    expect(result.success).toBe(false);
  });
});
