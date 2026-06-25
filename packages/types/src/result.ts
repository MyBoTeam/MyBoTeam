import { z } from "zod";

export const ResultSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.discriminatedUnion("ok", [
    z.object({
      ok: z.literal(true),
      value: dataSchema,
    }),
    z.object({
      ok: z.literal(false),
      error: z.object({
        code: z.string().min(1),
        message: z.string().min(1),
        details: z.unknown().optional(),
      }),
    }),
  ]);

export type Result<T, E = { code: string; message: string; details?: unknown }> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const err = <E extends { code: string; message: string; details?: unknown }>(
  error: E
): Result<never, E> => ({ ok: false, error });

export const isOk = <T>(result: Result<T>): result is { ok: true; value: T } =>
  result.ok;

export const isErr = <T>(result: Result<T>): result is { ok: false; error: { code: string; message: string; details?: unknown } } =>
  !result.ok;
