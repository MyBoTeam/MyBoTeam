import { describe, expect, it } from 'vitest';
import { SkillRecordSchema } from '../src/skill.js';

describe('SkillRecordSchema', () => {
  const validSkill = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'email-drafting',
    description: 'Draft professional emails',
    filePath: '/skills/email-drafting.md',
    content: '# Email Drafting Skill\n\nDraft professional emails...',
    agentId: '550e8400-e29b-41d4-a716-446655440001',
    enabled: true,
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
  };

  it('accepts valid skill', () => {
    const result = SkillRecordSchema.safeParse(validSkill);
    expect(result.success).toBe(true);
  });

  it('accepts skill without agentId', () => {
    const result = SkillRecordSchema.safeParse({
      ...validSkill,
      agentId: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = SkillRecordSchema.safeParse({
      ...validSkill,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty content', () => {
    const result = SkillRecordSchema.safeParse({
      ...validSkill,
      content: '',
    });
    expect(result.success).toBe(false);
  });
});
