#!/usr/bin/env node
import axios from 'axios';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const secret = process.env.PRINTFUL_WEBHOOK_SECRET;
if (!secret) {
  console.error('PRINTFUL_WEBHOOK_SECRET env var missing');
  process.exit(1);
}

// Minimal shipment.sent sample
const payload = {
  type: 'shipment.sent',
  occurred_at: new Date().toISOString(),
  retries: 0,
  store_id: 123456,
  data: {
    shipment: { id: 999, status: 'shipped', tracking_number: 'TEST123', tracking_url: 'https://example.com' },
    order: { id: 888, external_id: 'test-ext', status: 'fulfilled' }
  }
};

const raw = JSON.stringify(payload);

const signature = crypto
  .createHmac('sha256', Buffer.from(secret, 'hex'))
  .update(raw)
  .digest('hex');

(async () => {
  try {
    const res = await axios.post('http://localhost:3001/api/printful/webhook', raw, {
      headers: {
        'Content-Type': 'application/json',
        'X-Printful-Signature': signature
      },
    });
    console.log('Webhook delivered', res.status);
  } catch (err) {
    console.error('Error sending webhook', err.response?.data || err.message);
  }
})(); 