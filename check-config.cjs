#!/usr/bin/env node

/**
 * Configuration Validation Script
 * Checks if all required environment variables are properly set
 * 
 * Usage: node check-config.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 DJBUILDIT Store Configuration Checker\n');

const requiredVars = {
  'Stripe Configuration': {
    'VITE_STRIPE_PUBLISHABLE_KEY': {
      required: true,
      pattern: /^pk_(test_|live_)[a-zA-Z0-9_]+$/,
      description: 'Stripe publishable key (pk_test_... or pk_live_...)'
    },
    'STRIPE_SECRET_KEY': {
      required: true,
      pattern: /^sk_(test_|live_)[a-zA-Z0-9_]+$/,
      description: 'Stripe secret key (sk_test_... or sk_live_...)'
    },
    'STRIPE_WEBHOOK_SECRET': {
      required: false,
      pattern: /^whsec_[a-zA-Z0-9_]+$/,
      description: 'Stripe webhook secret (whsec_...)'
    }
  },
  'Printful Configuration': {
    'PRINTFUL_API_KEY': {
      required: true,
      pattern: /^[a-zA-Z0-9_\-]+$/,
      description: 'Printful API key'
    },
    'PRINTFUL_STORE_ID': {
      required: true,
      pattern: /^\d+$/,
      description: 'Printful store ID (numeric)'
    },
    'PRINTFUL_WEBHOOK_SECRET': {
      required: false,
      pattern: /.+/,
      description: 'Printful webhook secret'
    }
  },
  'App Configuration': {
    'VITE_APP_URL': {
      required: true,
      pattern: /^https?:\/\/.+$/,
      description: 'Application URL (http://... or https://...)'
    },
    'NODE_ENV': {
      required: false,
      pattern: /^(development|production|test)$/,
      description: 'Node environment (development, production, or test)'
    }
  }
};

let allValid = true;
let warnings = [];
let errors = [];

function checkVariable(varName, config) {
  const value = process.env[varName];
  const isSet = value && value.trim() !== '';
  
  if (!isSet) {
    if (config.required) {
      errors.push(`❌ ${varName}: Missing required variable`);
      allValid = false;
      return false;
    } else {
      warnings.push(`⚠️  ${varName}: Optional variable not set`);
      return true;
    }
  }

  // Check for placeholder values
  if (value.includes('your_') || value.includes('placeholder') || value.includes('here')) {
    errors.push(`❌ ${varName}: Still contains placeholder value`);
    allValid = false;
    return false;
  }

  // Check pattern
  if (config.pattern && !config.pattern.test(value)) {
    errors.push(`❌ ${varName}: Invalid format (${config.description})`);
    allValid = false;
    return false;
  }

  console.log(`✅ ${varName}: Configured correctly`);
  return true;
}

// Check environment file exists
const fs = require('fs');
const envPath = '.env.local';

if (!fs.existsSync(envPath)) {
  console.log(`❌ Environment file ${envPath} not found!`);
  console.log('📝 Create .env.local file with your API keys first.\n');
  process.exit(1);
}

console.log('📋 Checking configuration...\n');

// Check all variables
for (const [section, vars] of Object.entries(requiredVars)) {
  console.log(`=== ${section} ===`);
  
  for (const [varName, config] of Object.entries(vars)) {
    checkVariable(varName, config);
  }
  
  console.log('');
}

// Display summary
console.log('📊 Configuration Summary:');
console.log('==========================');

if (errors.length > 0) {
  console.log('\n🚨 ERRORS:');
  errors.forEach(error => console.log(error));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(warning));
}

if (allValid) {
  console.log('\n🎉 All required configuration is valid!');
  console.log('\nNext steps:');
  console.log('1. Make sure your products have real Stripe and Printful IDs');
  console.log('2. Run: npm run dev');
  console.log('3. Test your store at http://localhost:5173/store');
  console.log('\n🚀 Your store should work perfectly!');
} else {
  console.log('\n❌ Configuration has errors. Please fix them before proceeding.');
  console.log('\n📖 Refer to STRIPE-PRINTFUL-SETUP.md for detailed instructions.');
  process.exit(1);
}

// Additional checks
console.log('\n🔧 Additional Checks:');

// Check if Stripe test vs live keys match
const stripePublishable = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (stripePublishable && stripeSecret) {
  const pubIsTest = stripePublishable.startsWith('pk_test_');
  const secretIsTest = stripeSecret.startsWith('sk_test_');
  
  if (pubIsTest !== secretIsTest) {
    console.log('⚠️  Stripe keys mismatch: One is test, one is live');
  } else if (pubIsTest) {
    console.log('🧪 Using Stripe TEST mode (safe for development)');
  } else {
    console.log('🔴 Using Stripe LIVE mode (real payments!)');
  }
}

// Check Node environment
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`🌍 Environment: ${nodeEnv}`);

if (nodeEnv === 'production' && stripePublishable && stripePublishable.startsWith('pk_test_')) {
  console.log('⚠️  Production environment with test Stripe keys');
}

console.log(''); 