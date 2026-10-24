/** Opaque URL-safe token; only its SHA-256 digest should be persisted. */
export declare function generateCompletionToken(): string;
export declare function hashCompletionToken(token: string): string;
export declare function isWellFormedCompletionToken(token: string): boolean;
export declare function completionTokenExpiry(now?: Date): Date;
