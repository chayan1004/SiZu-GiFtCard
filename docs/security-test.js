/**
 * Security Enhancement Test Script
 * Tests SQL injection protection and CORS configuration
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function testSQLInjectionProtection() {
  console.log('\n=== Testing SQL Injection Protection ===\n');
  
  const testCases = [
    {
      name: 'SQL Keywords in gift card code',
      endpoint: '/api/giftcards/balance',
      payload: { code: "ABC123' UNION SELECT * FROM users--" },
      expected: 'SQL keywords detected'
    },
    {
      name: 'SQL Comment sequences',
      endpoint: '/api/giftcards/balance',
      payload: { code: "ABC123-- DROP TABLE" },
      expected: 'SQL comment sequences detected'
    },
    {
      name: 'Encoded characters',
      endpoint: '/api/giftcards/balance',
      payload: { code: "ABC&#x31;23" },
      expected: 'Encoded characters detected'
    },
    {
      name: 'Script tags in recipient name',
      endpoint: '/api/giftcards',
      payload: { 
        initialAmount: 50,
        design: 'classic',
        recipientName: "<script>alert('XSS')</script>"
      },
      expected: 'Script tags are not allowed'
    },
    {
      name: 'Deep nested object attack',
      endpoint: '/api/giftcards/balance',
      payload: createDeepObject(15),
      expected: 'Input structure too deep'
    },
    {
      name: 'Invalid gift card code format',
      endpoint: '/api/giftcards/balance',
      payload: { code: "ABC-123!@#" },
      expected: 'Gift card codes must be 6-20 alphanumeric characters'
    },
    {
      name: 'Null byte injection',
      endpoint: '/api/giftcards/balance',
      payload: { code: "ABC123\0DROP" },
      expected: 'Null bytes are not allowed'
    }
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await fetch(`${BASE_URL}${testCase.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload)
      });
      
      const result = await response.json();
      const passed = response.status === 400 && result.message?.includes(testCase.expected);
      
      console.log(`Test: ${testCase.name}`);
      console.log(`Status: ${passed ? '✓ PASSED' : '✗ FAILED'}`);
      console.log(`Response: ${JSON.stringify(result)}`);
      console.log('---');
    } catch (error) {
      console.log(`Test: ${testCase.name}`);
      console.log(`Status: ✗ ERROR`);
      console.log(`Error: ${error.message}`);
      console.log('---');
    }
  }
}

async function testCORSConfiguration() {
  console.log('\n=== Testing CORS Configuration ===\n');
  
  const origins = [
    'http://localhost:3000',
    'https://example.replit.app',
    'https://malicious-site.com',
    null // No origin header
  ];
  
  for (const origin of origins) {
    try {
      const headers = origin ? { 'Origin': origin } : {};
      const response = await fetch(`${BASE_URL}/api/health`, {
        method: 'OPTIONS',
        headers
      });
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        'vary': response.headers.get('vary')
      };
      
      console.log(`Origin: ${origin || 'none'}`);
      console.log(`Status: ${response.status}`);
      console.log(`CORS Headers: ${JSON.stringify(corsHeaders, null, 2)}`);
      console.log('---');
    } catch (error) {
      console.log(`Origin: ${origin || 'none'}`);
      console.log(`Error: ${error.message}`);
      console.log('---');
    }
  }
}

async function testSecurityHeaders() {
  console.log('\n=== Testing Security Headers ===\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    
    const securityHeaders = {
      'x-content-type-options': response.headers.get('x-content-type-options'),
      'x-frame-options': response.headers.get('x-frame-options'),
      'x-xss-protection': response.headers.get('x-xss-protection'),
      'content-security-policy': response.headers.get('content-security-policy'),
      'strict-transport-security': response.headers.get('strict-transport-security'),
      'cache-control': response.headers.get('cache-control')
    };
    
    console.log('Security Headers:');
    for (const [header, value] of Object.entries(securityHeaders)) {
      console.log(`${header}: ${value || 'NOT SET'}`);
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

function createDeepObject(depth) {
  let obj = { code: 'ABC123' };
  let current = obj;
  
  for (let i = 0; i < depth; i++) {
    current.nested = { level: i };
    current = current.nested;
  }
  
  return obj;
}

// Run all tests
async function runAllTests() {
  await testSQLInjectionProtection();
  await testCORSConfiguration();
  await testSecurityHeaders();
  console.log('\n=== Security Tests Complete ===\n');
}

runAllTests();