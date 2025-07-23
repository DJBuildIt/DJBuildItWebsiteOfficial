# 🔍 CHECKOUT DEBUG GUIDE

## 🎯 PURPOSE
This guide helps you identify **exactly** where your checkout is failing by following the complete request flow.

## 🚀 How to Test & Debug

### 1. Start the Development Servers
```bash
# Option 1: Start both servers together
npm run dev

# Option 2: Start separately (for easier log viewing)
# Terminal 1 - API Server
npm run dev:api

# Terminal 2 - Frontend  
npm run dev:client
```

### 2. Open Browser Console
1. Go to `http://localhost:8081/store`
2. Open browser **Developer Tools** (F12)
3. Go to **Console** tab
4. Clear the console to start fresh

### 3. Attempt Checkout
1. Add a product to cart
2. Go to cart page
3. Enter ZIP code
4. Click **"Checkout"** button
5. **WATCH THE CONSOLE LOGS**

## 📋 What to Look For

### ✅ Expected Log Flow (SUCCESS):
```
🔵 CART_CHECKOUT_START - Frontend starts checkout
🔵 CART_VALIDATION_PASSED - Validation passes
🔵 CART_PRODUCT_MAPPED - Product mapping works
🔵 FRONTEND_CHECKOUT_START - API request starts
🔵 FRONTEND_API_REQUEST - Request details
🔵 INCOMING_REQUEST - Backend receives request
🔵 CHECKOUT_START - Backend starts processing
✅ VALIDATION_PASSED - Backend validation passes
✅ PRODUCT_FOUND - Product exists
🔵 STRIPE_SESSION_DATA - Session data prepared
🔵 STRIPE_API_CALL_START - Calling Stripe API
✅ STRIPE_API_CALL_SUCCESS - Stripe responds
✅ CHECKOUT_COMPLETE - Backend success
✅ FRONTEND_API_RESPONSE - Frontend receives response
✅ CART_CHECKOUT_SESSION_SUCCESS - Session created
🔵 CART_REDIRECTING_TO_CHECKOUT - Redirecting to Stripe
```

### 🔴 Error Indicators:
- **VALIDATION_ERROR** - Check product ID, quantity, or ZIP code
- **PRODUCT_NOT_FOUND** - Product mapping issue
- **STRIPE_API_CALL_ERROR** - Stripe configuration problem
- **FRONTEND_API_ERROR** - Network or API endpoint issue
- **CART_PRODUCT_MAPPING_ERROR** - Product ID mismatch

## 🐛 Common Issues & Solutions

### Issue 1: "PRODUCT_NOT_FOUND" Error
**Cause**: Product ID mismatch between frontend and backend
**Look for**: `CART_PRODUCT_MAPPING_ERROR` in logs
**Solution**: Check product IDs match between Store.tsx and dev-server.cjs

### Issue 2: "STRIPE_API_CALL_ERROR" 
**Cause**: Invalid Stripe keys or API issue
**Look for**: Stripe error details in backend logs
**Solution**: Verify `.env.local` has correct `STRIPE_SECRET_KEY`

### Issue 3: "Network Error" or "404"
**Cause**: API endpoint not reachable
**Look for**: `FRONTEND_API_REQUEST` shows wrong URL
**Solution**: Check if API server is running on port 3001

### Issue 4: "VALIDATION_ERROR"
**Cause**: Missing required fields
**Look for**: `CART_VALIDATION_ERROR` in logs
**Solution**: Ensure ZIP code and product selection are valid

## 📊 Debug Commands

### Test API Server Directly:
```bash
# Health check
curl http://localhost:3001/api/health

# Test checkout (replace with your actual test)
curl -X POST http://localhost:3001/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"productId":"cursor-mug","quantity":1}'
```

### Test Through Proxy:
```bash
# Should work if Vite proxy is configured correctly
curl -X POST http://localhost:8081/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"productId":"cursor-mug","quantity":1}'
```

## 🎯 What to Report

When you find the error, copy the **entire log section** that shows the failure, including:
1. The error message
2. The step where it failed
3. Any request/response data
4. The full error stack trace

**Example Error Report:**
```
🔴 [2025-07-02T15:23:45.123Z] CART_CHECKOUT_SESSION_FAILED: {
  "checkoutId": "cart_checkout_1234567890_abc123",
  "error": {
    "message": "Product not found",
    "code": "product_not_found"
  }
}
```

## 💡 Pro Tips

1. **Clear browser cache** if you see stale errors
2. **Check both browser console AND terminal** for complete picture
3. **Try different products** to isolate product-specific issues
4. **Test with fresh incognito window** to avoid cached auth issues

---

**🔍 This comprehensive logging will show us exactly where your checkout fails!** 