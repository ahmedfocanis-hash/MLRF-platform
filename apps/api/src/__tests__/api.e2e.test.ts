import crypto from 'node:crypto';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { app } from '../app.js';

describe('MLRF API end-to-end demo flow', () => {
  const phone = `01${['0', '1', '2', '5'][crypto.randomInt(0, 4)]}${String(crypto.randomInt(0, 100_000_000)).padStart(8, '0')}`;
  const email = `e2e-${crypto.randomUUID()}@example.test`;
  const password = 'E2e-Demo-Password-2026!';
  let accessToken = '';
  let certificateHash = '';

  it('exposes a healthy API and a consistent not-found envelope', async () => {
    const health = await request(app).get('/api/v1/health').expect(200);
    expect(health.body).toMatchObject({ success: true, data: { status: 'ok', service: 'mlrf-api' }, error: null });

    const missing = await request(app).get('/api/v1/route-that-does-not-exist').expect(404);
    expect(missing.body).toMatchObject({ success: false, data: null, error: { code: 'NOT_FOUND' } });
  });

  it('rejects protected requests without a bearer token', async () => {
    const response = await request(app).get('/api/v1/auth/me').expect(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('completes registration, OTP, profile, tier, payment, and certificate verification', async () => {
    const registration = await request(app).post('/api/v1/auth/register').send({
      name: 'E2E Demo Subscriber', phone, email, password,
    }).expect(201);
    expect(registration.body.data.user.email).toBe(email);

    const invalidOtp = await request(app).post('/api/v1/auth/verify-otp').send({ phone, code: '000000' }).expect(400);
    expect(invalidOtp.body.error.code).toBe('OTP_INVALID');

    await request(app).post('/api/v1/auth/verify-otp').send({ phone, code: '123456' }).expect(200);

    const login = await request(app).post('/api/v1/auth/login').send({ email, password }).expect(200);
    accessToken = login.body.data.accessToken;
    expect(accessToken).toBeTruthy();

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(me.body.data.user.email).toBe(email);

    await request(app).put('/api/v1/subscriber/profile').set('Authorization', `Bearer ${accessToken}`).send({
      nationalId: '29901011234567', governorate: 'Cairo', entityType: 'individual',
    }).expect(200);

    const tier = await request(app).post('/api/v1/subscriber/select-tier').set('Authorization', `Bearer ${accessToken}`).send({
      tierId: 'gp', entityType: 'individual',
    }).expect(200);
    expect(tier.body.data.amount).toBeGreaterThan(0);

    const initiated = await request(app).post('/api/v1/payments/initiate').set('Authorization', `Bearer ${accessToken}`).send({}).expect(201);
    expect(initiated.body.data.payment.status).toBe('pending');

    const settled = await request(app).post(`/api/v1/payments/${initiated.body.data.payment.id}/simulate`)
      .set('Authorization', `Bearer ${accessToken}`).send({ outcome: 'success' }).expect(200);
    expect(settled.body.data.payment.status).toBe('paid');
    expect(settled.body.data.certificate.qrHash).toBeTruthy();
    certificateHash = settled.body.data.certificate.qrHash;

    const certificates = await request(app).get('/api/v1/certificates/me').set('Authorization', `Bearer ${accessToken}`).expect(200);
    expect(certificates.body.data).toHaveLength(1);

    const verified = await request(app).get(`/api/v1/public/verify/${certificateHash}`).expect(200);
    expect(verified.body.data.result).toBe('VALID');
    expect(verified.body.data.name).toContain('E2E');
  });

  it('enforces role permissions on protected admin endpoints', async () => {
    const subscriber = await request(app).post('/api/v1/auth/login').send({ email, password }).expect(200);
    const response = await request(app).get('/api/v1/dev/sms-inbox')
      .set('Authorization', `Bearer ${subscriber.body.data.accessToken}`).expect(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  afterAll(() => {
    // Demo state is process-local. The unique fixture avoids collisions with other tests.
    accessToken = '';
    certificateHash = '';
  });
});
