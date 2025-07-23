# ⚡ Quick Environment Setup

## 🚀 **2-Minute Setup**

### **Step 1: Get Your API Keys**

#### **Stripe Test Keys** (Free & Safe)
1. Go to [Stripe Test Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Make sure **"Test mode"** toggle is ON (top-left)
3. Copy your keys:
   - **Publishable key**: `pk_test_...` 
   - **Secret key**: `sk_test_...`

#### **Printful API Key**
1. Go to [Printful API Settings](https://www.printful.com/dashboard/account/api)
2. Click **"Generate API access key"**
3. Copy the generated key
4. Note your **Store ID** (visible in dashboard)

### **Step 2: Create `.env.local` File**

Create a file called `.env.local` in your project root and paste this:

```bash
# 🧪 STRIPE TEST KEYS (safe for development)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# 🖨️ PRINTFUL API KEY
PRINTFUL_API_KEY=your_printful_api_key_here
PRINTFUL_STORE_ID=your_store_id_here

# 🚀 APP CONFIGURATION
VITE_APP_URL=http://localhost:5173
NODE_ENV=development
VITE_TEST_MODE=true
```

### **Step 3: Replace Placeholder Values**

Replace these placeholders with your actual keys:
- `pk_test_your_publishable_key_here` → Your Stripe publishable key
- `sk_test_your_secret_key_here` → Your Stripe secret key  
- `your_printful_api_key_here` → Your Printful API key
- `your_store_id_here` → Your Printful store ID

### **Step 4: Verify Setup**

```bash
# Check if your keys are configured correctly
npm run check-env

# If all good, start development
npm run dev
```

## 🔐 **Key Differences: Test vs Live**

| Environment | Stripe Keys | Printful Key | Behavior |
|-------------|-------------|--------------|----------|
| **Test** | `pk_test_...`, `sk_test_...` | Same API key | No real charges, no fulfillment |
| **Live** | `pk_live_...`, `sk_live_...` | Same API key | Real charges, real fulfillment |

## ⚠️ **Important Notes**

### **For Development (What You Want)**
- ✅ Use **Stripe test keys** (`pk_test_`, `sk_test_`)
- ✅ Set `VITE_TEST_MODE=true`
- ✅ Orders created as drafts (no fulfillment)
- ✅ No real money charged

### **For Production (Later)**
- 🚨 Use **Stripe live keys** (`pk_live_`, `sk_live_`)
- 🚨 Set `VITE_TEST_MODE=false`
- 🚨 Orders will be fulfilled
- 🚨 Real money will be charged

## 🧪 **Testing Strategy**

### **Printful Testing**
Printful doesn't have separate test/live environments:
- **Testing**: Create draft orders (don't confirm them)
- **Live**: Create draft orders, then confirm them for fulfillment
- **Same API Key**: Use the same key for both scenarios

### **Stripe Testing**
Stripe has separate test and live environments:
- **Test Cards**: Use `4242424242424242` (always succeeds)
- **Test Webhooks**: Use Stripe CLI for local testing
- **No Real Charges**: Test mode never charges real money

## 🛠️ **Webhook Setup (Optional for Basic Testing)**

For local webhook testing:
```bash
# Install Stripe CLI first, then:
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# Copy the webhook secret it provides
# Add it to your .env.local as STRIPE_WEBHOOK_SECRET
```

## 🆘 **Troubleshooting**

### **"Invalid API Key" Error**
- ✅ Check for typos in your `.env.local` file
- ✅ Make sure no extra spaces around the keys
- ✅ Verify test keys start with `pk_test_` and `sk_test_`

### **"Environment Variables Not Found"**
- ✅ File must be named exactly `.env.local`
- ✅ File must be in project root (same level as `package.json`)
- ✅ Restart your development server after creating the file

### **"Printful Store Not Found"**
- ✅ Double-check your `PRINTFUL_STORE_ID`
- ✅ Make sure your API key has access to the store
- ✅ Verify the store is active in your Printful dashboard

## 🎯 **Validation Commands**

```bash
# Check your environment setup
npm run check-env

# Run the testing suite
npm run test

# Start development server
npm run dev

# Test a complete checkout flow
npm run test:e2e
```

---

**🎉 That's it!** Your environment should now be ready for testing the Stripe + Printful integration. Start with small test orders and work your way up! 

Remember: **Test keys are completely safe** - use them liberally during development. No real money will ever be charged in test mode! 💡 