/**
 * Test Security Token Validation
 * Verifies that Square test tokens are properly allowed
 */

const BASE_URL = 'http://localhost:5000';

async function testTokenValidation() {
  console.log('Testing Security Token Validation\n');
  
  // Test a simple endpoint with the test token
  const testPayload = {
    sourceId: 'wnon:cash-app-ok',
    testField: 'This is a simple test'
  };
  
  console.log('Sending payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}/api/payments/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'test-auth-cookie'
      },
      body: JSON.stringify(testPayload)
    });
    
    const data = await response.json();
    console.log('\nResponse status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (!response.ok && data.message?.includes('SQL comment sequences')) {
      console.log('\nERROR: Square test token is being blocked by SQL injection protection');
      console.log('The security middleware should allow "wnon:cash-app-ok" as a test token');
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}

testTokenValidation();