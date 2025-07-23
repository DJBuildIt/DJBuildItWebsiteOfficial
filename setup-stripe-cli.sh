#!/bin/bash

# Stripe CLI Setup Script for DJBUILDIT Store
# This script sets up Stripe CLI for local development with webhooks

echo "🔧 DJBUILDIT Stripe CLI Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}❌ Stripe CLI not found. Installing...${NC}"
    brew install stripe/stripe-cli/stripe
else
    echo -e "${GREEN}✅ Stripe CLI is installed${NC}"
fi

echo ""
echo "🔑 Stripe CLI Authentication"
echo "=============================="
echo ""
echo "To authenticate Stripe CLI, you need your SECRET KEY from Stripe Dashboard."
echo ""
echo -e "${YELLOW}📋 Steps to get your Stripe Secret Key:${NC}"
echo "1. Go to https://dashboard.stripe.com/apikeys"
echo "2. Copy your 'Secret key' (starts with sk_test_...)"
echo "3. Keep it handy for the next step"
echo ""

read -p "Press Enter when you have your Stripe secret key ready..."

echo ""
echo "🔐 Authenticating with Stripe..."
echo "Enter your Stripe SECRET KEY when prompted:"
echo ""

# Authenticate with Stripe
stripe login --interactive

# Check if authentication was successful
if stripe --version &> /dev/null; then
    echo -e "${GREEN}✅ Stripe CLI authenticated successfully!${NC}"
else
    echo -e "${RED}❌ Stripe CLI authentication failed. Please try again.${NC}"
    exit 1
fi

echo ""
echo "🔗 Setting up Local Webhook Forwarding"
echo "======================================="
echo ""
echo "This will create a secure tunnel from Stripe to your local development server."
echo "The webhook secret will be automatically generated and displayed."
echo ""

read -p "Press Enter to start webhook forwarding..."

echo ""
echo -e "${BLUE}🚀 Starting webhook forwarding...${NC}"
echo "This will run in the background and show you the webhook secret."
echo ""
echo -e "${YELLOW}📝 Copy the webhook secret (whsec_...) that appears below!${NC}"
echo ""

# Start webhook forwarding and capture the output
echo "Starting: stripe listen --forward-to localhost:5173/api/webhooks/stripe"
echo ""

# Run the listen command
stripe listen --forward-to localhost:5173/api/webhooks/stripe &

# Get the process ID
STRIPE_PID=$!

echo ""
echo -e "${GREEN}✅ Webhook forwarding started!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Copy the webhook secret (whsec_...) from above"
echo "2. Add it to your .env.local file as STRIPE_WEBHOOK_SECRET=whsec_..."
echo "3. Keep this terminal open while developing"
echo "4. Test your store at http://localhost:5173/store"
echo ""
echo -e "${BLUE}💡 To stop webhook forwarding later:${NC}"
echo "Press Ctrl+C or run: kill $STRIPE_PID"
echo ""

# Wait for user input
read -p "Press Enter to continue running webhook forwarding (Ctrl+C to stop)..."

# Keep the webhook forwarding running
wait $STRIPE_PID 