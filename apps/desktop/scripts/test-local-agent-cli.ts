#!/usr/bin/env npx tsx

import { type ChildProcess, execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateTestLocalAgentConfig,
  TEST_LOCAL_AGENT_CDP_PORT,
  TEST_LOCAL_AGENT_CHROME_PROFILE,
  TEST_LOCAL_AGENT_HTTP_PORT,
} from './test-local-agent-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(_prefix: string, _message: string, _color = colors.cyan): void {}

function logError(_message: string): void {}

function parseArgs(): { prompt: string; model?: string; cwd?: string } {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    process.exit(0);
  }

  let model: string | undefined;
  let cwd: string | undefined;
  let prompt = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--model' && args[i + 1]) {
      model = args[++i];
    } else if (args[i] === '--cwd' && args[i + 1]) {
      cwd = args[++i];
    } else if (!args[i].startsWith('--')) {
      prompt = args[i];
    }
  }

  if (!prompt) {
    logError('No prompt provided. Use --help for usage.');
    process.exit(1);
  }

  return { prompt, model, cwd };
}

function checkEnvironment(): void {
  if (!process.env.ANTHROPIC_API_KEY) {
    logError('ANTHROPIC_API_KEY environment variable is required.');
    process.exit(1);
  }
}

function findOpenCodeCli(): string {
  const localBin = path.resolve(__dirname, '..', 'node_modules', '.bin', 'opencode');
  if (fs.existsSync(localBin)) {
    return localBin;
  }

  try {
    const globalPath = execSync('which opencode', { encoding: 'utf-8' }).trim();
    if (globalPath && fs.existsSync(globalPath)) {
      return globalPath;
    }
  } catch {
                                                    
  }

  const homeDir = process.env.HOME || '';
  const nvmDir = path.join(homeDir, '.nvm', 'versions', 'node');
  if (fs.existsSync(nvmDir)) {
    const versions = fs.readdirSync(nvmDir);
    for (const version of versions) {
      const nvmPath = path.join(nvmDir, version, 'bin', 'opencode');
      if (fs.existsSync(nvmPath)) {
        return nvmPath;
      }
    }
  }

  logError('OpenCode CLI not found. Make sure opencode-ai is installed.');
  process.exit(1);
}

async function startDevBrowserServer(): Promise<ChildProcess> {
  const devBrowserDir = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'packages',
    'core',
    'mcp-tools',
    'dev-browser',
  );
  const serverScript = path.join(devBrowserDir, 'scripts', 'start-server.ts');

  log('test-local-agent', `Starting dev-browser server on port ${TEST_LOCAL_AGENT_HTTP_PORT}...`);

  const serverProcess = spawn('npx', ['tsx', serverScript], {
    cwd: devBrowserDir,
    env: {
      ...process.env,
      DEV_BROWSER_PORT: String(TEST_LOCAL_AGENT_HTTP_PORT),
      DEV_BROWSER_CDP_PORT: String(TEST_LOCAL_AGENT_CDP_PORT),
      DEV_BROWSER_PROFILE: TEST_LOCAL_AGENT_CHROME_PROFILE,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Dev-browser server startup timeout'));
    }, 60000);

    serverProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timeout);
        reject(new Error(`Dev-browser server exited with code ${code}`));
      }
    });

    const pollInterval = 500;
    const poll = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:${TEST_LOCAL_AGENT_HTTP_PORT}/`);
        if (response.ok) {
          clearTimeout(timeout);
          resolve();
          return;
        }
      } catch {
                                             
      }
      setTimeout(poll, pollInterval);
    };

    setTimeout(poll, 500);
  });

  log('test-local-agent', 'Dev-browser server started', colors.green);
  return serverProcess;
}

async function runOpenCode(
  cliPath: string,
  configPath: string,
  prompt: string,
  model?: string,
  cwd?: string,
): Promise<void> {
  const args = ['run', prompt, '--format', 'json', '--agent', 'myboteam'];

  if (model) {
    args.push('--model', model);
  }

  const workingDir = cwd || process.cwd();

  log('test-local-agent', `Working directory: ${workingDir}`);
  log('test-local-agent', `Model: ${model || 'default'}`);
  log('test-local-agent', 'Starting task...\n');

  const cliProcess = spawn(cliPath, args, {
    env: {
      ...process.env,
      OPENCODE_CONFIG: configPath,
    },
    cwd: workingDir,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  cliProcess.stdout?.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        formatOutput(parsed);
      } catch {}
    }
  });

  cliProcess.stderr?.on('data', (_data: Buffer) => {});

  return new Promise((resolve, reject) => {
    cliProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Exit code ${code}`));
      }
    });

    cliProcess.on('error', reject);
  });
}

function formatOutput(message: {
  type: string;
  part?: { text?: string; tool?: string; input?: unknown; output?: string };
}): void {
  switch (message.type) {
    case 'text':
      if (message.part?.text) {
      }
      break;

    case 'tool_call':
    case 'tool_use':
      if (message.part?.tool) {
        const input = message.part.input ? JSON.stringify(message.part.input, null, 2) : '';
        if (input && input !== '{}') {
        }
      }
      break;

    case 'tool_result':
      if (message.part?.output) {
        const _output = message.part.output.substring(0, 500);
      }
      break;

    case 'step_finish':
      break;

    default:
  }
}

function setupCleanup(serverProcess: ChildProcess | null): void {
  const cleanup = () => {
    log('test-local-agent', 'Cleaning up...');
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

async function main(): Promise<void> {
  const { prompt, model, cwd } = parseArgs();
  checkEnvironment();

  const configPath = generateTestLocalAgentConfig();

  const cliPath = findOpenCodeCli();
  log('test-local-agent', `Using OpenCode CLI: ${cliPath}`);

  let serverProcess: ChildProcess | null = null;
  try {
    serverProcess = await startDevBrowserServer();
    setupCleanup(serverProcess);

    await runOpenCode(cliPath, configPath, prompt, model, cwd);
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
  }
}

main().catch((error) => {
  logError(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
