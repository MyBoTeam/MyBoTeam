   
                                                                           
  
                                                               
                                                                              
  
                     
                             
                           
              
  
                                                              
   

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const { NODE_VERSION, PLATFORMS } = require('./node-version.cjs');
const BASE_URL = `https://nodejs.org/dist/v${NODE_VERSION}`;

const platformFlag = process.argv.find((a) => a.startsWith('--platform='));
const hasPlatformFlag = Boolean(platformFlag);
const platformArg = platformFlag?.split('=').slice(1).join('=').trim() ?? '';
const filteredPlatforms = hasPlatformFlag
  ? PLATFORMS.filter((p) => p.name === platformArg)
  : PLATFORMS;
if (hasPlatformFlag && filteredPlatforms.length === 0) {
  const supported = PLATFORMS.map((p) => p.name).join(', ');
  console.error(`Unsupported platform "${platformArg}". Supported values: ${supported}`);
  process.exit(1);
}

const RESOURCES_DIR = path.join(__dirname, '..', 'resources', 'nodejs');

   
                                                   
   
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);

    const file = fs.createWriteStream(destPath);

    https
      .get(url, (response) => {
                           
        if (response.statusCode === 302 || response.statusCode === 301) {
          file.close();
          fs.unlinkSync(destPath);
          return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;
        let lastPercent = 0;

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const percent = Math.floor((downloadedSize / totalSize) * 100);
          if (percent >= lastPercent + 10) {
            process.stdout.write(`  ${percent}%`);
            lastPercent = percent;
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(' Done');
          resolve();
        });
      })
      .on('error', (err) => {
        file.close();
        fs.unlinkSync(destPath);
        reject(err);
      });
  });
}

   
                                   
   
function verifyChecksum(filePath, expectedHash) {
  console.log('  Verifying checksum...');
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const actualHash = hashSum.digest('hex');

  if (actualHash !== expectedHash) {
    throw new Error(`Checksum mismatch!\n  Expected: ${expectedHash}\n  Got: ${actualHash}`);
  }
  console.log('  Checksum verified');
}

   
                                 
                                                                    
   
function extractArchive(archivePath, destDir, type) {
  console.log(`  Extracting to ${destDir}...`);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const { execFileSync } = require('child_process');

  if (type === 'tar') {
                                                                
    execFileSync('tar', ['-xzf', archivePath, '-C', destDir], { stdio: 'inherit' });
  } else if (type === 'zip') {
    if (process.platform === 'win32') {
                                                         
      execFileSync(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          `Expand-Archive -Path "${archivePath}" -DestinationPath "${destDir}" -Force`,
        ],
        { stdio: 'inherit' },
      );
    } else {
      execFileSync('unzip', ['-o', archivePath, '-d', destDir], { stdio: 'inherit' });
    }
  }

  console.log('  Extraction complete');
}

   
                                   
   
async function main() {
  console.log(`\nNode.js v${NODE_VERSION} Binary Downloader`);
  console.log('='.repeat(50));

                               
  if (!fs.existsSync(RESOURCES_DIR)) {
    fs.mkdirSync(RESOURCES_DIR, { recursive: true });
  }

                                        
  const tempDir = path.join(RESOURCES_DIR, '.temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  for (const platform of filteredPlatforms) {
    console.log(`\nProcessing ${platform.name}...`);

    const archivePath = path.join(tempDir, platform.file);
    const destDir = path.join(RESOURCES_DIR, platform.name);

                                 
    const extractedDir = path.join(destDir, platform.file.replace(/\.(tar\.gz|zip)$/, ''));
    if (fs.existsSync(extractedDir)) {
      console.log(`  Already exists: ${extractedDir}`);
      continue;
    }

                             
    if (!fs.existsSync(archivePath)) {
      const url = `${BASE_URL}/${platform.file}`;
      await downloadFile(url, archivePath);
    } else {
      console.log(`  Using cached: ${archivePath}`);
    }

                      
    verifyChecksum(archivePath, platform.sha256);

              
    extractArchive(archivePath, destDir, platform.extract);
  }

                            
  console.log('\nCleaning up temp files...');
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log('\nAll Node.js binaries downloaded successfully!');
  console.log(`Location: ${RESOURCES_DIR}`);

                             
  console.log('\nDirectory structure:');
  for (const platform of filteredPlatforms) {
    const destDir = path.join(RESOURCES_DIR, platform.name);
    if (fs.existsSync(destDir)) {
      const contents = fs.readdirSync(destDir);
      console.log(`  ${platform.name}/`);
      contents.forEach((item) => console.log(`    ${item}/`));
    }
  }
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
