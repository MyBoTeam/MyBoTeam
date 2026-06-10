   
                                                       
                                                                     
                                                                                                
   
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const APP_NAME = 'MyBoTeam';
const URL_SCHEME = 'myboteam';

                    
if (process.platform !== 'darwin') {
  console.log('[patch-electron-name] Skipping on non-macOS platform');
  process.exit(0);
}

const electronPath = path.join(
  __dirname,
  '../node_modules/electron/dist/Electron.app/Contents/Info.plist',
);

function installElectronBinary() {
  let installerPath;
  try {
    installerPath = require.resolve('electron/install.js', {
      paths: [path.join(__dirname, '..')],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[patch-electron-name] Electron installer not found:', message);
    return false;
  }

  console.log('[patch-electron-name] Electron app bundle missing; installing Electron binary...');
  const result = spawnSync(process.execPath, [installerPath], {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });

  return result.status === 0;
}

if (!fs.existsSync(electronPath)) {
  const installed = installElectronBinary();
  if (!installed || !fs.existsSync(electronPath)) {
    console.error('[patch-electron-name] Electron Info.plist not found:', electronPath);
    process.exit(1);
  }
}

let plist = fs.readFileSync(electronPath, 'utf8');

                                                      
if (
  plist.includes(`<string>${APP_NAME}</string>`) &&
  plist.includes(`<string>${URL_SCHEME}</string>`)
) {
  console.log(
    `[patch-electron-name] Already patched to "${APP_NAME}" with "${URL_SCHEME}://" scheme`,
  );
  process.exit(0);
}

                                               
plist = plist.replace(
  /<key>CFBundleDisplayName<\/key>\s*<string>[^<]*<\/string>/,
  `<key>CFBundleDisplayName</key>\n\t<string>${APP_NAME}</string>`,
);

plist = plist.replace(
  /<key>CFBundleName<\/key>\s*<string>[^<]*<\/string>/,
  `<key>CFBundleName</key>\n\t<string>${APP_NAME}</string>`,
);

                                                                             
if (!plist.includes('CFBundleURLTypes')) {
  const urlTypesEntry = `\t<key>CFBundleURLTypes</key>
\t<array>
\t\t<dict>
\t\t\t<key>CFBundleURLName</key>
\t\t\t<string>${APP_NAME} URL</string>
\t\t\t<key>CFBundleURLSchemes</key>
\t\t\t<array>
\t\t\t\t<string>${URL_SCHEME}</string>
\t\t\t</array>
\t\t</dict>
\t</array>`;

                                              
  plist = plist.replace(/(<\/dict>\s*<\/plist>)/, `${urlTypesEntry}\n$1`);
}

fs.writeFileSync(electronPath, plist);
console.log(
  `[patch-electron-name] Patched Electron.app: name="${APP_NAME}", URL scheme="${URL_SCHEME}://"`,
);
