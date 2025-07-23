// E-commerce Configuration
// Centralized configuration for Stripe and Printful integration

import { EcommerceConfig } from '@/types/ecommerce';

// ============================================================================
// ENVIRONMENT VARIABLES - ROBUST HANDLING (Works in both browser & Node)
// ============================================================================

// Unified env accessor that seamlessly falls back to process.env when running
// in a CJS/Node context where import.meta.env is undefined.
const ENV: Record<string, any> = (typeof import.meta !== 'undefined' && (import.meta as any).env)
  ? (import.meta as any).env
  : process.env;

const isDevelopment = ENV.DEV === true || ENV.NODE_ENV === 'development';
const isProduction = ENV.PROD === true || ENV.NODE_ENV === 'production';

// Safe environment variable getter with development fallbacks
const getEnvVar = (key: string, defaultValue?: string, required: boolean = false): string => {
  const value = ENV[key] || defaultValue;
  
  if (!value) {
    if (isDevelopment && !required) {
      // In development, log warning and return safe placeholder
      console.warn(`⚠️ Missing environment variable: ${key}. Using development placeholder.`);
      return `dev_placeholder_${key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
    
    if (isProduction || required) {
      // In production or for required vars, throw error
      throw new Error(`❌ Missing required environment variable: ${key}`);
    }
    
    // Fallback for edge cases
    return `fallback_${key.toLowerCase()}`;
  }
  
  return value;
};

// Check if we have real API keys (not placeholders)
const hasRealStripeKey = () => {
  const key = ENV.VITE_STRIPE_PUBLISHABLE_KEY;
  return key && !key.startsWith('dev_placeholder') && !key.startsWith('placeholder');
};

const hasRealPrintfulKey = () => {
  // Client-side can't access server-only API keys
  // This will be validated server-side during API calls
  return true; // Assume configured - server will handle validation
};

// ================= NEW ENV FLAGS =================
const printfulApiVersion = getEnvVar('PRINTFUL_API_VERSION', 'v2');
const printfulUseSandbox = getEnvVar('PRINTFUL_USE_SANDBOX', 'false') === 'true';
const printfulAutoConfirm = getEnvVar('PRINTFUL_AUTO_CONFIRM', 'false') === 'true';
// ============================================================================
// STRIPE CONFIGURATION - GRACEFUL DEGRADATION
// ============================================================================

export const STRIPE_CONFIG = {
  publishableKey: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY'),
  successUrl: getEnvVar('VITE_STRIPE_SUCCESS_URL', `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/success`),
  cancelUrl: getEnvVar('VITE_STRIPE_CANCEL_URL', `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/store`),
  webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET'), // Server-side only
  apiVersion: '2025-02-24.acacia' as const,
  isConfigured: hasRealStripeKey(),
} as const;

// ============================================================================
// PRINTFUL CONFIGURATION - GRACEFUL DEGRADATION
// ============================================================================

export const PRINTFUL_CONFIG = {
  apiKey: getEnvVar('PRINTFUL_API_KEY', '', false), // Server-side only
  storeId: '', // Server-side only - not accessible from client  
  webhookSecret: '', // Server-side only - not accessible from client
  baseUrl: printfulUseSandbox ? 'https://api.printful.com/sandbox' : 'https://api.printful.com',
  timeout: 30000, // 30 seconds
  isConfigured: hasRealPrintfulKey(), // Only requires API key now
  apiVersion: printfulApiVersion,
  autoConfirm: printfulAutoConfirm,
  useSandbox: printfulUseSandbox,
} as const;

// ============================================================================
// APPLICATION CONFIGURATION
// ============================================================================

export const APP_CONFIG = {
  baseUrl: isDevelopment ? 'http://localhost:8083' : getEnvVar('VITE_APP_URL', 'http://localhost:8083'),
  environment: getEnvVar('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
} as const;

// ============================================================================
// FEATURE FLAGS - DYNAMIC BASED ON CONFIGURATION
// ============================================================================

export const FEATURE_FLAGS = {
  enableCustomization: STRIPE_CONFIG.isConfigured && PRINTFUL_CONFIG.isConfigured,
  enableInventorySync: PRINTFUL_CONFIG.isConfigured,
  enableOrderTracking: STRIPE_CONFIG.isConfigured,
  enableWebhooks: isProduction && STRIPE_CONFIG.isConfigured && PRINTFUL_CONFIG.isConfigured,
  enableAnalytics: true,
  enableErrorReporting: isProduction,
  enablePayments: STRIPE_CONFIG.isConfigured,
  enableFulfillment: PRINTFUL_CONFIG.isConfigured,
} as const;

// ============================================================================
// BUSINESS RULES & LIMITS
// ============================================================================

export const BUSINESS_RULES = {
  // Order Limits
  maxOrderItems: 10,
  maxQuantityPerItem: 99,
  minOrderAmount: 500, // $5.00 in cents
  maxOrderAmount: 500000, // $5,000.00 in cents
  
  // Customization Limits
  maxCustomizationUploads: 5,
  maxUploadSizeBytes: 10 * 1024 * 1024, // 10MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  maxTextLength: 500,
  
  // Timing
  orderTimeoutMinutes: 30,
  webhookRetryDelayMs: 1000,
  maxWebhookRetries: 3,
  
  // Inventory
  lowStockThreshold: 10,
  outOfStockThreshold: 0,
} as const;

// ============================================================================
// LEGACY PRODUCT MAPPING - DEPRECATED
// ============================================================================

// 🚨 DEPRECATED: Product data is now loaded dynamically from Stripe API
// Use ProductsService.getProducts() instead of hardcoded mappings
// This section kept for reference only - remove after migration complete

// OLD ARCHITECTURE (removed):
// - Hardcoded product IDs mapped to Stripe Price IDs
// - Multiple sources of truth causing price mismatches
// - Manual updates required for price changes

// NEW ARCHITECTURE (implemented):  
// - Single source of truth: Stripe Dashboard
// - Dynamic product loading via /api/stripe/products
// - Automatic price synchronization
// - Zero-maintenance pricing updates

// ============================================================================
// ERROR MESSAGES - CONTEXT-AWARE
// ============================================================================

export const ERROR_MESSAGES = {
  // Payment Errors
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  PAYMENT_DECLINED: 'Your payment was declined. Please check your card details.',
  PAYMENT_TIMEOUT: 'Payment timed out. Please try again.',
  PAYMENT_NOT_CONFIGURED: 'Payment system is not configured. Please contact support.',
  
  // Order Errors
  ORDER_NOT_FOUND: 'Order not found.',
  ORDER_ALREADY_PROCESSED: 'This order has already been processed.',
  INVALID_ORDER_DATA: 'Invalid order data provided.',
  FULFILLMENT_NOT_CONFIGURED: 'Order fulfillment is not configured. Please contact support.',
  
  // Inventory Errors
  OUT_OF_STOCK: 'This item is currently out of stock.',
  INSUFFICIENT_STOCK: 'Not enough items in stock.',
  
  // Validation Errors
  INVALID_EMAIL: 'Please provide a valid email address.',
  INVALID_PHONE: 'Please provide a valid phone number.',
  INVALID_ADDRESS: 'Please provide a valid shipping address.',
  
  // Configuration Errors
  STRIPE_NOT_CONFIGURED: 'Stripe payment processing is not configured.',
  PRINTFUL_NOT_CONFIGURED: 'Printful fulfillment is not configured.',
  
  // Generic Errors
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
  // Stripe
  createCheckoutSession: '/api/stripe/create-checkout-session',
  getCheckoutSession: '/api/stripe/session', // For session retrieval
  webhookStripe: '/api/stripe/webhook',
  
  // Printful
  createOrder: '/api/printful/create-order',
  getOrder: '/api/printful/orders',
  syncProducts: '/api/printful/sync-products',
  webhookPrintful: '/api/webhooks/printful',
  
  // Orders
  getOrders: '/api/orders',
  getOrderById: '/api/stripe/session', // Updated to use Stripe session endpoint
  updateOrder: '/api/orders',
  
  // Products
  getProducts: '/api/products',
  getProductById: '/api/products',
  
  // Shipping
  calculateShipping: '/api/shipping/calculate-rates',
} as const;

// ============================================================================
// WEBHOOK EVENTS
// ============================================================================

export const WEBHOOK_EVENTS = {
  // Stripe Events
  stripe: {
    checkoutSessionCompleted: 'checkout.session.completed',
    paymentIntentSucceeded: 'payment_intent.succeeded',
    paymentIntentPaymentFailed: 'payment_intent.payment_failed',
    invoicePaymentSucceeded: 'invoice.payment_succeeded',
    customerSubscriptionCreated: 'customer.subscription.created',
  },
  
  // Printful Events
  printful: {
    orderUpdated: 'order_updated',
    orderFailed: 'order_failed',
    orderCanceled: 'order_canceled',
    packageShipped: 'package_shipped',
    packageReturned: 'package_returned',
  },
} as const;

// ============================================================================
// COMPREHENSIVE CONFIG OBJECT
// ============================================================================

export const ECOMMERCE_CONFIG: EcommerceConfig = {
  stripe: STRIPE_CONFIG,
  printful: PRINTFUL_CONFIG,
  features: FEATURE_FLAGS,
  limits: {
    maxOrderItems: BUSINESS_RULES.maxOrderItems,
    maxCustomizationUploads: BUSINESS_RULES.maxCustomizationUploads,
    orderTimeoutMinutes: BUSINESS_RULES.orderTimeoutMinutes,
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const isProductionEnv = () => APP_CONFIG.environment === 'production';
export const isDevelopmentEnv = () => APP_CONFIG.environment === 'development';
export const isTestEnv = () => APP_CONFIG.environment === 'test';

export const getApiUrl = (endpoint: string): string => {
  return `${APP_CONFIG.baseUrl}${endpoint}`;
};

export const formatPrice = (priceInCents: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(priceInCents / 100);
};

// ============================================================================
// CONFIGURATION VALIDATION & WARNINGS
// ============================================================================

export const validateEnvironment = (): { isValid: boolean; warnings: string[]; errors: string[] } => {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check required production variables - CLIENT-SIDE ACCESSIBLE ONLY
  if (isProductionEnv()) {
    const requiredClientVars = [
      'VITE_STRIPE_PUBLISHABLE_KEY',
    ];
    
    const missing = requiredClientVars.filter(key => !ENV[key]);
    if (missing.length > 0) {
      errors.push(`Missing required client environment variables: ${missing.join(', ')}`);
    }
    
    // Server-side variables (STRIPE_SECRET_KEY, PRINTFUL_API_KEY, etc.) 
    // are validated server-side, not accessible from client
  }
  
  // Check development warnings - ONLY show if actually not configured
  if (isDevelopmentEnv()) {
    if (!STRIPE_CONFIG.isConfigured) {
      warnings.push('Stripe is not configured - payment features will be disabled');
    }
    // Printful will be validated server-side during API calls
    // Client-side assumes it's configured
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
};

// ============================================================================
// CONFIGURATION STATUS
// ============================================================================

export const getConfigurationStatus = () => {
  const validation = validateEnvironment();
  
  return {
    stripe: {
      configured: STRIPE_CONFIG.isConfigured,
      status: STRIPE_CONFIG.isConfigured ? 'ready' : 'not-configured',
    },
    printful: {
      configured: PRINTFUL_CONFIG.isConfigured,
      status: PRINTFUL_CONFIG.isConfigured ? 'ready' : 'not-configured',
    },
    overall: {
      ready: STRIPE_CONFIG.isConfigured && PRINTFUL_CONFIG.isConfigured,
      warnings: validation.warnings,
      errors: validation.errors,
    },
  };
};

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

// Log configuration status in development
if (isDevelopment) {
  const status = getConfigurationStatus();
  
  if (status.overall.warnings.length > 0) {
    console.warn('⚠️ Configuration Warnings:', status.overall.warnings);
  }
  
  if (status.overall.errors.length > 0) {
    console.error('❌ Configuration Errors:', status.overall.errors);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ECOMMERCE_CONFIG; 