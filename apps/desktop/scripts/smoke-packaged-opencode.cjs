   
                                            
  
                                                                     
                                                                        
                              
                                    
                                                                           
                                                    
                                                             
                                                                        
  
                       
                                                            
                                                                          
                         
  
         
                                               
                                                      
                                 
  
                  
                                                                   
                                                                                
  
              
            
                                         
                   
   

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const READY_LINE_PATTERN = /opencode server listening on\s+(https?:\/\/\S+)/;

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
                                                                            
                                                                         
                                                          
    if (arg === '--') {
      continue;
    }
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (!m) {
      console.error(`[smoke-packaged-opencode] Unrecognized argument: ${arg}`);
      process.exit(2);
    }
    out[m[1]] = m[2];
  }
  return out;
}

function log(msg) {
  console.log(`[smoke-packaged-opencode] ${msg}`);
}

function die(msg, code = 1) {
  console.error(`[smoke-packaged-opencode] FAIL: ${msg}`);
  process.exit(code);
}

   
                                                                    
  
                                          
                                                                                
                                                                       
                                                                       
  
                                                                      
                                                                           
                                                                         
                                                                           
                                                                        
                                                                       
                                  
   
function resolveBinary(artifactDir) {
  const candidates = [
    path.join(artifactDir, 'Contents', 'Resources', 'app.asar.unpacked', 'node_modules'),
    path.join(artifactDir, 'resources', 'app.asar.unpacked', 'node_modules'),
  ];
  const modulesDir = candidates.find((p) => fs.existsSync(p));
  if (!modulesDir) {
    die(
      `Could not find app.asar.unpacked/node_modules under ${artifactDir}. ` +
        `Checked: ${candidates.join(', ')}`,
    );
  }

  const platformName = process.platform === 'win32' ? 'windows' : process.platform;
  const targetPrefix = `opencode-${platformName}-${process.arch}`;
  const entries = fs
    .readdirSync(modulesDir)
    .filter((name) => name === targetPrefix || name.startsWith(`${targetPrefix}-`))
    .sort((a, b) => a.length - b.length);

  if (entries.length === 0) {
    const all = fs
      .readdirSync(modulesDir)
      .filter((n) => n.startsWith('opencode-'))
      .join(', ');
    die(
      `No OpenCode dir matching "${targetPrefix}" under ${modulesDir}. ` +
        `Opencode dirs present: ${all || '(none)'}`,
    );
  }

  const binName = process.platform === 'win32' ? 'opencode.exe' : 'opencode';
  const binPath = path.join(modulesDir, entries[0], 'bin', binName);
  if (!fs.existsSync(binPath)) {
    die(`Binary not found at expected path: ${binPath}`);
  }
  return binPath;
}

function runVersion(binPath, expectedVersion) {
  return new Promise((resolve, reject) => {
    const proc = spawn(binPath, ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '';
    proc.stdout.on('data', (d) => (buf += d.toString()));
    proc.stderr.on('data', (d) => (buf += d.toString()));
    proc.on('error', reject);
    proc.on('close', (code) => {
      const out = buf.trim();
      if (code !== 0) {
        return reject(new Error(`opencode --version exited ${code}. Output: ${out}`));
      }
      if (!out.includes(expectedVersion)) {
        return reject(
          new Error(`Expected version "${expectedVersion}" in output, got: ${out || '(empty)'}`),
        );
      }
      resolve(out);
    });
  });
}

function createIsolatedEnv() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opencode-smoke-'));
  const sub = (name) => {
    const p = path.join(root, name);
    fs.mkdirSync(p, { recursive: true });
    return p;
  };
  const dirs = {
    home: sub('home'),
    config: sub('config'),
    data: sub('data'),
    state: sub('state'),
    cache: sub('cache'),
  };
  return {
    root,
    env: {
      ...process.env,
      HOME: dirs.home,
      USERPROFILE: dirs.home,
      XDG_CONFIG_HOME: dirs.config,
      XDG_DATA_HOME: dirs.data,
      XDG_STATE_HOME: dirs.state,
      XDG_CACHE_HOME: dirs.cache,
      APPDATA: dirs.config,
      LOCALAPPDATA: dirs.cache,
      OPENCODE_CONFIG_DIR: path.join(dirs.config, 'opencode'),
    },
  };
}

function runServeSmoke(binPath, readyTimeoutMs, killTimeoutMs) {
  return new Promise((resolve) => {
    const isolated = createIsolatedEnv();

    const cleanup = () => {
      try {
        fs.rmSync(isolated.root, { recursive: true, force: true });
      } catch {
                                                                   
      }
    };

    const proc = spawn(binPath, ['serve', '--hostname=127.0.0.1', '--port=0'], {
      env: isolated.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdoutBuf = '';
    let stderrBuf = '';
    let settled = false;

    const readyTimer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      try {
        proc.kill();
      } catch {
                                              
      }
      cleanup();
      resolve({
        ok: false,
        error: new Error(
          `Timeout after ${readyTimeoutMs}ms waiting for ready line. ` +
            `Last stdout: ${stdoutBuf.slice(-1500) || '(empty)'} ` +
            `Last stderr: ${stderrBuf.slice(-1500) || '(empty)'}`,
        ),
      });
    }, readyTimeoutMs);

    proc.stdout.on('data', (chunk) => {
      stdoutBuf += chunk.toString();
      if (settled) {
        return;
      }
      const match = stdoutBuf.match(READY_LINE_PATTERN);
      if (!match) {
        return;
      }
      settled = true;
      clearTimeout(readyTimer);
      const readyUrl = match[1];

                                                                              
                                                                             
                                                                              
      try {
        proc.kill();
      } catch {
                  
      }
      const killTimer = setTimeout(() => {
        try {
          proc.kill('SIGKILL');
        } catch {
                    
        }
      }, killTimeoutMs);

      proc.once('close', (code, signal) => {
        clearTimeout(killTimer);
        cleanup();
        resolve({ ok: true, readyUrl, exitCode: code, exitSignal: signal });
      });
    });

    proc.stderr.on('data', (chunk) => {
      stderrBuf += chunk.toString();
    });

    proc.on('error', (err) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(readyTimer);
      cleanup();
      resolve({ ok: false, error: err });
    });

    proc.on('close', (code, signal) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(readyTimer);
      cleanup();
      resolve({
        ok: false,
        error: new Error(
          `opencode serve exited before ready line (code=${code}, signal=${signal}). ` +
            `Last stdout: ${stdoutBuf.slice(-1500) || '(empty)'} ` +
            `Last stderr: ${stderrBuf.slice(-1500) || '(empty)'}`,
        ),
      });
    });
  });
}

async function main() {
  const args = parseArgs(process.argv);
  const artifactDir = args['artifact-dir'];
  const expectedVersion = args['expected-version'];
  const readyTimeoutMs = parseInt(args['ready-timeout-ms'] ?? '30000', 10);
  const killTimeoutMs = parseInt(args['kill-timeout-ms'] ?? '5000', 10);

  if (!artifactDir || !expectedVersion) {
    console.error(
      'Usage: smoke-packaged-opencode.cjs ' +
        '--artifact-dir=<path> --expected-version=<version> ' +
        '[--ready-timeout-ms=N] [--kill-timeout-ms=N]',
    );
    process.exit(2);
  }
  if (!Number.isFinite(readyTimeoutMs) || readyTimeoutMs <= 0) {
    die(`--ready-timeout-ms must be a positive integer, got: ${args['ready-timeout-ms']}`, 2);
  }
  if (!Number.isFinite(killTimeoutMs) || killTimeoutMs <= 0) {
    die(`--kill-timeout-ms must be a positive integer, got: ${args['kill-timeout-ms']}`, 2);
  }
  if (!fs.existsSync(artifactDir)) {
    die(`--artifact-dir does not exist: ${artifactDir}`);
  }

  log(`Artifact:          ${artifactDir}`);
  log(`Expected version:  ${expectedVersion}`);
  log(`Ready timeout:     ${readyTimeoutMs}ms`);

  const binPath = resolveBinary(artifactDir);
  log(`Resolved binary:   ${binPath}`);

  try {
    const versionOut = await runVersion(binPath, expectedVersion);
    log(`Version check OK: ${versionOut}`);
  } catch (err) {
    die(`Version check failed: ${err.message}`);
  }

  log('Running "opencode serve --port=0" with isolated HOME/XDG env...');
  const result = await runServeSmoke(binPath, readyTimeoutMs, killTimeoutMs);
  if (!result.ok) {
    die(`Serve smoke failed: ${result.error.message}`);
  }
  log(
    `Serve smoke OK — ready on ${result.readyUrl} ` +
      `(exit=${result.exitCode}, signal=${result.exitSignal})`,
  );
  log('PASS');
}

main().catch((err) => die(err.stack || err.message));
