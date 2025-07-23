#!/usr/bin/env node

/**
 * Product Configuration Update Script
 * Run this after getting your real Stripe and Printful IDs
 * 
 * Usage: node update-products.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const STORE_FILE_PATH = path.join(__dirname, 'src', 'pages', 'Store.tsx');

console.log('🛒 DJBUILDIT Store Product Configuration Updater\n');
console.log('This script will help you update your products with real Stripe and Printful IDs.\n');

async function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function updateProducts() {
  try {
    console.log('📝 Let\'s update your products with real IDs...\n');

    // Product 1 - Fitness Tracker Pro
    console.log('=== PRODUCT 1: Fitness Tracker Pro ===');
    const product1StripeProductId = await prompt('Stripe Product ID (prod_...): ');
    const product1StripePriceId = await prompt('Stripe Price ID (price_...): ');
    const product1PrintfulProductId = await prompt('Printful Product ID (number): ');
    const product1PrintfulVariantId = await prompt('Printful Variant ID (number): ');
    const product1ImageUrl = await prompt('Product Image URL (optional, press enter to skip): ');

    console.log('\n=== PRODUCT 2: Workout Planner Premium ===');
    const product2StripeProductId = await prompt('Stripe Product ID (prod_...): ');
    const product2StripePriceId = await prompt('Stripe Price ID (price_...): ');
    const product2PrintfulProductId = await prompt('Printful Product ID (number): ');
    const product2PrintfulVariantId = await prompt('Printful Variant ID (number): ');
    const product2ImageUrl = await prompt('Product Image URL (optional, press enter to skip): ');

    console.log('\n📁 Reading Store.tsx file...');
    
    if (!fs.existsSync(STORE_FILE_PATH)) {
      throw new Error(`Store.tsx not found at ${STORE_FILE_PATH}`);
    }

    let storeContent = fs.readFileSync(STORE_FILE_PATH, 'utf8');

    // Update Product 1
    storeContent = storeContent.replace(
      /stripeProductId: "prod_fitness_tracker"/,
      `stripeProductId: "${product1StripeProductId}"`
    );
    storeContent = storeContent.replace(
      /stripePriceId: "price_1234567890"/,
      `stripePriceId: "${product1StripePriceId}"`
    );
    storeContent = storeContent.replace(
      /printfulProductId: 123456/,
      `printfulProductId: ${product1PrintfulProductId}`
    );
    storeContent = storeContent.replace(
      /printfulVariantId: 789012/,
      `printfulVariantId: ${product1PrintfulVariantId}`
    );

    // Update Product 2
    storeContent = storeContent.replace(
      /stripeProductId: "prod_workout_planner"/,
      `stripeProductId: "${product2StripeProductId}"`
    );
    storeContent = storeContent.replace(
      /stripePriceId: "price_2345678901"/,
      `stripePriceId: "${product2StripePriceId}"`
    );
    storeContent = storeContent.replace(
      /printfulProductId: 123457/,
      `printfulProductId: ${product2PrintfulProductId}`
    );
    storeContent = storeContent.replace(
      /printfulVariantId: 789013/,
      `printfulVariantId: ${product2PrintfulVariantId}`
    );

    // Update image URLs if provided
    if (product1ImageUrl) {
      storeContent = storeContent.replace(
        /url: "https:\/\/images\.unsplash\.com\/photo-1571019613454-1cb2f99b2d8b[^"]*"/,
        `url: "${product1ImageUrl}"`
      );
    }

    if (product2ImageUrl) {
      storeContent = storeContent.replace(
        /url: "https:\/\/images\.unsplash\.com\/photo-1434682881908-b43d0467b798[^"]*"/,
        `url: "${product2ImageUrl}"`
      );
    }

    // Create backup
    const backupPath = STORE_FILE_PATH + '.backup';
    fs.writeFileSync(backupPath, fs.readFileSync(STORE_FILE_PATH));
    console.log(`📋 Backup created: ${backupPath}`);

    // Write updated file
    fs.writeFileSync(STORE_FILE_PATH, storeContent);
    console.log('✅ Store.tsx updated successfully!');

    console.log('\n🎉 Product configuration updated!');
    console.log('\nNext steps:');
    console.log('1. Make sure your .env.local file has all the API keys');
    console.log('2. Run: npm run dev');
    console.log('3. Test your store at http://localhost:5173/store');
    console.log('\n🚀 Your store is ready to accept real payments!');

  } catch (error) {
    console.error('❌ Error updating products:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Validation functions
function validateStripeId(id, type) {
  const patterns = {
    product: /^prod_[a-zA-Z0-9_]+$/,
    price: /^price_[a-zA-Z0-9_]+$/
  };
  return patterns[type] && patterns[type].test(id);
}

function validatePrintfulId(id) {
  return /^\d+$/.test(id);
}

// Start the update process
updateProducts().catch(console.error); 