import { describe, it, expect } from 'vitest';
import { verifyPrintfulSignature } from '../../src/middleware/printful-verify';
import crypto from 'crypto';

describe('Printful HMAC verification', () => {
  it('validates correct signature', () => {
    const secretHex = 'aabbccddeeff00112233445566778899';
    const body = Buffer.from('{"hello":"world"}', 'utf8');

    const sig = crypto.createHmac('sha256', Buffer.from(secretHex, 'hex')).update(body).digest('hex');
    const ok = verifyPrintfulSignature(body, sig, secretHex);
    expect(ok).toBe(true);
  });

  it('rejects invalid signature', () => {
    const secretHex = 'deadbeef';
    const body = Buffer.from('test');
    const ok = verifyPrintfulSignature(body, 'ff', secretHex);
    expect(ok).toBe(false);
  });
}); 