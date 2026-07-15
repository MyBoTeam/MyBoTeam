import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeDelegationPolicy } from '../../../src/eve/file-writers.js';
import type { DelegationPolicy } from '../../../src/eve/runtime-files.js';

const testPolicy: DelegationPolicy = {
  enabled: true,
  rules: [
    {
      targetAgent: 'agent-a',
      condition: 'task.requiresSkill("research")',
      maxDepth: 2,
    },
    {
      targetAgent: 'agent-b',
      condition: 'task.priority === "high"',
      maxDepth: 1,
    },
  ],
  defaultBehavior: 'deny',
};

describe('Delegation Policy (T012)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(
      process.cwd(),
      '.test-eve-delegation',
      `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    );
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('writeDelegationPolicy()', () => {
    it('should write delegation-policy.json to specified path', async () => {
      const outputPath = path.join(tempDir, 'delegation-policy.json');
      const content = await writeDelegationPolicy(outputPath, testPolicy);

      expect(content).toBeDefined();
      const fileExists = await fs
        .stat(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      const written = await fs.readFile(outputPath, 'utf8');
      expect(written).toBe(content);
    });

    it('should serialize policy correctly', async () => {
      const outputPath = path.join(tempDir, 'delegation-policy.json');
      const content = await writeDelegationPolicy(outputPath, testPolicy);

      const parsed = JSON.parse(content);
      expect(parsed.enabled).toBe(true);
      expect(parsed.defaultBehavior).toBe('deny');
      expect(parsed.rules).toHaveLength(2);
    });

    it('should include all rule fields', async () => {
      const outputPath = path.join(tempDir, 'delegation-policy.json');
      await writeDelegationPolicy(outputPath, testPolicy);

      const parsed = JSON.parse(await fs.readFile(outputPath, 'utf8'));

      const rule1 = parsed.rules[0];
      expect(rule1.targetAgent).toBe('agent-a');
      expect(rule1.condition).toBe('task.requiresSkill("research")');
      expect(rule1.maxDepth).toBe(2);

      const rule2 = parsed.rules[1];
      expect(rule2.targetAgent).toBe('agent-b');
      expect(rule2.condition).toBe('task.priority === "high"');
      expect(rule2.maxDepth).toBe(1);
    });

    it('should handle policy with no rules', async () => {
      const policyNoRules: DelegationPolicy = {
        enabled: false,
        rules: [],
        defaultBehavior: 'allow',
      };

      const outputPath = path.join(tempDir, 'delegation-policy.json');
      await writeDelegationPolicy(outputPath, policyNoRules);

      const parsed = JSON.parse(await fs.readFile(outputPath, 'utf8'));
      expect(parsed.rules).toHaveLength(0);
      expect(parsed.enabled).toBe(false);
      expect(parsed.defaultBehavior).toBe('allow');
    });

    it('should produce valid JSON', async () => {
      const outputPath = path.join(tempDir, 'delegation-policy.json');
      await writeDelegationPolicy(outputPath, testPolicy);

      const content = await fs.readFile(outputPath, 'utf8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should serialize policy with circular-looking references (no runtime cycle detection needed at write time)', async () => {
      // FR-004/US4 Scenario 3: Circular delegation references
      // The materializer writes the policy as-is; cycle detection is a concern
      // for the delegation engine at runtime, not the file writer.
      const circularPolicy: DelegationPolicy = {
        enabled: true,
        rules: [
          {
            targetAgent: 'agent-a',
            condition: 'task.type === "research"',
            maxDepth: 3,
          },
          {
            targetAgent: 'agent-b',
            condition: 'task.type === "writing"',
            maxDepth: 2,
          },
        ],
        defaultBehavior: 'deny',
      };

      const outputPath = path.join(tempDir, 'delegation-policy.json');
      await writeDelegationPolicy(outputPath, circularPolicy);

      const parsed = JSON.parse(await fs.readFile(outputPath, 'utf8'));
      expect(parsed.rules).toHaveLength(2);
      expect(parsed.rules[0].targetAgent).toBe('agent-a');
      expect(parsed.rules[1].targetAgent).toBe('agent-b');
    });
  });
});
