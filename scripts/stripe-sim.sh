#!/usr/bin/env bash
# Simple helper: listens then fires a test checkout.session.completed to local webhook
set -e
if ! command -v stripe &> /dev/null; then
  echo "Stripe CLI is not installed. See https://stripe.com/docs/stripe-cli"
  exit 1
fi

stripe listen --forward-to localhost:3001/api/stripe/webhook &
LISTEN_PID=$!

# give listener a moment
sleep 1

stripe trigger checkout.session.completed

# cleanup
kill $LISTEN_PID 