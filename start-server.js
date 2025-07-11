#!/usr/bin/env node

/**
 * Core server startup script with browser dependency fix
 * Resolves tsx dependency issues and browser compatibility warnings
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment variables to suppress browser warnings
process.env.BROWSERSLIST_IGNORE_OLD_DATA = 'true';
process.env.NODE_ENV = 'development';

console.log('🚀 Starting SiZu GiftCard server with browser compatibility fix...');

// Try to use tsx directly from node_modules
const tsxPath = join(__dirname, 'node_modules', '.bin', 'tsx');
const serverPath = join(__dirname, 'server', 'index.ts');

const server = spawn('node', [tsxPath, serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    BROWSERSLIST_IGNORE_OLD_DATA: 'true',
    NODE_ENV: 'development'
  }
});

server.on('error', (error) => {
  console.error('❌ Server startup failed:', error.message);
  
  // Fallback: Try direct node with ts-node
  console.log('🔄 Attempting fallback startup...');
  
  const fallbackServer = spawn('node', [
    '--loader', 'tsx/esm',
    serverPath
  ], {
    stdio: 'inherit',
    env: {
      ...process.env,
      BROWSERSLIST_IGNORE_OLD_DATA: 'true'
    }
  });
  
  fallbackServer.on('error', (fallbackError) => {
    console.error('❌ Fallback startup failed:', fallbackError.message);
    process.exit(1);
  });
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});