#!/usr/bin/env node

require('esbuild-register');

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const pino = require('pino');
const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });

const { webhookHealth } = require('./src/lib/webhook-health');

// Import the serverless function logic
const createCheckoutSessionHandler = require('./api/stripe/create-checkout-session').default;
const getProductsHandler = require('./api/stripe/products').default;
const getSessionHandler = require('./api/stripe/get-session').default;
const getPriceHandler = require('./api/stripe/price').default;
const stripeWebhookHandler = require('./api/webhooks/stripe').default;
const printfulWebhookHandler = require('./api/webhooks/printful').default;

const app = express();
const PORT = 3001;

// ============================================================================
// COMPREHENSIVE LOGGING SETUP
// ============================================================================
// replace log.* util to use pino if desired but keep existing for minimal change

// Initialize Stripe with logging
logger.info('SERVER_STARTUP', {
  port: PORT,
  stripeKeyPresent: !!process.env.STRIPE_SECRET_KEY,
  stripeKeyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...' : 'MISSING',
  appUrl: process.env.VITE_APP_URL || 'http://localhost:8081'
});

if (!process.env.STRIPE_SECRET_KEY) {
  logger.error('STRIPE_CONFIG', new Error('STRIPE_SECRET_KEY environment variable is missing'));
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware with logging
app.use(cors());

// Conditionally parse JSON body, leaving it raw for the Stripe webhook
app.use((req, res, next) => {
  if (req.path === '/api/stripe/webhook' || req.path === '/api/printful/webhook') {
    // Pass the raw request body for webhook signature verification
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info('INCOMING_REQUEST', {
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'origin': req.headers.origin
    },
    body: req.body
  });
  next();
});

// ============================================================================
// STRIPE API ENDPOINTS - UNIFIED
// ============================================================================

// Products API - Single Source of Truth
app.get('/api/stripe/products', getProductsHandler);

// Stripe Checkout Session API - Uses the unified serverless function
// Adapter: wrap Express req/res into Fetch API-compatible Request for the serverless handler
app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    // Build a full URL so the Request object is valid
    const fullUrl = `http://localhost:${PORT}${req.originalUrl}`;
    const fetchRequest = new Request(fullUrl, {
      method: req.method,
      headers: req.headers,
      // For JSON bodies the original middleware has already parsed it into req.body
      body: req.headers['content-type']?.includes('application/json') ? JSON.stringify(req.body) : undefined,
    });

    const response = await createCheckoutSessionHandler(fetchRequest);

    // Relay status, headers and body back to Express response
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    const bodyText = await response.text();
    res.send(bodyText);
  } catch (err) {
    logger.error('CHECKOUT_SESSION_ERROR', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Stripe Session Retrieval API - for success page
app.get('/api/stripe/session/:sessionId', getSessionHandler);

// Stripe Price API - fetch a single price with product expansion
app.get('/api/stripe/price/:priceId', getPriceHandler);

// Stripe Webhook Handler - Uses the unified serverless function
app.post('/api/stripe/webhook', stripeWebhookHandler);

// Printful Webhook Handler
app.post('/api/printful/webhook', printfulWebhookHandler);

// Secure Shipping Calculation API
app.post('/api/shipping/calculate-rates', async (req, res) => {
  const requestId = `shipping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('SHIPPING_CALCULATION_START', { requestId, body: req.body });
    
    const { country, state, city, postalCode, items } = req.body;
    
    // Validate required fields
    if (!country || !postalCode || !items || items.length === 0) {
      logger.error('SHIPPING_VALIDATION_ERROR', new Error('Missing required fields'));
      return res.status(400).json({ 
        success: false,
        error: { 
          code: 'VALIDATION_ERROR', 
          message: 'Country, postal code, and items are required' 
        },
        requestId
      });
    }

    // Server-side product mapping (keeps Printful variant IDs secure)
    const productToVariantMapping = {
      'cursor-hat': 14554,
      'cursor-mug': 14553
    };

    // Validate all products are supported
    for (const item of items) {
      if (!productToVariantMapping[item.productId]) {
        logger.error('UNSUPPORTED_PRODUCT', new Error(`Product ${item.productId} not supported`));
        return res.status(400).json({
          success: false,
          error: {
            code: 'UNSUPPORTED_PRODUCT',
            message: `Product ${item.productId} is not supported`
          },
          requestId
        });
      }
    }

    // Check if Printful API is configured
    if (!process.env.PRINTFUL_API_KEY) {
      logger.warn('PRINTFUL_NOT_CONFIGURED', { requestId });
      
      // Return fallback rates when Printful isn't configured
      const fallbackRates = [
        {
          id: 'standard',
          name: 'Standard Shipping',
          cost: 599, // $5.99
          currency: 'USD',
          deliveryDays: '3-7 days',
          description: 'Standard delivery in 3-7 business days'
        },
        {
          id: 'express',
          name: 'Express Shipping',
          cost: 1299, // $12.99
          currency: 'USD',
          deliveryDays: '1-3 days',
          description: 'Express delivery in 1-3 business days'
        }
      ];

      logger.info('SHIPPING_FALLBACK_RATES', { requestId, ratesCount: fallbackRates.length });
      
      return res.json({
        success: true,
        data: fallbackRates,
        requestId
      });
    }

    // Prepare Printful API request
    const printfulItems = items.map(item => ({
      catalog_variant_id: productToVariantMapping[item.productId],
      quantity: item.quantity
    }));

    const printfulRequest = {
      recipient: {
        country_code: country,
        state_code: state || undefined,
        city: city || undefined,
        zip: postalCode
      },
      order_items: printfulItems.map(item => ({ ...item, source: 'catalog' })),
      currency: 'USD'
    };

    logger.info('PRINTFUL_API_REQUEST', { requestId, printfulRequest });

    // Call Printful API
    const printfulResponse = await axios.post(
      'https://api.printful.com/v2/shipping-rates',
      printfulRequest,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'DJBUILDIT-Store/2.0.0'
        },
        timeout: 10000
      }
    );

    if (printfulResponse.data && printfulResponse.data.data && printfulResponse.data.data.length > 0) {
      // Convert Printful response to our format
      const rates = printfulResponse.data.data.map(rate => ({
        id: rate.shipping,
        name: rate.shipping_method_name,
        cost: Math.round(parseFloat(rate.rate) * 100), // Convert to cents
        currency: rate.currency,
        deliveryDays: `${rate.min_delivery_days}-${rate.max_delivery_days} days`,
        description: `Delivery in ${rate.min_delivery_days}-${rate.max_delivery_days} business days`
      }));

      logger.info('PRINTFUL_API_SUCCESS', { requestId, ratesCount: rates.length });

      res.json({
        success: true,
        data: rates,
        requestId
      });
    } else {
      // No rates returned, use fallback
      logger.warn('PRINTFUL_NO_RATES', { requestId, response: printfulResponse.data });
      
      const fallbackRates = [
        {
          id: 'standard',
          name: 'Standard Shipping',
          cost: 599,
          currency: 'USD',
          deliveryDays: '3-7 days',
          description: 'Standard delivery in 3-7 business days'
        }
      ];

      res.json({
        success: true,
        data: fallbackRates,
        requestId
      });
    }

  } catch (error) {
    logger.error('SHIPPING_CALCULATION_ERROR', error);
    
    // Return fallback rates on any error
    const fallbackRates = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        cost: 599,
        currency: 'USD',
        deliveryDays: '3-7 days',
        description: 'Standard delivery in 3-7 business days'
      }
    ];

    res.json({
      success: true,
      data: fallbackRates,
      requestId,
      note: 'Fallback rates due to shipping calculation error'
    });
  }
});

// Health check with comprehensive status
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    stripe: {
      configured: !!process.env.STRIPE_SECRET_KEY,
      keyPrefix: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...' : 'MISSING',
      webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET
    },
    printful: {
      configured: !!process.env.PRINTFUL_API_KEY,
      keyPrefix: process.env.PRINTFUL_API_KEY ? process.env.PRINTFUL_API_KEY.substring(0, 10) + '...' : 'MISSING'
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      VITE_APP_URL: process.env.VITE_APP_URL || 'not set'
    },
    features: {
      stripeCheckout: true,
      shippingCalculation: true,
      webhookHandling: true,
      sessionRetrieval: true,
      nativeShippingCollection: true,
      automaticTaxCalculation: true
    }
  };
  
  logger.info('HEALTH_CHECK', health);
  res.json(health);
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('EXPRESS_ERROR', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health/webhook', (req, res) => {
  res.json({
    stripeLastReceivedAt: webhookHealth.stripe,
    printfulLastReceivedAt: webhookHealth.printful,
    uptime: process.uptime(),
  });
});

// Start server
app.listen(PORT, () => {
  logger.info('SERVER_STARTED', {
    port: PORT,
    url: `http://localhost:${PORT}`,
    routes: [
      'POST /api/stripe/create-checkout-session - Create Stripe checkout session with native shipping',
      'GET /api/stripe/session/:sessionId - Retrieve session details for success page',
      'POST /api/stripe/webhook - Handle Stripe webhook events',
      'POST /api/shipping/calculate-rates - Calculate shipping rates (fallback)',
      'GET /api/health - Health check and configuration status'
    ],
    features: [
      '✅ Native Stripe shipping collection',
      '✅ Automatic tax calculation',
      '✅ Phone number collection',
      '✅ Billing address collection',
      '✅ Customer creation',
      '✅ Webhook event handling',
      '✅ Session retrieval for order confirmation'
    ]
  });
});

module.exports = app; 