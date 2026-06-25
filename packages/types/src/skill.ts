import { z } from "zod";

export const SkillRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  filePath: z.string().min(1),
  content: z.string().min(1),
  agentId: z.string().uuid().optional(),
  enabled: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SkillRecord = z.infer<typeof SkillRecordSchema>;
