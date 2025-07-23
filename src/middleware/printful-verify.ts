import crypto from 'crypto';

/**
 * Verify Printful v2 webhook signature using HMAC-SHA256.
 * @param rawBody Raw request body as Buffer
 * @param signature Header value of `X-Printful-Signature`
 * @param secret Env secret (hex string as provided by Printful)
 */
export function verifyPrintfulSignature(rawBody: Buffer, signature: string | undefined, secret: string | undefined): boolean {
  if (!signature || !secret) return false;
  try {
    const cleanSig = signature.replace(/^sha256=/, '');
    const secretBuf = Buffer.from(secret, 'hex');
    const expected = crypto.createHmac('sha256', secretBuf).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(cleanSig, 'hex'), Buffer.from(expected, 'hex'));
  } catch (_) {
    return false;
  }
