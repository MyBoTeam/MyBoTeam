   
                                                 
  
                                                  
                                                                   
  
                                
                                                                     
  
                                                                 
                                                                   
                                                                      
                                                            
   

'use strict';

const { execSync } = require('child_process');
const path = require('path');

                                                                         
                                                                          
                                                                
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

                                                                                 
                                                   
const mcpToolsPath = path.join(__dirname, '..', '..', '..', 'packages', 'agent-core', 'mcp-tools');
runCommand(
  `npm --prefix "${mcpToolsPath}" install --omit=dev --no-package-lock`,
  'Installing shared MCP tools runtime dependencies',
);

                                                       
if (!useBundledMcp) {
                                                                            
                                                                          
                                                           
                                                                  
                                                                        
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
