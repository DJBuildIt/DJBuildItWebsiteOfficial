# Testing Strategy for Stripe & Printful Integration

## 🎯 Overview

This document outlines the comprehensive testing strategy for your Stripe + Printful v2 API integration, covering unit tests, integration tests, E2E tests, and API-specific testing approaches.

## 📦 Installation

First, install the testing dependencies:

```bash
npm install --save-dev \
  vitest \
  @vitest/ui \
  @vitest/coverage-v8 \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  msw \
  jsdom \
  stripe-mock
```

## 🛠️ Testing Infrastructure

### 1. Vitest Configuration (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.*',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### 2. Test Environment Variables (.env.test)
```bash
# Stripe Test Environment
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_mock_key
STRIPE_SECRET_KEY=sk_test_mock_key
STRIPE_WEBHOOK_SECRET=whsec_test_mock

# Printful Test Environment  
PRINTFUL_API_KEY=mock_printful_key
PRINTFUL_STORE_ID=12345
PRINTFUL_WEBHOOK_SECRET=test_webhook_secret

# App Configuration
VITE_APP_URL=http://localhost:5173
NODE_ENV=test
```

## 🎨 Stripe Testing Strategy

### Test Card Numbers (from Stripe documentation)
```typescript
export const STRIPE_TEST_CARDS = {
  SUCCESS: '4242424242424242',
  DECLINED: '4000000000000002',
  INSUFFICIENT_FUNDS: '4000000000000995',
  REQUIRES_3DS: '4000002760003184',
  EXPIRED_CARD: '4000000000000069',
  INCORRECT_CVC: '4000000000000127',
}
```

### Key Stripe Test Scenarios

#### 1. Checkout Session Creation
```typescript
// Test: src/services/__tests__/stripe.test.ts
describe('Stripe Integration', () => {
  it('should create checkout session with Printful shipping rates', async () => {
    // Test the complete flow:
    // 1. Calculate Printful shipping rates
    // 2. Create Stripe checkout session  
    // 3. Verify session includes correct shipping options
  })

  it('should handle checkout session creation failures', async () => {
    // Test error handling when Stripe API fails
  })
})
```

#### 2. Webhook Processing
```typescript
describe('Stripe Webhooks', () => {
  it('should process checkout.session.completed webhook', async () => {
    // Test the complete order flow:
    // 1. Receive Stripe webhook
    // 2. Verify signature
    // 3. Create Printful draft order
    // 4. Confirm Printful order
  })

  it('should handle webhook signature verification failures', async () => {
    // Test security: invalid webhook signatures should be rejected
  })
})
```

### Stripe Testing Best Practices

1. **Use Stripe Test Environment**: Always use `pk_test_` and `sk_test_` keys
2. **Test Clock for Subscriptions**: Use Stripe Test Clocks for time-based testing
3. **Webhook Testing**: Use Stripe CLI for local webhook testing
4. **Mock vs Real API**: Use stripe-mock for unit tests, real test API for integration tests

## 🖨️ Printful v2 API Testing Strategy

### Printful Test Environment
```typescript
export const PRINTFUL_TEST_CONFIG = {
  BASE_URL: 'https://api.printful.com',
  SANDBOX_MODE: true, // Use sandbox when available
  TEST_PRODUCT_ID: 71, // Standard test product
  TEST_VARIANT_ID: 4011, // Standard test variant
}
```

### Key Printful Test Scenarios

#### 1. Shipping Rate Calculation
```typescript
describe('Printful v2 Shipping', () => {
  it('should calculate shipping rates for valid address', async () => {
    const shippingRates = await calculateShippingRatesV2({
      recipient: {
        country_code: 'US',
        state_code: 'CA',
        city: 'Los Angeles',
        zip: '90210'
      },
      items: [{ variant_id: 4011, quantity: 1 }]
    })
    
    expect(shippingRates).toHaveLength.greaterThan(0)
    expect(shippingRates[0]).toHaveProperty('rate')
    expect(shippingRates[0]).toHaveProperty('name')
  })

  it('should handle invalid addresses gracefully', async () => {
    // Test error handling for invalid shipping addresses
  })
})
```

#### 2. Order Creation & Confirmation
```typescript
describe('Printful v2 Orders', () => {
  it('should create draft order and confirm it', async () => {
    // Test complete order flow:
    // 1. Create draft order
    // 2. Wait for cost calculation  
    // 3. Confirm order
    // 4. Verify order status
  })

  it('should handle order creation failures', async () => {
    // Test error scenarios: invalid products, out of stock, etc.
  })
})
```

### Printful Testing Best Practices

1. **Use Test Products**: Stick to known test product/variant IDs
2. **Mock External Calls**: Use MSW to mock Printful API in unit tests
3. **Test Rate Limiting**: Verify your app handles API rate limits
4. **Webhook Simulation**: Test webhook handling with mock events

## 🔄 Integration Testing Strategy

### End-to-End Customer Journey
```typescript
describe('Complete E-commerce Flow', () => {
  it('should complete full purchase journey', async () => {
    // 1. Customer adds product to cart
    // 2. Proceeds to checkout
    // 3. Printful shipping rates calculated
    // 4. Stripe checkout session created
    // 5. Payment processed
    // 6. Webhook triggers Printful order
    // 7. Order confirmed in Printful
  })
})
```

### Critical Integration Points

1. **Shipping Rate Integration**
   - Test Printful shipping calculation before Stripe checkout
   - Verify rates are correctly passed to Stripe

2. **Order Synchronization**
   - Test Stripe payment → Printful order creation flow
   - Verify order data consistency between systems

3. **Error Handling**
   - Test partial failures (Stripe success, Printful failure)
   - Verify proper customer communication

## 🎭 Mock Service Workers (MSW) Setup

### Stripe API Mocks
```typescript
// src/test/mocks/stripe.ts
import { rest } from 'msw'

export const stripeHandlers = [
  rest.post('https://api.stripe.com/v1/checkout/sessions', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'cs_test_mock_session',
        url: 'https://checkout.stripe.com/pay/cs_test_mock_session',
        payment_status: 'unpaid',
      })
    )
  }),
]
```

### Printful API Mocks
```typescript
// src/test/mocks/printful.ts
import { rest } from 'msw'

export const printfulHandlers = [
  rest.post('https://api.printful.com/v2/shipping-rates', (req, res, ctx) => {
    return res(
      ctx.json({
        result: [{
          id: 'standard',
          name: 'Standard Shipping',
          rate: '5.99',
          currency: 'USD',
        }]
      })
    )
  }),
]
```

## 🚀 Playwright E2E Testing

### E2E Test Examples
```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test'

test('complete checkout flow', async ({ page }) => {
  await page.goto('/')
  
  // Add product to cart
  await page.click('[data-testid="add-to-cart"]')
  
  // Proceed to checkout
  await page.click('[data-testid="checkout-button"]')
  
  // Fill shipping information
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="shipping_address"]', '123 Test St')
  
  // Verify Stripe checkout loads
  await expect(page.locator('#stripe-checkout')).toBeVisible()
})
```

## 📊 Test Categories & Priority

### High Priority (Must Test)
1. ✅ Stripe checkout session creation
2. ✅ Printful shipping rate calculation
3. ✅ Webhook signature verification
4. ✅ Order creation in Printful after payment
5. ✅ Error handling for API failures

### Medium Priority (Should Test)
1. 🔄 Edge cases (invalid addresses, out of stock)
2. 🔄 Rate limiting scenarios
3. 🔄 Webhook retry logic
4. 🔄 Currency conversion
5. 🔄 Mobile checkout flow

### Low Priority (Nice to Have)
1. 📋 Performance testing
2. 📋 Load testing with concurrent orders
3. 📋 Accessibility testing
4. 📋 Cross-browser compatibility

## 🏃‍♂️ Running Tests

### Development Workflow
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:stripe
npm run test:printful
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### CI/CD Pipeline Testing
```bash
# Production-like testing
npm run test:run
npm run test:e2e
npm run test:coverage
```

## 🔍 Monitoring & Debugging

### Test Debugging Tools
1. **Vitest UI**: `npm run test:ui` for interactive testing
2. **Playwright Trace**: Captures detailed E2E test traces
3. **Coverage Reports**: Track test coverage metrics
4. **MSW DevTools**: Debug mock API responses

### Production Testing Checklist
- [ ] All critical paths have >90% test coverage
- [ ] E2E tests pass on all target browsers
- [ ] Webhook handling tested with real Stripe CLI
- [ ] Printful v2 API integration verified in staging
- [ ] Error scenarios properly handled and tested
- [ ] Performance benchmarks met

## 🚨 Emergency Testing Protocol

When issues arise in production:

1. **Immediate**: Run full test suite to verify current state
2. **Investigate**: Check webhook logs and API response logs  
3. **Isolate**: Create minimal reproduction test case
4. **Fix**: Implement fix with corresponding test
5. **Verify**: Run full test suite before deployment

## 📚 Resources

- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Printful API Documentation](https://developers.printful.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Testing](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

---

Remember: **Test early, test often, test realistically!** 🧪✨ 