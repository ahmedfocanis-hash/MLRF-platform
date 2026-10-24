export interface CertificatePdfData {
    certNumber: string;
    holderName?: string | undefined;
    specialty?: string | undefined;
    issuedAt?: string | undefined;
    expiresAt?: string | undefined;
    status?: string | undefined;
    verificationUrl?: string | undefined;
}
export declare function generateCertificatePdf(data: CertificatePdfData): Buffer;
