const fs = require('fs');
const path = require('path');
const { runCommandSync, runPnpmSync } = require('../../../scripts/dev-runtime.cjs');

const desktopRoot = path.join(__dirname, '..');
const cliArgs = new Set(process.argv.slice(2));
const isRemote = cliArgs.has('--remote');
const isClean = cliArgs.has('--clean');
const isCheck = cliArgs.has('--check');
const mode = isRemote ? 'remote' : isClean ? 'clean' : 'dev';

const env = { ...process.env };
if (!isRemote && !env.MYBOTEAM_ROUTER_URL) {
  env.MYBOTEAM_ROUTER_URL = 'http://localhost:5173';
}
if (isClean) {
  env.CLEAN_START = '1';
}

try {
  runNodeScript('patch-electron-name.cjs', env);

                                                               
                                           

  if (!isCheck) {
    fs.rmSync(path.join(desktopRoot, 'dist-electron'), { recursive: true, force: true });
  }

  if (isCheck) {
    console.log(`[desktop:${mode}] Check mode passed`);
    process.exit(0);
  }

  runPnpmSync(['exec', 'vite'], {
    cwd: desktopRoot,
    env,
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[desktop:${mode}] ${message}`);
  process.exit(1);
}

function runNodeScript(scriptName, commandEnv) {
  runCommandSync(process.execPath, [path.join(__dirname, scriptName)], {
    cwd: desktopRoot,
    env: commandEnv,
  });
}
