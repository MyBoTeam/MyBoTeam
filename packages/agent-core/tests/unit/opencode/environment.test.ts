import { describe, expect, it } from 'vitest';

import { buildOpenCodeEnvironment } from '../../../src/opencode/environment.js';

describe('buildOpenCodeEnvironment', () => {
  it('copies base environment', () => {
    const base = { PATH: '/usr/bin', HOME: '/home/user' };
    const result = buildOpenCodeEnvironment(base, { apiKeys: {} });
    expect(result.PATH).toBe('/usr/bin');
    expect(result.HOME).toBe('/home/user');
  });

  it('sets API key env vars', () => {
    const result = buildOpenCodeEnvironment(
      {},
      {
        apiKeys: {
          anthropic: 'sk-ant-xxx',
          openai: 'sk-openai-xxx',
          google: 'google-key',
          xai: 'xai-key',
          deepseek: 'ds-key',
        },
      },
    );
    expect(result.ANTHROPIC_API_KEY).toBe('sk-ant-xxx');
    expect(result.OPENAI_API_KEY).toBe('sk-openai-xxx');
    expect(result.GOOGLE_GENERATIVE_AI_API_KEY).toBe('google-key');
    expect(result.XAI_API_KEY).toBe('xai-key');
    expect(result.DEEPSEEK_API_KEY).toBe('ds-key');
  });

  it('skips missing API keys', () => {
    const result = buildOpenCodeEnvironment({}, { apiKeys: { anthropic: null } });
    expect(result.ANTHROPIC_API_KEY).toBeUndefined();
  });

  it('sets task ID', () => {
    const result = buildOpenCodeEnvironment({}, { apiKeys: {}, taskId: 'task-123' });
    expect(result.MYBOTEAM_TASK_ID).toBe('task-123');
  });

  it('does not set task ID when not provided', () => {
    const result = buildOpenCodeEnvironment({}, { apiKeys: {} });
    expect(result.MYBOTEAM_TASK_ID).toBeUndefined();
  });

  it('sets openai base URL', () => {
    const result = buildOpenCodeEnvironment(
      {},
      { apiKeys: {}, openAiBaseUrl: 'https://custom.openai.com' },
    );
    expect(result.OPENAI_BASE_URL).toBe('https://custom.openai.com');
  });

  it('sets ollama host', () => {
    const result = buildOpenCodeEnvironment(
      {},
      { apiKeys: {}, ollamaHost: 'http://ollama.local:11434' },
    );
    expect(result.OLLAMA_HOST).toBe('http://ollama.local:11434');
  });

  describe('bedrock credentials', () => {
    it('sets apiKey auth type', () => {
      const result = buildOpenCodeEnvironment(
        {},
        {
          apiKeys: {},
          bedrockCredentials: {
            authType: 'apiKey',
            apiKey: 'bedrock-key',
            region: 'us-east-1',
          },
        },
      );
      expect(result.AWS_BEARER_TOKEN_BEDROCK).toBe('bedrock-key');
      expect(result.AWS_REGION).toBe('us-east-1');
    });

    it('sets accessKeys auth type', () => {
      const result = buildOpenCodeEnvironment(
        {},
        {
          apiKeys: {},
          bedrockCredentials: {
            authType: 'accessKeys',
            accessKeyId: 'AKID',
            secretAccessKey: 'secret',
            sessionToken: 'token',
            region: 'us-west-2',
          },
        },
      );
      expect(result.AWS_ACCESS_KEY_ID).toBe('AKID');
      expect(result.AWS_SECRET_ACCESS_KEY).toBe('secret');
      expect(result.AWS_SESSION_TOKEN).toBe('token');
      expect(result.AWS_REGION).toBe('us-west-2');
    });

    it('sets profile auth type', () => {
      const result = buildOpenCodeEnvironment(
        {},
        {
          apiKeys: {},
          bedrockCredentials: {
            authType: 'profile',
            profileName: 'my-profile',
            region: 'eu-central-1',
          },
        },
      );
      expect(result.AWS_PROFILE).toBe('my-profile');
      expect(result.AWS_REGION).toBe('eu-central-1');
    });

    it('does not set region when not provided', () => {
      const result = buildOpenCodeEnvironment(
        {},
        {
          apiKeys: {},
          bedrockCredentials: {
            authType: 'profile',
            profileName: 'default',
          },
        },
      );
      expect(result.AWS_REGION).toBeUndefined();
    });
  });

  describe('vertex credentials', () => {
    it('sets project and location', () => {
      const result = buildOpenCodeEnvironment(
        {},
        {
          apiKeys: {},
          vertexCredentials: {
            projectId: 'my-project',
            location: 'us-central1',
            authType: 'serviceAccount',
          },
        },
      );
      expect(result.GOOGLE_CLOUD_PROJECT).toBe('my-project');
      expect(result.GOOGLE_CLOUD_LOCATION).toBe('us-central1');
    });

    it('sets service account key path when authType is serviceAccount', () => {
      const result = buildOpenCodeEnvironment(
        {},
        {
          apiKeys: {},
          vertexCredentials: {
            projectId: 'my-project',
            location: 'us-central1',
            authType: 'serviceAccount',
          },
          vertexServiceAccountKeyPath: '/path/to/key.json',
        },
      );
      expect(result.GOOGLE_APPLICATION_CREDENTIALS).toBe('/path/to/key.json');
    });

    it('does not set service account key path when authType is not serviceAccount', () => {
      const result = buildOpenCodeEnvironment(
        {},
        {
          apiKeys: {},
          vertexCredentials: {
            projectId: 'my-project',
            location: 'us-central1',
            authType: 'oauth',
          },
          vertexServiceAccountKeyPath: '/path/to/key.json',
        },
      );
      expect(result.GOOGLE_APPLICATION_CREDENTIALS).toBeUndefined();
    });
  });

  it('sets bundled Node.js bin path', () => {
    const result = buildOpenCodeEnvironment(
      {},
      { apiKeys: {}, bundledNodeBinPath: '/path/to/node/bin' },
    );
    expect(result.NODE_BIN_PATH).toBe('/path/to/node/bin');
  });

  it('merges all settings together', () => {
    const result = buildOpenCodeEnvironment(
      { EXISTING: 'value' },
      {
        apiKeys: { anthropic: 'sk-ant-xxx' },
        taskId: 'task-999',
        openAiBaseUrl: 'https://custom.openai.com',
        bedrockCredentials: { authType: 'profile', profileName: 'prod', region: 'us-east-1' },
        bundledNodeBinPath: '/node/bin',
        ollamaHost: 'http://ollama:11434',
        vertexCredentials: { projectId: 'proj', location: 'us-central1', authType: 'oauth' },
      },
    );
    expect(result.EXISTING).toBe('value');
    expect(result.ANTHROPIC_API_KEY).toBe('sk-ant-xxx');
    expect(result.MYBOTEAM_TASK_ID).toBe('task-999');
    expect(result.OPENAI_BASE_URL).toBe('https://custom.openai.com');
    expect(result.AWS_PROFILE).toBe('prod');
    expect(result.AWS_REGION).toBe('us-east-1');
    expect(result.NODE_BIN_PATH).toBe('/node/bin');
    expect(result.OLLAMA_HOST).toBe('http://ollama:11434');
    expect(result.GOOGLE_CLOUD_PROJECT).toBe('proj');
    expect(result.GOOGLE_CLOUD_LOCATION).toBe('us-central1');
  });
});
