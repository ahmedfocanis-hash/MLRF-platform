function escapePdf(str) {
    return String(str || '')
        .replace(/\\/g, '\\\\')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)');
}
export function generateCertificatePdf(data) {
    const { certNumber = 'MLRF-2026-000123', holderName = 'Dr. Demo User', specialty = 'General Practitioner (GP)', issuedAt = '2026-01-01', expiresAt = '2027-01-01', status = 'VALID', verificationUrl = 'https://mlrf-platform-ykit.vercel.app/api/v1/certificates/MLRF-2026-000123/pdf', } = data;
    const objects = [];
    function addObj(content) {
        objects.push(content);
        return objects.length;
    }
    const lines = [
        'q',
        // Outer decorative border
        '0.08 0.45 0.42 rg',
        '20 20 555.28 801.89 re s',
        '0.76 0.6 0.2 rg',
        '24 24 547.28 793.89 re s',
        'Q',
        // Header block
        'BT',
        '/F2 18 Tf',
        '0.08 0.25 0.35 rg',
        '50 780 Td',
        '(ARAB REPUBLIC OF EGYPT) Tj',
        'ET',
        'BT',
        '/F2 15 Tf',
        '0.08 0.5 0.42 rg',
        '50 755 Td',
        '(MEDICAL LIABILITY RISK FUND - MLRF) Tj',
        'ET',
        'BT',
        '/F1 10 Tf',
        '0.35 0.35 0.35 rg',
        '50 738 Td',
        '(Established pursuant to Egyptian Medical Liability Law No. 13 of 2025) Tj',
        'ET',
        // Separator line
        'q',
        '0.75 0.8 0.82 RG',
        '1.5 w',
        '50 722 m 545 722 l S',
        'Q',
        // Title
        'BT',
        '/F2 17 Tf',
        '0.1 0.2 0.4 rg',
        '50 685 Td',
        '(OFFICIAL CERTIFICATE OF MEDICAL LIABILITY COVERAGE) Tj',
        'ET',
        // Certificate Details Box
        'q',
        '0.96 0.98 0.98 rg',
        '50 480 495 185 re f',
        '0.82 0.88 0.88 RG',
        '1.2 w',
        '50 480 495 185 re s',
        'Q',
        // Details Rows
        'BT',
        '/F1 11 Tf',
        '0.3 0.3 0.3 rg',
        '70 635 Td',
        '(Certificate Number:) Tj',
        '0 0 0 rg',
        '/F2 12 Tf',
        '145 0 Td',
        '(' + escapePdf(certNumber) + ') Tj',
        'ET',
        'BT',
        '/F1 11 Tf',
        '0.3 0.3 0.3 rg',
        '70 605 Td',
        '(Subscriber / Doctor:) Tj',
        '0 0 0 rg',
        '/F2 12 Tf',
        '145 0 Td',
        '(' + escapePdf(holderName) + ') Tj',
        'ET',
        'BT',
        '/F1 11 Tf',
        '0.3 0.3 0.3 rg',
        '70 575 Td',
        '(Medical Specialty:) Tj',
        '0 0 0 rg',
        '/F2 12 Tf',
        '145 0 Td',
        '(' + escapePdf(specialty) + ') Tj',
        'ET',
        'BT',
        '/F1 11 Tf',
        '0.3 0.3 0.3 rg',
        '70 545 Td',
        '(Validity Period:) Tj',
        '0 0 0 rg',
        '/F2 11 Tf',
        '145 0 Td',
        '(' + escapePdf(issuedAt + '  until  ' + expiresAt) + ') Tj',
        'ET',
        'BT',
        '/F1 11 Tf',
        '0.3 0.3 0.3 rg',
        '70 515 Td',
        '(Coverage Status:) Tj',
        '0.05 0.55 0.25 rg',
        '/F2 12 Tf',
        '145 0 Td',
        '(' + escapePdf(status + ' - ACTIVE & COMPLIANT') + ') Tj',
        'ET',
        // Attestation paragraph
        'BT',
        '/F2 11 Tf',
        '0.15 0.15 0.15 rg',
        '50 440 Td',
        '(STATUTORY LEGAL ATTESTATION) Tj',
        'ET',
        'BT',
        '/F1 10 Tf',
        '0.3 0.3 0.3 rg',
        '50 420 Td',
        '(This certificate verifies that the aforementioned practitioner / healthcare facility has registered) Tj',
        '0 -15 Td',
        '(and satisfied all mandatory statutory contribution requirements in accordance with Egyptian) Tj',
        '0 -15 Td',
        '(Medical Liability Law No. 13 of 2025 and Prime Ministerial Decree No. 303 of 2025.) Tj',
        '0 -18 Td',
        '(The coverage provides statutory indemnification against professional medical liability risks) Tj',
        '0 -15 Td',
        '(under the governance and supervision of the Medical Liability Risk Fund Board.) Tj',
        'ET',
        // Verification audit box
        'q',
        '0.95 0.97 0.98 rg',
        '50 240 495 85 re f',
        '0.8 0.85 0.88 RG',
        '1 w',
        '50 240 495 85 re s',
        'Q',
        'BT',
        '/F2 10 Tf',
        '0.08 0.45 0.42 rg',
        '70 300 Td',
        '(LIVE QR DIGITAL AUDIT TRAIL) Tj',
        'ET',
        'BT',
        '/F1 9 Tf',
        '0.3 0.3 0.3 rg',
        '70 280 Td',
        '(Official Live Document URL for Mobile Scanners & Inspectors:) Tj',
        'ET',
        'BT',
        '/F2 9 Tf',
        '0.1 0.3 0.6 rg',
        '70 262 Td',
        '(' + escapePdf(verificationUrl) + ') Tj',
        'ET',
        // Bottom Seals
        'BT',
        '/F2 10 Tf',
        '0.2 0.2 0.2 rg',
        '50 160 Td',
        '(Executive Authority Seal) Tj',
        '340 0 Td',
        '(General Registrar Signature) Tj',
        'ET',
        'BT',
        '/F1 9 Tf',
        '0.4 0.4 0.4 rg',
        '50 145 Td',
        '(Medical Liability Risk Fund) Tj',
        '340 0 Td',
        '(Digital Authentication Bureau) Tj',
        'ET',
    ];
    const streamContent = lines.join('\n');
    const streamObj = '<< /Length ' + Buffer.byteLength(streamContent) + ' >>\nstream\n' + streamContent + '\nendstream';
    addObj('<< /Type /Catalog /Pages 2 0 R >>');
    addObj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    addObj('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>');
    addObj(streamObj);
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const header = '%PDF-1.4\n';
    let body = '';
    const offsets = [0];
    let currentOffset = Buffer.byteLength(header);
    for (let i = 0; i < objects.length; i++) {
        offsets.push(currentOffset);
        const objStr = (i + 1) + ' 0 obj\n' + objects[i] + '\nendobj\n';
        body += objStr;
        currentOffset += Buffer.byteLength(objStr);
    }
    const xrefOffset = currentOffset;
    let xref = 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i++) {
        xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    const trailer = 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n';
    return Buffer.from(header + body + xref + trailer);
}
//# sourceMappingURL=certificatePdf.js.map