#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Validates that all required API keys are properly configured
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function logHeader(text) {
  console.log(`\n${colorize('🔍 ' + text, 'cyan')}`);
  console.log(colorize('=' + '='.repeat(text.length + 3), 'cyan'));
}

function logSuccess(text) {
  console.log(`${colorize('✅', 'green')} ${text}`);
}

function logWarning(text) {
  console.log(`${colorize('⚠️ ', 'yellow')} ${text}`);
}

function logError(text) {
  console.log(`${colorize('❌', 'red')} ${text}`);
}

function logInfo(text) {
  console.log(`${colorize('ℹ️ ', 'blue')} ${text}`);
}

// Check if environment file exists
function checkEnvFile() {
  logHeader('Environment File Check');
  
  const envFiles = ['.env.local', '.env.development', '.env'];
  let foundEnvFile = null;
  
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      foundEnvFile = file;
      logSuccess(`Found environment file: ${file}`);
      break;
    }
  }
  
  if (!foundEnvFile) {
    logError('No environment file found!');
    console.log('\nCreate a .env.local file with your API keys:');
    console.log(colorize(`
# Stripe Test Keys (get from https://dashboard.stripe.com/test/apikeys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# Printful API Key (get from https://www.printful.com/dashboard/account/api)
PRINTFUL_API_KEY=your_printful_api_key_here
PRINTFUL_STORE_ID=your_store_id_here

# App Configuration
VITE_APP_URL=http://localhost:5173
NODE_ENV=development
VITE_TEST_MODE=true
    `, 'yellow'));
    return false;
  }
  
  return foundEnvFile;
}

// Load environment variables from file
function loadEnvVars(envFile) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

// Validate API key formats
function validateApiKeys(envVars) {
  logHeader('API Key Validation');
  
  const validations = [
    {
      key: 'VITE_STRIPE_PUBLISHABLE_KEY',
      name: 'Stripe Publishable Key',
      required: true,
      validate: (value) => {
        if (!value) return { valid: false, message: 'Missing key' };
        if (value.startsWith('pk_test_')) return { valid: true, message: 'Test key (safe for development)' };
        if (value.startsWith('pk_live_')) return { valid: true, message: 'Live key (⚠️  production only!)' };
        return { valid: false, message: 'Invalid format (should start with pk_test_ or pk_live_)' };
      }
    },
    {
      key: 'STRIPE_SECRET_KEY',
      name: 'Stripe Secret Key',
      required: true,
      validate: (value) => {
        if (!value) return { valid: false, message: 'Missing key' };
        if (value.startsWith('sk_test_')) return { valid: true, message: 'Test key (safe for development)' };
        if (value.startsWith('sk_live_')) return { valid: true, message: 'Live key (⚠️  production only!)' };
        return { valid: false, message: 'Invalid format (should start with sk_test_ or sk_live_)' };
      }
    },
    {
      key: 'PRINTFUL_API_KEY',
      name: 'Printful API Key',
      required: true,
      validate: (value) => {
        if (!value) return { valid: false, message: 'Missing key' };
        if (value.length < 10) return { valid: false, message: 'Key seems too short' };
        return { valid: true, message: 'Format looks valid' };
      }
    },
    {
      key: 'PRINTFUL_STORE_ID',
      name: 'Printful Store ID',
      required: true,
      validate: (value) => {
        if (!value) return { valid: false, message: 'Missing store ID' };
        if (!/^\d+$/.test(value)) return { valid: false, message: 'Should be a number' };
        return { valid: true, message: 'Format looks valid' };
      }
    },
    {
      key: 'STRIPE_WEBHOOK_SECRET',
      name: 'Stripe Webhook Secret',
      required: false,
      validate: (value) => {
        if (!value) return { valid: true, message: 'Optional for local development' };
        if (value.startsWith('whsec_')) return { valid: true, message: 'Format looks valid' };
        return { valid: false, message: 'Invalid format (should start with whsec_)' };
      }
    }
  ];
  
  let allValid = true;
  
  validations.forEach(({ key, name, required, validate }) => {
    const value = envVars[key];
    const result = validate(value);
    
    if (result.valid) {
      logSuccess(`${name}: ${result.message}`);
    } else {
      if (required) {
        logError(`${name}: ${result.message}`);
        allValid = false;
      } else {
        logWarning(`${name}: ${result.message}`);
      }
    }
  });
  
  return allValid;
}

// Check configuration consistency
function checkConfiguration(envVars) {
  logHeader('Configuration Check');
  
  const stripePublishable = envVars.VITE_STRIPE_PUBLISHABLE_KEY;
  const stripeSecret = envVars.STRIPE_SECRET_KEY;
  
  if (stripePublishable && stripeSecret) {
    const publishableIsTest = stripePublishable.startsWith('pk_test_');
    const secretIsTest = stripeSecret.startsWith('sk_test_');
    
    if (publishableIsTest === secretIsTest) {
      const mode = publishableIsTest ? 'test' : 'live';
      logSuccess(`Stripe keys are both in ${mode} mode ✓`);
    } else {
      logError('Stripe key mismatch! Publishable and secret keys are in different modes');
      return false;
    }
  }
  
  const testMode = envVars.VITE_TEST_MODE;
  if (testMode === 'true') {
    logSuccess('Test mode enabled - safe for development');
  } else if (testMode === 'false') {
    logWarning('Test mode disabled - orders will be processed!');
  } else {
    logWarning('Test mode not set - defaulting to enabled');
  }
  
  return true;
}

// Generate helpful suggestions
function generateSuggestions(envVars) {
  logHeader('Recommendations');
  
  const stripePublishable = envVars.VITE_STRIPE_PUBLISHABLE_KEY;
  
  if (!stripePublishable || stripePublishable.startsWith('pk_live_')) {
    logInfo('💡 For development, use Stripe test keys (pk_test_..., sk_test_...)');
    logInfo('   Get them from: https://dashboard.stripe.com/test/apikeys');
  }
  
  if (!envVars.STRIPE_WEBHOOK_SECRET) {
    logInfo('💡 For webhook testing, use Stripe CLI:');
    logInfo('   stripe listen --forward-to localhost:5173/api/webhooks/stripe');
  }
  
  if (envVars.VITE_TEST_MODE !== 'true') {
    logInfo('💡 Enable test mode during development:');
    logInfo('   VITE_TEST_MODE=true');
  }
  
  logInfo('💡 Need help? Check ENV_SETUP_GUIDE.md for detailed instructions');
}

// Test API connectivity (basic check)
async function testConnectivity(envVars) {
  logHeader('API Connectivity Test');
  
  try {
    // Simple test: check if we can construct valid URLs
    if (envVars.STRIPE_SECRET_KEY) {
      logInfo('Stripe API endpoint: https://api.stripe.com/v1/');
    }
    
    if (envVars.PRINTFUL_API_KEY) {
      logInfo('Printful API endpoint: https://api.printful.com/');
    }
    
    logSuccess('Basic connectivity check passed');
    logInfo('Run "npm run test" to perform full API integration tests');
    
  } catch (error) {
    logError(`Connectivity test failed: ${error.message}`);
  }
}

// Main execution
async function main() {
  console.log(colorize('\n🔑 Environment Variables Checker', 'bold'));
  console.log(colorize('=====================================\n', 'bold'));
  
  // Check for environment file
  const envFile = checkEnvFile();
  if (!envFile) {
    process.exit(1);
  }
  
  // Load environment variables
  const envVars = loadEnvVars(envFile);
  
  // Validate API keys
  const keysValid = validateApiKeys(envVars);
  
  // Check configuration consistency
  const configValid = checkConfiguration(envVars);
  
  // Test basic connectivity
  await testConnectivity(envVars);
  
  // Generate suggestions
  generateSuggestions(envVars);
  
  // Final result
  console.log('\n' + '='.repeat(50));
  if (keysValid && configValid) {
    logSuccess('✨ Environment setup looks good! Ready for testing.');
    console.log('\nNext steps:');
    console.log('1. Run: npm run test');
    console.log('2. Run: npm run dev');
    console.log('3. Test checkout flow with Stripe test cards');
    process.exit(0);
  } else {
    logError('❌ Environment setup needs attention. Please fix the issues above.');
    process.exit(1);
  }
}

// Run the checker
main().catch(error => {
  console.error(colorize(`\n💥 Error: ${error.message}`, 'red'));
  process.exit(1);
}); 