
/**
 * Comprehensive Production Audit - Enhanced Deep System Validation
 * Tests all components: Routes, Hooks, APIs, Server, Database, Frontend, TypeScript, Security, Performance
 * No mocks, demos, or placeholders - Production ready validation only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

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
  details: {},
  performanceMetrics: {},
  securityIssues: [],
  recommendations: []
};

// Color coding for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper function for colored output
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// API request helper with comprehensive error handling
async function apiRequest(endpoint, options = {}) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ProductionAudit/2.0',
        ...options.headers
      },
      timeout: 10000,
      ...options
    });

    const contentType = response.headers.get('content-type');
    let data = null;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    const duration = Date.now() - startTime;
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
      ok: response.ok,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      status: 0,
      error: error.message,
      ok: false,
      duration
    };
  }
}

// Get project root directory
const PROJECT_ROOT = path.join(__dirname, '..', '..');

// Enhanced test runner with metrics collection
async function runTest(category, name, testFn, isCritical = false) {
  testResults.totalTests++;
  const startTime = Date.now();
  
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;
    
    if (result === true) {
      testResults.passed++;
      log(`✅ ${name}`, 'green');
      if (!testResults.details[category]) testResults.details[category] = {};
      testResults.details[category][name] = { 
        status: 'passed', 
        duration: `${duration}ms`,
        critical: isCritical
      };
      return true;
    } else if (result && result.warning) {
      testResults.warnings++;
      log(`⚠️  ${name}: ${result.warning}`, 'yellow');
      if (!testResults.details[category]) testResults.details[category] = {};
      testResults.details[category][name] = { 
        status: 'warning', 
        message: result.warning,
        duration: `${duration}ms`,
        critical: isCritical
      };
      if (isCritical) {
        testResults.recommendations.push(`${category}: ${name} - ${result.warning}`);
      }
      return false;
    } else {
      testResults.failed++;
      const errorMsg = result.error || 'Failed';
      log(`❌ ${name}: ${errorMsg}`, 'red');
      
      if (isCritical) {
        testResults.criticalIssues.push(`${category}: ${name} - ${errorMsg}`);
      }
      
      if (!testResults.details[category]) testResults.details[category] = {};
      testResults.details[category][name] = { 
        status: 'failed', 
        error: errorMsg,
        duration: `${duration}ms`,
        critical: isCritical
      };
      return false;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.failed++;
    log(`❌ ${name}: ${error.message}`, 'red');
    
    if (isCritical) {
      testResults.criticalIssues.push(`${category}: ${name} - ${error.message}`);
    }
    
    if (!testResults.details[category]) testResults.details[category] = {};
    testResults.details[category][name] = { 
      status: 'error', 
      error: error.message,
      duration: `${duration}ms`,
      critical: isCritical
    };
    return false;
  }
}

// 1. Enhanced Server & Environment Tests
async function testServerEnvironment() {
  log('\n🖥️  TESTING SERVER & ENVIRONMENT...', 'blue');
  
  await runTest('Server', 'Health Check Endpoint', async () => {
    const response = await apiRequest('/api/health');
    if (response.duration) {
      testResults.performanceMetrics.healthCheckTime = response.duration;
    }
    return response.status === 200 && response.data.status === 'healthy';
  }, true);

  await runTest('Server', 'Environment Variables Complete', () => {
    const required = [
      'DATABASE_URL', 'SESSION_SECRET', 'REPLIT_DOMAINS',
      'SQUARE_APPLICATION_ID', 'SQUARE_ACCESS_TOKEN', 'SQUARE_LOCATION_ID',
      'MAILGUN_API_KEY', 'MAILGUN_DOMAIN'
    ];
    const missing = required.filter(env => !process.env[env]);
    if (missing.length > 0) {
      return { error: `Missing critical env vars: ${missing.join(', ')}` };
    }
    return true;
  }, true);

  await runTest('Server', 'CORS Configuration', async () => {
    const response = await apiRequest('/api/health', {
      headers: { 'Origin': 'https://example.com' }
    });
    const corsHeader = response.headers['access-control-allow-origin'];
    if (!corsHeader) {
      return { error: 'CORS headers not configured - critical for frontend' };
    }
    return true;
  }, true);

  await runTest('Server', 'Security Headers Complete', async () => {
    const response = await apiRequest('/api/health');
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options', 
      'x-xss-protection',
      'content-security-policy'
    ];
    const missing = requiredHeaders.filter(h => !response.headers[h]);
    if (missing.length > 0) {
      return { error: `Missing security headers: ${missing.join(', ')}` };
    }
    return true;
  }, true);

  await runTest('Server', 'Rate Limiting Active', async () => {
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'test' })
      }));
    }
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.status === 429);
    
    if (!rateLimited) {
      return { error: 'Rate limiting not working - security vulnerability' };
    }
    return true;
  }, true);
}

// 2. Enhanced Database Tests
async function testDatabase() {
  log('\n🗄️  TESTING DATABASE...', 'blue');
  
  await runTest('Database', 'Connection Pool Health', async () => {
    const response = await apiRequest('/api/fees/active');
    if (response.duration) {
      testResults.performanceMetrics.dbQueryTime = response.duration;
    }
    return response.status === 200 && Array.isArray(response.data);
  }, true);

  await runTest('Database', 'Schema Integrity Complete', () => {
    const schemaFile = path.join(PROJECT_ROOT, 'shared/schema.ts');
    if (!fs.existsSync(schemaFile)) {
      return { error: 'Schema file not found - critical database issue' };
    }
    
    const content = fs.readFileSync(schemaFile, 'utf8');
    const requiredTables = [
      'sessions', 'users', 'giftCards', 'giftCardTransactions',
      'receipts', 'fraudAlerts', 'savedCards', 'feeConfigurations',
      'squarePayments', 'webhookEvents'
    ];
    
    const missing = requiredTables.filter(table => !content.includes(`export const ${table}`));
    if (missing.length > 0) {
      return { error: `Missing critical tables: ${missing.join(', ')}` };
    }
    return true;
  }, true);

  await runTest('Database', 'Relations & Indexes Defined', () => {
    const schemaFile = path.join(PROJECT_ROOT, 'shared/schema.ts');
    const content = fs.readFileSync(schemaFile, 'utf8');
    
    if (!content.includes('relations(')) {
      return { error: 'No relations defined - will cause join failures' };
    }
    if (!content.includes('index(')) {
      return { warning: 'No indexes defined - performance will be poor' };
    }
    return true;
  }, true);

  await runTest('Database', 'Transaction Support', async () => {
    // Test if database supports transactions by checking storage implementation
    const storageFile = path.join(PROJECT_ROOT, 'server/storage.ts');
    if (!fs.existsSync(storageFile)) {
      return { error: 'Storage service not found' };
    }
    
    const content = fs.readFileSync(storageFile, 'utf8');
    if (!content.includes('transaction') && !content.includes('begin()')) {
      return { warning: 'Transaction support not implemented' };
    }
    return true;
  });
}

// 3. Enhanced Authentication Flow Tests
async function testAuthentication() {
  log('\n🔐 TESTING AUTHENTICATION SYSTEM...', 'blue');
  
  await runTest('Auth', 'Admin Protection Complete', async () => {
    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/giftcards',
      '/api/admin/fraud-alerts',
      '/api/admin/stats',
      '/api/fees'
    ];
    
    for (const endpoint of adminEndpoints) {
      const response = await apiRequest(endpoint);
      if (response.status !== 401) {
        return { error: `${endpoint} not protected (returned ${response.status})` };
      }
    }
    return true;
  }, true);

  await runTest('Auth', 'Customer Protection Complete', async () => {
    const customerEndpoints = [
      '/api/user/orders',
      '/api/user/saved-cards',
      '/api/giftcards/mine'
    ];
    
    for (const endpoint of customerEndpoints) {
      const response = await apiRequest(endpoint);
      if (response.status !== 401) {
        return { error: `${endpoint} not protected (returned ${response.status})` };
      }
    }
    return true;
  }, true);

  await runTest('Auth', 'Session Management Working', async () => {
    const response = await apiRequest('/api/auth/customer');
    return response.status === 401; // Should be unauthenticated
  }, true);

  await runTest('Auth', 'Input Validation on Auth', async () => {
    const maliciousInputs = [
      { email: '<script>alert(1)</script>', password: 'test' },
      { email: 'test@test.com', password: "'; DROP TABLE users; --" },
      { email: '../../../etc/passwd', password: 'test' }
    ];
    
    for (const input of maliciousInputs) {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(input)
      });
      
      if (response.status === 200) {
        return { error: 'Authentication accepts malicious input' };
      }
    }
    return true;
  }, true);
}

// 4. Enhanced API Endpoints Tests
async function testAPIEndpoints() {
  log('\n🔌 TESTING API ENDPOINTS...', 'blue');
  
  // Test all public endpoints
  const publicEndpoints = [
    { path: '/api/health', method: 'GET', expected: 200 },
    { path: '/api/fees/active', method: 'GET', expected: 200 },
    { path: '/api/giftcards/check-balance', method: 'POST', expected: 400, body: {} },
  ];

  for (const endpoint of publicEndpoints) {
    await runTest('API', `Public: ${endpoint.method} ${endpoint.path}`, async () => {
      const response = await apiRequest(endpoint.path, {
        method: endpoint.method,
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
      });
      return response.status === endpoint.expected;
    }, true);
  }

  await runTest('API', 'Input Sanitization Complete', async () => {
    const maliciousInputs = [
      { code: '<script>alert("xss")</script>' },
      { code: "'; DROP TABLE giftCards; --" },
      { code: '{{7*7}}' },
      { code: '../../../etc/passwd' },
      { code: 'ABC123\0DROP' }
    ];
    
    for (const input of maliciousInputs) {
      const response = await apiRequest('/api/giftcards/check-balance', {
        method: 'POST',
        body: JSON.stringify(input)
      });
      
      if (response.status === 200) {
        testResults.securityIssues.push(`Input sanitization failed for: ${input.code}`);
        return { error: 'Input sanitization failed - security vulnerability' };
      }
    }
    return true;
  }, true);

  await runTest('API', 'Error Handling Consistent', async () => {
    const errorTests = [
      { path: '/api/nonexistent', expected: 404 },
      { path: '/api/giftcards/balance', method: 'POST', body: {}, expected: 400 },
      { path: '/api/admin/stats', expected: 401 }
    ];
    
    for (const test of errorTests) {
      const response = await apiRequest(test.path, {
        method: test.method || 'GET',
        body: test.body ? JSON.stringify(test.body) : undefined
      });
      
      if (response.status !== test.expected) {
        return { error: `Inconsistent error handling on ${test.path}` };
      }
    }
    return true;
  }, true);
}

// 5. Enhanced Frontend Integration Tests
async function testFrontendIntegration() {
  log('\n🎨 TESTING FRONTEND INTEGRATION...', 'blue');
  
  await runTest('Frontend', 'React App Loading', async () => {
    const response = await apiRequest('/');
    return response.status === 200 && response.data.includes('<!DOCTYPE html>');
  }, true);

  await runTest('Frontend', 'Vite Dev Server Working', async () => {
    // Check if Vite is properly serving assets
    const response = await apiRequest('/src/main.tsx');
    if (response.status === 404) {
      return { warning: 'Vite dev server may not be properly configured' };
    }
    return true;
  });

  await runTest('Frontend', 'TypeScript Compilation', () => {
    try {
      execSync('npx tsc --noEmit --project client', { stdio: 'pipe' });
      return true;
    } catch (error) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      const errorCount = (output.match(/error TS/g) || []).length;
      if (errorCount > 0) {
        return { error: `${errorCount} TypeScript compilation errors` };
      }
      return { error: 'TypeScript compilation failed' };
    }
  }, true);

  await runTest('Frontend', 'React Query Setup', () => {
    const mainFile = path.join(PROJECT_ROOT, 'client/src/main.tsx');
    if (!fs.existsSync(mainFile)) {
      return { error: 'main.tsx not found' };
    }
    
    const content = fs.readFileSync(mainFile, 'utf8');
    if (!content.includes('QueryClient') || !content.includes('QueryClientProvider')) {
      return { error: 'React Query not properly configured' };
    }
    return true;
  }, true);

  await runTest('Frontend', 'Hook Imports Working', () => {
    const hooksDir = path.join(PROJECT_ROOT, 'client/src/hooks');
    if (!fs.existsSync(hooksDir)) {
      return { error: 'Hooks directory not found' };
    }
    
    const hookFiles = fs.readdirSync(hooksDir)
      .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    
    for (const file of hookFiles) {
      const content = fs.readFileSync(path.join(hooksDir, file), 'utf8');
      if (content.includes('useQuery') && !content.includes('@tanstack/react-query')) {
        return { error: `${file} has incorrect useQuery import` };
      }
    }
    return true;
  }, true);
}

// 6. Enhanced Security Audit
async function testSecurity() {
  log('\n🔒 TESTING SECURITY MEASURES...', 'blue');
  
  await runTest('Security', 'SQL Injection Protection', async () => {
    const sqlAttacks = [
      "ABC123'; DROP TABLE users; --",
      "ABC123' UNION SELECT * FROM users--",
      "ABC123' OR '1'='1",
      "ABC123'; DELETE FROM giftCards; --"
    ];
    
    for (const attack of sqlAttacks) {
      const response = await apiRequest('/api/giftcards/check-balance', {
        method: 'POST',
        body: JSON.stringify({ code: attack })
      });
      
      if (response.status === 200) {
        testResults.securityIssues.push(`SQL injection vulnerability: ${attack}`);
        return { error: 'SQL injection protection failed' };
      }
    }
    return true;
  }, true);

  await runTest('Security', 'XSS Protection Complete', async () => {
    const xssAttacks = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert("xss")>',
      'javascript:alert("xss")',
      '<svg onload=alert("xss")>'
    ];
    
    for (const attack of xssAttacks) {
      const response = await apiRequest('/api/giftcards', {
        method: 'POST',
        body: JSON.stringify({
          initialAmount: 50,
          recipientName: attack
        })
      });
      
      if (response.status === 200) {
        testResults.securityIssues.push(`XSS vulnerability: ${attack}`);
        return { error: 'XSS protection failed' };
      }
    }
    return true;
  }, true);

  await runTest('Security', 'CSRF Protection', async () => {
    // Test if CSRF tokens are required for state-changing operations
    const response = await apiRequest('/api/giftcards', {
      method: 'POST',
      headers: { 'Origin': 'https://malicious-site.com' },
      body: JSON.stringify({ initialAmount: 50 })
    });
    
    if (response.status === 200) {
      return { error: 'CSRF protection not implemented' };
    }
    return true;
  }, true);

  await runTest('Security', 'Authentication Bypass Attempts', async () => {
    const bypassAttempts = [
      { headers: { 'X-Forwarded-For': 'admin' } },
      { headers: { 'Authorization': 'Bearer fake-token' } },
      { headers: { 'X-User-ID': '1' } },
      { headers: { 'Cookie': 'admin=true' } }
    ];
    
    for (const attempt of bypassAttempts) {
      const response = await apiRequest('/api/admin/stats', {
        headers: attempt.headers
      });
      
      if (response.status === 200) {
        return { error: 'Authentication bypass possible' };
      }
    }
    return true;
  }, true);
}

// 7. Enhanced Performance Tests
async function testPerformance() {
  log('\n⚡ TESTING PERFORMANCE...', 'blue');
  
  await runTest('Performance', 'API Response Times', async () => {
    const endpoints = ['/api/health', '/api/fees/active'];
    const times = [];
    
    for (const endpoint of endpoints) {
      for (let i = 0; i < 5; i++) {
        const response = await apiRequest(endpoint);
        times.push(response.duration);
      }
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    testResults.performanceMetrics.avgApiResponseTime = avgTime;
    
    if (avgTime > 200) {
      return { warning: `Slow API responses: ${avgTime.toFixed(2)}ms average` };
    }
    return true;
  });

  await runTest('Performance', 'Memory Usage', () => {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    testResults.performanceMetrics.memoryUsageMB = heapUsedMB;
    
    if (heapUsedMB > 512) {
      return { warning: `High memory usage: ${heapUsedMB}MB` };
    }
    return true;
  });

  await runTest('Performance', 'Concurrent Request Handling', async () => {
    const concurrentRequests = 20;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(apiRequest('/api/health'));
    }
    
    const start = Date.now();
    const responses = await Promise.all(promises);
    const duration = Date.now() - start;
    
    const successCount = responses.filter(r => r.ok).length;
    testResults.performanceMetrics.concurrentRequestHandling = {
      requests: concurrentRequests,
      successful: successCount,
      duration: `${duration}ms`
    };
    
    if (successCount < concurrentRequests * 0.9) {
      return { error: `Poor concurrent handling: ${successCount}/${concurrentRequests} succeeded` };
    }
    return true;
  }, true);
}

// 8. Enhanced Production Readiness Tests
async function testProductionReadiness() {
  log('\n🚀 TESTING PRODUCTION READINESS...', 'blue');
  
  await runTest('Production', 'No Development Dependencies', () => {
    const packageFile = path.join(PROJECT_ROOT, 'package.json');
    const content = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    
    const prodDeps = Object.keys(content.dependencies || {});
    const devOnlyInProd = prodDeps.filter(dep => 
      dep.includes('dev') || 
      dep.includes('test') || 
      dep === 'nodemon'
    );
    
    if (devOnlyInProd.length > 0) {
      return { warning: `Dev dependencies in production: ${devOnlyInProd.join(', ')}` };
    }
    return true;
  });

  await runTest('Production', 'Error Handling Complete', async () => {
    const errorEndpoints = [
      '/api/nonexistent',
      '/api/giftcards/invalid-endpoint',
      '/api/admin/nonexistent'
    ];
    
    for (const endpoint of errorEndpoints) {
      const response = await apiRequest(endpoint);
      if (response.status !== 404) {
        return { error: `Poor error handling on ${endpoint}` };
      }
    }
    return true;
  }, true);

  await runTest('Production', 'Logging Configuration', () => {
    const serverFile = path.join(PROJECT_ROOT, 'server/index.ts');
    const routesFile = path.join(PROJECT_ROOT, 'server/routes.ts');
    
    const serverContent = fs.readFileSync(serverFile, 'utf8');
    const routesContent = fs.readFileSync(routesFile, 'utf8');
    
    if (!serverContent.includes('console.') && !routesContent.includes('console.')) {
      return { warning: 'No logging configured' };
    }
    return true;
  });

  await runTest('Production', 'Environment Detection', () => {
    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv) {
      return { warning: 'NODE_ENV not set' };
    }
    if (nodeEnv === 'development') {
      return { warning: 'Running in development mode' };
    }
    return true;
  });

  await runTest('Production', 'SSL/HTTPS Ready', async () => {
    // Check if HTTPS redirect is configured
    const response = await apiRequest('/api/health', {
      headers: { 'X-Forwarded-Proto': 'http' }
    });
    
    // In production, should either redirect or have security headers
    const hasSecurityHeaders = response.headers['strict-transport-security'];
    if (!hasSecurityHeaders) {
      return { warning: 'HTTPS security not fully configured' };
    }
    return true;
  });
}

// 9. Integration & Webhook Tests
async function testIntegration() {
  log('\n🔄 TESTING INTEGRATION & WEBHOOKS...', 'blue');
  
  await runTest('Integration', 'Square API Integration', () => {
    const squareFile = path.join(PROJECT_ROOT, 'server/services/SquareService.ts');
    if (!fs.existsSync(squareFile)) {
      return { error: 'Square service not found' };
    }
    
    const content = fs.readFileSync(squareFile, 'utf8');
    if (!content.includes('squareup') || !content.includes('Client')) {
      return { error: 'Square SDK not properly integrated' };
    }
    return true;
  }, true);

  await runTest('Integration', 'Webhook Endpoints Available', async () => {
    const webhookEndpoints = [
      '/webhooks/square',
      '/webhooks/mailgun'
    ];
    
    for (const endpoint of webhookEndpoints) {
      const response = await apiRequest(endpoint, { method: 'POST' });
      if (response.status === 404) {
        return { error: `Webhook endpoint ${endpoint} not found` };
      }
    }
    return true;
  }, true);

  await runTest('Integration', 'Email Service Integration', () => {
    const emailFile = path.join(PROJECT_ROOT, 'server/services/EmailService.ts');
    if (!fs.existsSync(emailFile)) {
      return { error: 'Email service not found' };
    }
    
    const content = fs.readFileSync(emailFile, 'utf8');
    if (!content.includes('mailgun')) {
      return { error: 'Email service not properly configured' };
    }
    return true;
  }, true);
}

// 10. File System & Code Quality Tests
async function testCodeQuality() {
  log('\n📝 TESTING CODE QUALITY...', 'blue');
  
  await runTest('Code Quality', 'TypeScript Strict Mode', () => {
    const tsConfig = path.join(PROJECT_ROOT, 'tsconfig.json');
    const config = JSON.parse(fs.readFileSync(tsConfig, 'utf8'));
    
    if (!config.compilerOptions.strict) {
      return { warning: 'TypeScript strict mode not enabled' };
    }
    return true;
  });

  await runTest('Code Quality', 'No Any Types', () => {
    const filesToCheck = [
      'server/routes.ts',
      'server/storage.ts',
      'client/src/App.tsx'
    ];
    
    for (const file of filesToCheck) {
      if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
        if (content.includes(': any') && !content.includes('// eslint-disable')) {
          return { warning: `${file} contains 'any' types` };
        }
      }
    }
    return true;
  });

  await runTest('Code Quality', 'No Mock/Demo Code', () => {
    const filesToCheck = [
      'server/routes.ts',
      'server/storage.ts',
      'client/src/main.tsx'
    ];
    
    for (const file of filesToCheck) {
      if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
        if (content.includes('mock') || content.includes('demo') || content.includes('placeholder')) {
          return { error: `${file} contains non-production code` };
        }
      }
    }
    return true;
  }, true);
}

// Generate comprehensive report with recommendations
function generateReport() {
  const successRate = Math.round((testResults.passed / testResults.totalTests) * 100);
  const criticalFailures = Object.values(testResults.details)
    .flat()
    .filter(test => test && test.critical && test.status !== 'passed').length;
  
  const healthScore = Math.max(0, successRate - (criticalFailures * 10) - (testResults.warnings * 2));
  
  log('\n' + '='.repeat(80), 'cyan');
  log('📊 COMPREHENSIVE PRODUCTION AUDIT REPORT', 'magenta');
  log('='.repeat(80), 'cyan');
  
  log(`\n📅 Timestamp: ${AUDIT_TIMESTAMP}`);
  log(`🎯 Total Tests: ${testResults.totalTests}`);
  log(`✅ Passed: ${testResults.passed}`, 'green');
  log(`⚠️  Warnings: ${testResults.warnings}`, 'yellow');
  log(`❌ Failed: ${testResults.failed}`, 'red');
  log(`🚨 Critical Failures: ${criticalFailures}`, criticalFailures > 0 ? 'red' : 'green');
  log(`💯 Success Rate: ${successRate}%`);
  log(`🏥 Health Score: ${healthScore}%`);
  
  // Performance metrics
  if (Object.keys(testResults.performanceMetrics).length > 0) {
    log('\n⚡ PERFORMANCE METRICS:', 'cyan');
    Object.entries(testResults.performanceMetrics).forEach(([key, value]) => {
      log(`   ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
    });
  }
  
  // Security issues
  if (testResults.securityIssues.length > 0) {
    log('\n🔒 SECURITY ISSUES FOUND:', 'red');
    testResults.securityIssues.forEach(issue => {
      log(`   • ${issue}`, 'red');
    });
  }
  
  // Critical issues
  if (testResults.criticalIssues.length > 0) {
    log('\n🚨 CRITICAL ISSUES:', 'red');
    testResults.criticalIssues.forEach(issue => {
      log(`   • ${issue}`, 'red');
    });
  }
  
  // Recommendations
  if (testResults.recommendations.length > 0) {
    log('\n💡 RECOMMENDATIONS:', 'yellow');
    testResults.recommendations.forEach(rec => {
      log(`   • ${rec}`, 'yellow');
    });
  }
  
  // Category breakdown
  log('\n📋 DETAILED CATEGORY BREAKDOWN:', 'blue');
  Object.entries(testResults.details).forEach(([category, tests]) => {
    const categoryTests = Object.entries(tests);
    const passed = categoryTests.filter(([_, result]) => result.status === 'passed').length;
    const critical = categoryTests.filter(([_, result]) => result.critical).length;
    const total = categoryTests.length;
    
    log(`\n   ${category}: ${passed}/${total} passed ${critical > 0 ? `(${critical} critical)` : ''}`);
    
    categoryTests.forEach(([testName, result]) => {
      const icon = result.status === 'passed' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      const criticalFlag = result.critical ? ' [CRITICAL]' : '';
      log(`     ${icon} ${testName}${criticalFlag} (${result.duration || 'N/A'})`);
    });
  });
  
  // Production readiness verdict
  log('\n🏁 PRODUCTION READINESS VERDICT:', 'magenta');
  if (healthScore >= 95 && criticalFailures === 0) {
    log('   ✅ READY FOR PRODUCTION DEPLOYMENT', 'green');
    log('   All critical systems operational, minimal issues detected.', 'green');
  } else if (healthScore >= 85 && criticalFailures <= 2) {
    log('   ⚠️  MOSTLY READY - ADDRESS CRITICAL ISSUES FIRST', 'yellow');
    log('   Fix critical issues before deploying to production.', 'yellow');
  } else if (healthScore >= 70) {
    log('   🔧 NEEDS WORK - MULTIPLE ISSUES DETECTED', 'yellow');
    log('   Significant improvements needed before production.', 'yellow');
  } else {
    log('   ❌ NOT READY FOR PRODUCTION', 'red');
    log('   Major issues must be resolved before deployment.', 'red');
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, `comprehensive-audit-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  log(`\n📄 Detailed JSON report saved to: ${reportPath}`);
  
  log('\n' + '='.repeat(80), 'cyan');
}

// Main audit execution
async function runComprehensiveAudit() {
  log('🚀 Starting Enhanced Comprehensive Production Audit...', 'magenta');
  log('🔍 Deep system validation - All components will be tested', 'cyan');
  log('='.repeat(80), 'blue');
  
  try {
    // Check if server is running first
    const health = await apiRequest('/api/health');
    if (!health.ok) {
      log('❌ Server is not running! Please start the server first.', 'red');
      log('Run: npm run dev', 'yellow');
      process.exit(1);
    }
    
    log('✅ Server detected, beginning comprehensive audit...', 'green');
    
    // Run all test suites
    await testServerEnvironment();
    await testDatabase();
    await testAuthentication();
    await testAPIEndpoints();
    await testFrontendIntegration();
    await testSecurity();
    await testPerformance();
    await testProductionReadiness();
    await testIntegration();
    await testCodeQuality();
    
    // Generate comprehensive report
    generateReport();
    
  } catch (error) {
    log(`\n❌ Audit failed with critical error: ${error.message}`, 'red');
    log('Stack trace:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Execute the enhanced comprehensive audit
runComprehensiveAudit().catch(console.error);
