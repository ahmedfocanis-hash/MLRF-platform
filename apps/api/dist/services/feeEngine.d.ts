export type FeeBreakdown = {
    tierId: string;
    baseFee: number;
    riskSurcharge: number;
    lateRenewalPenalty: number;
    total: number;
    risk: string;
};
/** Server-owned fee calculation. Client-provided totals are intentionally not accepted. */
export declare function calculateFee(tierId: string, options?: {
    lateRenewal?: boolean;
}): FeeBreakdown;
