import { describe, expect, it } from 'vitest';
import { AgentConfigSchema, InferenceParamsSchema } from '../../src/agent-config.js';

describe('AgentConfigSchema', () => {
  const validConfig = {
    name: 'test-agent',
    model: 'gpt-4',
    provider: 'openai',
    role: 'Test agent',
    description: 'A test agent',
    params: {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
    },
    secrets: ['secret1', 'secret2'],
    skills: ['skill1'],
    mcps: ['mcp1'],
  };

  it('should accept valid config with all fields', () => {
    const result = AgentConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('should reject config missing required name', () => {
    const config = { ...validConfig, name: undefined };
    const result = AgentConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should reject name with special characters', () => {
    const config = { ...validConfig, name: 'invalid@name!' };
    const result = AgentConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should accept name with allowed characters', () => {
    const config = { ...validConfig, name: 'valid-name_123' };
    const result = AgentConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('should accept empty secrets/skills/mcps arrays', () => {
    const config = { ...validConfig, secrets: [], skills: [], mcps: [] };
    const result = AgentConfigSchema.safeParse(config);
    // Note: .default([]) means undefined becomes [], but empty arrays are valid
    expect(result.success).toBe(true);
  });

  it('should reject secrets exceeding 50 items', () => {
    const config = { ...validConfig, secrets: Array(51).fill('secret') };
    const result = AgentConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should reject mcps exceeding 10 items', () => {
    const config = { ...validConfig, mcps: Array(11).fill('mcp') };
    const result = AgentConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });

  it('should reject unknown keys (strict mode)', () => {
    const config = { ...validConfig, unknownKey: 'value' };
    const result = AgentConfigSchema.safeParse(config);
    expect(result.success).toBe(false);
  });
});

describe('InferenceParamsSchema', () => {
  it('should accept valid inference params', () => {
    const params = {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      presencePenalty: 0.5,
      frequencyPenalty: 0.3,
    };
    const result = InferenceParamsSchema.safeParse(params);
    expect(result.success).toBe(true);
  });

  it('should reject temperature > 2', () => {
    const params = { temperature: 2.5 };
    const result = InferenceParamsSchema.safeParse(params);
    expect(result.success).toBe(false);
  });

  it('should reject temperature < 0', () => {
    const params = { temperature: -0.5 };
    const result = InferenceParamsSchema.safeParse(params);
    expect(result.success).toBe(false);
  });

  it('should reject topP > 1', () => {
    const params = { topP: 1.5 };
    const result = InferenceParamsSchema.safeParse(params);
    expect(result.success).toBe(false);
  });

  it('should reject topP < 0', () => {
    const params = { topP: -0.1 };
    const result = InferenceParamsSchema.safeParse(params);
    expect(result.success).toBe(false);
  });

  it('should reject presencePenalty out of range', () => {
    const params = { presencePenalty: 3 };
    const result = InferenceParamsSchema.safeParse(params);
    expect(result.success).toBe(false);
  });

  it('should reject frequencyPenalty out of range', () => {
    const params = { frequencyPenalty: 3 };
    const result = InferenceParamsSchema.safeParse(params);
    expect(result.success).toBe(false);
  });

  it('should reject maxTokens non-positive', () => {
    const params = { maxTokens: 0 };
    const result = InferenceParamsSchema.safeParse(params);
    expect(result.success).toBe(false);
  });

  it('should reject maxTokens non-integer', () => {
    const params = { maxTokens: 1.5 };
    const result = InferenceParamsSchema.safeParse(params);
    expect(result.success).toBe(false);
  });

  it('should accept stop as string', () => {
    const params = { stop: 'END' };
    const result = InferenceParamsSchema.safeParse(params);
    expect(result.success).toBe(true);
  });

  it('should accept stop as array', () => {
    const params = { stop: ['END', 'STOP'] };
    const result = InferenceParamsSchema.safeParse(params);
    expect(result.success).toBe(true);
  });

  it('should accept empty params', () => {
    const result = InferenceParamsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
