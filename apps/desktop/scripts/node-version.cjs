   
                                                                           
                                                     
  
               
                                                                             
                                                                                       
                                                                                     
                                                   
  
                                                                           
                                                                            
                                                             
  
                                                                                 
                                             
   

'use strict';

const NODE_VERSION = '24.15.0';

const PLATFORMS = [
  {
    name: 'darwin-x64',
    file: `node-v${NODE_VERSION}-darwin-x64.tar.gz`,
    extract: 'tar',
    sha256: 'ffd5ee293467927f3ee731a553eb88fd1f48cf74eebc2d74a6babe4af228673b',
  },
  {
    name: 'darwin-arm64',
    file: `node-v${NODE_VERSION}-darwin-arm64.tar.gz`,
    extract: 'tar',
    sha256: '372331b969779ab5d15b949884fc6eaf88d5afe87bde8ba881d6400b9100ffc4',
  },
  {
    name: 'linux-x64',
    file: `node-v${NODE_VERSION}-linux-x64.tar.gz`,
    extract: 'tar',
    sha256: '44836872d9aec49f1e6b52a9a922872db9a2b02d235a616a5681b6a85fec8d89',
  },
  {
    name: 'linux-arm64',
    file: `node-v${NODE_VERSION}-linux-arm64.tar.gz`,
    extract: 'tar',
    sha256: '73afc234d558c24919875f51c2d1ea002a2ada4ea6f83601a383869fefa64eed',
  },
  {
    name: 'win32-x64',
    file: `node-v${NODE_VERSION}-win-x64.zip`,
    extract: 'zip',
    sha256: 'cc5149eabd53779ce1e7bdc5401643622d0c7e6800ade18928a767e940bb0e62',
  },
];

module.exports = { NODE_VERSION, PLATFORMS };
