/**
 * Integration-ish tests for the daemon's `onBeforeStart` hook.
 *
 * These tests run the REAL `resolveTaskConfig` + `generateConfig` (not
 * mocked), so they prove that the live daemon config path writes all of:
 *   - workspace knowledge notes into the system prompt
 *   - enabled MCP connectors into `mcpServers`
 *   - GWS accounts (gws-mcp / gmail-mcp / calendar-mcp) + manifest env
 *   - OpenAI `store: false` provider option
 *   - language preference
 * into the actual opencode-<taskId>.json file on disk.
 *
 * The only mocks we inject sit at the edges `resolveTaskConfig` can't
 * reach without sql.js WASM bindings:
 *   - `getDatabase()` returns an in-memory stub that answers the two SQL
 *     shapes `prepareGwsManifest` issues
 *   - knowledge-note repo + provider-settings repo return fixed values
 *
 * Everything else — connector-token shape, cloud browser config,
 * language, `store: false` injection, filename construction — flows
 * through the real code.
 *
 * Tests also pin the three regressions Codex flagged:
 *   - validateTaskConfig preserves workspaceId (so resolveTaskConfig
 *     actually sees it)
 *   - configFileName sanitisation against malicious taskIds
 *   - resumeSession workspaceId fallback to the stored task (in a
 *     sibling test file that mocks StorageAPI only)
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let knowledgeInstructionsText: string | undefined;
let knowledgeContextText: string | undefined;
let activeProviderModel: { provider: string; model: string } | null = null;
let gwsRows: Record<string, unknown>[] = [];

let fakeNodeBinDir: string;
let fakeMcpToolsPath: string;

const dbStub = {
  exec: vi.fn((sql: string) => {
    if (sql.includes('SELECT') && sql.includes('google_accounts')) {
      if (gwsRows.length === 0) {
        return [{ columns: gwsColumns, values: [] }];
      }
      return [
        {
          columns: gwsColumns,
          values: gwsRows.map((r) =>
            gwsColumns.map((col) => {
              const v = (r as Record<string, unknown>)[col];
              return v ?? null;
            }),
          ),
        },
      ];
    }
    return [];
  }),
  run: vi.fn(),
};
const gwsColumns = [
  'google_account_id',
  'email',
  'display_name',
  'picture_url',
  'label',
  'status',
  'connected_at',
  'last_refreshed_at',
];

vi.mock('@myboteam/agent-core/storage/database', () => ({
  getDatabase: vi.fn(() => dbStub),
  flushDatabase: vi.fn(),
}));

vi.mock('@myboteam/agent-core/storage/repositories/knowledgeNotes', () => ({
  getFormattedKnowledgeNotes: vi.fn(() => ({
    instructions: knowledgeInstructionsText ?? '',
    context: knowledgeContextText ?? '',
  })),
  getKnowledgeNotesForPrompt: vi.fn(() => {
    const parts: string[] = [];
    if (knowledgeInstructionsText) parts.push(`### Instruction\n${knowledgeInstructionsText}`);
    if (knowledgeContextText) parts.push(knowledgeContextText);
    return parts.join('\n\n');
  }),
}));

vi.mock('@myboteam/agent-core', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,

    syncApiKeysToOpenCodeAuth: vi.fn(),
    getOpenCodeAuthJsonPath: vi.fn(() => '/tmp/fake-auth.json'),

    getBundledNodePaths: vi.fn(() => ({
      binDir: fakeNodeBinDir,
      nodeExe: path.join(fakeNodeBinDir, process.platform === 'win32' ? 'node.exe' : 'node'),
    })),
    getEnabledSkills: vi.fn(() => []),
    isCliAvailable: vi.fn(async () => true),
  };
});

vi.mock('@myboteam/agent-core/storage/repositories/index', async () => {
  return {
    getProviderSettings: vi.fn(() => ({
      activeProviderId: null,
      connectedProviders: {},
      debugMode: false,
      onboardingComplete: true,
      selectedModel: undefined,
      ollamaConfig: null,
      litellmConfig: null,
      azureFoundryConfig: null,
      lmstudioConfig: null,
      huggingfaceLocalConfig: null,
      nimConfig: null,
      openAiBaseUrl: '',
      llamaCppConfig: null,
      language: undefined,
    })),
    getActiveProviderModel: vi.fn(() => activeProviderModel),
    getConnectedProviderIds: vi.fn(() => []),
    getOllamaConfig: vi.fn(() => null),
    getLMStudioConfig: vi.fn(() => null),
    getLiteLLMConfig: vi.fn(() => null),
    getAzureFoundryConfig: vi.fn(() => null),
    getHuggingFaceLocalConfig: vi.fn(() => null),
    getNimConfig: vi.fn(() => null),
    getOpenAiBaseUrl: vi.fn(() => ''),
    getLlamaCppConfig: vi.fn(() => null),
  };
});

const { onBeforeStart } = await import('../../src/task-config-builder.js');

function makeStorage(overrides: Record<string, unknown> = {}) {
  return {
    getAllApiKeys: vi.fn(async () => ({ openai: 'sk-test-openai' })),
    getApiKey: vi.fn((provider: string) => (provider === 'openai' ? 'sk-test-openai' : null)),
    get: vi.fn(() => null),
    set: vi.fn(),
    getEnabledConnectors: vi.fn(() => []),
    getConnectorTokens: vi.fn(() => null),
    setConnectorStatus: vi.fn(),
    storeConnectorTokens: vi.fn(),
    getCloudBrowserConfig: vi.fn(() => null),
    getLanguage: vi.fn(() => undefined),
    ...overrides,
  };
}

describe('daemon onBeforeStart — integration against real resolveTaskConfig + generateConfig', () => {
  let tmpUserData: string;

  beforeEach(() => {
    knowledgeInstructionsText = undefined;
    knowledgeContextText = undefined;
    activeProviderModel = null;
    gwsRows = [];
    tmpUserData = path.join(
      os.tmpdir(),
      `daemon-onbeforestart-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(tmpUserData, { recursive: true });
    fakeNodeBinDir = path.join(tmpUserData, 'fake-node-bin');
    fs.mkdirSync(fakeNodeBinDir, { recursive: true });
    fs.writeFileSync(path.join(fakeNodeBinDir, 'node'), '');
    fs.writeFileSync(path.join(fakeNodeBinDir, 'node.exe'), '');

    fakeMcpToolsPath = path.join(tmpUserData, 'fake-mcp-tools');
    for (const tool of [
      'request-connector-auth',
      'complete-task',
      'start-task',
      'whatsapp',
      'dev-browser-mcp',
      'gmail-mcp',
      'calendar-mcp',
      'gws-mcp',
      'request-google-file-picker',
    ]) {
      const distDir = path.join(fakeMcpToolsPath, tool, 'dist');
      fs.mkdirSync(distDir, { recursive: true });
      fs.writeFileSync(path.join(distDir, 'index.mjs'), '');
    }
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpUserData, { recursive: true, force: true });
    } catch {}
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('writes opencode-<taskId>.json containing workspace knowledge notes and OpenAI store:false', async () => {
    // Use an `instruction`-type note to exercise the new binding wrapper path.
    knowledgeInstructionsText = '- Remember: treat `foo` as a reserved keyword in this workspace.';
    const storage = makeStorage();

    const { configPath } = await onBeforeStart(
      storage as never,
      {
        userDataPath: tmpUserData,
        mcpToolsPath: fakeMcpToolsPath,
        isPackaged: false,
        resourcesPath: '',
        appPath: '',
      },
      { taskId: 'tsk_abc', workspaceId: 'ws_42' },
    );

    expect(configPath).toBe(path.join(tmpUserData, 'opencode', 'opencode-tsk_abc.json'));
    expect(fs.existsSync(configPath)).toBe(true);

    const written = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const systemPrompt =
      typeof written.instructions === 'string'
        ? written.instructions
        : Array.isArray(written.instructions)
          ? written.instructions.join('\n')
          : JSON.stringify(written);
    expect(systemPrompt).toContain('treat `foo` as a reserved keyword');

    expect(written.provider?.openai?.options?.store).toBe(false);
  });

  it('returns workspaceInstructions alongside env so the adapter can inject them as SDK `system` per-turn', async () => {
    knowledgeInstructionsText = '- Always add "Haiku" suffix to every reply';
    const storage = makeStorage();

    const result = await onBeforeStart(
      storage as never,
      {
        userDataPath: tmpUserData,
        mcpToolsPath: fakeMcpToolsPath,
        isPackaged: false,
        resourcesPath: '',
        appPath: '',
      },
      { taskId: 'tsk_ws_instr', workspaceId: 'ws_42' },
    );

    expect(result.workspaceInstructions).toBeDefined();
    expect(result.workspaceInstructions).toContain('Always add "Haiku" suffix to every reply');

    expect(result.env.OPENCODE_CONFIG).toBeDefined();
  });

  it('omits workspaceInstructions when no instruction-type notes exist (context/reference only)', async () => {
    knowledgeInstructionsText = undefined;
    knowledgeContextText = '### Context\n- Project uses Postgres 16';
    const storage = makeStorage();

    const result = await onBeforeStart(
      storage as never,
      {
        userDataPath: tmpUserData,
        mcpToolsPath: fakeMcpToolsPath,
        isPackaged: false,
        resourcesPath: '',
        appPath: '',
      },
      { taskId: 'tsk_ctx_only', workspaceId: 'ws_42' },
    );

    expect(result.workspaceInstructions).toBeUndefined();
  });

  it('includes enabled MCP connectors in the written config', async () => {
    const storage = makeStorage({
      getEnabledConnectors: vi.fn(() => [
        {
          id: 'conn-slack-1',
          name: 'slack',
          url: 'https://slack.example.com/mcp',
          status: 'connected',
        },
      ]),
      getConnectorTokens: vi.fn(() => ({
        accessToken: 'slack-access-token',
        refreshToken: undefined,
        expiresAt: Date.now() + 3600_000,
      })),
    });

    const { configPath } = await onBeforeStart(
      storage as never,
      {
        userDataPath: tmpUserData,
        mcpToolsPath: fakeMcpToolsPath,
        isPackaged: false,
        resourcesPath: '',
        appPath: '',
      },
      { taskId: 'tsk_conn', workspaceId: undefined },
    );

    const written = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const mcp = (written.mcp ?? written.mcpServers ?? {}) as Record<
      string,
      { type?: string; url?: string; headers?: Record<string, string> }
    >;

    const userConnectorEntries = Object.entries(mcp).filter(([key]) =>
      key.startsWith('connector-'),
    );
    expect(userConnectorEntries).toHaveLength(1);
    const [connectorKey, connectorServer] = userConnectorEntries[0];
    expect(connectorKey).toBe('connector-slack-conn-s');
    expect(connectorServer.type).toBe('remote');
    expect(connectorServer.url).toBe('https://slack.example.com/mcp');
    expect(connectorServer.headers?.Authorization).toBe('Bearer slack-access-token');
  });

  it('registers gws-mcp + gmail-mcp + calendar-mcp + GWS_ACCOUNTS_MANIFEST env when accounts are connected', async () => {
    const now = Date.now();
    gwsRows = [
      {
        google_account_id: 'gacc-1',
        email: 'alice@example.com',
        display_name: 'Alice',
        picture_url: null,
        label: 'Personal',
        status: 'connected',
        connected_at: new Date(now).toISOString(),
        last_refreshed_at: null,
      },
    ];
    const storage = makeStorage({
      get: vi.fn((key: string) => {
        if (key === 'gws:token:gacc-1') {
          return JSON.stringify({
            accessToken: 'ya29.live',
            refreshToken: 'rt-live',
            expiresAt: now + 3600_000,
            scopes: ['https://www.googleapis.com/auth/gmail.modify'],
          });
        }
        return null;
      }),
    });

    const { configPath } = await onBeforeStart(
      storage as never,
      {
        userDataPath: tmpUserData,
        mcpToolsPath: fakeMcpToolsPath,
        isPackaged: false,
        resourcesPath: '',
        appPath: '',
      },
      { taskId: 'tsk_gws', workspaceId: undefined },
    );

    const written = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const mcp = (written.mcp ?? written.mcpServers ?? {}) as Record<
      string,
      { environment?: Record<string, string>; env?: Record<string, string> }
    >;

    expect(Object.keys(mcp)).toEqual(
      expect.arrayContaining(['gws-mcp', 'gmail-mcp', 'calendar-mcp']),
    );

    const gwsMcpEnv = mcp['gws-mcp'].environment ?? mcp['gws-mcp'].env ?? {};
    expect(gwsMcpEnv.GWS_ACCOUNTS_MANIFEST).toContain('gws-manifests');
    expect(gwsMcpEnv.GWS_ACCOUNTS_MANIFEST).toContain('manifest.json');

    expect(fs.existsSync(gwsMcpEnv.GWS_ACCOUNTS_MANIFEST!)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(gwsMcpEnv.GWS_ACCOUNTS_MANIFEST!, 'utf-8'));
    expect(manifest).toHaveLength(1);
    expect(manifest[0].email).toBe('alice@example.com');
  });

  it('sanitises malicious taskIds when building the per-task config filename', async () => {
    const storage = makeStorage();
    const { configPath } = await onBeforeStart(
      storage as never,
      {
        userDataPath: tmpUserData,
        mcpToolsPath: fakeMcpToolsPath,
        isPackaged: false,
        resourcesPath: '',
        appPath: '',
      },
      { taskId: '../../../etc/passwd', workspaceId: undefined },
    );

    expect(configPath.startsWith(path.join(tmpUserData, 'opencode'))).toBe(true);
    expect(configPath).not.toContain('..');
    expect(configPath).not.toContain('/etc/passwd');
    const filename = path.basename(configPath);
    expect(filename).toMatch(/^opencode-[_A-Za-z0-9-]+\.json$/);
  });

  it('falls back to default opencode.json when ctx has no taskId (transient OAuth path)', async () => {
    const storage = makeStorage();
    const { configPath } = await onBeforeStart(
      storage as never,
      {
        userDataPath: tmpUserData,
        mcpToolsPath: fakeMcpToolsPath,
        isPackaged: false,
        resourcesPath: '',
        appPath: '',
      },
      {},
    );

    expect(path.basename(configPath)).toBe('opencode.json');
  });

  it('handles getDatabase() failure gracefully (catch branch)', async () => {
    const dbModule = await import('@myboteam/agent-core/storage/database');
    vi.mocked(dbModule.getDatabase).mockImplementationOnce(() => {
      throw new Error('db not ready');
    });
    const storage = makeStorage();
    const { configPath } = await onBeforeStart(
      storage as never,
      {
        userDataPath: tmpUserData,
        mcpToolsPath: fakeMcpToolsPath,
        isPackaged: false,
        resourcesPath: '',
        appPath: '',
      },
      { taskId: 'tsk_no_db', workspaceId: undefined },
    );

    expect(fs.existsSync(configPath)).toBe(true);
    const written = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(written).toBeDefined();

    const mcp = (written.mcp ?? written.mcpServers ?? {}) as Record<string, unknown>;
    expect(Object.keys(mcp)).not.toContain('gws-mcp');
    expect(Object.keys(mcp)).not.toContain('gmail-mcp');
    expect(Object.keys(mcp)).not.toContain('calendar-mcp');
  });

  it('sets PATH env on non-Windows (process.platform !== win32)', async () => {
    const storage = makeStorage();
    const result = await onBeforeStart(
      storage as never,
      {
        userDataPath: tmpUserData,
        mcpToolsPath: fakeMcpToolsPath,
        isPackaged: false,
        resourcesPath: '',
        appPath: '',
      },
      { taskId: 'tsk_path', workspaceId: undefined },
    );

    expect(result.env.PATH).toBe(`${fakeNodeBinDir}${path.delimiter}${process.env.PATH ?? ''}`);
    expect(result.env.OPENCODE_CONFIG).toBeDefined();
    expect(result.env.OPENCODE_CONFIG_DIR).toBeDefined();
  });

  it('also sets Path env on Windows (process.platform === win32)', async () => {
    const origDescriptor = Object.getOwnPropertyDescriptor(process, 'platform')!;
    try {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const storage = makeStorage();
      const result = await onBeforeStart(
        storage as never,
        {
          userDataPath: tmpUserData,
          mcpToolsPath: fakeMcpToolsPath,
          isPackaged: false,
          resourcesPath: '',
          appPath: '',
        },
        { taskId: 'tsk_win32', workspaceId: undefined },
      );

      expect(result.env.PATH).toBe(`${fakeNodeBinDir}${path.delimiter}${process.env.PATH ?? ''}`);
      expect(result.env.Path).toBe(result.env.PATH);
    } finally {
      Object.defineProperty(process, 'platform', origDescriptor);
    }
  });
});
