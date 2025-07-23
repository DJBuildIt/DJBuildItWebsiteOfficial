# 🎯 PRINTFUL WEBHOOK COMPLETE SETUP GUIDE
## Bulletproof Production Implementation

This guide provides a comprehensive, bulletproof approach to setting up Printful webhooks with complete monitoring and maintenance procedures.

## 📋 **OVERVIEW - COMPLETE WEBHOOK SYSTEM**

### **Phase Status**
- ✅ **Phase 1**: Pre-Setup Requirements (COMPLETE)
- ✅ **Phase 2**: Event Configuration (COMPLETE)
- ✅ **Phase 3**: Webhook Setup Script (COMPLETE)
- ✅ **Phase 4**: Environment Management (COMPLETE)
- ✅ **Phase 5**: Verification System (COMPLETE)
- ✅ **Phase 6**: Health Monitoring (COMPLETE)
- ✅ **Phase 7**: Continuous Testing (COMPLETE)
- ✅ **Phase 8**: Production Maintenance (COMPLETE)

### **Complete Event Coverage**
- **Essential Order Events**: 5 events (order_created, order_updated, order_failed, order_canceled, order_refunded)
- **Essential Shipment Events**: 4 events (shipment_sent, shipment_returned, shipment_canceled, shipment_out_of_stock)
- **Hold Management Events**: 6 events (order/shipment put_hold, put_hold_approval, remove_hold)
- **Catalog Events**: 1 event (catalog_price_changed)
- **Optional Events**: 1 event (mockup_task_finished)
- **Total**: 17 webhook events configured

---

## 🚀 **EXECUTION PLAN - STEP BY STEP**

### **Step 1: Environment Setup (Phase 1)**

```bash
# 1. Create your .env.local file with all required variables
cp .env.example .env.local  # If .env.example exists

# 2. Add these critical environment variables to .env.local:
PRINTFUL_API_KEY=your_printful_api_key_here
PRINTFUL_STORE_ID=your_store_id_here
VITE_APP_URL=https://your-domain.com
PRINTFUL_WEBHOOK_SECRET=will_be_generated_by_setup_script

# 3. For local development, use ngrok for HTTPS:
ngrok http 5173
# Then set VITE_APP_URL=https://your-ngrok-id.ngrok.io
```

### **Step 2: Execute Webhook Setup (Phase 2-5)**

```bash
# Run the comprehensive webhook setup
node setup-printful-webhooks.js

# For different profiles:
node setup-printful-webhooks.js --minimal      # 7 essential events
node setup-printful-webhooks.js                # 15 recommended events (default)
node setup-printful-webhooks.js --complete     # 17 all events
```

**Expected Output:**
```
🚀 PRINTFUL WEBHOOK V2 COMPLETE SETUP
=====================================
📋 Using Profile: Recommended Production Setup
🎯 Events to configure: 15

✅ WEBHOOK SETUP SUCCESSFUL!
🔑 CRITICAL INFORMATION (Save These Values):
🔐 Secret Key (SAVE TO ENVIRONMENT): [long_hex_string]
```

### **Step 3: Verification & Testing (Phase 6-7)**

```bash
# Run comprehensive webhook testing
node scripts/test-printful-webhooks.js

# This will:
# - Test webhook configuration
# - Test endpoint connectivity
# - Test individual events
# - Generate health report
# - Setup continuous monitoring
```

**Expected Health Score:** 90-100/100 for production readiness

---

## 🔧 **WEBHOOK PROFILES EXPLAINED**

### **Minimal Profile (7 Events)**
**Best for:** Basic order tracking, minimal complexity
**Events:**
- order_created, order_updated, order_failed, order_canceled
- shipment_sent, shipment_returned, shipment_canceled

### **Recommended Profile (15 Events) - DEFAULT**
**Best for:** Production e-commerce with comprehensive tracking
**Events:**
- All Essential Order Events (5)
- All Essential Shipment Events (4)
- All Hold Management Events (6)

### **Complete Profile (17 Events)**
**Best for:** Advanced integrations with catalog management
**Events:**
- All Recommended Events (15)
- catalog_price_changed
- mockup_task_finished

---

## 🛡️ **SECURITY & VALIDATION**

### **Signature Verification**
The webhook handler implements Printful v2 signature verification:
```typescript
// Automatic signature verification in api/webhooks/printful.ts
const signature = req.headers.get('X-PF-Signature');
if (!verifyPrintfulV2Signature(rawBody, signature)) {
  return 401; // Unauthorized
}
```

### **Rate Limiting**
- Webhook endpoint has strict rate limiting
- 50 requests per minute per IP
- Automatic blocking of suspicious activity

### **Environment Security**
- All secrets stored in `.env.local` (never committed)
- Server-side only variables properly protected
- Automatic validation of required variables

---

## 📊 **MONITORING & MAINTENANCE**

### **Health Monitoring**
```bash
# Check webhook health anytime
node scripts/test-printful-webhooks.js

# Review health report
cat webhook-health-report.json
```

### **Continuous Monitoring Setup**
```bash
# Set up automated monitoring (every 30 minutes)
crontab -e
# Add: */30 * * * * /path/to/project/scripts/monitor-webhooks.sh
```

### **Production Monitoring**
- **Health Score**: Target 90+/100
- **Response Time**: <2 seconds
- **Error Rate**: <1%
- **Uptime**: 99.9%+

---

## 🎯 **EVENT HANDLING PRIORITIES**

### **HIGH PRIORITY (Immediate Action Required)**
- `order_created` → Create order record, send confirmation
- `order_updated` → Update costs, notify customer
- `order_failed` → Process refund, notify customer
- `order_canceled` → Cancel order, process refund
- `order_refunded` → Update payment status
- `shipment_sent` → Send tracking info to customer
- `shipment_returned` → Process return, notify customer
- `shipment_out_of_stock` → Notify customer, find alternatives

### **MEDIUM PRIORITY (Business Process Management)**
- `order_put_hold` → Update order status, investigate
- `order_put_hold_approval` → Request manual approval
- `order_remove_hold` → Resume order processing
- `shipment_put_hold` → Update shipment status
- `shipment_put_hold_approval` → Request manual approval
- `shipment_remove_hold` → Resume shipment

### **LOW PRIORITY (Background Processing)**
- `catalog_price_changed` → Update product pricing
- `mockup_task_finished` → Update product images

---

## 🔄 **WEBHOOK DELIVERY LIFECYCLE**

### **1. Webhook Trigger**
- Event occurs in Printful system
- Webhook payload generated
- Delivery attempted to your endpoint

### **2. Signature Verification**
- X-PF-Signature header validated
- HMAC-SHA256 verification using PRINTFUL_WEBHOOK_SECRET
- Reject if signature invalid

### **3. Event Processing**
- Parse JSON payload
- Route to appropriate handler
- Execute business logic
- Return 2xx status code

### **4. Retry Logic (Printful Side)**
- Failed deliveries retried automatically
- Exponential backoff (1min, 5min, 15min, 1hr, 6hr, 24hr)
- Maximum 6 retry attempts
- Monitor `retries` field in webhook payload

---

## 🚨 **TROUBLESHOOTING GUIDE**

### **Common Issues & Solutions**

#### **Issue: Webhook setup fails with 401**
```bash
# Check API key
curl -H "Authorization: Bearer $PRINTFUL_API_KEY" https://api.printful.com/stores
```
**Solution**: Verify PRINTFUL_API_KEY is valid and has webhook permissions

#### **Issue: Webhook URL unreachable**
```bash
# For local development
ngrok http 5173
# Update VITE_APP_URL to ngrok URL
```
**Solution**: Ensure webhook URL is HTTPS and publicly accessible

#### **Issue: Signature verification fails**
**Check**: PRINTFUL_WEBHOOK_SECRET matches the secret from setup
**Solution**: Re-run setup script to get fresh secret key

#### **Issue: Events not being received**
```bash
# Test webhook configuration
node scripts/test-printful-webhooks.js
```
**Solution**: Check health report and follow recommendations

### **Debug Commands**
```bash
# Check current webhook config
curl -X GET "https://api.printful.com/v2/webhooks" \
  -H "Authorization: Bearer $PRINTFUL_API_KEY"

# Test webhook endpoint
curl -X POST "https://your-domain.com/api/webhooks/printful" \
  -H "Content-Type: application/json" \
  -H "X-PF-Signature: test" \
  -d '{"type": "test", "data": {}}'
```

---

## 📈 **PRODUCTION DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] ✅ All environment variables configured
- [ ] ✅ Webhook handler tested locally
- [ ] ✅ Signature verification working
- [ ] ✅ Database schema supports all events
- [ ] ✅ Error handling implemented
- [ ] ✅ Logging configured

### **Deployment**
- [ ] ✅ Deploy with webhook endpoint accessible
- [ ] ✅ Update VITE_APP_URL to production domain
- [ ] ✅ Run webhook setup for production
- [ ] ✅ Update PRINTFUL_WEBHOOK_SECRET
- [ ] ✅ Test webhook delivery

### **Post-Deployment**
- [ ] ✅ Monitor webhook health score (target: 90+)
- [ ] ✅ Verify event delivery in application logs
- [ ] ✅ Test with real order flow
- [ ] ✅ Set up continuous monitoring
- [ ] ✅ Create alerts for critical failures

---

## 🎉 **COMPLETION VERIFICATION**

Your Printful webhook setup is **COMPLETE** and **PRODUCTION-READY** when:

✅ **Setup Score**: 100/100
- Webhook configuration exists
- All events properly configured
- Endpoint is reachable and validates signatures
- Environment variables properly set

✅ **Health Score**: 90+/100
- No critical issues identified
- All event handlers implemented
- Monitoring systems active

✅ **Test Results**: All Green
- Configuration test: ✅ PASS
- Connectivity test: ✅ PASS
- Event tests: ✅ ALL PASS
- Security validation: ✅ PASS

## 📞 **SUPPORT & MAINTENANCE**

### **Regular Maintenance Tasks**
- **Weekly**: Review webhook health reports
- **Monthly**: Update webhook configuration if needed
- **Quarterly**: Review and optimize event handlers

### **Emergency Procedures**
- **Webhook Down**: Check health report, verify endpoint accessibility
- **High Error Rate**: Review application logs, check signature validation
- **Events Missing**: Verify webhook configuration, check Printful dashboard

---

**🎯 Your Printful webhook system is now bulletproof and production-ready!**

For questions or issues, check:
1. Health report: `webhook-health-report.json`
2. Application logs: Monitor webhook processing
3. Printful dashboard: Check webhook delivery status 