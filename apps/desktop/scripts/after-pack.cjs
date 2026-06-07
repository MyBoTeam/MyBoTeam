   
                                                                                  
  
                                                                          
                                                                                      
  
                                                                        
   

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { NODE_VERSION } = require('./node-version.cjs');

   
                                             
                                                                                                           
   
const ARCH_MAP = {
  0: 'ia32',             
  1: 'x64',            
  2: 'armv7l',               
  3: 'arm64',              
  4: 'universal',                               
};

   
                                                              
   
const PLATFORM_MAP = {
  mac: 'darwin',
  windows: 'win32',
  linux: 'linux',
};

   
                                                   
   
function getNodeDirName(platform, arch) {
  if (platform === 'win32') {
    return `node-v${NODE_VERSION}-win-${arch}`;
  }
  return `node-v${NODE_VERSION}-${platform}-${arch}`;
}

   
                                                                 
  
                                                                            
                                                                            
                                                                          
                                                                      
  
                                                     
                                                       
                                                            
                                                                             
                                                                                           
                                                                   
   
exports.default = async function afterPack(context) {
  const { packager, arch, appOutDir } = context;
  const platformName = packager.platform.name;

  const archName = ARCH_MAP[arch] || 'x64';
  const nodePlatform = PLATFORM_MAP[platformName] || platformName;

  console.log(`\n[after-pack] Platform: ${platformName}, Arch: ${archName}`);

                                                                          
                                                                                                                   
  const isUniversalBuild = appOutDir.includes('universal');

                                                                         
                                                                                    
  if (platformName === 'mac' && isUniversalBuild) {
    console.log('[after-pack] macOS universal build - copying both x64 and arm64 Node.js binaries');
    await copyNodeBinary(context, nodePlatform, 'x64');
    await copyNodeBinary(context, nodePlatform, 'arm64');
    await resignMacApp(context);
    return;
  }

                                                              
  await copyNodeBinary(context, nodePlatform, archName);

                                                                          
                                                                      
                                                                           
                                                                          

                                                  
  if (platformName === 'mac') {
    await resignMacApp(context);
  }
};

   
                                                               
   
async function copyNodeBinary(context, platform, arch) {
  const { packager, appOutDir } = context;
  const platformName = packager.platform.name;

  const nodeDirName = getNodeDirName(platform, arch);

                                                                                       
  const sourceDir = path.join(
    __dirname,
    '..',
    'resources',
    'nodejs',
    `${platform}-${arch}`,
    nodeDirName,
  );

                                                       
  if (!fs.existsSync(sourceDir)) {
    const errorMsg =
      `[after-pack] ERROR: Node.js binary not found at ${sourceDir}\n` +
      `Run "pnpm -F @myboteam/desktop download:nodejs" first to download the binaries.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

                                            
                                                                         
  const platformArch = `${platform}-${arch}`;
  let destDir;
  if (platformName === 'mac') {
                                                                    
    const appName = packager.appInfo.productFilename;
    destDir = path.join(
      appOutDir,
      `${appName}.app`,
      'Contents',
      'Resources',
      'nodejs',
      platformArch,
    );
  } else {
                                      
    destDir = path.join(appOutDir, 'resources', 'nodejs', platformArch);
  }

  console.log(`[after-pack] Copying Node.js ${arch}: ${sourceDir} -> ${destDir}`);

                                 
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

                                                                         
  try {
    copyDirRecursive(sourceDir, destDir, destDir, NODEJS_EXCLUDE_DIRS);
  } catch (err) {
    console.error(`[after-pack] ERROR copying Node.js ${arch}:`, err.message);
    throw err;
  }

                                     
  if (platformName !== 'windows') {
    const binDir = path.join(destDir, 'bin');
    if (fs.existsSync(binDir)) {
      const binaries = ['node', 'npm', 'npx'];
      for (const binary of binaries) {
        const binPath = path.join(binDir, binary);
        if (fs.existsSync(binPath)) {
          fs.chmodSync(binPath, 0o755);
        }
      }
    }
  }

  console.log(`[after-pack] Successfully copied Node.js ${arch} to ${destDir}`);
}

   
                                              
                                                                                              
                                                                             
   
const NODEJS_EXCLUDE_DIRS = ['include'];

   
                               
                                         
                                               
                                                                                                  
                                                                     
   
function copyDirRecursive(src, dest, rootDest = dest, excludeDirs = []) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
                                  
      if (excludeDirs.includes(entry.name)) {
        console.log(`[after-pack] Skipping excluded directory: ${entry.name} (saves ~53MB)`);
        continue;
      }
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDirRecursive(srcPath, destPath, rootDest, excludeDirs);
    } else if (entry.isSymbolicLink()) {
                                                                   
      const linkTarget = fs.readlinkSync(srcPath);

                                                                                 
                                                                         
      if (path.isAbsolute(linkTarget)) {
        console.warn(`[after-pack] Skipping absolute symlink: ${srcPath} -> ${linkTarget}`);
        continue;
      }

                                                                                   
                                                                         
      const resolvedPath = path.resolve(path.dirname(destPath), linkTarget);
      if (!resolvedPath.startsWith(rootDest)) {
        console.warn(
          `[after-pack] Skipping symlink that escapes directory: ${srcPath} -> ${linkTarget}`,
        );
        continue;
      }

      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
      fs.symlinkSync(linkTarget, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

   
                                                
  
                                                              
                                                                   
                                                                 
  
                                                               
                                                           
   
async function resignMacApp(context) {
  const { appOutDir, packager } = context;
  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`[after-pack] Re-signing macOS app: ${appPath}`);

  try {
                                                                  
                                          
                                                               
                                                           
    execSync(`codesign --force --deep --sign - "${appPath}"`, {
      stdio: 'inherit',
    });
    console.log('[after-pack] Successfully re-signed macOS app');
  } catch (err) {
    console.error('[after-pack] Failed to re-sign macOS app:', err.message);
                                                              
                                               
  }
}
