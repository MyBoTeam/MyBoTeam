import { z } from "zod";

export const VaultEntryTypeSchema = z.enum([
  "api_key",
  "oauth_token",
  "credential",
  "secret",
]);

export type VaultEntryType = z.infer<typeof VaultEntryTypeSchema>;

export const VaultEntrySchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(1).max(256),
  type: VaultEntryTypeSchema,
  encryptedValue: z.string().min(1),
  iv: z.string().min(1),
  salt: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type VaultEntry = z.infer<typeof VaultEntrySchema>;
