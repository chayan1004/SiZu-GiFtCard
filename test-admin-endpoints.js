#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Admin endpoints to test
const adminEndpoints = [
  // Email Templates
  { method: 'GET', path: '/email-templates', description: 'List email templates' },
  { method: 'GET', path: '/email-templates/variables/receipt', description: 'Get template variables' },
  
  // Gift Card Designs
  { method: 'GET', path: '/gift-card-designs', description: 'List gift card designs' },
  
  // System Settings
  { method: 'GET', path: '/system-settings', description: 'List system settings' },
  { method: 'GET', path: '/system-settings/keys/available', description: 'Get available setting keys' },
  
  // Audit Logs
  { method: 'GET', path: '/audit-logs', description: 'List audit logs' },
  { method: 'GET', path: '/audit-logs/stats', description: 'Get audit log statistics' },
  
  // Database Tools
  { method: 'GET', path: '/admin/database/stats', description: 'Get database statistics' },
  
  // Webhook Subscriptions
  { method: 'GET', path: '/webhook-subscriptions/event-types', description: 'List webhook event types' },
  { method: 'GET', path: '/webhook-subscriptions/subscriptions', description: 'List webhook subscriptions' },
  
  // Disputes
  { method: 'GET', path: '/disputes', description: 'List disputes' },
  
  // Refunds
  { method: 'GET', path: '/refunds', description: 'List refunds' }
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    let result = 'UNKNOWN';
    
    if (status === 200) {
      result = '✅ OK';
    } else if (status === 401) {
      result = '🔒 AUTH REQUIRED';
    } else if (status === 404) {
      result = '❌ NOT FOUND';
    } else if (status === 503) {
      result = '⚠️  SERVICE UNAVAILABLE';
    } else {
      result = `❌ ERROR (${status})`;
    }
    
    console.log(`${result} ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
    
  } catch (error) {
    console.log(`❌ FAILED ${endpoint.method} ${endpoint.path} - ${error.message}`);
  }
}

async function testAllEndpoints() {
  console.log('🧪 Testing Admin API Endpoints...\n');
  
  for (const endpoint of adminEndpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n✅ Admin endpoint test complete!');
}

testAllEndpoints().catch(console.error);