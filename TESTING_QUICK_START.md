# 🚀 Quick Start: Testing Stripe & Printful Integration

## ⚡ Get Started in 5 Minutes

### 1. Install Testing Infrastructure
```bash
# Make script executable and run setup
chmod +x scripts/setup-testing.sh
./scripts/setup-testing.sh
```

### 2. Start Testing
```bash
# Run all tests
npm run test

# Interactive testing UI
npm run test:ui

# End-to-end tests
npm run test:e2e
```

## 🎯 Key Test Scenarios to Implement

### ✅ Critical Tests (Implement First)

#### Stripe Integration
```typescript
// Test checkout session creation with Printful rates
it('creates checkout session with shipping rates', async () => {
  const session = await createCheckoutSession({
    items: [{ variant_id: 4011, quantity: 1 }],
    shipping: { country: 'US', zip: '90210' }
  })
  
  expect(session.shipping_options).toBeDefined()
  expect(session.url).toContain('checkout.stripe.com')
})
```

#### Printful v2 API
```typescript
// Test shipping rate calculation
it('calculates v2 shipping rates', async () => {
  const rates = await calculateShippingRatesV2({
    recipient: { country_code: 'US', zip: '90210' },
    items: [{ variant_id: 4011, quantity: 1 }]
  })
  
  expect(rates).toHaveLength.greaterThan(0)
  expect(rates[0]).toHaveProperty('rate')
})
```

#### Integration Flow
```typescript
// Test complete order flow
it('processes complete order flow', async () => {
  // 1. Create Stripe checkout with Printful shipping
  // 2. Simulate successful payment webhook
  // 3. Verify Printful order creation
  // 4. Confirm order in Printful
})
```

## 🧪 Testing Strategies by API

### Stripe Testing
- **Use Test Cards**: `4242424242424242` (success), `4000000000000002` (declined)
- **Test Environment**: Always use `pk_test_` and `sk_test_` keys
- **Webhook Testing**: Use Stripe CLI: `stripe listen --forward-to localhost:5173/api/webhooks/stripe`
- **Mock vs Real**: MSW for unit tests, real Stripe test API for integration

### Printful v2 Testing
- **Test Products**: Use variant ID `4011` for reliable testing
- **Rate Calculation**: Test with various country/zip combinations
- **Order Flow**: Test draft creation → confirmation workflow
- **Error Handling**: Test invalid products, out-of-stock scenarios

## 🎭 Mock Services Setup

The setup script creates MSW mocks for both APIs:

```typescript
// Stripe mocks respond with checkout sessions
// Printful mocks respond with shipping rates & orders
```

## 📊 Test Commands Reference

```bash
# Unit Tests
npm run test                    # All tests
npm run test:stripe             # Stripe-specific tests
npm run test:printful           # Printful-specific tests
npm run test:integration        # Integration tests

# Coverage & Debugging
npm run test:coverage           # Coverage report
npm run test:ui                 # Interactive testing

# E2E Tests
npm run test:e2e               # All E2E tests
npm run test:e2e:headed        # E2E with browser UI
```

## 🔍 Manual Testing Checklist

### Stripe (Use Test Mode)
- [ ] Checkout session creation works
- [ ] Shipping options display correctly
- [ ] Payment with test card succeeds
- [ ] Webhook signature verification works
- [ ] Failed payments handled gracefully

### Printful v2 API
- [ ] Shipping rates calculate correctly
- [ ] Order creation in draft mode works
- [ ] Order confirmation succeeds
- [ ] Error responses handled properly
- [ ] Rate limiting respected

### Integration
- [ ] Complete purchase flow end-to-end
- [ ] Order data consistent between systems
- [ ] Webhook → Printful order automation works
- [ ] Error scenarios don't break checkout

## 🚨 Common Issues & Solutions

### Issue: Tests fail with "Module not found"
**Solution**: Run `npm install` after setup script

### Issue: Stripe webhook tests fail
**Solution**: Verify `STRIPE_WEBHOOK_SECRET` in test environment

### Issue: Printful API tests timeout
**Solution**: Check network connectivity or use mocks for unit tests

### Issue: E2E tests fail to start server
**Solution**: Ensure development server isn't already running

## 📚 Next Steps

1. **Run the setup script** to install everything
2. **Implement critical test scenarios** listed above
3. **Set up CI/CD testing** in your deployment pipeline
4. **Read TESTING_STRATEGY.md** for comprehensive details
5. **Add more test scenarios** as you develop new features

## 🎯 Success Metrics

- ✅ >90% test coverage on critical payment flows
- ✅ All E2E tests pass on major browsers
- ✅ Integration tests verify Stripe ↔ Printful data flow
- ✅ Error scenarios properly tested and handled
- ✅ Webhook processing tested with real Stripe CLI

---

**Quick tip**: Start with the critical tests first, then expand coverage as needed. Focus on testing the integration points between Stripe and Printful v2 API! 🎯 