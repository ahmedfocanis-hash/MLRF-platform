import { DEMO_TIERS } from '@mlrf/shared';

export type FeeBreakdown = {
  tierId: string;
  baseFee: number;
  riskSurcharge: number;
  lateRenewalPenalty: number;
  total: number;
  risk: string;
};

/** Server-owned fee calculation. Client-provided totals are intentionally not accepted. */
export function calculateFee(tierId: string, options: { lateRenewal?: boolean } = {}): FeeBreakdown {
  const tier = DEMO_TIERS.find((candidate) => candidate.id === tierId);
  if (!tier) throw new Error('Unknown specialty tier');
  const riskValue = tier.risk as string;
  const riskSurcharge =
    riskValue === 'high'
      ? Math.round(tier.fee * 0.05)
      : riskValue === 'very-high'
        ? Math.round(tier.fee * 0.1)
        : 0;
  const lateRenewalPenalty = options.lateRenewal ? Math.round(tier.fee * 0.03) : 0;
  return {
    tierId,
    baseFee: tier.fee,
    riskSurcharge,
    lateRenewalPenalty,
    total: tier.fee + riskSurcharge + lateRenewalPenalty,
    risk: tier.risk,
  };
}
