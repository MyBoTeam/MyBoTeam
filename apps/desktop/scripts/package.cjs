#!/usr/bin/env node

   
                                                                 
  
                                                                     
                                                                   
                                                                    
                                                                       
                                  
  
                                                                        
                                                                     
                                                                             
   

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const myboteamPath = path.join(nodeModulesPath, '@myboteam');

                                       
const workspacePackages = ['agent-core'];
const symlinkTargets = {};

                                                                            
                                                                                     
                                                                       
const pnpmSymlinksToResolve = [
  'opencode-ai',
  'opencode-darwin-arm64',
  'opencode-darwin-x64',
  'opencode-darwin-x64-baseline',
  'opencode-linux-arm64',
  'opencode-linux-arm64-musl',
  'opencode-linux-x64',
  'opencode-linux-x64-baseline',
  'opencode-linux-x64-musl',
  'opencode-linux-x64-baseline-musl',
  'opencode-windows-x64',
  'opencode-windows-x64-baseline',
];
const resolvedSymlinks = {};

try {
                                        
  for (const pkg of workspacePackages) {
    const pkgPath = path.join(myboteamPath, pkg);
    if (fs.existsSync(pkgPath)) {
      const stats = fs.lstatSync(pkgPath);
      if (stats.isSymbolicLink()) {
        symlinkTargets[pkg] = fs.readlinkSync(pkgPath);
        console.log('Temporarily removing workspace symlink:', pkgPath);
        fs.unlinkSync(pkgPath);
      }
    }
  }

                                                  
  if (Object.keys(symlinkTargets).length > 0) {
    try {
      fs.rmdirSync(myboteamPath);
    } catch {
                                                     
    }
  }

                                                                                   
  for (const pkg of pnpmSymlinksToResolve) {
    const pkgPath = path.join(nodeModulesPath, pkg);
    if (fs.existsSync(pkgPath)) {
      const stats = fs.lstatSync(pkgPath);
      if (stats.isSymbolicLink()) {
        const linkTarget = fs.readlinkSync(pkgPath);
        const realPath = fs.realpathSync(pkgPath);
        resolvedSymlinks[pkg] = { linkTarget, pkgPath };
        console.log('Replacing pnpm symlink with copy:', pkgPath);
        fs.unlinkSync(pkgPath);
        fs.cpSync(realPath, pkgPath, { recursive: true });
      }
    }
  }

                                                                       
  const args = process.argv.slice(2).join(' ');

                                                                
                                                                     
                                                              
                                                   
  const command = `npx electron-builder ${args}`;

  console.log('Running:', command);
  execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
} finally {
                                
  for (const [pkg, { linkTarget, pkgPath }] of Object.entries(resolvedSymlinks)) {
    console.log('Restoring pnpm symlink:', pkgPath);
    if (fs.existsSync(pkgPath)) {
      fs.rmSync(pkgPath, { recursive: true, force: true });
    }
    if (isWindows) {
      const absoluteTarget = path.isAbsolute(linkTarget)
        ? linkTarget
        : path.resolve(path.dirname(pkgPath), linkTarget);
      fs.symlinkSync(absoluteTarget, pkgPath, 'junction');
    } else {
      fs.symlinkSync(linkTarget, pkgPath);
    }
  }

                         
  const packagesToRestore = Object.keys(symlinkTargets);
  if (packagesToRestore.length > 0) {
    console.log('Restoring workspace symlinks');

                                             
    if (!fs.existsSync(myboteamPath)) {
      fs.mkdirSync(myboteamPath, { recursive: true });
    }

    for (const pkg of packagesToRestore) {
      const pkgPath = path.join(myboteamPath, pkg);
      const target = symlinkTargets[pkg];

                                                                                       
                                                              
      const absoluteTarget = path.isAbsolute(target)
        ? target
        : path.resolve(path.dirname(pkgPath), target);

      if (isWindows) {
        fs.symlinkSync(absoluteTarget, pkgPath, 'junction');
      } else {
        fs.symlinkSync(target, pkgPath);
      }
      console.log('  Restored:', pkgPath);
    }
  }
}
