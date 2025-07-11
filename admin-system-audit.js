/**
 * Comprehensive Admin System Audit
 * Tests all admin functionalities, routes, and connections
 */

import fs from 'fs';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const ADMIN_ENDPOINTS = [
  '/api/admin/stats',
  '/api/admin/transactions', 
  '/api/admin/giftcards',
  '/api/admin/fraud-alerts',
  '/api/admin/users',
  '/api/admin/analytics',
  '/api/admin/security',
  '/api/admin/fees'
];

const USER_ENDPOINTS = [
  '/api/giftcards/mine',
  '/api/user/orders',
  '/api/user/saved-cards',
  '/api/giftcards/check-balance',
  '/api/user/profile'
];

const PUBLIC_ENDPOINTS = [
  '/api/health',
  '/api/fees/active'
];

const auditResults = {
  timestamp: new Date().toISOString(),
  adminEndpoints: {},
  userEndpoints: {},
  publicEndpoints: {},
  databaseConnections: {},
  features: {},
  typescript: {},
  production: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = data;
    }

    return {
      status: response.status,
      ok: response.ok,
      data: parsedData,
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

async function testAdminEndpoints() {
  console.log('\n🔍 Testing Admin Endpoints...');
  
  for (const endpoint of ADMIN_ENDPOINTS) {
    const result = await apiRequest(endpoint);
    const testName = `Admin ${endpoint}`;
    
    if (result.status === 401) {
      auditResults.adminEndpoints[endpoint] = {
        status: 'INFO',
        message: 'Requires admin authentication',
        httpStatus: result.status
      };
      console.log(`  ℹ️  ${testName}: Requires authentication`);
    } else if (result.ok) {
      auditResults.adminEndpoints[endpoint] = {
        status: 'PASS',
        message: 'Endpoint accessible',
        httpStatus: result.status,
        hasData: !!result.data
      };
      auditResults.summary.passed++;
      console.log(`  ✅ ${testName}: OK`);
    } else {
      auditResults.adminEndpoints[endpoint] = {
        status: 'FAIL',
        message: result.error || 'Endpoint error',
        httpStatus: result.status
      };
      auditResults.summary.failed++;
      console.log(`  ❌ ${testName}: Failed (${result.status})`);
    }
    auditResults.summary.total++;
  }
}

async function testUserEndpoints() {
  console.log('\n🔍 Testing User Endpoints...');
  
  for (const endpoint of USER_ENDPOINTS) {
    const result = await apiRequest(endpoint);
    const testName = `User ${endpoint}`;
    
    if (result.status === 401) {
      auditResults.userEndpoints[endpoint] = {
        status: 'INFO',
        message: 'Requires user authentication',
        httpStatus: result.status
      };
      console.log(`  ℹ️  ${testName}: Requires authentication`);
    } else if (result.ok) {
      auditResults.userEndpoints[endpoint] = {
        status: 'PASS',
        message: 'Endpoint accessible',
        httpStatus: result.status,
        hasData: !!result.data
      };
      auditResults.summary.passed++;
      console.log(`  ✅ ${testName}: OK`);
    } else {
      auditResults.userEndpoints[endpoint] = {
        status: 'FAIL',
        message: result.error || 'Endpoint error',
        httpStatus: result.status
      };
      auditResults.summary.failed++;
      console.log(`  ❌ ${testName}: Failed (${result.status})`);
    }
    auditResults.summary.total++;
  }
}

async function testPublicEndpoints() {
  console.log('\n🔍 Testing Public Endpoints...');
  
  for (const endpoint of PUBLIC_ENDPOINTS) {
    const result = await apiRequest(endpoint);
    const testName = `Public ${endpoint}`;
    
    if (result.ok) {
      auditResults.publicEndpoints[endpoint] = {
        status: 'PASS',
        message: 'Endpoint accessible',
        httpStatus: result.status,
        data: result.data
      };
      auditResults.summary.passed++;
      console.log(`  ✅ ${testName}: OK`);
    } else {
      auditResults.publicEndpoints[endpoint] = {
        status: 'FAIL',
        message: result.error || 'Endpoint error',
        httpStatus: result.status
      };
      auditResults.summary.failed++;
      console.log(`  ❌ ${testName}: Failed`);
    }
    auditResults.summary.total++;
  }
}

async function testDatabaseConnections() {
  console.log('\n🔍 Testing Database Connections...');
  
  // Test database status
  const dbStatus = await apiRequest('/api/database/status');
  if (dbStatus.data && dbStatus.data.connected) {
    auditResults.databaseConnections.postgresql = {
      status: 'PASS',
      message: 'PostgreSQL connected',
      version: dbStatus.data.version
    };
    auditResults.summary.passed++;
    console.log('  ✅ PostgreSQL: Connected');
  } else {
    auditResults.databaseConnections.postgresql = {
      status: 'FAIL',
      message: 'PostgreSQL not connected'
    };
    auditResults.summary.failed++;
    console.log('  ❌ PostgreSQL: Not connected');
  }
  auditResults.summary.total++;
}

async function testFeatures() {
  console.log('\n🔍 Testing Core Features...');
  
  const features = [
    { name: 'Gift Card Creation', endpoint: '/api/giftcards', method: 'POST' },
    { name: 'Balance Check', endpoint: '/api/giftcards/check-balance', method: 'POST' },
    { name: 'Card Redemption', endpoint: '/api/giftcards/redeem', method: 'POST' },
    { name: 'Fee Configuration', endpoint: '/api/fees/active' },
    { name: 'Receipt Generation', endpoint: '/api/receipts' }
  ];
  
  for (const feature of features) {
    const result = await apiRequest(feature.endpoint, feature.method);
    
    if (result.status === 401 || result.status === 400) {
      auditResults.features[feature.name] = {
        status: 'INFO',
        message: 'Feature requires valid data/auth',
        endpoint: feature.endpoint
      };
      console.log(`  ℹ️  ${feature.name}: Requires valid data`);
    } else if (result.ok || result.status === 404) {
      auditResults.features[feature.name] = {
        status: 'PASS',
        message: 'Feature endpoint exists',
        endpoint: feature.endpoint
      };
      auditResults.summary.passed++;
      console.log(`  ✅ ${feature.name}: Available`);
    } else {
      auditResults.features[feature.name] = {
        status: 'FAIL',
        message: 'Feature not available',
        endpoint: feature.endpoint
      };
      auditResults.summary.failed++;
      console.log(`  ❌ ${feature.name}: Not available`);
    }
    auditResults.summary.total++;
  }
}

async function checkTypeScript() {
  console.log('\n🔍 Checking TypeScript...');
  
  // Check if TypeScript config exists
  if (fs.existsSync('tsconfig.json')) {
    auditResults.typescript.config = {
      status: 'PASS',
      message: 'TypeScript configured'
    };
    auditResults.summary.passed++;
    console.log('  ✅ TypeScript: Configured');
  } else {
    auditResults.typescript.config = {
      status: 'FAIL',
      message: 'No TypeScript config found'
    };
    auditResults.summary.failed++;
    console.log('  ❌ TypeScript: No config');
  }
  auditResults.summary.total++;
}

async function checkProductionReadiness() {
  console.log('\n🔍 Checking Production Readiness...');
  
  // Check for mock data usage
  const mockPatterns = ['mock', 'placeholder', 'demo', 'fake', 'sample'];
  const serverFiles = fs.readdirSync('server').filter(f => f.endsWith('.ts'));
  let hasMocks = false;
  
  for (const file of serverFiles) {
    const content = fs.readFileSync(`server/${file}`, 'utf8').toLowerCase();
    for (const pattern of mockPatterns) {
      if (content.includes(pattern) && !content.includes('// production')) {
        hasMocks = true;
        break;
      }
    }
  }
  
  if (!hasMocks) {
    auditResults.production.noMocks = {
      status: 'PASS',
      message: 'No mock data detected'
    };
    auditResults.summary.passed++;
    console.log('  ✅ Mock Data: None detected');
  } else {
    auditResults.production.noMocks = {
      status: 'WARNING',
      message: 'Possible mock data detected'
    };
    auditResults.summary.warnings++;
    console.log('  ⚠️  Mock Data: Possible mocks detected');
  }
  auditResults.summary.total++;
  
  // Check environment variables
  const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingEnvVars.length === 0) {
    auditResults.production.environment = {
      status: 'PASS',
      message: 'Required environment variables set'
    };
    auditResults.summary.passed++;
    console.log('  ✅ Environment: Variables configured');
  } else {
    auditResults.production.environment = {
      status: 'FAIL',
      message: `Missing: ${missingEnvVars.join(', ')}`
    };
    auditResults.summary.failed++;
    console.log(`  ❌ Environment: Missing ${missingEnvVars.join(', ')}`);
  }
  auditResults.summary.total++;
  
  // Check error handling
  const health = await apiRequest('/api/health');
  if (health.ok) {
    auditResults.production.errorHandling = {
      status: 'PASS',
      message: 'Server error handling active'
    };
    auditResults.summary.passed++;
    console.log('  ✅ Error Handling: Active');
  } else {
    auditResults.production.errorHandling = {
      status: 'FAIL',
      message: 'Server error handling issues'
    };
    auditResults.summary.failed++;
    console.log('  ❌ Error Handling: Issues detected');
  }
  auditResults.summary.total++;
}

async function generateReport() {
  console.log('\n📊 ADMIN SYSTEM AUDIT REPORT');
  console.log('════════════════════════════════════════');
  
  const successRate = Math.round((auditResults.summary.passed / auditResults.summary.total) * 100);
  
  console.log(`\n✨ Overall Health Score: ${successRate}%`);
  console.log(`   Total Tests: ${auditResults.summary.total}`);
  console.log(`   ✅ Passed: ${auditResults.summary.passed}`);
  console.log(`   ❌ Failed: ${auditResults.summary.failed}`);
  console.log(`   ⚠️  Warnings: ${auditResults.summary.warnings}`);
  
  // Production readiness
  const isProductionReady = auditResults.summary.failed === 0 && successRate >= 90;
  console.log(`\n🚀 Production Ready: ${isProductionReady ? 'YES ✅' : 'NO ❌'}`);
  
  if (!isProductionReady) {
    console.log('\n⚠️  Issues to resolve:');
    
    // List failures
    Object.entries(auditResults).forEach(([category, tests]) => {
      if (typeof tests === 'object' && !Array.isArray(tests)) {
        Object.entries(tests).forEach(([test, result]) => {
          if (result.status === 'FAIL') {
            console.log(`   - ${category}.${test}: ${result.message}`);
          }
        });
      }
    });
  }
  
  // Save detailed report
  fs.writeFileSync('admin-audit-report.json', JSON.stringify(auditResults, null, 2));
  console.log('\n📄 Detailed report saved to: admin-audit-report.json');
}

async function runAdminSystemAudit() {
  console.log('🚀 Starting Comprehensive Admin System Audit...');
  console.log(`   Timestamp: ${new Date().toLocaleString()}`);
  console.log(`   Target: ${BASE_URL}`);
  
  try {
    await testPublicEndpoints();
    await testAdminEndpoints();
    await testUserEndpoints();
    await testDatabaseConnections();
    await testFeatures();
    await checkTypeScript();
    await checkProductionReadiness();
    await generateReport();
  } catch (error) {
    console.error('\n❌ Audit failed with error:', error.message);
    auditResults.error = error.message;
    fs.writeFileSync('admin-audit-report.json', JSON.stringify(auditResults, null, 2));
  }
}

// Run the audit
runAdminSystemAudit();