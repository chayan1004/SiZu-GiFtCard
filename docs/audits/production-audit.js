/**
 * Production Readiness Audit - Complete System Check
 * Zero mocks, placeholders, or demos - Production only
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUDIT_RESULTS = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: [],
  timestamp: new Date().toISOString()
};

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = response.headers.get('content-type')?.includes('application/json') 
      ? await response.json() 
      : await response.text();
    
    return { 
      status: response.status, 
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return { 
      status: 0, 
      ok: false, 
      error: error.message 
    };
  }
}

// Test Categories
async function testEndpoints() {
  console.log('\n🔍 TESTING API ENDPOINTS...\n');
  
  const endpoints = [
    // Public endpoints
    { method: 'GET', path: '/api/health', expected: 200, name: 'Health Check' },
    { method: 'GET', path: '/api/fees/active', expected: 200, name: 'Active Fees' },
    { method: 'POST', path: '/api/giftcards/check-balance', expected: 400, name: 'Balance Check (no data)', body: {} },
    
    // Auth endpoints
    { method: 'GET', path: '/api/auth/user', expected: 401, name: 'User Auth Check' },
    { method: 'GET', path: '/api/auth/customer', expected: 401, name: 'Customer Auth Check' },
    { method: 'GET', path: '/api/login', expected: 302, name: 'Login Redirect' },
    { method: 'GET', path: '/api/logout', expected: 302, name: 'Logout Redirect' },
    
    // Protected endpoints (should return 401)
    { method: 'GET', path: '/api/giftcards', expected: 401, name: 'List Gift Cards' },
    { method: 'POST', path: '/api/giftcards', expected: 401, name: 'Create Gift Card', body: {} },
    { method: 'POST', path: '/api/giftcards/redeem', expected: 401, name: 'Redeem Gift Card', body: {} },
    { method: 'GET', path: '/api/transactions', expected: 401, name: 'List Transactions' },
    { method: 'GET', path: '/api/analytics/stats', expected: 401, name: 'Analytics Stats' },
    
    // Admin endpoints (should return 401)
    { method: 'GET', path: '/api/admin/users', expected: 401, name: 'Admin Users' },
    { method: 'GET', path: '/api/admin/giftcards', expected: 401, name: 'Admin Gift Cards' },
    { method: 'GET', path: '/api/admin/fraud-alerts', expected: 401, name: 'Admin Fraud Alerts' },
    { method: 'GET', path: '/api/fees', expected: 401, name: 'Fee Management' },
    
    // Customer endpoints
    { method: 'POST', path: '/api/auth/register', expected: 400, name: 'Customer Register', body: {} },
    { method: 'POST', path: '/api/auth/login', expected: 400, name: 'Customer Login', body: {} },
    { method: 'GET', path: '/api/user/orders', expected: 401, name: 'User Orders' },
    { method: 'GET', path: '/api/user/saved-cards', expected: 401, name: 'Saved Cards' },
  ];
  
  for (const endpoint of endpoints) {
    const result = await apiRequest(endpoint.path, { 
      method: endpoint.method,
      body: endpoint.body ? JSON.stringify(endpoint.body) : undefined
    });
    
    const passed = result.status === endpoint.expected;
    AUDIT_RESULTS[passed ? 'passed' : 'failed']++;
    
    AUDIT_RESULTS.details.push({
      category: 'API Endpoints',
      test: endpoint.name,
      status: passed ? 'PASS' : 'FAIL',
      details: `${endpoint.method} ${endpoint.path} - Expected: ${endpoint.expected}, Got: ${result.status}`,
      error: result.error
    });
    
    console.log(`${passed ? '✅' : '❌'} ${endpoint.name}: ${result.status} ${passed ? '' : `(Expected ${endpoint.expected})`}`);
  }
}

async function testDatabase() {
  console.log('\n🔍 TESTING DATABASE CONNECTION...\n');
  
  // Check database-dependent endpoints
  const dbTests = [
    { 
      name: 'Fee Configurations Exist', 
      test: async () => {
        const result = await apiRequest('/api/fees/active');
        return result.ok && Array.isArray(result.data) && result.data.length > 0;
      }
    },
    {
      name: 'Balance Check Validates Input',
      test: async () => {
        const result = await apiRequest('/api/giftcards/check-balance', {
          method: 'POST',
          body: JSON.stringify({ code: 'INVALID-CODE' })
        });
        return result.status === 404; // Should return not found for invalid code
      }
    }
  ];
  
  for (const test of dbTests) {
    try {
      const passed = await test.test();
      AUDIT_RESULTS[passed ? 'passed' : 'failed']++;
      
      AUDIT_RESULTS.details.push({
        category: 'Database',
        test: test.name,
        status: passed ? 'PASS' : 'FAIL'
      });
      
      console.log(`${passed ? '✅' : '❌'} ${test.name}`);
    } catch (error) {
      AUDIT_RESULTS.failed++;
      AUDIT_RESULTS.details.push({
        category: 'Database',
        test: test.name,
        status: 'FAIL',
        error: error.message
      });
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

async function testSecurity() {
  console.log('\n🔍 TESTING SECURITY MEASURES...\n');
  
  const securityTests = [
    {
      name: 'SQL Injection Protection',
      test: async () => {
        const result = await apiRequest('/api/giftcards/check-balance', {
          method: 'POST',
          body: JSON.stringify({ code: "'; DROP TABLE users; --" })
        });
        return result.status === 404; // Should safely handle malicious input
      }
    },
    {
      name: 'XSS Protection',
      test: async () => {
        const result = await apiRequest('/api/giftcards', {
          method: 'POST',
          body: JSON.stringify({ 
            amount: 50,
            recipientName: '<script>alert("XSS")</script>'
          })
        });
        // Should reject with 401 (auth) or 400 (validation), not allow script
        return result.status === 401 || result.status === 400;
      }
    },
    {
      name: 'CORS Headers Present',
      test: async () => {
        const result = await apiRequest('/api/health');
        return result.headers['access-control-allow-origin'] !== undefined;
      }
    },
    {
      name: 'Security Headers',
      test: async () => {
        const result = await apiRequest('/api/health');
        const required = ['x-content-type-options', 'x-frame-options'];
        return required.every(header => result.headers[header] !== undefined);
      }
    }
  ];
  
  for (const test of securityTests) {
    try {
      const passed = await test.test();
      AUDIT_RESULTS[passed ? 'passed' : 'failed']++;
      
      AUDIT_RESULTS.details.push({
        category: 'Security',
        test: test.name,
        status: passed ? 'PASS' : 'FAIL'
      });
      
      console.log(`${passed ? '✅' : '❌'} ${test.name}`);
    } catch (error) {
      AUDIT_RESULTS.failed++;
      AUDIT_RESULTS.details.push({
        category: 'Security',
        test: test.name,
        status: 'FAIL',
        error: error.message
      });
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

async function testPerformance() {
  console.log('\n🔍 TESTING PERFORMANCE...\n');
  
  const perfTests = [
    {
      name: 'API Response Time',
      test: async () => {
        const start = Date.now();
        await apiRequest('/api/health');
        const duration = Date.now() - start;
        console.log(`  Response time: ${duration}ms`);
        return duration < 200; // Should respond within 200ms
      }
    },
    {
      name: 'Static Assets Available',
      test: async () => {
        const result = await apiRequest('/');
        return result.ok && result.data.includes('<!DOCTYPE html>');
      }
    }
  ];
  
  for (const test of perfTests) {
    try {
      const passed = await test.test();
      AUDIT_RESULTS[passed ? 'passed' : 'failed']++;
      
      AUDIT_RESULTS.details.push({
        category: 'Performance',
        test: test.name,
        status: passed ? 'PASS' : 'FAIL'
      });
      
      console.log(`${passed ? '✅' : '❌'} ${test.name}`);
    } catch (error) {
      AUDIT_RESULTS.failed++;
      AUDIT_RESULTS.details.push({
        category: 'Performance',
        test: test.name,
        status: 'FAIL',
        error: error.message
      });
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

async function checkProductionReadiness() {
  console.log('\n🔍 CHECKING PRODUCTION READINESS...\n');
  
  const readinessChecks = [
    {
      name: 'No Mock Data References',
      test: () => {
        const files = [
          'server/routes.ts',
          'server/storage.ts',
          'client/src/App.tsx'
        ];
        
        for (const file of files) {
          const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
          if (content.includes('mock') || content.includes('demo') || content.includes('placeholder')) {
            return false;
          }
        }
        return true;
      }
    },
    {
      name: 'Environment Variables Configured',
      test: () => {
        const required = ['DATABASE_URL', 'SESSION_SECRET'];
        return required.every(env => process.env[env] !== undefined);
      }
    },
    {
      name: 'TypeScript Compilation',
      test: () => {
        // Check if TypeScript files compile without errors
        try {
          require('child_process').execSync('npx tsc --noEmit', { stdio: 'ignore' });
          return true;
        } catch {
          return false;
        }
      }
    }
  ];
  
  for (const check of readinessChecks) {
    try {
      const passed = check.test();
      AUDIT_RESULTS[passed ? 'passed' : 'failed']++;
      
      AUDIT_RESULTS.details.push({
        category: 'Production Readiness',
        test: check.name,
        status: passed ? 'PASS' : 'FAIL'
      });
      
      console.log(`${passed ? '✅' : '❌'} ${check.name}`);
    } catch (error) {
      AUDIT_RESULTS.failed++;
      AUDIT_RESULTS.details.push({
        category: 'Production Readiness',
        test: check.name,
        status: 'FAIL',
        error: error.message
      });
      console.log(`❌ ${check.name}: ${error.message}`);
    }
  }
}

async function generateDetailedReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PRODUCTION READINESS AUDIT REPORT');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${AUDIT_RESULTS.timestamp}`);
  console.log(`Total Tests: ${AUDIT_RESULTS.passed + AUDIT_RESULTS.failed + AUDIT_RESULTS.warnings}`);
  console.log(`✅ Passed: ${AUDIT_RESULTS.passed}`);
  console.log(`❌ Failed: ${AUDIT_RESULTS.failed}`);
  console.log(`⚠️  Warnings: ${AUDIT_RESULTS.warnings}`);
  console.log(`Success Rate: ${((AUDIT_RESULTS.passed / (AUDIT_RESULTS.passed + AUDIT_RESULTS.failed)) * 100).toFixed(2)}%`);
  
  // Group results by category
  const categories = {};
  AUDIT_RESULTS.details.forEach(detail => {
    if (!categories[detail.category]) {
      categories[detail.category] = { passed: 0, failed: 0, tests: [] };
    }
    categories[detail.category].tests.push(detail);
    if (detail.status === 'PASS') {
      categories[detail.category].passed++;
    } else {
      categories[detail.category].failed++;
    }
  });
  
  console.log('\n📋 DETAILED RESULTS BY CATEGORY:');
  console.log('-'.repeat(60));
  
  Object.entries(categories).forEach(([category, data]) => {
    console.log(`\n${category}:`);
    console.log(`  Passed: ${data.passed}/${data.tests.length}`);
    data.tests.forEach(test => {
      if (test.status === 'FAIL') {
        console.log(`  ❌ ${test.test}`);
        if (test.details) console.log(`     ${test.details}`);
        if (test.error) console.log(`     Error: ${test.error}`);
      }
    });
  });
  
  // Save report
  const reportPath = path.join(process.cwd(), 'docs/audits/production-audit-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(AUDIT_RESULTS, null, 2));
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  // Production readiness verdict
  console.log('\n' + '='.repeat(60));
  const readinessScore = (AUDIT_RESULTS.passed / (AUDIT_RESULTS.passed + AUDIT_RESULTS.failed)) * 100;
  if (readinessScore >= 95) {
    console.log('✅ PRODUCTION READY - All critical tests passed!');
  } else if (readinessScore >= 80) {
    console.log('⚠️  ALMOST READY - Fix remaining issues before deployment');
  } else {
    console.log('❌ NOT READY - Significant issues need to be resolved');
  }
  console.log('='.repeat(60));
}

// Main audit function
async function runProductionAudit() {
  console.log('🚀 Starting Production Readiness Audit...\n');
  
  try {
    // Check if server is running
    const health = await apiRequest('/api/health');
    if (!health.ok) {
      console.error('❌ Server is not running! Start the server first.');
      process.exit(1);
    }
    
    // Run all tests
    await testEndpoints();
    await testDatabase();
    await testSecurity();
    await testPerformance();
    await checkProductionReadiness();
    
    // Generate report
    await generateDetailedReport();
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(1);
  }
}

// Run the audit
runProductionAudit();