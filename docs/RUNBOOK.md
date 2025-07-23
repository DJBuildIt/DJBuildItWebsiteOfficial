# RUNBOOK – Stripe + Printful Integration

_Last updated: 2025-07-10_

---

## 1 · Environment Variables
| Name | Example | Scope | Notes |
|------|---------|-------|-------|
| STRIPE_SECRET_KEY | `sk_test_…` | server | Test or live secret key |
| VITE_STRIPE_PUBLISHABLE_KEY | `pk_test_…` | client | Loaded via Vite |
| STRIPE_WEBHOOK_SECRET | `whsec_…` | server | From Stripe CLI / dashboard |
| PRINTFUL_API_KEY | `dev_…` / `live_…` | server | Private token (Account → Developer) |
| PRINTFUL_API_VERSION | `v2` | server | Switch once v3 etc. appear |
| PRINTFUL_USE_SANDBOX | `true` \| `false` | server | `true` uses `https://api.printful.com/sandbox` |
| PRINTFUL_AUTO_CONFIRM | `false` | server | `true` auto-confirms draft orders |
| PRINTFUL_WEBHOOK_SECRET | hex string | server | Provided when you create the webhook in Printful dashboard |

Create `.env.local` (backend) and `.env` (frontend) with these values.

---

## 2 · Running Locally
```bash
# 1. install deps
npm i

# 2. start api + vite client in parallel
npm run dev     # (shortcut for dev:api + dev:client)
```
• API: http://localhost:3001  
• Front-end: http://localhost:5173

### Health endpoints
* `GET /health` – basic server health
* `GET /health/webhook` – shows last Stripe & Printful webhook timestamps

---

## 3 · Webhook Simulation

### Stripe
```bash
npm run stripe:fire
```
* Spawns `stripe listen` (requires Stripe CLI) → forwards to `/api/stripe/webhook`.
* Triggers `checkout.session.completed` event.

### Printful
```bash
export PRINTFUL_WEBHOOK_SECRET=<hex>
npm run printful:fire
```
* Sends a signed `shipment.sent` event to `/api/printful/webhook`.

### All-in-one
```bash
npm run test:webhooks   # fires both
```

---

## 4 · Automated Tests
```bash
# Unit + integration
npm test

# Headless Playwright (if added later)
pm run test:e2e
```
Key suite: `test/integration/printful-signature.spec.ts` ensures signature logic.

---

## 5 · Deployment Checklist
1. Set all env vars in hosting platform (Vercel / Railway etc.).
2. `PRINTFUL_USE_SANDBOX=false` and `PRINTFUL_AUTO_CONFIRM=true` for production.
3. Create live Printful webhook → point to `https://<domain>/api/printful/webhook` and copy secret.
4. Stripe dashboard → add endpoint for live events or keep Stripe CLI tunnel during staging.
5. Verify `/health/webhook` shows recent timestamps after a live test order.

---

## 6 · Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Printful webhook 400 | Bad signature | Ensure `PRINTFUL_WEBHOOK_SECRET` matches dashboard, check hex format |
| Orders stay in draft | `PRINTFUL_AUTO_CONFIRM=false` | Set `true` or manually confirm in dashboard |
| Stripe price API 500 | Route missing | Ensure `dev-server.cjs` exposes `/api/stripe/price/:id` |
| Webhook health shows `null` | No events received | Trigger simulation scripts or check public webhook config |

---

## 7 · Useful Commands
```bash
# Sync Stripe KV cache (if needed)
node src/lib/stripe-kv-sync.ts

# Update product list from Stripe dashboard
npm run update-products
```

---

_End of runbook_ 