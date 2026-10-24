import { describe, expect, it } from 'vitest';
import { completionTokenExpiry, generateCompletionToken, hashCompletionToken, isWellFormedCompletionToken, } from '../services/completionTokens.js';
describe('bank-import completion tokens', () => {
    it('generates URL-safe 256-bit tokens without persisting the raw value', () => {
        const token = generateCompletionToken();
        expect(isWellFormedCompletionToken(token)).toBe(true);
        expect(hashCompletionToken(token)).toMatch(/^[a-f0-9]{64}$/);
        expect(hashCompletionToken(token)).not.toBe(token);
    });
    it('hashes consistently and changes the digest for a different token', () => {
        expect(hashCompletionToken('example-token')).toBe(hashCompletionToken('example-token'));
        expect(hashCompletionToken('example-token')).not.toBe(hashCompletionToken('different-token'));
    });
    it('sets the default completion-token expiry to exactly 72 hours', () => {
        const now = new Date('2026-01-01T00:00:00.000Z');
        expect(completionTokenExpiry(now).toISOString()).toBe('2026-01-04T00:00:00.000Z');
    });
    it('rejects malformed token strings', () => {
        expect(isWellFormedCompletionToken('short')).toBe(false);
        expect(isWellFormedCompletionToken('x'.repeat(43) + '!')).toBe(false);
    });
});
//# sourceMappingURL=completionTokens.test.js.map