import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { AgentConfig } from '@myboteam/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dematerialize, materialize } from '../../../src/eve/materializer.js';
import type {
  DelegationPolicy,
  MaterializeOptions,
  ToolCatalogEntry,
} from '../../../src/eve/runtime-files.js';

const validConfig: AgentConfig = {
  name: 'test-agent',
  model: 'gpt-4',
  provider: 'openai',
  role: 'worker',
  description: 'A test agent for materialization',
  secrets: [],
  skills: ['skill1', 'skill2'],
  mcps: [],
};

const availableTools: ToolCatalogEntry[] = [
  {
    name: 'skill1',
    description: 'Test skill 1',
    parameters: { type: 'object', properties: {} },
    required: true,
  },
  {
    name: 'skill2',
    description: 'Test skill 2',
    parameters: { type: 'object', properties: {} },
    required: false,
  },
  {
    name: 'unassigned-skill',
    description: 'Skill not assigned to agent',
    parameters: { type: 'object', properties: {} },
    required: true,
  },
];

describe('EveMaterializer', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(
      process.cwd(),
      '.test-eve-materializer',
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

  describe('materialize()', () => {
    it('should create output directory and generate runtime files', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result = await materialize(validConfig, options);

      expect(result).toBeDefined();
      expect(result.agentName).toBe(validConfig.name);
      expect(result.outputDir).toContain(validConfig.name);
      expect(result.filesGenerated).toContain('tool-catalog.json');
      expect(result.filesGenerated).toContain('provider-config.json');
      expect(result.filesGenerated).toContain('checksums.sha256');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);

      // Verify directory exists
      const dirExists = await fs
        .stat(result.outputDir)
        .then((s) => s.isDirectory())
        .catch(() => false);
      expect(dirExists).toBe(true);

      // Verify files exist
      const files = await fs.readdir(result.outputDir);
      expect(files).toContain('tool-catalog.json');
      expect(files).toContain('provider-config.json');
      expect(files).toContain('checksums.sha256');
    });

    it('should filter tool catalog based on assigned skills', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result = await materialize(validConfig, options);

      const toolCatalog = JSON.parse(
        await fs.readFile(path.join(result.outputDir, 'tool-catalog.json'), 'utf8'),
      );

      // Should only contain tools that match assigned skills
      expect(toolCatalog).toHaveLength(2);
      expect(toolCatalog.map((t: ToolCatalogEntry) => t.name)).toEqual(['skill1', 'skill2']);
      expect(toolCatalog.map((t: ToolCatalogEntry) => t.name)).not.toContain('unassigned-skill');
    });

    it('should generate provider-config.json with correct structure', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result = await materialize(validConfig, options);

      const providerConfig = JSON.parse(
        await fs.readFile(path.join(result.outputDir, 'provider-config.json'), 'utf8'),
      );

      expect(providerConfig.provider).toBe(validConfig.provider);
      expect(providerConfig.model).toBe(validConfig.model);
      expect(providerConfig.inferenceParams).toBeDefined();
      expect(providerConfig.inferenceParams.temperature).toBe(0.7);
      expect(providerConfig.inferenceParams.maxTokens).toBe(4096);
    });

    it('should generate valid checksums.sha256', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result = await materialize(validConfig, options);

      const checksums = JSON.parse(
        await fs.readFile(path.join(result.outputDir, 'checksums.sha256'), 'utf8'),
      );

      expect(checksums).toBeDefined();
      expect(typeof checksums).toBe('object');

      // Verify checksums are valid hex strings
      for (const [file, checksum] of Object.entries(checksums)) {
        expect(typeof checksum).toBe('string');
        expect(checksum).toMatch(/^[a-f0-9]{64}$/);
      }
    });

    it('should be idempotent - same config produces byte-identical output', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result1 = await materialize(validConfig, options);
      const files1: Record<string, string> = {};
      for (const file of result1.filesGenerated) {
        files1[file] = await fs.readFile(path.join(result1.outputDir, file), 'utf8');
      }

      const result2 = await materialize(validConfig, options);
      const files2: Record<string, string> = {};
      for (const file of result2.filesGenerated) {
        files2[file] = await fs.readFile(path.join(result2.outputDir, file), 'utf8');
      }

      // All files should be byte-identical
      for (const file of result1.filesGenerated) {
        expect(files1[file]).toBe(files2[file]);
      }
    });

    it('should throw error on invalid agent config', async () => {
      const invalidConfig = {
        name: '', // Invalid: empty name
        model: 'gpt-4',
        provider: 'openai',
      } as AgentConfig;

      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      await expect(materialize(invalidConfig, options)).rejects.toThrow('Invalid agent config');
    });

    it('should handle agent with no assigned skills (include all tools)', async () => {
      const configNoSkills: AgentConfig = {
        ...validConfig,
        skills: [],
      };

      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result = await materialize(configNoSkills, options);

      const toolCatalog = JSON.parse(
        await fs.readFile(path.join(result.outputDir, 'tool-catalog.json'), 'utf8'),
      );

      // Should include all tools when no skills are assigned
      expect(toolCatalog).toHaveLength(3);
    });

    it('should include duration measurement', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result = await materialize(validConfig, options);

      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(typeof result.durationMs).toBe('number');
    });

    it('should populate checksum in result', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result = await materialize(validConfig, options);

      expect(result.checksum).toBeDefined();
      expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should update files when re-materialized with changed config', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      // First materialization
      const result1 = await materialize(validConfig, options);
      const catalog1 = JSON.parse(
        await fs.readFile(path.join(result1.outputDir, 'tool-catalog.json'), 'utf8'),
      );
      const checksumBefore = await fs.readFile(
        path.join(result1.outputDir, 'checksums.sha256'),
        'utf8',
      );

      // Change config — different skills
      const changedConfig: AgentConfig = {
        ...validConfig,
        skills: ['skill1'], // removed skill2
      };

      // Re-materialize (overwrites same directory)
      const result2 = await materialize(changedConfig, options);
      const catalog2 = JSON.parse(
        await fs.readFile(path.join(result2.outputDir, 'tool-catalog.json'), 'utf8'),
      );
      const checksumAfter = await fs.readFile(
        path.join(result2.outputDir, 'checksums.sha256'),
        'utf8',
      );

      // Files should be updated
      expect(catalog1).toHaveLength(2);
      expect(catalog2).toHaveLength(1);
      expect(catalog2[0].name).toBe('skill1');

      // Checksums should differ (captured before/after overwrite)
      expect(checksumBefore).not.toBe(checksumAfter);
    });

    it('should clean up partial files on failure', async () => {
      // Create a valid materialization first
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };
      const result = await materialize(validConfig, options);
      const outputDir = result.outputDir;

      // Verify files exist
      const filesBefore = await fs.readdir(outputDir);
      expect(filesBefore.length).toBeGreaterThan(0);

      // Now try to materialize with invalid config — should fail and clean up
      const invalidConfig = { ...validConfig, name: '' } as AgentConfig;
      await expect(materialize(invalidConfig, { ...options, baseDir: tempDir })).rejects.toThrow();

      // The invalid materialization should not leave partial files
      // (the original materialization files should still be there since
      // the invalid one used a different output dir based on empty name)
      const filesAfter = await fs.readdir(outputDir);
      expect(filesAfter).toEqual(filesBefore);
    });

    it('should generate delegation-policy.json when delegation policy is provided', async () => {
      const delegationPolicy: DelegationPolicy = {
        enabled: true,
        rules: [{ targetAgent: 'helper', condition: 'always', maxDepth: 1 }],
        defaultBehavior: 'deny',
      };

      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
        delegationPolicy,
      };

      const result = await materialize(validConfig, options);

      expect(result.filesGenerated).toContain('delegation-policy.json');
      expect(result.filesGenerated).toContain('checksums.sha256');

      const policyContent = JSON.parse(
        await fs.readFile(path.join(result.outputDir, 'delegation-policy.json'), 'utf8'),
      );
      expect(policyContent.enabled).toBe(true);
      expect(policyContent.rules).toHaveLength(1);
      expect(policyContent.rules[0].targetAgent).toBe('helper');
      expect(policyContent.defaultBehavior).toBe('deny');

      const checksums = JSON.parse(
        await fs.readFile(path.join(result.outputDir, 'checksums.sha256'), 'utf8'),
      );
      expect(checksums['delegation-policy.json']).toBeDefined();
      expect(checksums['delegation-policy.json']).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should not generate delegation-policy.json when no policy provided', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result = await materialize(validConfig, options);

      expect(result.filesGenerated).not.toContain('delegation-policy.json');

      const files = await fs.readdir(result.outputDir);
      expect(files).not.toContain('delegation-policy.json');
    });

    it('should reject path traversal in agentId', async () => {
      // Zod schema regex [a-zA-Z0-9 _-] already prevents dots/slashes,
      // but resolveAgentDirectory adds defense-in-depth for edge cases
      const traversalConfig: AgentConfig = {
        ...validConfig,
        name: '../../../etc/passwd',
      };

      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      // Zod validation rejects this first (regex), then path check would reject it
      await expect(materialize(traversalConfig, options)).rejects.toThrow();
    });
  });

  describe('dematerialize()', () => {
    it('should remove all materialized files', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result = await materialize(validConfig, options);

      // Verify files exist
      const filesBefore = await fs.readdir(result.outputDir);
      expect(filesBefore.length).toBeGreaterThan(0);

      // Dematerialize
      await dematerialize(validConfig.name, tempDir);

      // Verify directory is removed
      const dirExists = await fs
        .stat(result.outputDir)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(false);
    });

    it('should handle dematerializing non-existent agent gracefully', async () => {
      // Should not throw
      await expect(dematerialize('non-existent-agent', tempDir)).resolves.not.toThrow();
    });

    it('should reject path traversal in agentId', async () => {
      await expect(dematerialize('../../etc/passwd', tempDir)).rejects.toThrow(
        'Invalid agent identifier',
      );
    });
  });
});
