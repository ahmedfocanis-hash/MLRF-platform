export type PaymentOutcome = 'success' | 'failure';
export declare function issueCertificate(userId: string | any, subscriptionId: string | any, session?: any): Promise<any>;
/**
 * Applies a payment outcome using Turso / libSQL.
 */
export declare function settleMongoPayment(paymentId: string, outcome: PaymentOutcome, webhookReference?: string): Promise<{
    payment: any;
    duplicate: boolean;
    certificate?: never;
    user?: never;
} | {
    payment: any;
    certificate: any;
    user: any;
    duplicate: boolean;
}>;
export declare const settleTursoPayment: typeof settleMongoPayment;
export declare function isValidWebhookSignature(body: unknown, signature: string): boolean;
