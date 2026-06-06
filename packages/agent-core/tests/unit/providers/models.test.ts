import { describe, expect, it } from 'vitest';
import type { ProviderType } from '../../../src/common/types/provider.js';
import {
  DEFAULT_MODEL,
  DEFAULT_PROVIDERS,
  findModelById,
  getApiKeyEnvVar,
  getDefaultModelForProvider,
  getModelsForProvider,
  getProviderById,
  isValidModel,
  providerRequiresApiKey,
} from '../../../src/providers/models.js';

describe('providers/models', () => {
  describe('DEFAULT_MODEL', () => {
    it('should be defined', () => {
      expect(DEFAULT_MODEL).toBeDefined();
      expect(DEFAULT_MODEL.provider).toBeDefined();
    });
  });

  describe('DEFAULT_PROVIDERS', () => {
    it('should be an array', () => {
      expect(Array.isArray(DEFAULT_PROVIDERS)).toBe(true);
      expect(DEFAULT_PROVIDERS.length).toBeGreaterThan(0);
    });
  });

  describe('getModelsForProvider', () => {
    it('should return models for a provider with static models', () => {
      const models = getModelsForProvider('zai');
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return empty array for provider with no static models', () => {
      const models = getModelsForProvider('anthropic');
      expect(models).toEqual([]);
    });

    it('should return empty array for unknown provider', () => {
      const models = getModelsForProvider('unknown' as ProviderType);
      expect(models).toEqual([]);
    });
  });

  describe('getDefaultModelForProvider', () => {
    it('should return first model for provider with static models', () => {
      const model = getDefaultModelForProvider('zai');
      expect(model).toBeDefined();
      expect(model?.id).toBeDefined();
    });

    it('should return undefined for provider with no static models', () => {
      const model = getDefaultModelForProvider('anthropic');
      expect(model).toBeUndefined();
    });

    it('should return undefined for unknown provider', () => {
      const model = getDefaultModelForProvider('unknown' as ProviderType);
      expect(model).toBeUndefined();
    });
  });

  describe('isValidModel', () => {
    it('should return true for a valid model id', () => {
      const validResult = isValidModel('zai', 'glm-5');
      expect(validResult).toBe(true);
    });

    it('should return true for a valid fullId', () => {
      const validResult = isValidModel('zai', 'zai/glm-5');
      expect(validResult).toBe(true);
    });

    it('should return false for an invalid model', () => {
      expect(isValidModel('anthropic', 'nonexistent-model')).toBe(false);
    });

    it('should return false for unknown provider', () => {
      expect(isValidModel('unknown' as ProviderType, 'test')).toBe(false);
    });
  });

  describe('findModelById', () => {
    it('should find a model by id', () => {
      const found = findModelById('glm-5');
      expect(found).toBeDefined();
      expect(found?.id).toBe('glm-5');
    });

    it('should find a model by fullId', () => {
      const found = findModelById('zai/glm-5');
      expect(found).toBeDefined();
    });

    it('should return undefined for unknown model', () => {
      const found = findModelById('nonexistent-model-id');
      expect(found).toBeUndefined();
    });
  });

  describe('getProviderById', () => {
    it('should return provider config for known provider', () => {
      const provider = getProviderById('anthropic');
      expect(provider).toBeDefined();
      expect(provider?.id).toBe('anthropic');
    });

    it('should return undefined for unknown provider', () => {
      const provider = getProviderById('unknown' as ProviderType);
      expect(provider).toBeUndefined();
    });
  });

  describe('providerRequiresApiKey', () => {
    it('should return true for anthropic', () => {
      expect(providerRequiresApiKey('anthropic')).toBe(true);
    });

    it('should return false for ollama', () => {
      expect(providerRequiresApiKey('ollama')).toBe(false);
    });
  });

  describe('getApiKeyEnvVar', () => {
    it('should return env var name for anthropic', () => {
      const envVar = getApiKeyEnvVar('anthropic');
      expect(envVar).toBeDefined();
      expect(typeof envVar).toBe('string');
    });

    it('should return undefined for unknown provider', () => {
      const envVar = getApiKeyEnvVar('unknown' as ProviderType);
      expect(envVar).toBeUndefined();
    });
  });
});
