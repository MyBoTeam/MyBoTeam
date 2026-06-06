import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockExistsSync = vi.fn();

vi.mock('node:fs', () => ({
  default: {
    existsSync: mockExistsSync,
  },
  existsSync: mockExistsSync,
}));

describe('model-runtime-mapping', () => {
  let originalPlatform: string;
  let originalArch: string;

  beforeEach(() => {
    vi.clearAllMocks();
    originalPlatform = process.platform;
    originalArch = process.arch;
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    Object.defineProperty(process, 'arch', { value: originalArch });
  });

  describe('resolveLlamaCppRuntimeModelName', () => {
    it('should return modelId unchanged on non-macOS', async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      Object.defineProperty(process, 'arch', { value: 'x64' });
      const { resolveLlamaCppRuntimeModelName } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = resolveLlamaCppRuntimeModelName('my-model');
      expect(result).toBe('my-model');
    });

    it('should return modelId unchanged on macOS non-arm64', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'x64' });
      const { resolveLlamaCppRuntimeModelName } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = resolveLlamaCppRuntimeModelName('my-model');
      expect(result).toBe('my-model');
    });

    it('should return modelId when no userDataPath and no XDG_DATA_HOME', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });
      const { resolveLlamaCppRuntimeModelName } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = resolveLlamaCppRuntimeModelName('my-model', { userDataPath: '' });
      expect(result).toBe('my-model');
    });

    it('should return modelId when mlx manifest does not exist', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });
      mockExistsSync.mockReturnValueOnce(false);
      const { resolveLlamaCppRuntimeModelName } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = resolveLlamaCppRuntimeModelName('my-model', {
        userDataPath: '/data',
        fileExists: mockExistsSync,
      });
      expect(result).toBe('my-model');
    });

    it('should return modelDir when mlx manifest exists', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });
      mockExistsSync.mockReturnValueOnce(true);
      const { resolveLlamaCppRuntimeModelName } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = resolveLlamaCppRuntimeModelName('my-model', {
        userDataPath: '/data',
        fileExists: mockExistsSync,
      });
      expect(result).toBe('/data/llama-cpp-models/my-model');
    });

    it('should sanitize model name in path', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });
      mockExistsSync.mockReturnValueOnce(true);
      const { resolveLlamaCppRuntimeModelName } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = resolveLlamaCppRuntimeModelName('my/cool/model v1.0', {
        userDataPath: '/data',
        fileExists: mockExistsSync,
      });
      expect(result).toBe('/data/llama-cpp-models/my-cool-model-v1.0');
    });

    it('should use XDG_DATA_HOME when userDataPath is not provided', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });
      const existingXdg = process.env.XDG_DATA_HOME;
      process.env.XDG_DATA_HOME = '/xdg/data';
      mockExistsSync.mockReturnValueOnce(true);
      const { resolveLlamaCppRuntimeModelName } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = resolveLlamaCppRuntimeModelName('model-x', {
        fileExists: mockExistsSync,
      });
      expect(result).toContain('/xdg/data');
      process.env.XDG_DATA_HOME = existingXdg;
    });
  });

  describe('normalizeSelectedModelForSdk', () => {
    it('should return null for null input', async () => {
      const { normalizeSelectedModelForSdk } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = normalizeSelectedModelForSdk(null);
      expect(result).toBeNull();
    });

    it('should handle zai provider', async () => {
      const { normalizeSelectedModelForSdk } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = normalizeSelectedModelForSdk({
        provider: 'zai',
        model: 'zai/glm-4',
      });
      expect(result).toEqual({ providerID: 'zai-coding-plan', modelID: 'glm-4' });
    });

    it('should handle deepseek provider', async () => {
      const { normalizeSelectedModelForSdk } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = normalizeSelectedModelForSdk({
        provider: 'deepseek',
        model: 'deepseek/deepseek-chat',
      });
      expect(result).toEqual({ providerID: 'deepseek', modelID: 'deepseek-chat' });
    });

    it('should handle openrouter provider', async () => {
      const { normalizeSelectedModelForSdk } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = normalizeSelectedModelForSdk({
        provider: 'openrouter',
        model: 'openrouter/anthropic/claude-3',
      });
      expect(result).toEqual({ providerID: 'openrouter', modelID: 'anthropic/claude-3' });
    });

    it('should handle ollama provider', async () => {
      const { normalizeSelectedModelForSdk } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = normalizeSelectedModelForSdk({
        provider: 'ollama',
        model: 'ollama/llama2',
      });
      expect(result).toEqual({ providerID: 'ollama', modelID: 'llama2' });
    });

    it('should handle litellm provider', async () => {
      const { normalizeSelectedModelForSdk } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = normalizeSelectedModelForSdk({
        provider: 'litellm',
        model: 'litellm/gpt-4',
      });
      expect(result).toEqual({ providerID: 'litellm', modelID: 'gpt-4' });
    });

    it('should handle lmstudio provider', async () => {
      const { normalizeSelectedModelForSdk } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = normalizeSelectedModelForSdk({
        provider: 'lmstudio',
        model: 'lmstudio/local-model',
      });
      expect(result).toEqual({ providerID: 'lmstudio', modelID: 'local-model' });
    });

    it('should handle vertex provider', async () => {
      const { normalizeSelectedModelForSdk } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = normalizeSelectedModelForSdk({
        provider: 'vertex',
        model: 'vertex/us-central1/claude-3',
      });
      expect(result).toEqual({ providerID: 'vertex', modelID: 'claude-3' });
    });

    it('should handle bedrock provider', async () => {
      const { normalizeSelectedModelForSdk } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = normalizeSelectedModelForSdk({
        provider: 'bedrock',
        model: 'amazon-bedrock/anthropic.claude-3',
      });
      expect(result).toEqual({ providerID: 'amazon-bedrock', modelID: 'anthropic.claude-3' });
    });

    it('should handle bedrock with bedrock/ prefix', async () => {
      const { normalizeSelectedModelForSdk } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = normalizeSelectedModelForSdk({
        provider: 'bedrock',
        model: 'bedrock/anthropic.claude-3',
      });
      expect(result).toEqual({ providerID: 'amazon-bedrock', modelID: 'anthropic.claude-3' });
    });

    it('should handle generic provider fallback', async () => {
      const { normalizeSelectedModelForSdk } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = normalizeSelectedModelForSdk({
        provider: 'anthropic',
        model: 'anthropic/claude-opus-4-5',
      });
      expect(result).toEqual({ providerID: 'anthropic', modelID: 'claude-opus-4-5' });
    });

    it('should handle provider without prefix in model', async () => {
      const { normalizeSelectedModelForSdk } = await import(
        '../../../src/opencode/model-runtime-mapping.js'
      );
      const result = normalizeSelectedModelForSdk({
        provider: 'openai',
        model: 'gpt-4',
      });
      expect(result).toEqual({ providerID: 'openai', modelID: 'gpt-4' });
    });
  });
});
