   
                                                                  
  
                                                                       
                                                                    
                                                                     
                                                                    
                                                              
                       
  
                                                                     
                                                                      
                                                           
  
                                                                    
                                                                      
                                                                  
                                                                   
                                              
   

'use strict';

const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'dist', 'package.json');
fs.writeFileSync(target, '{"type":"commonjs"}\n');
