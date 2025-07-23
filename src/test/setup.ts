import { beforeAll, afterEach, afterAll, vi } from 'vitest'
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
// Note: These are test-specific mock values, not your real keys
Object.defineProperty(process.env, 'VITE_STRIPE_PUBLISHABLE_KEY', {
  value: 'pk_test_mock_key_for_testing',
  writable: true
})

Object.defineProperty(process.env, 'STRIPE_SECRET_KEY', {
  value: 'sk_test_mock_key_for_testing',
  writable: true
})

Object.defineProperty(process.env, 'PRINTFUL_API_KEY', {
  value: 'mock_printful_key_for_testing',
  writable: true
})

Object.defineProperty(process.env, 'PRINTFUL_STORE_ID', {
  value: '12345',
  writable: true
})

Object.defineProperty(process.env, 'VITE_APP_URL', {
  value: 'http://localhost:5173',
  writable: true
})

Object.defineProperty(process.env, 'VITE_TEST_MODE', {
  value: 'true',
  writable: true
})

// Mock Stripe globally using Vitest vi instead of jest
Object.defineProperty(window, 'Stripe', {
  value: vi.fn(() => ({
    elements: vi.fn(() => ({
      create: vi.fn(() => ({
        mount: vi.fn(),
        destroy: vi.fn(),
        on: vi.fn(),
        update: vi.fn(),
      })),
      getElement: vi.fn(),
    })),
    createToken: vi.fn(),
    createSource: vi.fn(),
    confirmCardPayment: vi.fn(),
    confirmCardSetup: vi.fn(),
    paymentRequest: vi.fn(),
    redirectToCheckout: vi.fn(),
  })),
  configurable: true,
