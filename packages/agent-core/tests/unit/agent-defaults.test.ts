import { AgentConfigSchema } from '@myboteam/types';
import { describe, expect, it } from 'vitest';
import { DEFAULT_AGENTS } from '../../src/agent-defaults.js';

describe('DEFAULT_AGENTS', () => {
  it('should have three default agents', () => {
    expect(DEFAULT_AGENTS).toHaveLength(3);
  });

  it('each default should pass AgentConfigSchema validation', () => {
    for (const agent of DEFAULT_AGENTS) {
      const result = AgentConfigSchema.safeParse(agent);
      expect(result.success).toBe(true);
    }
  });

  it('orchestrator should have coordinator role', () => {
    const orchestrator = DEFAULT_AGENTS.find((a) => a.name === 'orchestrator');
    expect(orchestrator).toBeDefined();
    expect(orchestrator?.role).toBe('coordinator');
  });

  it('secretary should have scheduling role', () => {
    const secretary = DEFAULT_AGENTS.find((a) => a.name === 'secretary');
    expect(secretary).toBeDefined();
    expect(secretary?.role).toBe('scheduling');
  });

  it('accountant should have resource tracking role', () => {
    const accountant = DEFAULT_AGENTS.find((a) => a.name === 'accountant');
    expect(accountant).toBeDefined();
    expect(accountant?.role).toBe('resource tracking');
  });
});
