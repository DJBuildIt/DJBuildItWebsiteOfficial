#!/usr/bin/env node

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

// ============================================================================
// PRINTFUL WEBHOOK TESTING & MONITORING SCRIPT
// Phase 6-7: Production Monitoring & Testing
// ============================================================================

const https = require('https');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;
const WEBHOOK_URL = process.env.VITE_APP_URL ? 
  `${process.env.VITE_APP_URL}/api/webhooks/printful` : 
  'https://your-domain.vercel.app/api/webhooks/printful';

if (!PRINTFUL_API_KEY) {
  console.error('❌ PRINTFUL_API_KEY environment variable is required');
  process.exit(1);
}

console.log('🧪 PRINTFUL WEBHOOK TESTING & MONITORING');
console.log('=======================================');
console.log('📡 Testing Webhook URL:', WEBHOOK_URL);
console.log('');

// ============================================================================
// ADVANCED HTTPS REQUEST HELPER
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
// WEBHOOK CONFIGURATION TESTING
// ============================================================================

async function testWebhookConfiguration() {
  console.log('🔍 1. Testing Current Webhook Configuration...');
  
  const options = {
    hostname: 'api.printful.com',
    port: 443,
    path: '/v2/webhooks',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
      'User-Agent': 'Printful-Webhook-Test/1.0',
      ...(PRINTFUL_STORE_ID && { 'X-PF-Store-Id': PRINTFUL_STORE_ID })
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      const result = response.data.result || response.data;
      
      console.log('✅ Webhook configuration found');
      console.log(`📡 Endpoint: ${result.default_url}`);
      console.log(`🔗 Public Key: ${result.public_key}`);
      console.log(`⏰ Expires: ${result.expires_at || 'Never'}`);
      console.log(`🎯 Active Events: ${result.events ? result.events.length : 0}`);
      
      if (result.events && result.events.length > 0) {
        console.log('');
        console.log('📋 Configured Events:');
        result.events.forEach(event => {
          const eventUrl = event.url || result.default_url;
          console.log(`  ✓ ${event.type.padEnd(25)} → ${eventUrl}`);
        });
      }
      
      // Validate webhook URL
      if (result.default_url !== WEBHOOK_URL) {
        console.log('');
        console.log('⚠️  WARNING: Configured URL differs from current VITE_APP_URL');
        console.log(`   Configured: ${result.default_url}`);
        console.log(`   Current:    ${WEBHOOK_URL}`);
        console.log('   💡 Run setup script to update webhook URL');
      }
      
      return result;
    } else if (response.statusCode === 404) {
      console.log('❌ No webhook configuration found');
      console.log('💡 Run: node setup-printful-webhooks.js');
      return null;
    } else {
      console.error('❌ Failed to get webhook configuration:', response.statusCode);
      console.error('Response:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

// ============================================================================
// WEBHOOK ENDPOINT CONNECTIVITY TEST
// ============================================================================

async function testWebhookEndpoint() {
  console.log('');
  console.log('🌐 2. Testing Webhook Endpoint Connectivity...');
  
  const webhookUrl = new URL(WEBHOOK_URL);
  
  const options = {
    hostname: webhookUrl.hostname,
    port: webhookUrl.port || 443,
    path: webhookUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Printful-Webhook-Test/1.0',
      'X-PF-Signature': 'test_signature_ignore', // Mock signature for testing
    }
  };

  const testPayload = {
    type: 'test_event',
    occurred_at: new Date().toISOString(),
    retries: 0,
    store_id: parseInt(PRINTFUL_STORE_ID || '12345'),
    data: {
      test: true,
      message: 'Webhook connectivity test'
    }
  };

  try {
    const response = await makeRequest(options, testPayload);
    
    console.log(`📡 Response Status: ${response.statusCode}`);
    console.log(`📊 Response Headers:`, Object.keys(response.headers).join(', '));
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('✅ Webhook endpoint is reachable');
      console.log(`📄 Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
    } else if (response.statusCode === 401) {
      console.log('⚠️  Webhook endpoint returned 401 (expected for test signature)');
      console.log('✅ This indicates the endpoint is properly validating signatures');
    } else {
      console.log(`⚠️  Unexpected response status: ${response.statusCode}`);
      console.log(`📄 Response: ${JSON.stringify(response.data)}`);
    }
    
    return response.statusCode;
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.error('❌ Domain not found - check your VITE_APP_URL');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused - server may be down');
    } else {
      console.error('❌ Connection failed:', error.message);
    }
    return null;
  }
}

// ============================================================================
// INDIVIDUAL EVENT TESTING
// ============================================================================

async function testIndividualEvents(webhookConfig) {
  if (!webhookConfig || !webhookConfig.events) {
    console.log('⚠️  Skipping individual event tests - no webhook configuration');
    return;
  }

  console.log('');
  console.log('🎯 3. Testing Individual Event Configurations...');
  
  const testResults = [];
  
  for (const event of webhookConfig.events) {
    try {
      const options = {
        hostname: 'api.printful.com',
        port: 443,
        path: `/v2/webhooks/${event.type}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
          'User-Agent': 'Printful-Webhook-Test/1.0',
          ...(PRINTFUL_STORE_ID && { 'X-PF-Store-Id': PRINTFUL_STORE_ID })
        }
      };

      const response = await makeRequest(options);
      
      if (response.statusCode === 200) {
        const result = response.data.result || response.data;
        testResults.push({
          event: event.type,
          status: 'configured',
          url: result.url || webhookConfig.default_url,
          params: result.params || []
        });
        console.log(`  ✅ ${event.type.padEnd(25)} - Configured`);
      } else {
        testResults.push({
          event: event.type,
          status: 'error',
          statusCode: response.statusCode
        });
        console.log(`  ❌ ${event.type.padEnd(25)} - Error (${response.statusCode})`);
      }
    } catch (error) {
      testResults.push({
        event: event.type,
        status: 'failed',
        error: error.message
      });
      console.log(`  ❌ ${event.type.padEnd(25)} - Failed (${error.message})`);
    }
  }
  
  return testResults;
}

// ============================================================================
// WEBHOOK HEALTH MONITORING
// ============================================================================

async function generateHealthReport(webhookConfig, endpointStatus, eventTests) {
  console.log('');
  console.log('📊 4. Generating Health Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    webhook_url: WEBHOOK_URL,
    configuration: {
      exists: !!webhookConfig,
      public_key: webhookConfig?.public_key || null,
      expires_at: webhookConfig?.expires_at || 'Never',
      total_events: webhookConfig?.events?.length || 0
    },
    endpoint: {
      reachable: endpointStatus >= 200 && endpointStatus < 500,
      status_code: endpointStatus,
      validates_signatures: endpointStatus === 401
    },
    events: eventTests || [],
    health_score: 0,
    recommendations: []
  };
  
  // Calculate health score
  let score = 0;
  
  if (report.configuration.exists) score += 25;
  if (report.endpoint.reachable) score += 25;
  if (report.endpoint.validates_signatures) score += 20;
  if (report.configuration.total_events >= 5) score += 15;
  if (report.events.filter(e => e.status === 'configured').length >= 5) score += 15;
  
  report.health_score = Math.min(score, 100);
  
  // Generate recommendations
  if (!report.configuration.exists) {
    report.recommendations.push('Run webhook setup: node setup-printful-webhooks.js');
  }
  
  if (!report.endpoint.reachable) {
    report.recommendations.push('Check webhook URL accessibility and server status');
  }
  
  if (!report.endpoint.validates_signatures) {
    report.recommendations.push('Verify webhook signature validation is working');
  }
  
  if (report.configuration.total_events < 5) {
    report.recommendations.push('Configure more webhook events for better order tracking');
  }
  
  // Display health report
  console.log('');
  console.log('🏥 WEBHOOK HEALTH REPORT');
  console.log('========================');
  console.log(`📊 Health Score: ${report.health_score}/100`);
  console.log(`📡 Endpoint Status: ${report.endpoint.reachable ? '✅ Reachable' : '❌ Unreachable'}`);
  console.log(`🔐 Signature Validation: ${report.endpoint.validates_signatures ? '✅ Working' : '⚠️  Unknown'}`);
  console.log(`🎯 Configured Events: ${report.configuration.total_events}`);
  
  if (report.recommendations.length > 0) {
    console.log('');
    console.log('💡 RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'webhook-health-report.json');
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('');
    console.log(`📁 Health report saved to: ${reportPath}`);
  } catch (error) {
    console.log('⚠️  Could not save health report:', error.message);
  }
  
  return report;
}

// ============================================================================
// CONTINUOUS MONITORING SETUP
// ============================================================================

async function setupContinuousMonitoring() {
  console.log('');
  console.log('⚙️  5. Setting Up Continuous Monitoring...');
  
  const monitoringScript = `#!/bin/bash

# Printful Webhook Health Monitoring Script
# Run this via cron job for continuous monitoring

echo "🏥 Webhook Health Check - $(date)"
echo "================================="

# Run webhook tests
node scripts/test-printful-webhooks.js

# Check for critical issues
if [ -f "webhook-health-report.json" ]; then
  HEALTH_SCORE=$(cat webhook-health-report.json | jq -r '.health_score')
  
  if [ "$HEALTH_SCORE" -lt 80 ]; then
    echo "⚠️  WARNING: Webhook health score is $HEALTH_SCORE/100"
    echo "📧 Consider sending alert notification"
  else
    echo "✅ Webhook health score: $HEALTH_SCORE/100"
  fi
else
  echo "❌ Could not find health report"
fi

echo ""
echo "📊 For detailed report, check: webhook-health-report.json"
`;

  const scriptPath = path.join(process.cwd(), 'scripts', 'monitor-webhooks.sh');
  
  try {
    fs.writeFileSync(scriptPath, monitoringScript);
    fs.chmodSync(scriptPath, '755');
    console.log(`📁 Monitoring script created: ${scriptPath}`);
    console.log('');
    console.log('💡 SETUP CONTINUOUS MONITORING:');
    console.log('   1. Add to crontab for regular checks:');
    console.log('      */30 * * * * /path/to/your/project/scripts/monitor-webhooks.sh');
    console.log('   2. Set up alerts based on health score in webhook-health-report.json');
    console.log('   3. Monitor application logs for webhook processing errors');
  } catch (error) {
    console.log('⚠️  Could not create monitoring script:', error.message);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    console.log('🚀 Starting comprehensive webhook testing...');
    console.log('');
    
    // Phase 1: Test webhook configuration
    const webhookConfig = await testWebhookConfiguration();
    
    // Phase 2: Test endpoint connectivity
    const endpointStatus = await testWebhookEndpoint();
    
    // Phase 3: Test individual events
    const eventTests = await testIndividualEvents(webhookConfig);
    
    // Phase 4: Generate health report
    const healthReport = await generateHealthReport(webhookConfig, endpointStatus, eventTests);
    
    // Phase 5: Setup monitoring
    await setupContinuousMonitoring();
    
    console.log('');
    console.log('🎉 WEBHOOK TESTING COMPLETE!');
    console.log('============================');
    
    if (healthReport.health_score >= 90) {
      console.log('🏆 Excellent webhook health! Your setup is production-ready.');
    } else if (healthReport.health_score >= 70) {
      console.log('✅ Good webhook health. Consider addressing recommendations.');
    } else {
      console.log('⚠️  Webhook health needs attention. Please review recommendations.');
    }
    
  } catch (error) {
    console.error('💥 TESTING FAILED:', error.message);
    process.exit(1);
  }
}

// Handle CLI arguments
if (process.argv.includes('--help')) {
  console.log('Printful Webhook Testing & Monitoring');
  console.log('');
  console.log('Usage: node scripts/test-printful-webhooks.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help     Show this help message');
  console.log('');
  console.log('Environment Variables:');
  console.log('  PRINTFUL_API_KEY    Required - Your Printful API key');
  console.log('  PRINTFUL_STORE_ID   Optional - Your Printful store ID');
  console.log('  VITE_APP_URL        Required - Your app URL for webhook endpoint');
  process.exit(0);
}

// Execute main function
main(); 