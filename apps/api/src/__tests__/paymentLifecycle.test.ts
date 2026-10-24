import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { isValidWebhookSignature } from '../services/paymentLifecycle.js';

const secret = process.env.PAYMENT_WEBHOOK_SECRET ?? 'demo-webhook-secret-change-me';

describe('payment webhook signatures', () => {
  it('accepts a valid HMAC signature for the exact JSON payload', () => {
    const payload = {
      paymentId: '65a123456789012345678901',
      outcome: 'success',
      webhookReference: 'evt-1',
    };
    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    expect(isValidWebhookSignature(payload, signature)).toBe(true);
  });

  it('rejects a modified payload', () => {
    const signedPayload = {
      paymentId: '65a123456789012345678901',
      outcome: 'success',
      webhookReference: 'evt-1',
    };
    const signature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(signedPayload))
      .digest('hex');
    expect(isValidWebhookSignature({ ...signedPayload, outcome: 'failure' }, signature)).toBe(
      false,
    );
  });

  it('rejects malformed and wrong-length signatures without throwing', () => {
    expect(isValidWebhookSignature({ ok: true }, 'not-a-signature')).toBe(false);
    expect(isValidWebhookSignature({ ok: true }, '')).toBe(false);
  });
});
