import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { AgentConfig } from '@myboteam/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateInstructionsTemplate, writeInstructions } from '../../../src/eve/file-writers.js';
import { materialize } from '../../../src/eve/materializer.js';
import type { MaterializeOptions, ToolCatalogEntry } from '../../../src/eve/runtime-files.js';

const validConfig: AgentConfig = {
  name: 'test-agent',
  model: 'gpt-4',
  provider: 'openai',
  role: 'worker',
  description: 'A test agent for profile injection',
  secrets: [],
  skills: ['skill1', 'skill2'],
  mcps: ['mcp1'],
};

const availableTools: ToolCatalogEntry[] = [
  {
    name: 'skill1',
    description: 'Test skill 1',
    parameters: { type: 'object', properties: {} },
    required: true,
  },
];

describe('Profile Injection (T008)', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(
      process.cwd(),
      '.test-eve-profile',
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

  describe('generateInstructionsTemplate()', () => {
    it('should include agent name in heading', () => {
      const template = generateInstructionsTemplate(validConfig);
      expect(template).toContain(`# ${validConfig.name}`);
    });

    it('should include description in Role section', () => {
      const template = generateInstructionsTemplate(validConfig);
      expect(template).toContain('## Role');
      expect(template).toContain(validConfig.description);
    });

    it('should include role in Purpose section', () => {
      const template = generateInstructionsTemplate(validConfig);
      expect(template).toContain('## Purpose');
      expect(template).toContain(validConfig.role);
    });

    it('should include all skills in Capabilities section', () => {
      const template = generateInstructionsTemplate(validConfig);
      expect(template).toContain('## Capabilities');
      for (const skill of validConfig.skills) {
        expect(template).toContain(`- ${skill}`);
      }
    });

    it('should include MCP servers in MCP Servers section', () => {
      const template = generateInstructionsTemplate(validConfig);
      expect(template).toContain('## MCP Servers');
      for (const mcp of validConfig.mcps) {
        expect(template).toContain(`- ${mcp}`);
      }
    });

    it('should include provider and model in Model section', () => {
      const template = generateInstructionsTemplate(validConfig);
      expect(template).toContain('## Model');
      expect(template).toContain(`Provider: ${validConfig.provider}`);
      expect(template).toContain(`Model: ${validConfig.model}`);
    });

    it('should handle agent with no skills', () => {
      const configNoSkills: AgentConfig = { ...validConfig, skills: [] };
      const template = generateInstructionsTemplate(configNoSkills);
      expect(template).toContain('no specific skills assigned');
    });

    it('should handle agent with no MCP servers', () => {
      const configNoMcps: AgentConfig = { ...validConfig, mcps: [] };
      const template = generateInstructionsTemplate(configNoMcps);
      expect(template).not.toContain('## MCP Servers');
    });

    it('should handle agent with no description', () => {
      const configNoDesc: AgentConfig = { ...validConfig, description: undefined };
      const template = generateInstructionsTemplate(configNoDesc);
      expect(template).toContain(`# ${validConfig.name}`);
      expect(template).not.toContain('## Role');
    });

    it('should handle agent with no role', () => {
      const configNoRole: AgentConfig = { ...validConfig, role: undefined };
      const template = generateInstructionsTemplate(configNoRole);
      expect(template).toContain(`# ${validConfig.name}`);
      expect(template).not.toContain('## Purpose');
    });
  });

  describe('writeInstructions()', () => {
    it('should write instructions.md to specified path', async () => {
      const outputPath = path.join(tempDir, 'instructions.md');
      const content = await writeInstructions(outputPath, validConfig);

      expect(content).toBeDefined();
      const fileExists = await fs
        .stat(outputPath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      const written = await fs.readFile(outputPath, 'utf8');
      expect(written).toBe(content);
    });

    it('should return the generated content', async () => {
      const outputPath = path.join(tempDir, 'instructions.md');
      const content = await writeInstructions(outputPath, validConfig);

      expect(content).toContain(`# ${validConfig.name}`);
      expect(content).toContain(validConfig.description);
      expect(content).toContain(validConfig.role);
    });
  });

  describe('Materializer with Instructions', () => {
    it('should generate instructions.md as part of materialization', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result = await materialize(validConfig, options);

      expect(result.filesGenerated).toContain('instructions.md');

      const instructions = await fs.readFile(
        path.join(result.outputDir, 'instructions.md'),
        'utf8',
      );

      expect(instructions).toContain(`# ${validConfig.name}`);
      expect(instructions).toContain(validConfig.description);
      expect(instructions).toContain(validConfig.role);
      expect(instructions).toContain(`- ${validConfig.skills[0]}`);
      expect(instructions).toContain(`- ${validConfig.skills[1]}`);
    });

    it('should include instructions.md in checksums.sha256', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result = await materialize(validConfig, options);

      const checksums = JSON.parse(
        await fs.readFile(path.join(result.outputDir, 'checksums.sha256'), 'utf8'),
      );

      expect(checksums['instructions.md']).toBeDefined();
      expect(checksums['instructions.md']).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce valid instructions.md with all profile fields (SC-003)', async () => {
      const options: MaterializeOptions = {
        baseDir: tempDir,
        availableTools,
      };

      const result = await materialize(validConfig, options);

      const instructions = await fs.readFile(
        path.join(result.outputDir, 'instructions.md'),
        'utf8',
      );

      // SC-003: 100% of agent profile fields present
      expect(instructions).toContain(validConfig.name);
      expect(instructions).toContain(validConfig.description);
      expect(instructions).toContain(validConfig.role);
      expect(instructions).toContain(validConfig.model);
      expect(instructions).toContain(validConfig.provider);
    });
  });
});
