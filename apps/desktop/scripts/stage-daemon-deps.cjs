   
                                                                        
                                                              
  
                                                                     
                                                                    
                                                          
  
                                                         
  
                                                                  
                                                                
                                                                 
                                                
                                                                  
                                                                
  
                                                                     
                                                                  
                                     
  
               
                                                                        
                                                                         
                                                                       
                                                                  
                                                                     
                                                                    
                                                             
                                                               
                                                                    
                                                         
  
                 
                                                               
                                              
                                                                  
  
         
                                                                                
                                                                          
   

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { NODE_VERSION } = require('./node-version.cjs');

const DESKTOP_ROOT = path.join(__dirname, '..');
const REPO_ROOT = path.join(DESKTOP_ROOT, '..', '..');
const DAEMON_DIST = path.join(REPO_ROOT, 'apps', 'daemon', 'dist');

const DEPS = ['ws@8', 'sql.js@^1.11.0'];

                                                                       
                                                                   
                                                                      
                                                                     
const NATIVE_DEPS = [];

const SUPPORTED_TARGET_PLATFORMS = new Set([
  'darwin-x64',
  'darwin-arm64',
  'linux-x64',
  'linux-arm64',
  'win32-x64',
]);

function log(msg) {
  console.log(`[stage-daemon-deps] ${msg}`);
}

function die(msg) {
  console.error(`[stage-daemon-deps] FAIL: ${msg}`);
  process.exit(1);
}

   
                                                                      
                                                
   
function packageName(spec) {
  const at = spec.lastIndexOf('@');
  return at <= 0 ? spec : spec.slice(0, at);
}

function parseArgs(argv) {
  let targetPlatform = null;
  for (const arg of argv) {
    if (arg.startsWith('--target-platform=')) {
      targetPlatform = arg.slice('--target-platform='.length).trim();
    }
  }
  return { targetPlatform };
}

   
                                                                       
                                                                       
                                                                      
            
   
function hostPlatform() {
  return `${process.platform}-${process.arch}`;
}

   
                                                                    
                                                                         
                                                                     
                                                                  
                                                                       
                                                                    
                                                             
   
function resolveBundledNode(target) {
                                                                           
                                                                        
                                                                     
                                                                  
  const host = hostPlatform();
  const platformRoot = path.join(DESKTOP_ROOT, 'resources', 'nodejs', host);

  if (!fs.existsSync(platformRoot)) {
    die(
      `Bundled Node dir not found for host ${host}: ${platformRoot}. ` +
        `Run \`pnpm -F @myboteam/desktop download:nodejs\` first.`,
    );
  }

                                                      
                                                                        
                                                           
  const expectedDir = `node-v${NODE_VERSION}-${host.replace('win32-', 'win-')}`;
  const nodeDir = path.join(platformRoot, expectedDir);
  if (!fs.existsSync(nodeDir)) {
    die(
      `Expected bundled Node directory not found: ${nodeDir}. ` +
        `node-version.cjs pins v${NODE_VERSION}; run \`pnpm -F @myboteam/desktop download:nodejs\` ` +
        `(and remove any stale node-v*/ directories under ${platformRoot} if you've upgraded).`,
    );
  }

  const isWindows = process.platform === 'win32';
  const nodeBin = path.join(nodeDir, isWindows ? 'node.exe' : path.join('bin', 'node'));
  const npmCli = isWindows
    ? path.join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js')
    : path.join(nodeDir, 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js');

  if (!fs.existsSync(nodeBin)) {
    die(`Bundled Node binary missing at ${nodeBin}`);
  }
  if (!fs.existsSync(npmCli)) {
    die(`Bundled npm CLI missing at ${npmCli}`);
  }

  void target;                                                           
  return { nodeBin, npmCli };
}

   
                                                                   
                                                                 
                                                                
                                                              
                                
   
function npmInstallEnv(nodeBinDir, target) {
  const [targetPlatform, targetArch] = target.split('-');
  const env = {
    ...process.env,
    PATH: `${nodeBinDir}${path.delimiter}${process.env.PATH || ''}`,
  };
  if (target !== hostPlatform()) {
                                                                     
                                                               
    env.npm_config_target_arch = targetArch;
    env.npm_config_target_platform = targetPlatform === 'win32' ? 'win32' : targetPlatform;
    env.npm_config_arch = targetArch;
    env.npm_config_platform = env.npm_config_target_platform;
  }
  return env;
}

   
                                                                  
                                                                     
  
                                                                    
                                                                   
                                                                   
                                               
  
                                                                   
                                                                   
                                                    
   
function readNativeArch(binaryPath) {
  const fd = fs.openSync(binaryPath, 'r');
  try {
    const header = Buffer.alloc(64);
    fs.readSync(fd, header, 0, 64, 0);

                                                                    
      
                                                                       
                                                                          
                                                                     
                                          
                                                                     
                                                                      
      
                                                                       
                                                                 
    if (header.readUInt32LE(0) === 0xfeedfacf) {
      const cpuType = header.readInt32LE(4);
      const baseCpuType = cpuType & ~0x01000000;
      if (baseCpuType === 7) return 'x64';                   
      if (baseCpuType === 12) return 'arm64';                  
      return null;
    }

                                                             
    if (header[0] === 0x7f && header[1] === 0x45 && header[2] === 0x4c && header[3] === 0x46) {
                                                                      
                                                              
      const machine = header.readUInt16LE(0x12);
      if (machine === 0x3e) return 'x64';             
      if (machine === 0xb7) return 'arm64';              
      return null;
    }

                                                                    
                                                                  
                                           
    if (header[0] === 0x4d && header[1] === 0x5a) {
      const peOffset = header.readUInt32LE(0x3c);
      const peHeader = Buffer.alloc(6);
      fs.readSync(fd, peHeader, 0, 6, peOffset);
                                                          
      const sigOk =
        peHeader[0] === 0x50 && peHeader[1] === 0x45 && peHeader[2] === 0 && peHeader[3] === 0;
      if (!sigOk) return null;
      const machine = peHeader.readUInt16LE(4);
      if (machine === 0x8664) return 'x64';                            
      if (machine === 0xaa64) return 'arm64';                            
      return null;
    }
    return null;
  } finally {
    fs.closeSync(fd);
  }
}

   
                                                                      
                                                                        
                                                                            
  
                                                                   
                                                                     
   
function purgePreviousStaging() {
  const nodeModules = path.join(DAEMON_DIST, 'node_modules');
  for (const name of NATIVE_DEPS) {
    const pkgDir = path.join(nodeModules, name);
    if (fs.existsSync(pkgDir)) {
      log(`Removing previous ${name} install at ${pkgDir}`);
      fs.rmSync(pkgDir, { recursive: true, force: true });
    }
  }
  for (const lockfile of ['package-lock.json', 'pnpm-lock.yaml']) {
    const lockPath = path.join(DAEMON_DIST, lockfile);
    if (fs.existsSync(lockPath)) {
      log(`Removing stale ${lockfile}`);
      fs.rmSync(lockPath, { force: true });
    }
  }
}

   
                                                                   
                                                                      
                                                                   
   
function verifyNativeBinariesForTarget(target) {
  const expectedArch = target.split('-')[1];
                                                                      
                                                                    
                                                                
                                                               
  if (expectedArch !== 'x64' && expectedArch !== 'arm64') {
    die(
      `verifyNativeBinariesForTarget: unsupported arch '${expectedArch}' in target ` +
        `'${target}'. Extend readNativeArch() + this check when adding new arches.`,
    );
  }

  for (const name of NATIVE_DEPS) {
    const releaseDir = path.join(DAEMON_DIST, 'node_modules', name, 'build', 'Release');
    if (!fs.existsSync(releaseDir)) {
      die(
        `Expected native build directory missing after install: ${releaseDir}. ` +
          `prebuild-install for ${name} did not run or failed silently.`,
      );
    }
    const nodeFiles = fs.readdirSync(releaseDir).filter((f) => f.endsWith('.node'));
    if (nodeFiles.length === 0) {
      die(
        `No *.node binary under ${releaseDir} after install. ` +
          `Check that ${name}'s release assets include a build for ${target}.`,
      );
    }
    for (const file of nodeFiles) {
      const binaryPath = path.join(releaseDir, file);
      const actualArch = readNativeArch(binaryPath);
      if (actualArch === null) {
        die(
          `Could not determine arch of ${binaryPath}. Unknown binary format ` +
            `(not Mach-O / ELF / PE). Target=${target}.`,
        );
      }
      if (actualArch !== expectedArch) {
        die(
          `Arch mismatch for ${name}: ${binaryPath} is ${actualArch}, ` +
            `expected ${expectedArch} (target=${target}). The previous stage run ` +
            `may have left a stale binary — purgePreviousStaging() should have ` +
            `removed it, so this is a bug.`,
        );
      }
      log(`Verified ${name} binary matches target arch ${expectedArch}: ${file}`);
    }
  }
}

function main() {
  if (!fs.existsSync(DAEMON_DIST)) {
    die(
      `Daemon dist not found at ${DAEMON_DIST}. ` + `Run \`pnpm -F @myboteam/daemon build\` first.`,
    );
  }

  const { targetPlatform } = parseArgs(process.argv.slice(2));
  const target = targetPlatform ?? hostPlatform();
  if (!SUPPORTED_TARGET_PLATFORMS.has(target)) {
    die(
      `Unsupported target platform '${target}'. ` +
        `Supported: ${[...SUPPORTED_TARGET_PLATFORMS].join(', ')}`,
    );
  }

  const host = hostPlatform();
  const isCrossArch = target !== host;

  const { nodeBin, npmCli } = resolveBundledNode(target);
  const binDir = path.dirname(nodeBin);

  log(`Bundled Node: ${nodeBin}`);
  log(`Staging into: ${DAEMON_DIST}`);
  log(`Dependencies: ${DEPS.join(' ')}`);
  log(`Target: ${target}${isCrossArch ? ` (cross-arch; host=${host})` : ''}`);

                                                                
                                                                         
                                                                      
                   
  purgePreviousStaging();

  const env = npmInstallEnv(binDir, target);

  execFileSync(nodeBin, [npmCli, 'install', '--no-save', ...DEPS], {
    cwd: DAEMON_DIST,
    env,
    stdio: 'inherit',
  });

                                                                         
                           
  verifyNativeBinariesForTarget(target);

                                                                      
                                                                       
                                                                    
                                   
  if (!isCrossArch) {
    for (const spec of DEPS) {
      const name = packageName(spec);
      log(`Verifying require('${name}') under bundled Node...`);
      execFileSync(
        nodeBin,
        ['-e', `require('./node_modules/${name}'); console.log('${name} OK')`],
        {
          cwd: DAEMON_DIST,
          env,
          stdio: 'inherit',
        },
      );
    }
  } else {
    log(
      `Target=${target}: cross-arch, skipping runtime require() smoke (would fail ABI). ` +
        `Arch check via magic bytes above is the correctness gate.`,
    );
  }

  log('Staging complete.');
}

main();
