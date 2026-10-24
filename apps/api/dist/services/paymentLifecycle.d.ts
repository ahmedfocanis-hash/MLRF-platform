import mongoose, { type ClientSession } from 'mongoose';
export type PaymentOutcome = 'success' | 'failure';
export declare function issueCertificate(userId: mongoose.Types.ObjectId, subscriptionId: mongoose.Types.ObjectId, session?: ClientSession): Promise<any>;
/**
 * Applies a payment outcome in a MongoDB transaction. The Mongo deployment must
 * support transactions (for example, a replica set). If any related write fails,
 * payment, subscription, user, certificate and audit changes roll back together.
 */
export declare function settleMongoPayment(paymentId: string, outcome: PaymentOutcome, webhookReference?: string): Promise<any>;
export declare function isValidWebhookSignature(body: unknown, signature: string): boolean;
