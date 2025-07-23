#!/bin/bash

echo "🧪 Setting up testing infrastructure for Stripe & Printful integration..."

# Install testing dependencies
echo "📦 Installing testing dependencies..."
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

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
npx playwright install

# Create test directory structure
echo "📁 Creating test directory structure..."
mkdir -p src/test/mocks
mkdir -p src/test/fixtures
mkdir -p tests/e2e
mkdir -p tests/integration

# Create basic test files if they don't exist
if [ ! -f "src/test/setup.ts" ]; then
cat > src/test/setup.ts << 'EOF'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { setupServer } from 'msw/node'
import { stripeHandlers } from './mocks/stripe'
import { printfulHandlers } from './mocks/printful'

// Setup MSW server for API mocking
export const server = setupServer(...stripeHandlers, ...printfulHandlers)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

// Mock environment variables for testing
process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key'
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key'
process.env.PRINTFUL_API_KEY = 'mock_printful_key'
process.env.PRINTFUL_STORE_ID = '12345'
process.env.VITE_APP_URL = 'http://localhost:5173'
EOF
fi

if [ ! -f "src/test/mocks/stripe.ts" ]; then
cat > src/test/mocks/stripe.ts << 'EOF'
import { http, HttpResponse } from 'msw'

export const stripeHandlers = [
  http.post('https://api.stripe.com/v1/checkout/sessions', () => {
    return HttpResponse.json({
      id: 'cs_test_mock_session',
      url: 'https://checkout.stripe.com/pay/cs_test_mock_session',
      payment_status: 'unpaid',
      shipping_options: [
        {
          shipping_rate: 'shr_standard',
          shipping_amount: 599,
        }
      ]
    })
  }),

  http.post('https://api.stripe.com/v1/webhooks', () => {
    return HttpResponse.json({
      id: 'evt_test_webhook',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_completed',
          payment_status: 'paid',
          shipping_details: {
            address: {
              city: 'Los Angeles',
              country: 'US',
              state: 'CA',
              postal_code: '90210',
            }
          }
        }
      }
    })
  }),
]
EOF
fi

if [ ! -f "src/test/mocks/printful.ts" ]; then
cat > src/test/mocks/printful.ts << 'EOF'
import { http, HttpResponse } from 'msw'

export const printfulHandlers = [
  http.post('https://api.printful.com/v2/shipping-rates', () => {
    return HttpResponse.json({
      result: [
        {
          id: 'standard',
          name: 'Standard Shipping',
          rate: '5.99',
          currency: 'USD',
          min_delivery_days: 3,
          max_delivery_days: 7,
        },
        {
          id: 'express',
          name: 'Express Shipping', 
          rate: '12.99',
          currency: 'USD',
          min_delivery_days: 1,
          max_delivery_days: 3,
        }
      ]
    })
  }),

  http.post('https://api.printful.com/v2/orders', () => {
    return HttpResponse.json({
      result: {
        id: 'order_123',
        status: 'draft',
        external_id: 'stripe_cs_test',
        costs: {
          currency: 'USD',
          subtotal: '15.00',
          shipping: '5.99',
          total: '20.99'
        }
      }
    })
  }),

  http.post('https://api.printful.com/v2/orders/:id/confirmation', () => {
    return HttpResponse.json({
      result: {
        id: 'order_123',
        status: 'confirmed',
        external_id: 'stripe_cs_test'
      }
    })
  }),
]
EOF
fi

# Update vitest config to use correct import
if [ ! -f "vitest.config.ts" ]; then
cat > vitest.config.ts << 'EOF'
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
EOF
fi

# Create example test files
if [ ! -f "src/services/__tests__/printful.test.ts" ]; then
cat > src/services/__tests__/printful.test.ts << 'EOF'
import { describe, it, expect, vi } from 'vitest'
import { calculateShippingRatesV2, createPrintfulDraftOrder } from '../printful'

describe('Printful v2 API Integration', () => {
  it('should calculate shipping rates successfully', async () => {
    const mockShippingData = {
      recipient: {
        country_code: 'US',
        state_code: 'CA', 
        city: 'Los Angeles',
        zip: '90210'
      },
      items: [
        {
          variant_id: 4011,
          quantity: 1
        }
      ]
    }

    const rates = await calculateShippingRatesV2(mockShippingData)
    
    expect(rates).toBeDefined()
    expect(Array.isArray(rates)).toBe(true)
    expect(rates.length).toBeGreaterThan(0)
    expect(rates[0]).toHaveProperty('id')
    expect(rates[0]).toHaveProperty('name')
    expect(rates[0]).toHaveProperty('rate')
  })

  it('should create draft order successfully', async () => {
    const mockOrderData = {
      external_id: 'test_order_123',
      recipient: {
        name: 'John Doe',
        address1: '123 Test St',
        city: 'Los Angeles',
        state_code: 'CA',
        country_code: 'US',
        zip: '90210',
        email: 'test@example.com'
      },
      items: [
        {
          variant_id: 4011,
          quantity: 1,
          files: []
        }
      ]
    }

    const order = await createPrintfulDraftOrder(mockOrderData)
    
    expect(order).toBeDefined()
    expect(order).toHaveProperty('id')
    expect(order).toHaveProperty('status', 'draft')
  })
})
EOF
fi

if [ ! -f "tests/e2e/checkout.spec.ts" ]; then
cat > tests/e2e/checkout.spec.ts << 'EOF'
import { test, expect } from '@playwright/test'

test.describe('E-commerce Checkout Flow', () => {
  test('should complete basic checkout process', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
    
    // Check if page loads correctly
    await expect(page).toHaveTitle(/DJBUILDIT/)
    
    // Test navigation to store/shop section
    // Note: Adjust selectors based on your actual implementation
    const storeLink = page.locator('a[href*="store"], a[href*="shop"]').first()
    if (await storeLink.isVisible()) {
      await storeLink.click()
      
      // Verify we're on the store page
      await expect(page.url()).toContain('store')
    }
  })

  test('should handle invalid checkout scenarios', async ({ page }) => {
    await page.goto('/store')
    
    // Test error handling
    // This test will need to be customized based on your store implementation
  })
})
EOF
fi

# Create .env.test file
if [ ! -f ".env.test" ]; then
cat > .env.test << 'EOF'
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
EOF
fi

echo "✅ Testing infrastructure setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run test' to run unit tests"
echo "2. Run 'npm run test:ui' for interactive testing"
echo "3. Run 'npm run test:e2e' for end-to-end tests"
echo "4. Check TESTING_STRATEGY.md for detailed testing guidance"
echo ""
echo "🚀 Happy testing!" 