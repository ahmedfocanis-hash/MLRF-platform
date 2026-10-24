import { describe, expect, it } from 'vitest';
import { calculateFee } from '../services/feeEngine.js';

describe('calculateFee', () => {
  it('uses the server-owned tier fee and returns a transparent breakdown', () => {
    expect(calculateFee('human_doctor_gp')).toEqual({
      tierId: 'human_doctor_gp',
      baseFee: 240,
      riskSurcharge: 0,
      lateRenewalPenalty: 0,
      total: 240,
      risk: 'standard',
    });
  });
  it('charges specialist more than a general practitioner', () => {
    expect(calculateFee('human_doctor_specialist').total).toBeGreaterThan(
      calculateFee('human_doctor_gp').total,
    );
  });
  it('adds the configured late renewal penalty', () => {
    expect(calculateFee('human_doctor_gp', { lateRenewal: true }).total).toBe(247);
  });
  it('rejects unknown tiers', () => {
    expect(() => calculateFee('not-a-tier')).toThrow('Unknown specialty tier');
  });
});
