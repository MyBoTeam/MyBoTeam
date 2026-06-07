#!/usr/bin/env node
   
                                              
                                                                 
  
                                                                   
                                                                              
                                           
   

const { spawn } = require('child_process');
const path = require('path');

                                                 
process.env.MYBOTEAM_ROUTER_URL = 'http://localhost:5173';

                                                                                 
if (process.platform === 'win32') {
  const sys32 = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32');
  const currentPath = process.env.PATH || '';
  if (!currentPath.toLowerCase().includes(sys32.toLowerCase())) {
    process.env.PATH = `${sys32};${currentPath}`;
  }
}

console.log('[dev-vite] Starting Vite with MYBOTEAM_ROUTER_URL=http://localhost:5173');

                                                
const desktopDir = path.resolve(__dirname, '..');
const vite = spawn('vite', [], {
  stdio: 'inherit',
  shell: true,
  cwd: desktopDir,
  env: process.env,
});

vite.on('error', (err) => {
  console.error('[dev-vite] Failed to start Vite:', err);
  process.exit(1);
});

vite.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[dev-vite] Vite terminated by signal: ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});
