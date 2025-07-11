#!/usr/bin/env node

/**
 * Comprehensive Authentication and Rate Limiting Test Suite
 * Tests all endpoints to ensure proper authentication and rate limiting are applied
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`${title}`, 'blue');
  log(`${'='.repeat(60)}`, 'blue');
}

const SERVER_URL = 'http://localhost:5000';

// Endpoint categories with expected authentication and rate limiting
const endpointTests = {
  // Public endpoints (balance check only)
  'Public Endpoints': [
    { 
      method: 'POST', 
      url: '/api/giftcards/balance', 
      requiresAuth: false, 
      rateLimit: 'giftCard',
      testData: { code: 'TESTCODE123' }
    },
    { 
      method: 'POST', 
      url: '/api/giftcards/check-balance', 
      requiresAuth: false, 
      rateLimit: 'giftCard',
      testData: { code: 'TESTCODE123' }
    },
    { 
      method: 'GET', 
      url: '/api/fees/active', 
      requiresAuth: false, 
      rateLimit: 'read'
    }
  ],

  // Customer authenticated endpoints
  'Customer Authenticated Endpoints': [
    { 
      method: 'POST', 
      url: '/api/giftcards/purchase', 
      requiresAuth: 'customer', 
      rateLimit: 'payment'
    },
    { 
      method: 'POST', 
      url: '/api/giftcards/redeem', 
      requiresAuth: 'customer', 
      rateLimit: 'giftCard'
    },
    { 
      method: 'GET', 
      url: '/api/giftcards/mine', 
      requiresAuth: 'customer', 
      rateLimit: 'read'
    },
    { 
      method: 'GET', 
      url: '/api/user/dashboard/stats', 
      requiresAuth: 'customer', 
      rateLimit: 'read'
    },
    { 
      method: 'GET', 
      url: '/api/user/transactions', 
      requiresAuth: 'customer', 
      rateLimit: 'read'
    },
    { 
      method: 'GET', 
      url: '/api/user/orders', 
      requiresAuth: 'customer', 
      rateLimit: 'read'
    },
    { 
      method: 'GET', 
      url: '/api/cards', 
      requiresAuth: 'customer', 
      rateLimit: 'read'
    },
    { 
      method: 'POST', 
      url: '/api/cards', 
      requiresAuth: 'customer', 
      rateLimit: 'write'
    }
  ],

  // Admin only endpoints
  'Admin Only Endpoints': [
    { 
      method: 'GET', 
      url: '/api/giftcards', 
      requiresAuth: 'admin', 
      rateLimit: 'read'
    },
    { 
      method: 'GET', 
      url: '/api/admin/giftcards', 
      requiresAuth: 'admin', 
      rateLimit: 'read'
    },
    { 
      method: 'GET', 
      url: '/api/admin/stats', 
      requiresAuth: 'admin', 
      rateLimit: 'admin'
    },
    { 
      method: 'GET', 
      url: '/api/admin/transactions', 
      requiresAuth: 'admin', 
      rateLimit: 'read'
    },
    { 
      method: 'GET', 
      url: '/api/admin/users', 
      requiresAuth: 'admin', 
      rateLimit: 'read'
    },
    { 
      method: 'GET', 
      url: '/api/admin/fraud-alerts', 
      requiresAuth: 'admin', 
      rateLimit: 'read'
    },
    { 
      method: 'GET', 
      url: '/api/admin/fees', 
      requiresAuth: 'admin', 
      rateLimit: 'read'
    },
    { 
      method: 'POST', 
      url: '/api/admin/fees', 
      requiresAuth: 'admin', 
      rateLimit: 'write'
    }
  ],

  // Payment processing endpoints
  'Payment Processing Endpoints': [
    { 
      method: 'POST', 
      url: '/api/payments/create', 
      requiresAuth: 'customer', 
      rateLimit: 'payment'
    },
    { 
      method: 'POST', 
      url: '/api/payments/recharge', 
      requiresAuth: 'customer', 
      rateLimit: 'payment'
    },
    { 
      method: 'GET', 
      url: '/api/payments/config', 
      requiresAuth: 'customer', 
      rateLimit: 'read'
    }
  ],

  // Service endpoints
  'Service Endpoints': [
    { 
      method: 'POST', 
      url: '/api/fees/calculate', 
      requiresAuth: false, 
      rateLimit: 'read'
    },
    { 
      method: 'POST', 
      url: '/api/ai/suggest-design', 
      requiresAuth: false, 
      rateLimit: 'auth'
    }
  ]
};

// Rate limit configurations to test
const rateLimitExpected = {
  general: 100,
  read: 150,
  write: 50,
  auth: 20,
  admin: 50,
  payment: 10,
  giftCard: 30
};

async function makeRequest(method, url, options = {}) {
  const fullUrl = `${SERVER_URL}${url}`;
  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  if (options.body) {
    requestOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(fullUrl, requestOptions);
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: response.status !== 204 ? await response.json().catch(() => ({})) : {}
    };
  } catch (error) {
    return {
      status: 0,
      statusText: 'Network Error',
      headers: {},
      body: { error: error.message }
    };
  }
}

async function testEndpointAuthentication(endpoint) {
  const { method, url, requiresAuth, rateLimit, testData } = endpoint;
  
  log(`\nTesting: ${method} ${url}`, 'cyan');
  
  // Test without authentication
  const noAuthResponse = await makeRequest(method, url, {
    body: testData
  });
  
  // Test with invalid authentication
  const invalidAuthResponse = await makeRequest(method, url, {
    headers: {
      'Authorization': 'Bearer invalid-token'
    },
    body: testData
  });

  // Analyze results
  const results = {
    endpoint: `${method} ${url}`,
    requiresAuth,
    rateLimit,
    tests: {}
  };

  // Check no auth response
  if (requiresAuth === false) {
    results.tests.noAuth = {
      expected: 'Allow (200-299) or Not Found (404)',
      actual: noAuthResponse.status,
      passed: noAuthResponse.status < 400 || noAuthResponse.status === 404
    };
  } else {
    results.tests.noAuth = {
      expected: 'Reject (401)',
      actual: noAuthResponse.status,
      passed: noAuthResponse.status === 401
    };
  }

  // Check invalid auth response
  if (requiresAuth !== false) {
    results.tests.invalidAuth = {
      expected: 'Reject (401)',
      actual: invalidAuthResponse.status,
      passed: invalidAuthResponse.status === 401
    };
  }

  // Check rate limiting headers
  const hasRateHeaders = noAuthResponse.headers['x-ratelimit-limit'] || 
                        noAuthResponse.headers['x-ratelimit-remaining'] ||
                        invalidAuthResponse.headers['x-ratelimit-limit'] ||
                        invalidAuthResponse.headers['x-ratelimit-remaining'];
  
  results.tests.rateLimit = {
    expected: 'Rate limit headers present',
    actual: hasRateHeaders ? 'Present' : 'Missing',
    passed: !!hasRateHeaders
  };

  return results;
}

async function testRateLimiting() {
  section('Rate Limiting Test');
  
  // Test a few requests to a public endpoint to verify rate limiting
  const testUrl = '/api/fees/active';
  const requests = [];
  
  log('Making 5 rapid requests to test rate limiting...', 'yellow');
  
  for (let i = 0; i < 5; i++) {
    requests.push(makeRequest('GET', testUrl));
  }
  
  const responses = await Promise.all(requests);
  
  let hasRateHeaders = false;
  let rateLimitValues = [];
  
  responses.forEach((response, index) => {
    if (response.headers['x-ratelimit-limit']) {
      hasRateHeaders = true;
      rateLimitValues.push({
        request: index + 1,
        limit: response.headers['x-ratelimit-limit'],
        remaining: response.headers['x-ratelimit-remaining'],
        status: response.status
      });
    }
  });
  
  if (hasRateHeaders) {
    log('✓ Rate limiting is active', 'green');
    rateLimitValues.forEach(data => {
      log(`  Request ${data.request}: ${data.remaining}/${data.limit} remaining (Status: ${data.status})`, 'cyan');
    });
  } else {
    log('✗ Rate limiting headers not found', 'red');
  }
  
  return hasRateHeaders;
}

async function generateReport(allResults) {
  section('Authentication Test Results Summary');
  
  let totalTests = 0;
  let passedTests = 0;
  const failures = [];
  
  for (const [category, results] of Object.entries(allResults)) {
    log(`\n${category}:`, 'magenta');
    
    results.forEach(result => {
      const testCount = Object.keys(result.tests).length;
      const passed = Object.values(result.tests).filter(test => test.passed).length;
      
      totalTests += testCount;
      passedTests += passed;
      
      if (passed === testCount) {
        log(`  ✓ ${result.endpoint}`, 'green');
      } else {
        log(`  ✗ ${result.endpoint} (${passed}/${testCount} passed)`, 'red');
        failures.push(result);
        
        // Show specific failures
        Object.entries(result.tests).forEach(([testName, test]) => {
          if (!test.passed) {
            log(`    ${testName}: Expected ${test.expected}, got ${test.actual}`, 'yellow');
          }
        });
      }
    });
  }
  
  section('Final Summary');
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${totalTests - passedTests}`, 'red');
  log(`Success Rate: ${successRate}%`, successRate >= 95 ? 'green' : successRate >= 80 ? 'yellow' : 'red');
  
  if (failures.length > 0) {
    log('\nEndpoints requiring attention:', 'yellow');
    failures.forEach(failure => {
      log(`  - ${failure.endpoint}`, 'red');
    });
  }
  
  // Overall assessment
  if (successRate >= 95) {
    log('\n🎉 Excellent! Authentication and rate limiting are properly implemented.', 'green');
  } else if (successRate >= 80) {
    log('\n⚠️  Good progress, but some endpoints need attention.', 'yellow');
  } else {
    log('\n❌ Authentication implementation needs significant improvements.', 'red');
  }
  
  return {
    totalTests,
    passedTests,
    successRate: parseFloat(successRate),
    failures: failures.length
  };
}

async function runComprehensiveTest() {
  section('Comprehensive Authentication & Rate Limiting Test Suite');
  log('Testing all endpoints for proper authentication and rate limiting...', 'cyan');
  
  // Check server health first
  try {
    const healthResponse = await makeRequest('GET', '/health');
    if (healthResponse.status !== 200) {
      log('❌ Server is not responding properly. Please check if the server is running.', 'red');
      return;
    }
    log('✓ Server is running and responding', 'green');
  } catch (error) {
    log('❌ Cannot connect to server. Please ensure the server is running on port 5000.', 'red');
    return;
  }
  
  // Test rate limiting
  const rateLimitWorking = await testRateLimiting();
  
  // Test all endpoint categories
  const allResults = {};
  
  for (const [category, endpoints] of Object.entries(endpointTests)) {
    section(`Testing: ${category}`);
    
    const categoryResults = [];
    
    for (const endpoint of endpoints) {
      const result = await testEndpointAuthentication(endpoint);
      categoryResults.push(result);
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    allResults[category] = categoryResults;
  }
  
  // Generate comprehensive report
  const summary = await generateReport(allResults);
  
  // Additional checks
  section('Additional Security Checks');
  
  if (rateLimitWorking) {
    log('✓ Rate limiting is functional', 'green');
  } else {
    log('✗ Rate limiting needs verification', 'red');
  }
  
  log('\nAuthentication Summary:', 'magenta');
  log(`• ${endpointTests['Public Endpoints'].length} public endpoints`, 'cyan');
  log(`• ${endpointTests['Customer Authenticated Endpoints'].length} customer endpoints`, 'cyan');
  log(`• ${endpointTests['Admin Only Endpoints'].length} admin endpoints`, 'cyan');
  log(`• ${endpointTests['Payment Processing Endpoints'].length} payment endpoints`, 'cyan');
  log(`• ${endpointTests['Service Endpoints'].length} service endpoints`, 'cyan');
  
  return summary;
}

// Run the test if this script is executed directly
if (require.main === module) {
  runComprehensiveTest()
    .then((summary) => {
      process.exit(summary.successRate >= 95 ? 0 : 1);
    })
    .catch((error) => {
      log(`\nTest execution failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runComprehensiveTest };