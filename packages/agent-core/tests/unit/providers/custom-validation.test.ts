/**
 * Unit tests for custom provider validation utilities and error codes.
 * Tests URL validation, API key validation, model name validation, and error code constants.
 */

import { CUSTOM_PROVIDER_ERRORS } from '@myboteam/types';
import { describe, expect, it } from 'vitest';
import {
  validateApiKey,
  validateModelName,
  validateProviderConfig,
  validateProviderUrl,
} from '../../../src/providers/tools/custom-validation.js';

describe('CustomProviderValidation', () => {
  describe('validateProviderUrl()', () => {
    it('should accept a valid HTTPS URL', () => {
      const url = validateProviderUrl('https://api.example.com/v1');
      expect(url.href).toBe('https://api.example.com/v1');
    });

    it('should accept a valid HTTP URL', () => {
      const url = validateProviderUrl('http://localhost:3000/api');
      expect(url.href).toBe('http://localhost:3000/api');
    });

    it('should reject a non-URL string', () => {
      expect(() => validateProviderUrl('not-a-url')).toThrow('[INVALID_URL]');
    });

    it('should reject a URL with non-http protocol', () => {
      expect(() => validateProviderUrl('ftp://example.com')).toThrow('[INVALID_URL]');
      expect(() => validateProviderUrl('ftp://example.com')).toThrow('protocol');
    });

    it('should reject an empty string', () => {
      expect(() => validateProviderUrl('')).toThrow('[INVALID_URL]');
    });
  });

  describe('validateApiKey()', () => {
    it('should return null when apiKey is undefined', () => {
      expect(validateApiKey(undefined)).toBeNull();
    });

    it('should return null when apiKey is null', () => {
      expect(validateApiKey(null)).toBeNull();
    });

    it('should return trimmed key for a valid API key', () => {
      expect(validateApiKey('sk-abc123')).toBe('sk-abc123');
    });

    it('should trim whitespace from valid API key', () => {
      expect(validateApiKey('  sk-abc123  ')).toBe('sk-abc123');
    });

    it('should throw when apiKey is empty string', () => {
      expect(() => validateApiKey('')).toThrow('[INVALID_API_KEY]');
      expect(() => validateApiKey('')).toThrow('must not be empty');
    });

    it('should throw when apiKey is whitespace only', () => {
      expect(() => validateApiKey('   ')).toThrow('[INVALID_API_KEY]');
    });

    it('should throw when apiKey exceeds maximum length', () => {
      const longKey = 'a'.repeat(1025);
      expect(() => validateApiKey(longKey)).toThrow('[INVALID_API_KEY]');
      expect(() => validateApiKey(longKey)).toThrow('exceeds maximum length');
    });

    it('should accept an API key at maximum length', () => {
      const maxKey = 'a'.repeat(1024);
      expect(validateApiKey(maxKey)).toBe(maxKey);
    });
  });

  describe('validateModelName()', () => {
    it('should return trimmed name for a valid model name', () => {
      expect(validateModelName('gpt-4')).toBe('gpt-4');
    });

    it('should trim whitespace from valid model name', () => {
      expect(validateModelName('  gpt-4  ')).toBe('gpt-4');
    });

    it('should throw when modelName is empty string', () => {
      expect(() => validateModelName('')).toThrow('[VALIDATION_FAILED]');
      expect(() => validateModelName('')).toThrow('required');
    });

    it('should throw when modelName is whitespace only', () => {
      expect(() => validateModelName('   ')).toThrow('[VALIDATION_FAILED]');
    });

    it('should throw when modelName exceeds maximum length', () => {
      const longName = 'a'.repeat(257);
      expect(() => validateModelName(longName)).toThrow('[VALIDATION_FAILED]');
      expect(() => validateModelName(longName)).toThrow('exceeds maximum length');
    });

    it('should accept a model name at maximum length', () => {
      const maxName = 'a'.repeat(256);
      expect(validateModelName(maxName)).toBe(maxName);
    });
  });

  describe('validateProviderConfig', () => {
    it('should pass for valid config', () => {
      expect(() =>
        validateProviderConfig({
          name: 'My Provider',
          url: 'https://api.example.com/v1',
          apiKey: 'sk-test-123',
          modelName: 'gpt-4',
        }),
      ).not.toThrow();
    });

    it('should pass for config without optional apiKey', () => {
      expect(() =>
        validateProviderConfig({
          name: 'Public Provider',
          url: 'https://api.example.com/v1',
          modelName: 'llama-3',
        }),
      ).not.toThrow();
    });

    it('should throw for invalid URL', () => {
      expect(() =>
        validateProviderConfig({
          name: 'Bad URL',
          url: 'not-a-url',
          modelName: 'gpt-4',
        }),
      ).toThrow('[INVALID_URL]');
    });

    it('should throw for empty name', () => {
      expect(() =>
        validateProviderConfig({
          name: '',
          url: 'https://api.example.com/v1',
          modelName: 'gpt-4',
        }),
      ).toThrow('[VALIDATION_FAILED]');
    });

    it('should throw for empty modelName', () => {
      expect(() =>
        validateProviderConfig({
          name: 'Valid Name',
          url: 'https://api.example.com/v1',
          modelName: '',
        }),
      ).toThrow('[VALIDATION_FAILED]');
    });

    it('should throw for empty apiKey', () => {
      expect(() =>
        validateProviderConfig({
          name: 'Valid Name',
          url: 'https://api.example.com/v1',
          apiKey: '',
          modelName: 'gpt-4',
        }),
      ).toThrow('[INVALID_API_KEY]');
    });
  });

  describe('CUSTOM_PROVIDER_ERRORS', () => {
    it('should have PROVIDER_NOT_FOUND constant', () => {
      expect(CUSTOM_PROVIDER_ERRORS.PROVIDER_NOT_FOUND).toBe('PROVIDER_NOT_FOUND');
    });

    it('should have PROVIDER_NAME_EXISTS constant', () => {
      expect(CUSTOM_PROVIDER_ERRORS.PROVIDER_NAME_EXISTS).toBe('PROVIDER_NAME_EXISTS');
    });

    it('should have INVALID_URL constant', () => {
      expect(CUSTOM_PROVIDER_ERRORS.INVALID_URL).toBe('INVALID_URL');
    });

    it('should have INVALID_API_KEY constant', () => {
      expect(CUSTOM_PROVIDER_ERRORS.INVALID_API_KEY).toBe('INVALID_API_KEY');
    });

    it('should have MODEL_NOT_FOUND constant', () => {
      expect(CUSTOM_PROVIDER_ERRORS.MODEL_NOT_FOUND).toBe('MODEL_NOT_FOUND');
    });

    it('should have VALIDATION_FAILED constant', () => {
      expect(CUSTOM_PROVIDER_ERRORS.VALIDATION_FAILED).toBe('VALIDATION_FAILED');
    });
  });
});
