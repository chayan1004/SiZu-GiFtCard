#!/usr/bin/env node

/**
 * Core browser database update script
 * Handles dependency conflicts and ensures clean browser data updates
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Starting browser database update...');

try {
  // Check current version
  const currentVersion = execSync('npm list caniuse-lite --depth=0', { encoding: 'utf8' });
  console.log('Current browser data version:', currentVersion.match(/caniuse-lite@([\d.]+)/)?.[1] || 'unknown');
  
  // Force clean npm cache
  console.log('🧹 Cleaning npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
  
  // Remove any temporary npm directories
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    const tempDirs = fs.readdirSync(nodeModulesPath).filter(dir => dir.startsWith('.'));
    tempDirs.forEach(dir => {
      const dirPath = path.join(nodeModulesPath, dir);
      console.log(`🗑️  Removing temp directory: ${dir}`);
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
      } catch (err) {
        console.warn(`Warning: Could not remove ${dir}:`, err.message);
      }
    });
  }
  
  // Install fresh caniuse-lite
  console.log('📦 Installing fresh browser data...');
  execSync('npm install caniuse-lite@latest --save', { stdio: 'inherit' });
  
  // Verify installation
  const newVersion = execSync('npm list caniuse-lite --depth=0', { encoding: 'utf8' });
  console.log('✅ Updated browser data version:', newVersion.match(/caniuse-lite@([\d.]+)/)?.[1] || 'unknown');
  
  // Test browser coverage
  console.log('🌐 Testing browser coverage...');
  const coverage = execSync('npx browserslist --coverage', { encoding: 'utf8' });
  console.log('Browser coverage:', coverage.match(/(\d+\.\d+%)/)?.[1] || 'unknown');
  
  console.log('✅ Browser database update completed successfully!');
  
} catch (error) {
  console.error('❌ Browser database update failed:', error.message);
  
  // Fallback solution - create local browser data cache
  console.log('🔄 Applying fallback solution...');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add browserslist override to ignore outdated warnings
  if (!packageJson.browserslist) {
    packageJson.browserslist = [
      "> 0.5%",
      "last 2 versions",
      "not dead",
      "Chrome >= 85",
      "Firefox >= 85",
      "Safari >= 14",
      "Edge >= 85"
    ];
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Fallback browser configuration applied');
  
  process.exit(1);
}