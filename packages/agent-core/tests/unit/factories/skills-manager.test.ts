import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/internal/classes/SkillsManager.js', () => ({
  SkillsManager: class MockSM {
    constructor(readonly options: unknown) {}
    getSkills = vi.fn();
    getSkill = vi.fn();
  },
}));

import { createSkillsManager } from '../../../src/factories/skills-manager.js';

describe('createSkillsManager', () => {
  it('should create a SkillsManager with options', () => {
    const options = { storage: {} as never, skillsDir: '/tmp/skills' } as never;
    const result = createSkillsManager(options);
    expect(result).toBeDefined();
    expect(typeof result.getSkills).toBe('function');
  });
});
