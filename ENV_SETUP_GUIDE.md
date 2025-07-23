# 🔑 Environment Variables Setup Guide - Enhanced for Webhooks

## 🎯 Phase 1: Pre-Setup Requirements ✅

### 1. **Get Your Test Keys**

#### Stripe Test Keys (FREE - No charges)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure you're in **Test Mode** (toggle in top left)
3. Copy these keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

#### Printful API Key (Works for Both Test & Live)
1. Go to [Printful Dashboard](https://www.printful.com/dashboard/account/api) 
2. Generate API access key
3. Note: Printful uses the same API key for testing and live orders
4. Testing is controlled by whether you **confirm** the order or leave it as draft

### 2. **Create Your `.env.local` File - ENHANCED FOR WEBHOOKS**

Create a file called `.env.local` in your project root with these variables:

```bash
# 🧪 STRIPE TEST KEYS (for development)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret

# 🖨️ PRINTFUL API KEY (same for test and live)
PRINTFUL_API_KEY=your_printful_api_key
PRINTFUL_STORE_ID=your_store_id_here
PRINTFUL_WEBHOOK_SECRET=your_printful_webhook_secret_hex_key

# 🚀 APP CONFIGURATION
VITE_APP_URL=http://localhost:5173
NODE_ENV=development
VITE_TEST_MODE=true

# 🛡️ SECURITY CONFIGURATION
CSRF_SECRET=your_32_character_random_string_here

# 📧 EMAIL CONFIGURATION (Optional - for EmailJS)
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key

# 🧪 TESTING CONFIGURATION
TEST_SKIP_PAYMENT=false
TEST_SKIP_PRINTFUL_ORDER=false
TEST_USE_MOCK_DATA=false
```

## 📋 **Detailed Configuration**

### **Environment Files Priority**
1. `.env.local` - Your personal keys (never commit this!)
2. `.env.development` - Development defaults
3. `.env.production` - Production defaults  
4. `.env` - Global defaults

### **Test vs Live Mode Setup**

#### 🧪 **Development/Testing Mode**
```bash
# .env.local (your personal file)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...
STRIPE_SECRET_KEY=sk_test_51234567890abcdef...
STRIPE_WEBHOOK_SECRET=whsec_test_1234567890abcdef...
PRINTFUL_API_KEY=your_printful_api_key
PRINTFUL_STORE_ID=12345
PRINTFUL_WEBHOOK_SECRET=your_hex_secret_from_webhook_setup
VITE_APP_URL=http://localhost:5173
NODE_ENV=development
VITE_TEST_MODE=true
```

#### 🚀 **Production Mode**
```bash
# .env.production (for deployment)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51234567890abcdef...
STRIPE_SECRET_KEY=sk_live_51234567890abcdef...
STRIPE_WEBHOOK_SECRET=whsec_live_1234567890abcdef...
PRINTFUL_API_KEY=your_printful_api_key
PRINTFUL_STORE_ID=12345
PRINTFUL_WEBHOOK_SECRET=your_hex_secret_from_webhook_setup
VITE_APP_URL=https://yourdomain.com
NODE_ENV=production
VITE_TEST_MODE=false
```

## 🔐 **How to Get Each Key**

### **Stripe Keys**

#### Test Keys (Safe for Development)
1. **Dashboard**: [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)
2. **Publishable Key**: Starts with `pk_test_` - Safe to expose in frontend
3. **Secret Key**: Starts with `sk_test_` - Keep secret, server-side only
4. **Webhook Secret**: Get from webhook endpoint configuration

#### Live Keys (Production Only)
1. **Dashboard**: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. **Publishable Key**: Starts with `pk_live_`
3. **Secret Key**: Starts with `sk_live_`
4. **Webhook Secret**: From live webhook endpoint

### **Printful API Key**
1. **Dashboard**: [https://www.printful.com/dashboard/account/api](https://www.printful.com/dashboard/account/api)
2. **Generate API Key**: Click "Generate API access key"
3. **Store ID**: Found in store settings or API responses
4. **Same Key**: Use same key for testing and production

### **🎯 NEW: Printful Webhook Secret (CRITICAL)**
The `PRINTFUL_WEBHOOK_SECRET` is generated when you run the webhook setup:
1. Run `node setup-printful-webhooks.js`
2. Copy the hex secret key from the output
3. Add it to your `.env.local` file
4. **Format**: Long hexadecimal string (e.g., `a1b2c3d4e5f6...`)

### **Printful Testing Strategy**
Unlike Stripe, Printful doesn't have separate test/live environments:
- **Testing**: Create draft orders, don't confirm them
- **Live**: Create draft orders, then confirm them for fulfillment
- **API Key**: Same key used for both scenarios

## 🧪 **Testing Configuration**

### **Test Mode Controls**
```bash
# Enable test mode (prevents actual fulfillment)
VITE_TEST_MODE=true

# Optional: Fine-grained testing controls
TEST_SKIP_PAYMENT=false        # Skip Stripe payment processing
TEST_SKIP_PRINTFUL_ORDER=false # Skip Printful order creation
TEST_USE_MOCK_DATA=false       # Use mock responses instead of real API calls
```

### **🎯 Webhook Configuration - ENHANCED**

#### For Local Testing (Stripe)
```bash
# Use Stripe CLI for local webhook testing
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# The webhook secret will be provided by Stripe CLI
STRIPE_WEBHOOK_SECRET=whsec_local_testing_secret
```

#### For Local Testing (Printful)
```bash
# Printful webhooks require HTTPS - use ngrok for local testing
ngrok http 5173

# Then update your VITE_APP_URL to the ngrok URL:
VITE_APP_URL=https://your-ngrok-id.ngrok.io

# Run the webhook setup to register the ngrok URL
node setup-printful-webhooks.js
```

#### For Production
```bash
# Set up webhook endpoints in Stripe Dashboard
# Add your domain: https://yourdomain.com/api/webhooks/stripe
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Set up Printful webhooks (done automatically by setup script)
# Webhook URL: https://yourdomain.com/api/webhooks/printful
PRINTFUL_WEBHOOK_SECRET=your_hex_secret_from_setup
```

## 🚨 **Security Best Practices**

### **What to Keep Secret**
- ❌ **Never commit to Git**: `.env.local`, `.env.production`
- ❌ **Server-side only**: `STRIPE_SECRET_KEY`, `PRINTFUL_API_KEY`, `PRINTFUL_WEBHOOK_SECRET`
- ✅ **Safe for frontend**: `VITE_*` prefixed variables

### **Git Configuration**
Add to your `.gitignore`:
```
.env.local
.env.production
.env.*.local
```

### **Environment Variable Validation**
```typescript
// src/lib/env-validation.ts
const requiredEnvVars = [
  'VITE_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY', 
  'PRINTFUL_API_KEY',
  'PRINTFUL_STORE_ID',
  'PRINTFUL_WEBHOOK_SECRET' // NEW: Required for webhook verification
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

## 🔄 **Switching Between Test and Live**

### **Development → Production Checklist**
- [ ] Replace `pk_test_` with `pk_live_` keys
- [ ] Replace `sk_test_` with `sk_live_` keys  
- [ ] Update webhook endpoints to production URLs
- [ ] Run webhook setup script for production domain
- [ ] Update `PRINTFUL_WEBHOOK_SECRET` with production secret
- [ ] Set `VITE_TEST_MODE=false`
- [ ] Test with small orders first
- [ ] Monitor webhook delivery and order fulfillment

### **Quick Environment Switcher**
```bash
# Switch to test mode
cp .env.test .env.local

# Switch to live mode  
cp .env.live .env.local
```

## 🛠️ **Testing Your Setup**

### **Verify Environment Loading**
```bash
# Check if environment variables are loaded
npm run check-config
```

### **Test API Connections**
```bash
# Test Stripe connection
curl -H "Authorization: Bearer $STRIPE_SECRET_KEY" https://api.stripe.com/v1/balance

# Test Printful connection  
curl -H "Authorization: Bearer $PRINTFUL_API_KEY" https://api.printful.com/stores
```

### **🎯 NEW: Test Webhook Setup**
```bash
# Verify Printful webhook configuration
curl -X GET "https://api.printful.com/v2/webhooks" \
  -H "Authorization: Bearer $PRINTFUL_API_KEY"

# Test webhook endpoint locally (requires ngrok for Printful)
curl -X POST "http://localhost:5173/api/webhooks/printful" \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

## 🎯 **Phase 1 Completion Checklist**
- [ ] ✅ Environment Variables configured (.env.local created)
- [ ] ✅ SSL/HTTPS Endpoint verified (production URL or ngrok for local)
- [ ] ✅ Webhook Handler implemented (api/webhooks/printful.ts)
- [ ] ✅ All required secrets obtained and configured
- [ ] ✅ Git ignore rules in place for security
- [ ] ✅ Environment validation implemented

## 🚀 **Quick Start Commands**

```bash
# 1. Copy environment template
cp ENV_SETUP_GUIDE.md .env.local

# 2. Edit with your keys
nano .env.local

# 3. Test the setup
npm run test:env

# 4. Start development
npm run dev
```

Remember: **Test keys are free and safe** - use them liberally during development! 🎉 