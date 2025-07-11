/**
 * Test Square OAuth Flow
 * Verifies that the OAuth endpoints are working correctly
 */

const BASE_URL = 'http://localhost:5000';

async function testOAuthFlow() {
  console.log('Testing Square OAuth Flow...\n');

  // Test 1: Check if OAuth service is available
  try {
    const response = await fetch(`${BASE_URL}/api/oauth/connections`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      console.log('✓ OAuth connections endpoint requires authentication (expected)');
    } else {
      console.log(`✗ Unexpected response status: ${response.status}`);
    }
  } catch (error) {
    console.error('✗ Failed to reach OAuth connections endpoint:', error.message);
  }

  // Test 2: Check OAuth redirect route
  try {
    const response = await fetch(`${BASE_URL}/api/oauth/square/authorize`, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects
    });

    if (response.status === 302 || response.status === 303) {
      const location = response.headers.get('location');
      console.log('✓ OAuth authorize endpoint redirects to:', location ? location.substring(0, 50) + '...' : 'N/A');
      
      // Check if it's a valid Square OAuth URL
      if (location && location.includes('connect.squareupsandbox.com')) {
        console.log('✓ Redirects to Square sandbox OAuth URL');
      }
    } else {
      console.log(`✗ Expected redirect, got status: ${response.status}`);
    }
  } catch (error) {
    console.error('✗ Failed to test OAuth authorize endpoint:', error.message);
  }

  // Test 3: Test OAuth callback endpoint structure
  try {
    const response = await fetch(`${BASE_URL}/api/oauth/square/callback?error=test_error&error_description=testing`, {
      method: 'GET',
      redirect: 'manual'
    });

    if (response.status === 302 || response.status === 303) {
      const location = response.headers.get('location');
      console.log('✓ OAuth callback handles errors and redirects to:', location);
    }
  } catch (error) {
    console.error('✗ Failed to test OAuth callback endpoint:', error.message);
  }

  console.log('\nOAuth configuration summary:');
  console.log('- Client ID: sandbox-sq0idb-l5OPb4gxToPCbEbXnfzXng');
  console.log('- Redirect URI: https://sizugiftcard.com/api/oauth/square/callback');
  console.log('- Environment: Sandbox');
  console.log('\nTo complete OAuth flow:');
  console.log('1. Login as admin at /admin');
  console.log('2. Navigate to /admin/settings');
  console.log('3. Click "Connect Square Account"');
  console.log('4. Complete authorization on Square sandbox');
}

// Run tests
testOAuthFlow().catch(console.error);