# Integration Audit – Stripe & Printful v2

_Last updated: {{DATE}}_

---

## 1. Current Integration Map

### Stripe
| Area | File(s) | Notes |
|------|---------|-------|
| Checkout session | `api/stripe/create-checkout-session.ts` | Builds line items from DB, hits Stripe `/checkout/sessions` |
| Price lookup (frontend) | `api/stripe/price.ts`, `src/hooks/useStripePrice.ts` | Exposes `/api/stripe/price/:priceId` route (added in recent patch) |
| Product list | `api/stripe/products.ts` | Used by store page |
| Success page session fetch | `api/stripe/get-session.ts` |
| Webhook handler | `api/webhooks/stripe.ts` | Verifies `stripe-signature`, then triggers `createAndConfirmPrintfulOrder()` |
| Front-end SDK | `src/services/stripe.ts`, `lib/stripe-kv-*.ts` |

Environment vars required:
* `STRIPE_SECRET_KEY` – server
* `VITE_STRIPE_PUBLISHABLE_KEY` – client
* `STRIPE_WEBHOOK_SECRET` – server (missing check for placeholder)

### Printful v2
| Area | File(s) | Notes |
|------|---------|-------|
| Service client | `src/services/printful.ts` | Full v2 wrapper (shipping, draft order, confirm, polling) |
| Shipping calc from checkout | `api/stripe/create-checkout-session.ts`, `src/services/printful.ts` |
| Order creation from Stripe webhook | `api/webhooks/stripe.ts` | Calls `createPrintfulDraftOrder()` then optionally `confirmPrintfulOrder()` |
| No dedicated Printful webhook endpoint yet | **TODO** – to be created under `api/webhooks/printful.ts` |

Environment vars required:
* `PRINTFUL_API_KEY` – **not set** in dev
* `PRINTFUL_AUTO_CONFIRM` – **planned flag**
* `PRINTFUL_USE_SANDBOX` – **planned flag**

## 2. Identified Gaps & Risks

1. **Webhook Security**
   * Stripe – good (signature verified).
   * Printful – incoming webhooks currently handled by Stripe file; no dedicated endpoint nor HMAC verification.

2. **Environment Flexibility**
   * No flags to switch sandbox vs live, or to skip auto-confirm.

3. **Testing Harness**
   * Stripe CLI used manually; no automated script.
   * Printful v2 sandbox/test not configured; no stub generator.

4. **Observability**
   * Logs are printed to console; no structured log or health-check route.

5. **Automated Tests**
   * Unit tests exist for some utilities but no integration tests for Stripe/Printful flows.

## 3. Change Matrix (linking to TODO IDs)

| Gap | Task ID | High-level Fix |
|-----|---------|----------------|
| Missing env flags | T2 | Introduce flags in `ecommerce-config` and `.env` examples |
| Flexible service layer | T3 | Refactor `src/services/printful.ts` to read flags |
| Webhook security | T4 | Middleware for HMAC (`X-Printful-Signature`) + central verification |
| Local harness | T5 | Scripts for Stripe CLI & Printful sandbox/draft generator |
| Integration tests | T6 | Vitest + Playwright suites with mocks & CLI triggers |
| Observability | T7 | Winston/pino logs, `/health/webhook` endpoint |
| Documentation | T8 | This audit + runbook + env guide |

## 4. Acceptance Criteria

* All env flags exist and default sensibly.
* Dev can run `npm run test:integration` → completes flows using test keys and sandbox.
* Webhook endpoints return 2xx, verify signatures, and log.
* Printful sandbox orders stay in `draft` unless `PRINTFUL_AUTO_CONFIRM=true`.
* CI passes unit + integration tests.

---

_End of audit document._ 