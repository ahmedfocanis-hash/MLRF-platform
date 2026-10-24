import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
export function detectDocumentMime(buffer) {
    if (buffer.subarray(0, 5).toString('ascii') === '%PDF-')
        return 'application/pdf';
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
        return 'image/jpeg';
    if (buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
        return 'image/png';
    return null;
}
export class LocalDiskStorageProvider {
    async put(input) {
        const detected = detectDocumentMime(input.buffer);
        if (!detected || detected !== input.mimeType)
            throw new Error('Document content does not match an allowed file type');
        if (input.buffer.length < 1 || input.buffer.length > 5 * 1024 * 1024)
            throw new Error('Document must be between 1 byte and 5 MB');
        const key = `${crypto.randomUUID()}.${extensionFor(detected)}`;
        const root = path.resolve(env.UPLOAD_DIR);
        await mkdir(root, { recursive: true, mode: 0o700 });
        await writeFile(path.join(root, key), input.buffer, { flag: 'wx', mode: 0o600 });
        return {
            key,
            mimeType: detected,
            size: input.buffer.length,
            originalName: path.basename(input.originalName).slice(0, 180),
        };
    }
}
function extensionFor(mimeType) {
    if (mimeType === 'application/pdf')
        return 'pdf';
    return mimeType === 'image/jpeg' ? 'jpg' : 'png';
}
//# sourceMappingURL=storage.js.map