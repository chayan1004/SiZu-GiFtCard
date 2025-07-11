/**
 * Comprehensive Production Audit - Full System Validation
 * Testing all components: Routes, Hooks, APIs, Server, Database, Frontend, TypeScript
 * No mocks, demos, or placeholders - Production ready validation only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUDIT_TIMESTAMP = new Date().toISOString();

// Test results storage
const testResults = {
  timestamp: AUDIT_TIMESTAMP,
  totalTests: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  criticalIssues: [],
  details: {}
};

// Color coding for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Helper function for colored output
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// API request helper with error handling
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ProductionAudit/1.0',
        ...options.headers
      },
      ...options
    });

    const contentType = response.headers.get('content-type');
    let data = null;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      ok: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      ok: false
    };
  }
}

// Get project root directory
const PROJECT_ROOT = path.join(__dirname, '..', '..');

// Test runner with proper error handling
async function runTest(category, name, testFn) {
  testResults.totalTests++;
  
  try {
    const result = await testFn();
    if (result === true) {
      testResults.passed++;
      log(`✅ ${name}`, 'green');
      if (!testResults.details[category]) testResults.details[category] = {};
      testResults.details[category][name] = { status: 'passed' };
      return true;
    } else if (result && result.warning) {
      testResults.warnings++;
      log(`⚠️  ${name}: ${result.warning}`, 'yellow');
      if (!testResults.details[category]) testResults.details[category] = {};
      testResults.details[category][name] = { status: 'warning', message: result.warning };
      return false;
    } else {
      testResults.failed++;
      log(`❌ ${name}: ${result.error || 'Failed'}`, 'red');
      testResults.criticalIssues.push(`${category}: ${name} - ${result.error || 'Failed'}`);
      if (!testResults.details[category]) testResults.details[category] = {};
      testResults.details[category][name] = { status: 'failed', error: result.error || 'Failed' };
      return false;
    }
  } catch (error) {
    testResults.failed++;
    log(`❌ ${name}: ${error.message}`, 'red');
    testResults.criticalIssues.push(`${category}: ${name} - ${error.message}`);
    if (!testResults.details[category]) testResults.details[category] = {};
    testResults.details[category][name] = { status: 'error', error: error.message };
    return false;
  }
}

// 1. Server & Environment Tests
async function testServerEnvironment() {
  log('\n🖥️  TESTING SERVER & ENVIRONMENT...', 'blue');
  
  await runTest('Server', 'Health Check Endpoint', async () => {
    const response = await apiRequest('/api/health');
    return response.status === 200 && response.data.status === 'healthy';
  });

  await runTest('Server', 'Environment Variables', () => {
    const required = ['DATABASE_URL', 'SESSION_SECRET', 'REPLIT_DOMAINS'];
    const missing = required.filter(env => !process.env[env]);
    if (missing.length > 0) {
      return { error: `Missing: ${missing.join(', ')}` };
    }
    return true;
  });

  await runTest('Server', 'CORS Configuration', async () => {
    const response = await apiRequest('/api/health', {
      headers: { 'Origin': 'https://example.com' }
    });
    const corsHeader = response.headers['access-control-allow-origin'];
    if (!corsHeader) {
      return { warning: 'CORS headers not configured' };
    }
    return true;
  });

  await runTest('Server', 'Security Headers', async () => {
    const response = await apiRequest('/api/health');
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];
    const missing = securityHeaders.filter(h => !response.headers[h]);
    if (missing.length > 0) {
      return { warning: `Missing headers: ${missing.join(', ')}` };
    }
    return true;
  });
}

// 2. Database Connection & Schema Tests
async function testDatabase() {
  log('\n🗄️  TESTING DATABASE...', 'blue');
  
  await runTest('Database', 'Connection Pool Active', async () => {
    const response = await apiRequest('/api/fees/active');
    return response.status === 200 && Array.isArray(response.data);
  });

  await runTest('Database', 'Schema Integrity', () => {
    const schemaFile = path.join(PROJECT_ROOT, 'shared/schema.ts');
    if (!fs.existsSync(schemaFile)) {
      return { error: 'Schema file not found' };
    }
    
    const content = fs.readFileSync(schemaFile, 'utf8');
    const requiredTables = [
      'sessions', 'users', 'giftCards', 'giftCardTransactions',
      'receipts', 'fraudAlerts', 'savedCards', 'feeConfigurations'
    ];
    
    const missing = requiredTables.filter(table => !content.includes(`export const ${table}`));
    if (missing.length > 0) {
      return { error: `Missing tables: ${missing.join(', ')}` };
    }
    return true;
  });

  await runTest('Database', 'Relations Defined', () => {
    const schemaFile = path.join(PROJECT_ROOT, 'shared/schema.ts');
    const content = fs.readFileSync(schemaFile, 'utf8');
    
    if (!content.includes('relations(')) {
      return { error: 'No relations defined in schema' };
    }
    return true;
  });
}

// 3. Authentication Flow Tests
async function testAuthentication() {
  log('\n🔐 TESTING AUTHENTICATION...', 'blue');
  
  await runTest('Auth', 'Unauthenticated Access Control', async () => {
    const protectedEndpoints = [
      '/api/giftcards',
      '/api/transactions',
      '/api/analytics/stats',
      '/api/admin/users',
      '/api/admin/fees',
      '/api/user/orders'
    ];
    
    for (const endpoint of protectedEndpoints) {
      const response = await apiRequest(endpoint);
      if (response.status !== 401) {
        return { error: `${endpoint} returned ${response.status} instead of 401` };
      }
    }
    return true;
  });

  await runTest('Auth', 'Customer Auth Flow', async () => {
    // Test registration
    const regResponse = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    
    if (regResponse.status === 400 && regResponse.data.message?.includes('already exists')) {
      return true; // User already exists is OK
    }
    
    return regResponse.status === 201 || regResponse.status === 200;
  });

  await runTest('Auth', 'Session Management', async () => {
    const response = await apiRequest('/api/auth/customer');
    return response.status === 401; // Should be unauthenticated
  });
}

// 4. API Endpoints Tests
async function testAPIEndpoints() {
  log('\n🔌 TESTING API ENDPOINTS...', 'blue');
  
  // Public endpoints
  await runTest('API', 'Balance Check Validation', async () => {
    const response = await apiRequest('/api/giftcards/check-balance', {
      method: 'POST',
      body: JSON.stringify({ code: '' })
    });
    return response.status === 400; // Should validate input
  });

  await runTest('API', 'Active Fees Endpoint', async () => {
    const response = await apiRequest('/api/fees/active');
    return response.status === 200 && Array.isArray(response.data);
  });

  // Input validation
  await runTest('API', 'SQL Injection Protection', async () => {
    const response = await apiRequest('/api/giftcards/check-balance', {
      method: 'POST',
      body: JSON.stringify({ code: "'; DROP TABLE users; --" })
    });
    return response.status === 400 || response.status === 404;
  });

  await runTest('API', 'XSS Protection', async () => {
    const response = await apiRequest('/api/giftcards', {
      method: 'POST',
      body: JSON.stringify({
        initialAmount: 50,
        recipientEmail: '<script>alert("xss")</script>@example.com'
      })
    });
    
    if (response.data && typeof response.data === 'object' && response.data.error) {
      return true;
    }
    return response.status === 400 || response.status === 401;
  });
}

// 5. Frontend Integration Tests
async function testFrontendIntegration() {
  log('\n🎨 TESTING FRONTEND INTEGRATION...', 'blue');
  
  await runTest('Frontend', 'React Build', () => {
    const buildFiles = [
      'vite.config.ts',
      'client/src/App.tsx',
      'client/src/main.tsx'
    ];
    
    const missing = buildFiles.filter(file => !fs.existsSync(path.join(PROJECT_ROOT, file)));
    if (missing.length > 0) {
      return { error: `Missing files: ${missing.join(', ')}` };
    }
    return true;
  });

  await runTest('Frontend', 'TypeScript Configuration', () => {
    const tsConfig = path.join(PROJECT_ROOT, 'tsconfig.json');
    if (!fs.existsSync(tsConfig)) {
      return { error: 'tsconfig.json not found' };
    }
    
    const config = JSON.parse(fs.readFileSync(tsConfig, 'utf8'));
    if (!config.compilerOptions || !config.compilerOptions.strict) {
      return { warning: 'TypeScript strict mode not enabled' };
    }
    return true;
  });

  await runTest('Frontend', 'API Hook Imports', () => {
    const hooksDir = path.join(PROJECT_ROOT, 'client/src/hooks');
    if (!fs.existsSync(hooksDir)) {
      return { error: 'Hooks directory not found' };
    }
    
    const hookFiles = fs.readdirSync(hooksDir)
      .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    
    for (const file of hookFiles) {
      const content = fs.readFileSync(path.join(hooksDir, file), 'utf8');
      if (content.includes('useQuery') && !content.includes("from '@tanstack/react-query'")) {
        return { error: `${file} missing useQuery import` };
      }
    }
    return true;
  });

  await runTest('Frontend', 'CSS Import Order', () => {
    const indexCss = path.join(PROJECT_ROOT, 'client/src/index.css');
    if (!fs.existsSync(indexCss)) {
      return { error: 'index.css not found' };
    }
    
    const content = fs.readFileSync(indexCss, 'utf8');
    const lines = content.split('\n');
    let tailwindIndex = -1;
    let importIndex = -1;
    
    lines.forEach((line, i) => {
      if (line.includes('@tailwind')) tailwindIndex = i;
      if (line.includes('@import') && !line.includes('@tailwind')) importIndex = i;
    });
    
    if (importIndex > -1 && tailwindIndex > -1 && importIndex < tailwindIndex) {
      return { error: 'CSS @import must come after @tailwind directives' };
    }
    return true;
  });
}

// 6. TypeScript Compilation Test
async function testTypeScript() {
  log('\n📘 TESTING TYPESCRIPT...', 'blue');
  
  await runTest('TypeScript', 'Compilation Check', () => {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      return true;
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const errorLines = output.split('\n').filter(line => line.includes('error'));
      if (errorLines.length > 0) {
        return { error: `${errorLines.length} compilation errors found` };
      }
      return { error: 'TypeScript compilation failed' };
    }
  });

  await runTest('TypeScript', 'Type Definitions', () => {
    const typeFiles = [
      'shared/schema.ts',
      'client/src/types/index.ts'
    ];
    
    for (const file of typeFiles) {
      if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
        if (content.includes('any') && !content.includes('// eslint-disable')) {
          return { warning: `${file} contains 'any' types` };
        }
      }
    }
    return true;
  });
}

// 7. Performance & Resource Tests
async function testPerformance() {
  log('\n⚡ TESTING PERFORMANCE...', 'blue');
  
  await runTest('Performance', 'API Response Time', async () => {
    const start = Date.now();
    await apiRequest('/api/health');
    const duration = Date.now() - start;
    
    if (duration > 100) {
      return { warning: `Slow response: ${duration}ms` };
    }
    return true;
  });

  await runTest('Performance', 'Memory Usage', () => {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    
    if (heapUsedMB > 500) {
      return { warning: `High memory usage: ${heapUsedMB}MB` };
    }
    return true;
  });
}

// 8. Security Audit
async function testSecurity() {
  log('\n🔒 TESTING SECURITY...', 'blue');
  
  await runTest('Security', 'Rate Limiting Active', async () => {
    // Make multiple rapid requests
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'test' })
      }));
    }
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.status === 429);
    
    if (!rateLimited) {
      return { warning: 'Rate limiting may not be configured properly' };
    }
    return true;
  });

  await runTest('Security', 'Input Sanitization', async () => {
    const maliciousInputs = [
      { code: '<script>alert(1)</script>' },
      { code: '${process.env.DATABASE_URL}' },
      { code: '{{7*7}}' },
      { code: '../../../etc/passwd' }
    ];
    
    for (const input of maliciousInputs) {
      const response = await apiRequest('/api/giftcards/check-balance', {
        method: 'POST',
        body: JSON.stringify(input)
      });
      
      if (response.status === 200) {
        return { error: 'Input sanitization failed' };
      }
    }
    return true;
  });
}

// 9. Integration & Flow Tests
async function testIntegration() {
  log('\n🔄 TESTING INTEGRATION & FLOW...', 'blue');
  
  await runTest('Integration', 'Frontend-Backend Connection', async () => {
    const response = await apiRequest('/');
    return response.status === 200;
  });

  await runTest('Integration', 'WebSocket Support', async () => {
    // Check if WebSocket route is defined
    const routesFile = path.join(PROJECT_ROOT, 'server/routes.ts');
    const content = fs.readFileSync(routesFile, 'utf8');
    
    if (!content.includes('WebSocket') && !content.includes('ws')) {
      return { warning: 'WebSocket support not implemented' };
    }
    return true;
  });
}

// 10. Production Readiness Checks
async function testProductionReadiness() {
  log('\n🚀 TESTING PRODUCTION READINESS...', 'blue');
  
  await runTest('Production', 'No Mock Data', () => {
    const filesToCheck = [
      'server/routes.ts',
      'server/storage.ts',
      'server/index.ts'
    ];
    
    for (const file of filesToCheck) {
      if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
        if (content.includes('mock') || content.includes('demo') || content.includes('placeholder')) {
          return { error: `${file} contains mock/demo data` };
        }
      }
    }
    return true;
  });

  await runTest('Production', 'Error Handling', async () => {
    // Test various error scenarios
    const response = await apiRequest('/api/nonexistent');
    return response.status === 404;
  });

  await runTest('Production', 'Logging Configuration', () => {
    const serverFile = path.join(PROJECT_ROOT, 'server/index.ts');
    const content = fs.readFileSync(serverFile, 'utf8');
    
    if (!content.includes('console.error') && !content.includes('logger')) {
      return { warning: 'No error logging configured' };
    }
    return true;
  });
}

// Generate comprehensive report
function generateReport() {
  const successRate = Math.round((testResults.passed / testResults.totalTests) * 100);
  const healthScore = successRate - (testResults.warnings * 2);
  
  log('\n' + '='.repeat(80), 'blue');
  log('📊 COMPREHENSIVE AUDIT REPORT', 'magenta');
  log('='.repeat(80), 'blue');
  
  log(`\n📅 Timestamp: ${AUDIT_TIMESTAMP}`);
  log(`🎯 Total Tests: ${testResults.totalTests}`);
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`⚠️  Warnings: ${testResults.warnings}`, 'yellow');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`💯 Success Rate: ${successRate}%`);
  log(`🏥 Health Score: ${healthScore}%`);
  
  if (testResults.criticalIssues.length > 0) {
    log('\n🚨 CRITICAL ISSUES:', 'red');
    testResults.criticalIssues.forEach(issue => {
      log(`   • ${issue}`, 'red');
    });
  }
  
  // Category breakdown
  log('\n📋 CATEGORY BREAKDOWN:', 'blue');
  Object.entries(testResults.details).forEach(([category, tests]) => {
    const categoryTests = Object.entries(tests);
    const passed = categoryTests.filter(([_, result]) => result.status === 'passed').length;
    const total = categoryTests.length;
    log(`   ${category}: ${passed}/${total} passed`);
  });
  
  // Production readiness verdict
  log('\n🏁 PRODUCTION READINESS:', 'magenta');
  if (healthScore >= 90) {
    log('   ✅ READY FOR PRODUCTION', 'green');
  } else if (healthScore >= 70) {
    log('   ⚠️  MOSTLY READY - Address warnings', 'yellow');
  } else {
    log('   ❌ NOT READY - Critical issues must be fixed', 'red');
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, `audit-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Main audit execution
async function runComprehensiveAudit() {
  log('🚀 Starting Comprehensive Production Audit...', 'magenta');
  log('='.repeat(80), 'blue');
  
  try {
    await testServerEnvironment();
    await testDatabase();
    await testAuthentication();
    await testAPIEndpoints();
    await testFrontendIntegration();
    await testTypeScript();
    await testPerformance();
    await testSecurity();
    await testIntegration();
    await testProductionReadiness();
    
    generateReport();
  } catch (error) {
    log(`\n❌ Audit failed with critical error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Execute audit
runComprehensiveAudit().catch(console.error);