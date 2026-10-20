import {describe, expect, it} from 'vitest';
import {calculateFee} from '../services/feeEngine.js';

describe('calculateFee', () => {
  it('uses the server-owned tier fee and returns a transparent breakdown', () => {
    expect(calculateFee('gp')).toEqual({tierId: 'gp', baseFee: 1800, riskSurcharge: 0, lateRenewalPenalty: 0, total: 1800, risk: 'standard'});
  });
  it('charges surgery more than a general practitioner', () => {
    expect(calculateFee('surgery').total).toBeGreaterThan(calculateFee('gp').total);
  });
  it('adds the configured late renewal penalty', () => {
    expect(calculateFee('gp', {lateRenewal: true}).total).toBe(1854);
  });
  it('rejects unknown tiers', () => {
    expect(() => calculateFee('not-a-tier')).toThrow('Unknown specialty tier');
  });
});
