import { z } from 'zod';

export const validationEvidenceStatusSchema = z.enum([
  'pass',
  'fail',
  'approved-exclusion',
  'approved-gap',
  'blocked',
  'not-run',
]);

export const validationEvidenceItemSchema = z.object({
  status: validationEvidenceStatusSchema,
  scopeItem: z.string().min(1),
  environment: z.string().min(1),
  commandOrResult: z.string().min(1),
  evidenceLink: z.string().min(1),
  reviewer: z.string().min(1),
  secretSafetyNote: z.string().min(1),
  residualRisk: z.string().optional(),
});

export type ValidationEvidenceItem = z.infer<typeof validationEvidenceItemSchema>;

export function parseValidationEvidenceItem(value: unknown): ValidationEvidenceItem {
  return validationEvidenceItemSchema.parse(value);
}
