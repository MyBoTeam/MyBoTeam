import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const clientSendMock = vi.hoisted(() => vi.fn());

function MockBedrockClient() {
  return { send: clientSendMock };
}

vi.mock('@aws-sdk/client-bedrock', () => ({
  BedrockClient: MockBedrockClient,
  ListFoundationModelsCommand: vi.fn(),
}));

vi.mock('../../../src/providers/bedrock-credential-resolver.js', () => ({
  resolveFromIni: vi.fn(() => vi.fn()),
}));

import { validateBedrockCredentials } from '../../../src/providers/bedrock.js';

beforeEach(() => {
  clientSendMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('validateBedrockCredentials', () => {
  it('returns error for invalid JSON', async () => {
    const result = await validateBedrockCredentials('not-json');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('parse');
  });

  it('validates API key auth type', async () => {
    clientSendMock.mockResolvedValueOnce({});
    const result = await validateBedrockCredentials(
      JSON.stringify({ authType: 'apiKey', apiKey: 'bedrock-test-key' }),
    );
    expect(result.valid).toBe(true);
  });

  it('validates API key auth type with custom region', async () => {
    clientSendMock.mockResolvedValueOnce({});
    const result = await validateBedrockCredentials(
      JSON.stringify({ authType: 'apiKey', apiKey: 'bedrock-test-key', region: 'eu-west-1' }),
    );
    expect(result.valid).toBe(true);
  });

  it('validates access keys auth type', async () => {
    clientSendMock.mockResolvedValueOnce({});
    const result = await validateBedrockCredentials(
      JSON.stringify({
        authType: 'accessKeys',
        accessKeyId: 'AKID123',
        secretAccessKey: 'sa-secret',
      }),
    );
    expect(result.valid).toBe(true);
  });

  it('returns error when access keys are missing', async () => {
    const result = await validateBedrockCredentials(JSON.stringify({ authType: 'accessKeys' }));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Access Key ID');
  });

  it('validates access keys with session token', async () => {
    clientSendMock.mockResolvedValueOnce({});
    const result = await validateBedrockCredentials(
      JSON.stringify({
        authType: 'accessKeys',
        accessKeyId: 'AKID123',
        secretAccessKey: 'sa-secret',
        sessionToken: 'session-token-xyz',
      }),
    );
    expect(result.valid).toBe(true);
  });

  it('validates profile auth type', async () => {
    clientSendMock.mockResolvedValueOnce({});
    const result = await validateBedrockCredentials(
      JSON.stringify({ authType: 'profile', profileName: 'bedrock-prod' }),
    );
    expect(result.valid).toBe(true);
  });

  it('returns error for invalid auth type', async () => {
    const result = await validateBedrockCredentials(JSON.stringify({ authType: 'unknown' }));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid authentication type');
  });

  it('maps UnrecognizedClientException to user-friendly error', async () => {
    clientSendMock.mockRejectedValueOnce(new Error('UnrecognizedClientException'));
    const result = await validateBedrockCredentials(
      JSON.stringify({ authType: 'apiKey', apiKey: 'bad-key' }),
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid AWS credentials');
  });

  it('maps AccessDeniedException to user-friendly error', async () => {
    clientSendMock.mockRejectedValueOnce(new Error('AccessDeniedException'));
    const result = await validateBedrockCredentials(
      JSON.stringify({ authType: 'apiKey', apiKey: 'bad-key' }),
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Access denied');
  });

  it('returns raw error message for unknown errors', async () => {
    clientSendMock.mockRejectedValueOnce(new Error('Some random AWS error'));
    const result = await validateBedrockCredentials(
      JSON.stringify({ authType: 'apiKey', apiKey: 'bad-key' }),
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Some random AWS error');
  });
});
