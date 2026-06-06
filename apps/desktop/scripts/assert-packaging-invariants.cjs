#!/usr/bin/env node

/**
 * assert-packaging-invariants.cjs — post-packaging sanity check for the
 * daemon-only-SQLite migration's end-state (Milestone 6).
 *
 * Enforces one invariant on a packaged MyBoTeam app artifact:
 *
 *   `daemon/node_modules/sql.js/` exists, so the daemon can open its
 *   SQLite database. sql.js is a pure JS + WASM module — no native
 *   `.node` binary needed, and therefore no electron-rebuild or
 *   ABI-matching concerns.
 *
 * CLI:
 *   node apps/desktop/scripts/assert-packaging-invariants.cjs \
 *     --app-root <path-to-packaged-app-resources-dir>
 *
 * Intended call sites:
 *   - OSS: `pnpm -F @myboteam/desktop verify:package --app-root <...>`
 *     after `pnpm package:mac|win|linux`.
 *   - Free (sibling `myboteam-release` workflow): one step per build
 *     job, invoking this script via the `commit_sha` checkout — no
 *     private copy to drift.
 *
 * On macOS Resources dir: `<dist>/mac*\/MyBoTeam.app/Contents/Resources`
 * On Windows Resources dir: `<dist>/win-*\/resources`
 * On Linux (AppImage extracted): `<AppImage-mount>/resources`
 */

'use strict';

const fs = require('fs');
const path = require('path');

function die(msg) {
  console.error(`[assert-packaging-invariants] FAIL: ${msg}`);
  process.exit(1);
}

function log(msg) {
  console.log(`[assert-packaging-invariants] ${msg}`);
}

function parseArgs(argv) {
  const result = { appRoot: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--app-root' && argv[i + 1]) {
      result.appRoot = path.resolve(argv[i + 1]);
      i++;
    }
  }
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.appRoot) {
    die('--app-root is required');
  }
  if (!fs.existsSync(args.appRoot)) {
    die(`--app-root does not exist: ${args.appRoot}`);
  }
  log(`Verifying packaging invariants under ${args.appRoot}`);

  // ─── Invariant: sql.js module is present for the daemon ───
  const daemonSqlJsDir = path.join(args.appRoot, 'daemon', 'node_modules', 'sql.js');
  if (!fs.existsSync(daemonSqlJsDir)) {
    die(
      `daemon/node_modules/sql.js/ missing at ${daemonSqlJsDir}. ` +
        `stage-daemon-deps.cjs likely did not run, or its output wasn't bundled ` +
        `into the packaged app's extraResources.`,
    );
  }

  // Check that the sql.js WASM file exists
  const wasmFiles = fs.readdirSync(daemonSqlJsDir).filter((name) => name.endsWith('.wasm'));
  if (wasmFiles.length > 0) {
    log(`OK: sql.js WASM file(s) found: ${wasmFiles.join(', ')}`);
  } else {
    // The .wasm may be in a dist/ subdirectory
    const distDir = path.join(daemonSqlJsDir, 'dist');
    const distWasm = fs.existsSync(distDir)
      ? fs.readdirSync(distDir).filter((name) => name.endsWith('.wasm'))
      : [];
    if (distWasm.length > 0) {
      log(`OK: sql.js WASM file(s) found in dist/: ${distWasm.join(', ')}`);
    } else {
      die(
        'sql.js WASM file missing. Expected .wasm file in sql.js/ or sql.js/dist/. ' +
        'The daemon will fail at startup without the WASM module.'
      );
    }
  }

  log('All packaging invariants hold');
  process.exit(0);
}

main();
