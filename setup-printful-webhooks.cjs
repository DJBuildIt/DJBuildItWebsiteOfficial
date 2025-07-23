#!/usr/bin/env node

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

// ============================================================================
// PRINTFUL WEBHOOK V2 COMPLETE SETUP SCRIPT
// Implements Phase 2-8 of the Comprehensive Webhook Plan
// ============================================================================

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION & VALIDATION
// ============================================================================

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;
const WEBHOOK_URL = process.env.VITE_APP_URL ? 
  `${process.env.VITE_APP_URL}/api/webhooks/printful` : 
  'https://your-domain.vercel.app/api/webhooks/printful';

// Enhanced validation
if (!PRINTFUL_API_KEY) {
  console.error('❌ PRINTFUL_API_KEY environment variable is required');
  console.error('📝 Get your API key from: https://www.printful.com/dashboard/account/api');
  process.exit(1);
}

if (!process.env.VITE_APP_URL) {
  console.error('⚠️  VITE_APP_URL not set, using placeholder URL');
  console.error('📝 Set VITE_APP_URL for automatic webhook URL configuration');
}

// Validate webhook URL format
if (!WEBHOOK_URL.startsWith('https://')) {
  console.error('❌ Webhook URL must use HTTPS (Printful v2 requirement)');
  console.error('🔗 Current URL:', WEBHOOK_URL);
  console.error('💡 For local testing, use ngrok: ngrok http 5173');
  process.exit(1);
}

console.log('🚀 PRINTFUL WEBHOOK V2 COMPLETE SETUP');
console.log('=====================================');
console.log('📡 Webhook URL:', WEBHOOK_URL);
console.log('🏪 Store ID:', PRINTFUL_STORE_ID || 'Auto-detect');
console.log('');

// ============================================================================
// WEBHOOK CONFIGURATION - PHASE 2: COMPLETE EVENT LIST
// ============================================================================

const ESSENTIAL_ORDER_EVENTS = [
  { type: 'order_created', priority: 'HIGH', description: 'Order created in Printful' },
  { type: 'order_updated', priority: 'HIGH', description: 'Order updated (costs calculated)' },
  { type: 'order_failed', priority: 'HIGH', description: 'Order failed (payment/validation)' },
  { type: 'order_canceled', priority: 'HIGH', description: 'Order canceled' },
  { type: 'order_refunded', priority: 'HIGH', description: 'Order refunded' }
];

const ESSENTIAL_SHIPMENT_EVENTS = [
  { type: 'shipment_sent', priority: 'HIGH', description: 'Shipment sent (tracking available)' },
  { type: 'shipment_returned', priority: 'HIGH', description: 'Shipment returned by carrier' },
  { type: 'shipment_canceled', priority: 'HIGH', description: 'Shipment canceled' },
  { type: 'shipment_out_of_stock', priority: 'HIGH', description: 'Items out of stock' }
];

const HOLD_MANAGEMENT_EVENTS = [
  { type: 'order_put_hold', priority: 'MEDIUM', description: 'Order put on hold' },
  { type: 'order_put_hold_approval', priority: 'MEDIUM', description: 'Order hold needs approval' },
  { type: 'order_remove_hold', priority: 'MEDIUM', description: 'Order removed from hold' },
  { type: 'shipment_put_hold', priority: 'MEDIUM', description: 'Shipment put on hold' },
  { type: 'shipment_put_hold_approval', priority: 'MEDIUM', description: 'Shipment hold needs approval' },
  { type: 'shipment_remove_hold', priority: 'MEDIUM', description: 'Shipment removed from hold' }
];

const CATALOG_EVENTS = [
  { type: 'catalog_price_changed', priority: 'LOW', description: 'Product prices updated' },
  // Note: catalog_stock_updated requires product IDs parameter
];

const OPTIONAL_EVENTS = [
  { type: 'mockup_task_finished', priority: 'LOW', description: 'Mockup generation completed' }
];

// ============================================================================
// WEBHOOK SETUP PROFILES
// ============================================================================

const SETUP_PROFILES = {
  minimal: {
    name: 'Minimal Production Setup',
    events: [...ESSENTIAL_ORDER_EVENTS.slice(0, 4), ...ESSENTIAL_SHIPMENT_EVENTS.slice(0, 3)]
  },
  recommended: {
    name: 'Recommended Production Setup',
    events: [...ESSENTIAL_ORDER_EVENTS, ...ESSENTIAL_SHIPMENT_EVENTS, ...HOLD_MANAGEMENT_EVENTS]
  },
  complete: {
    name: 'Complete Setup (All Events)',
    events: [...ESSENTIAL_ORDER_EVENTS, ...ESSENTIAL_SHIPMENT_EVENTS, ...HOLD_MANAGEMENT_EVENTS, ...CATALOG_EVENTS, ...OPTIONAL_EVENTS]
  }
};

// Default to recommended setup
const SELECTED_PROFILE = process.env.WEBHOOK_PROFILE || 'recommended';
const webhookProfile = SETUP_PROFILES[SELECTED_PROFILE];

if (!webhookProfile) {
  console.error(`❌ Invalid webhook profile: ${SELECTED_PROFILE}`);
  console.error('✅ Available profiles:', Object.keys(SETUP_PROFILES).join(', '));
  process.exit(1);
}

console.log(`📋 Using Profile: ${webhookProfile.name}`);
console.log(`🎯 Events to configure: ${webhookProfile.events.length}`);
console.log('');

// Build webhook configuration
const webhookConfig = {
  default_url: WEBHOOK_URL,
  expires_at: null, // Never expire - for production stability
  events: webhookProfile.events.map(event => ({ type: event.type }))
};

// ============================================================================
// ADVANCED HTTPS REQUEST FUNCTION
// ============================================================================

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
            parseError: error
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// ============================================================================
// PHASE 3: WEBHOOK SETUP EXECUTION
// ============================================================================

async function setupWebhooks() {
  console.log('🔧 Phase 3: Executing Webhook Setup...');
  
  const options = {
    hostname: 'api.printful.com',
    port: 443,
    path: '/v2/webhooks',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Printful-Webhook-Setup/2.0',
      ...(PRINTFUL_STORE_ID && { 'X-PF-Store-Id': PRINTFUL_STORE_ID })
    }
  };

  try {
    console.log('📡 Sending webhook configuration to Printful...');
    const response = await makeRequest(options, webhookConfig);
    
    if (response.statusCode === 200) {
      console.log('✅ WEBHOOK SETUP SUCCESSFUL!');
      console.log('');
      
      const result = response.data.result || response.data;
      
      // Display critical information
      console.log('🔑 CRITICAL INFORMATION (Save These Values):');
      console.log('============================================');
      console.log('🔓 Public Key:', result.public_key);
      
      if (result.secret_key) {
        console.log('🔐 Secret Key (SAVE TO ENVIRONMENT):');
        console.log(result.secret_key);
        
        // Write to .env.local if it exists
        await updateEnvFile(result.secret_key);
      }
      
      console.log('');
      console.log('📝 ENVIRONMENT VARIABLE SETUP:');
      console.log(`PRINTFUL_WEBHOOK_SECRET=${result.secret_key}`);
      console.log('');
      
      // Display configured events
      console.log('🎯 CONFIGURED EVENTS:');
      console.log('==================');
      
      if (result.events) {
        result.events.forEach(event => {
          const eventInfo = [...webhookProfile.events].find(e => e.type === event.type);
          const priority = eventInfo ? eventInfo.priority : 'UNKNOWN';
          const description = eventInfo ? eventInfo.description : 'No description';
          console.log(`  ✓ ${event.type.padEnd(25)} [${priority}] - ${description}`);
        });
      }
      
      console.log('');
      console.log('🚀 NEXT STEPS:');
      console.log('=============');
      console.log('1. Add PRINTFUL_WEBHOOK_SECRET to your .env.local file');
      console.log('2. Deploy your application with the new environment variable');
      console.log('3. Test webhooks by creating a test order in Printful');
      console.log('4. Monitor webhook logs for successful event receipt');
      
      // Generate verification command
      console.log('');
      console.log('🔍 VERIFICATION COMMAND:');
      console.log(`curl -X GET "https://api.printful.com/v2/webhooks" \\`);
      console.log(`  -H "Authorization: Bearer ${PRINTFUL_API_KEY.substring(0, 8)}..."`);
      
    } else {
      console.error('❌ WEBHOOK SETUP FAILED');
      console.error('Status Code:', response.statusCode);
      console.error('Response:', JSON.stringify(response.data, null, 2));
      
      // Provide troubleshooting guidance
      console.error('');
      console.error('🔧 TROUBLESHOOTING:');
      if (response.statusCode === 401) {
        console.error('- Check your PRINTFUL_API_KEY is valid');
        console.error('- Verify API key has webhook permissions');
      } else if (response.statusCode === 403) {
        console.error('- Check your Printful account has webhook access');
        console.error('- Verify store permissions if using PRINTFUL_STORE_ID');
      } else if (response.statusCode === 400) {
        console.error('- Check webhook URL is valid and accessible');
        console.error('- Ensure URL uses HTTPS protocol');
      }
    }
    
  } catch (error) {
    console.error('❌ REQUEST FAILED:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('🌐 Network issue: Unable to reach Printful API');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔒 Connection refused: Check your internet connection');
    }
    
    process.exit(1);
  }
}

// ============================================================================
// PHASE 4: ENVIRONMENT FILE MANAGEMENT
// ============================================================================

async function updateEnvFile(secretKey) {
  const envPath = path.join(process.cwd(), '.env.local');
  
  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('PRINTFUL_WEBHOOK_SECRET=')) {
        // Update existing entry
        const updatedContent = envContent.replace(
          /PRINTFUL_WEBHOOK_SECRET=.*/,
          `PRINTFUL_WEBHOOK_SECRET=${secretKey}`
        );
        fs.writeFileSync(envPath, updatedContent);
        console.log('📝 Updated PRINTFUL_WEBHOOK_SECRET in .env.local');
      } else {
        // Append new entry
        fs.appendFileSync(envPath, `\n# Printful Webhook Secret (Auto-generated)\nPRINTFUL_WEBHOOK_SECRET=${secretKey}\n`);
        console.log('📝 Added PRINTFUL_WEBHOOK_SECRET to .env.local');
      }
    } else {
      console.log('⚠️  .env.local not found - please add the secret key manually');
    }
  } catch (error) {
    console.log('⚠️  Could not update .env.local file:', error.message);
  }
}

// ============================================================================
// PHASE 5: VERIFICATION & TESTING
// ============================================================================

async function verifyWebhookSetup() {
  console.log('');
  console.log('🔍 Phase 5: Verifying Webhook Setup...');
  
  const options = {
    hostname: 'api.printful.com',
    port: 443,
    path: '/v2/webhooks',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
      'User-Agent': 'Printful-Webhook-Verify/2.0',
      ...(PRINTFUL_STORE_ID && { 'X-PF-Store-Id': PRINTFUL_STORE_ID })
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      const result = response.data.result || response.data;
      
      console.log('✅ Webhook configuration verified');
      console.log(`📡 Endpoint: ${result.default_url}`);
      console.log(`🔗 Public Key: ${result.public_key}`);
      console.log(`⏰ Expires: ${result.expires_at || 'Never'}`);
      console.log(`🎯 Active Events: ${result.events ? result.events.length : 0}`);
      
      return true;
    } else {
      console.error('❌ Webhook verification failed:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Verification request failed:', error.message);
    return false;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    // Phase 3: Setup webhooks
    await setupWebhooks();
    
    // Phase 5: Verify setup
    await verifyWebhookSetup();
    
    console.log('');
    console.log('🎉 WEBHOOK SETUP COMPLETE!');
    console.log('==========================');
    console.log('Your Printful webhooks are now configured and ready to receive events.');
    console.log('Monitor your application logs to verify webhook delivery.');
    
  } catch (error) {
    console.error('💥 SETUP FAILED:', error.message);
    process.exit(1);
  }
}

// Handle CLI arguments for different profiles
if (process.argv.includes('--minimal')) {
  process.env.WEBHOOK_PROFILE = 'minimal';
} else if (process.argv.includes('--complete')) {
  process.env.WEBHOOK_PROFILE = 'complete';
}

// Execute main function
main(); 