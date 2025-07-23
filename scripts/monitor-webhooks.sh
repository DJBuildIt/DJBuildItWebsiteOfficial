#!/bin/bash

# Printful Webhook Health Monitoring Script
# Run this via cron job for continuous monitoring

echo "🏥 Webhook Health Check - $(date)"
echo "================================="

# Run webhook tests
node scripts/test-printful-webhooks.js

# Check for critical issues
if [ -f "webhook-health-report.json" ]; then
  HEALTH_SCORE=$(cat webhook-health-report.json | jq -r '.health_score')
  
  if [ "$HEALTH_SCORE" -lt 80 ]; then
    echo "⚠️  WARNING: Webhook health score is $HEALTH_SCORE/100"
    echo "📧 Consider sending alert notification"
  else
    echo "✅ Webhook health score: $HEALTH_SCORE/100"
  fi
else
  echo "❌ Could not find health report"
fi

echo ""
echo "📊 For detailed report, check: webhook-health-report.json"
