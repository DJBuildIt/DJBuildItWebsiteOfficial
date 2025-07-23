# 🚀 STRIPE KV STORE IMPLEMENTATION GUIDE

## 📋 OVERVIEW

This guide implements the expert Stripe advice for avoiding "split brain" issues using a KV store approach. The solution creates a **single source of truth** for customer data and eliminates race conditions between Stripe and your database.

## 🎯 WHAT THIS SOLVES

**Before (Split Brain Issues):**
- ❌ Customer state scattered between Stripe and your DB
- ❌ Race conditions between webhooks and success pages
- ❌ Difficult to maintain data consistency
- ❌ Complex error handling across multiple systems

**After (KV Store Pattern):**
- ✅ Single `syncStripeDataToKV()` function for all data
- ✅ Customer created BEFORE checkout (no ephemeral customers)
- ✅ Consistent data sync after success and webhooks
- ✅ Redis/Upstash KV store as single source of truth

## 🏗️ ARCHITECTURE OVERVIEW

```
1. FRONTEND: Click "Buy Now" → Call generate-checkout endpoint
2. BACKEND: Create/get Stripe customer → Store in KV → Create session
3. USER: Complete payment → Redirect to /success
4. FRONTEND: Call success-sync endpoint → Sync customer data
5. WEBHOOK: Process events → Sync customer data
```

## 📦 REQUIRED DEPENDENCIES

Run this to install the new dependencies:

```bash
cd personal-web-da1
npm install @upstash/redis
```

## 🔧 ENVIRONMENT VARIABLES

Add these to your `.env.local` file:

```bash
# ============================================================================
# UPSTASH REDIS (KV STORE)
# ============================================================================
# Get these from: https://console.upstash.com/redis
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

# For client-side access (optional)
VITE_UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
VITE_UPSTASH_REDIS_REST_TOKEN=your_redis_token_here

# ============================================================================
# EXISTING STRIPE VARIABLES (keep these)
# ============================================================================
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
VITE_STRIPE_SUCCESS_URL=http://localhost:5173/success
VITE_STRIPE_CANCEL_URL=http://localhost:5173/store
```

## 🗄️ DATABASE SETUP

1. **Run the Stripe Customers Table Setup:**

```bash
# In your Supabase SQL editor, run:
cat stripe-customers-table.sql
```

This creates:
- `stripe_customers` table for KV mapping
- Helper functions for customer management
- Proper indexes and RLS policies

## 🔥 UPSTASH SETUP

1. **Create Upstash Account:**
   - Go to https://console.upstash.com/
   - Sign up/login
   - Create a new Redis database

2. **Get Connection Details:**
   - Copy the REST URL and Token
   - Add them to your `.env.local` file

3. **Test Connection:**
```bash
# Run this to test your Redis connection
curl -X POST your-redis-url \
  -H "Authorization: Bearer your-token" \
  -d '["SET", "test", "hello"]'
```

## 🛠️ IMPLEMENTATION STEPS

### Phase 1: Backend Infrastructure ✅

The following files have been created/updated:

1. **KV Store Service** (`src/lib/kv-store.ts`)
2. **Sync Service** (`src/lib/stripe-kv-sync.ts`)
3. **Generate Checkout Endpoint** (`api/stripe/generate-checkout.ts`)
4. **Success Sync Endpoint** (`api/stripe/success-sync.ts`)
5. **Updated Webhook** (`api/webhooks/stripe.ts`)
6. **Frontend Service** (`src/lib/stripe-kv-frontend.ts`)

### Phase 2: Frontend Integration

Update your components to use the new KV store pattern:

**Example: Update Cart Component**

```typescript
// Replace the old checkout with KV store checkout
import { stripeKV } from '@/lib/stripe-kv-frontend';

const handleCheckout = async () => {
  const customerEmail = 'customer@example.com'; // Get from form/user
  const customerName = 'John Doe'; // Optional
  
  const result = await stripeKV.completeCheckout({
    priceId: product.stripePriceId,
    quantity: 1,
    customerEmail,
    customerName,
    userId: stripeKV.generateUserId(customerEmail),
    metadata: {
      productName: product.name,
      cartId: 'cart_123'
    }
  });

  if (!result.success) {
    toast.error(result.error || 'Checkout failed');
  }
  // Success: user is redirected to Stripe
};
```

**Example: Update Success Page**

```typescript
// pages/Success.tsx
import { stripeKV } from '@/lib/stripe-kv-frontend';

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    const syncData = async () => {
      if (!sessionId) return;
      
      // Extract user info from your state/context
      const customerEmail = 'customer@example.com';
      const userId = stripeKV.generateUserId(customerEmail);
      
      const result = await stripeKV.syncAfterSuccess({
        userId,
        sessionId
      });
      
      if (result.success) {
        console.log('Customer data synced:', result.data?.customerData);
      } else {
        console.error('Sync failed:', result.error);
      }
    };
    
    syncData();
  }, [sessionId]);

  // ... rest of component
};
```

### Phase 3: Testing

1. **Test KV Store Connection:**
```bash
# Check KV store health
curl -X POST http://localhost:5173/api/health/kv
```

2. **Test Customer Creation:**
```bash
curl -X POST http://localhost:5173/api/stripe/generate-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_your_test_price_id",
    "quantity": 1,
    "customerEmail": "test@example.com",
    "customerName": "Test User"
  }'
```

3. **Test Success Sync:**
```bash
curl -X POST http://localhost:5173/api/stripe/success-sync \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test@example.com",
    "sessionId": "cs_test_session_id"
  }'
```

## 🎯 HOW IT WORKS

### The Magic: syncStripeDataToKV()

This **single function** is called:
1. After customer creation
2. On the success page
3. In webhook handlers
4. For any Stripe data sync needs

It fetches ALL customer data from Stripe and stores it in your KV store, eliminating split brain issues.

### Customer Creation Flow

```typescript
// OLD WAY (split brain prone):
stripe.checkout.sessions.create({
  // No customer specified - creates ephemeral customer
  line_items: [...]
});

// NEW WAY (bulletproof):
const customerId = await getOrCreateStripeCustomer(userId, email);
stripe.checkout.sessions.create({
  customer: customerId, // ALWAYS set customer
  line_items: [...]
});
```

### Success Page Flow

```typescript
// OLD WAY (race conditions):
const session = await stripe.checkout.sessions.retrieve(sessionId);
// Hope webhook hasn't processed yet...

// NEW WAY (always fresh):
await syncAfterSuccess(userId);
// Always gets latest data from Stripe
```

## 🔍 MONITORING & DEBUGGING

### Check KV Store Data

```bash
# View Redis data in Upstash console
# Or use Redis CLI:
redis-cli -u your-redis-url

# Check user mapping
GET stripe:user:customer@example.com

# Check customer data
GET stripe:customer:cus_stripe_customer_id
```

### Monitor Logs

Look for these log patterns:
- `🔵 [CUSTOMER] Creating new Stripe customer`
- `✅ [SYNC] Successfully synced customer data`
- `🔄 [WEBHOOK] Processing webhook sync`

## 🚨 COMMON ISSUES & SOLUTIONS

### 1. KV Store Not Configured
**Error:** `KV Store not configured - falling back to in-memory storage`
**Solution:** Add Upstash environment variables

### 2. Customer Creation Fails
**Error:** `Failed to create customer`
**Solution:** Check Stripe API keys and customer email validation

### 3. Sync Fails After Success
**Error:** `No Stripe customer found for user`
**Solution:** Ensure customer was created in checkout flow

### 4. Webhook Events Missing
**Error:** No sync happening on webhook
**Solution:** Check webhook endpoint registration and secrets

## 🎯 MIGRATION FROM OLD SYSTEM

1. **Keep Old Endpoints** for backward compatibility
2. **Gradually Switch** components to use KV store
3. **Monitor Both Systems** during transition
4. **Migrate Data** from old system to KV store

```typescript
// Migration script example
const migrateCustomerToKV = async (email: string) => {
  const customer = await stripe.customers.list({ email });
  if (customer.data.length > 0) {
    await syncStripeDataToKV(customer.data[0].id);
  }
};
```

## 📈 BENEFITS YOU'LL SEE

1. **No More Split Brain Issues** - Single source of truth
2. **Faster Success Pages** - No race conditions
3. **Reliable Webhooks** - Consistent data sync
4. **Better Analytics** - Complete customer view
5. **Easier Debugging** - All data in one place

## 🎉 YOU'RE DONE!

Your Stripe integration now follows the bulletproof KV store pattern. No more split brain issues, race conditions, or data inconsistencies!

### Next Steps:

1. Install Upstash Redis
2. Run the database migration
3. Update your frontend components
4. Test the new flow
5. Monitor and enjoy the stability!

BeepBoop 