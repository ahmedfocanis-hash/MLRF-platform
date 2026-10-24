export type AllowedDocumentMime = 'application/pdf' | 'image/jpeg' | 'image/png';
export type StoredDocument = {
    key: string;
    mimeType: AllowedDocumentMime;
    size: number;
    originalName: string;
};
export interface StorageProvider {
    put(input: {
        buffer: Buffer;
        mimeType: AllowedDocumentMime;
        originalName: string;
    }): Promise<StoredDocument>;
}
export declare function detectDocumentMime(buffer: Buffer): AllowedDocumentMime | null;
export declare class LocalDiskStorageProvider implements StorageProvider {
    put(input: {
        buffer: Buffer;
        mimeType: AllowedDocumentMime;
        originalName: string;
    }): Promise<StoredDocument>;
}
