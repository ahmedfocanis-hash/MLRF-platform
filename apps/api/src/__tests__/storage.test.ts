import { describe, expect, it } from 'vitest';
import { detectDocumentMime } from '../providers/storage.js';

describe('document magic-byte validation', () => {
  it('recognizes PDF content independently of its filename', () => {
    expect(detectDocumentMime(Buffer.from('%PDF-1.7\n'))).toBe('application/pdf');
  });
  it('recognizes JPEG and PNG signatures', () => {
    expect(detectDocumentMime(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe('image/jpeg');
    expect(detectDocumentMime(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe('image/png');
  });
  it('rejects a renamed executable or arbitrary bytes', () => {
    expect(detectDocumentMime(Buffer.from('MZ executable'))).toBeNull();
    expect(detectDocumentMime(Buffer.alloc(0))).toBeNull();
  });
});
