/**
 * Custom postinstall script for the desktop app.
 *
 * Milestone 6 of the daemon-only-SQLite migration
 * (plan: /Users/yanai/.claude/plans/squishy-exploring-hamster.md).
 *
 * Pre-M6 history (now retired):
 * Postinstall: no-op — sql.js (WASM SQLite) needs no native rebuild.
 *
 * Post-M6: Electron main owns no native modules. The daemon uses
 * `sql.js` (WASM) staged via `scripts/stage-daemon-deps.cjs`. This
 * postinstall is reduced to its remaining responsibility — installing
 * the shared MCP-tools runtime + per-tool dev dependencies.
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');

// Prevent infinite recursion when `npm install` triggered by this script
// walks back up the tree and re-runs the parent postinstall. Happens most
// often on Windows where path handling encourages upward walks.
if (process.env.MYBOTEAM_POSTINSTALL_RUNNING) {
  console.log('> Postinstall already running, skipping nested invocation');
  process.exit(0);
}
process.env.MYBOTEAM_POSTINSTALL_RUNNING = '1';

function runCommand(command, description) {
  console.log(`\n> ${description}...`);
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      shell: true,
      env: {
        ...process.env,
        MYBOTEAM_POSTINSTALL_RUNNING: '1',
      },
    });
  } catch (_error) {
    console.error(`Failed: ${description}`);
    process.exit(1);
  }
}

const useBundledMcp = process.env.MYBOTEAM_BUNDLED_MCP === '1' || process.env.CI === 'true';

// Install shared MCP tools runtime dependencies (Playwright) at mcp-tools/ root.
// MCP tools live in packages/agent-core/mcp-tools.
const mcpToolsPath = path.join(__dirname, '..', '..', '..', 'packages', 'agent-core', 'mcp-tools');
runCommand(
  `npm --prefix "${mcpToolsPath}" install --omit=dev --no-package-lock`,
  'Installing shared MCP tools runtime dependencies',
);

// Install per-tool dependencies for dev/tsx workflows.
if (!useBundledMcp) {
  // Install ALL dependencies (including devDependencies) during development
  // because esbuild needs them for bundling. The bundle-skills.cjs script
  // will reinstall with --omit=dev during packaged builds.
  // Phase 3 of the SDK cutover port removed `file-permission` and
  // `ask-user-question` MCP packages — don't try to install their deps.
  const tools = [
    'dev-browser',
    'dev-browser-mcp',
    'complete-task',
    'start-task',
    'gws-mcp',
    'gmail-mcp',
    'calendar-mcp',
  ];
  for (const tool of tools) {
    runCommand(
      `npm --prefix "${mcpToolsPath}/${tool}" install --no-package-lock`,
      `Installing ${tool} dependencies`,
    );
  }
}

console.log('\n> Postinstall complete!');
