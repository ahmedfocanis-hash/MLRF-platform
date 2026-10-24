import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import bidiFactory from 'bidi-js';
import arabicReshaper from 'arabic-reshaper';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bidi = bidiFactory();
export function formatArabic(text) {
    if (!text)
        return '';
    const reshaperFn = arabicReshaper.convertArabic || arabicReshaper.default?.convertArabic || arabicReshaper;
    const reshaped = reshaperFn(String(text));
    const embeddingLevels = bidi.getEmbeddingLevels(reshaped, 'rtl');
    return bidi.getReorderedString(reshaped, embeddingLevels);
}
function wrapAndFormatArabic(doc, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (doc.widthOfString(testLine) > maxWidth && currentLine) {
            lines.push(formatArabic(currentLine));
            currentLine = word;
        }
        else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        lines.push(formatArabic(currentLine));
    }
    return lines;
}
let cachedRegularFont = null;
let cachedBoldFont = null;
function loadFontBuffer(filename) {
    const candidateDirs = [
        path.join(__dirname, '..', 'assets', 'fonts'),
        path.join(__dirname, 'assets', 'fonts'),
        path.join(process.cwd(), 'apps', 'api', 'src', 'assets', 'fonts'),
        path.join(process.cwd(), 'apps', 'api', 'assets', 'fonts'),
        path.join(process.cwd(), 'src', 'assets', 'fonts'),
        path.join(process.cwd(), 'assets', 'fonts'),
    ];
    for (const dir of candidateDirs) {
        const fullPath = path.join(dir, filename);
        if (fs.existsSync(fullPath)) {
            return fs.readFileSync(fullPath);
        }
    }
    if (process.platform === 'win32') {
        const isBold = filename.toLowerCase().includes('bold');
        const winPath = path.join('C:\\Windows\\Fonts', isBold ? 'arialbd.ttf' : 'arial.ttf');
        if (fs.existsSync(winPath)) {
            return fs.readFileSync(winPath);
        }
    }
    throw new Error(`Font ${filename} not found in candidate paths.`);
}
function getRegularFont() {
    if (!cachedRegularFont) {
        cachedRegularFont = loadFontBuffer('Amiri-Regular.ttf');
    }
    return cachedRegularFont;
}
function getBoldFont() {
    if (!cachedBoldFont) {
        cachedBoldFont = loadFontBuffer('Amiri-Bold.ttf');
    }
    return cachedBoldFont;
}
export async function generateCertificatePdf(data) {
    const { certNumber = 'MLRF-2026-000123', holderName = 'د. أحمد محمد محمود', specialty = 'الأطباء البشريين - ممارس عام', issuedAt = '2026-01-01', expiresAt = '2027-01-01', status = 'VALID', verificationUrl = 'https://mlrf-platform-ykit.vercel.app/api/v1/certificates/MLRF-2026-000123/pdf', } = data;
    const regularFont = getRegularFont();
    const boldFont = getBoldFont();
    const doc = new PDFDocument({
        size: 'A4',
        margin: 36,
        info: {
            Title: 'وثيقة تغطية مخاطر المسؤولية الطبية',
            Author: 'الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الاخطاء الطبية - جمهورية مصر العربية',
            Subject: `شهادة تغطية معتمدة رقم ${certNumber}`,
            Keywords: 'MLRF, Medical Liability, Egypt, Certificate',
        },
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const donePromise = new Promise((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
    doc.registerFont('Amiri', regularFont);
    doc.registerFont('Amiri-Bold', boldFont);
    // Generate QR Code image buffer
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
        width: 104,
        margin: 1,
        color: { dark: '#0a3a40', light: '#ffffff' },
    });
    const pageWidth = doc.page.width; // 595.28
    const pageHeight = doc.page.height; // 841.89
    // Outer decorative border (Dual frame: Primary Teal & Accent Gold)
    doc.save();
    doc.lineWidth(3).strokeColor('#0f766e'); // Teal #0f766e
    doc.rect(20, 20, pageWidth - 40, pageHeight - 40).stroke();
    doc.lineWidth(1).strokeColor('#d97706'); // Gold #d97706
    doc.rect(24, 24, pageWidth - 48, pageHeight - 48).stroke();
    doc.restore();
    // Official State & Fund Header
    doc.font('Amiri-Bold').fontSize(16).fillColor('#0f3e46');
    doc.text(formatArabic('جمهورية مصر العربية'), 36, 40, { align: 'center', width: pageWidth - 72 });
    doc.font('Amiri-Bold').fontSize(13.5).fillColor('#0d9488');
    doc.text(formatArabic('الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الاخطاء الطبية'), 36, 65, { align: 'center', width: pageWidth - 72 });
    doc.font('Amiri').fontSize(9.5).fillColor('#4b5563');
    doc.text(formatArabic('صادر طبقاً لأحكام قانون تنظيم المسئولية الطبية وسلامة المريض رقم 13 لسنة 2025 ولائحته التنفيذية'), 36, 88, { align: 'center', width: pageWidth - 72 });
    // Divider
    doc.save();
    doc.lineWidth(1).strokeColor('#0d9488');
    doc.moveTo(60, 110).lineTo(pageWidth - 60, 110).stroke();
    doc.restore();
    // Title badge
    doc.save();
    doc.roundedRect(50, 120, pageWidth - 100, 36, 6).fillAndStroke('#f0fdfa', '#0d9488');
    doc.restore();
    doc.font('Amiri-Bold').fontSize(14.5).fillColor('#0f766e');
    doc.text(formatArabic('وثيقة تغطية مخاطر المسؤولية الطبية الرسمية المعتمدة'), 50, 127, {
        align: 'center',
        width: pageWidth - 100,
    });
    // Certification statement
    doc.font('Amiri').fontSize(10).fillColor('#1f2937');
    doc.text(formatArabic('تشهد إدارة الصندوق بأن العضو المذكور أدناه مسجل ومقيد رسمياً ومسدد لاشتراكات الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الاخطاء الطبية:'), 36, 172, { align: 'center', width: pageWidth - 72 });
    // Status mapping
    const upperStatus = String(status || '').toUpperCase();
    let statusText = 'سارية ومطابقة — سداد معتمد رسمياً';
    if (upperStatus.includes('EXPIRE')) {
        statusText = 'منتهية الصلاحية — يلزم تجديد الاشتراك';
    }
    else if (upperStatus.includes('PENDING') || upperStatus.includes('INCOMPLETE')) {
        statusText = 'قيد المراجعة والاستيفاء';
    }
    // Details box
    const boxTop = 198;
    const boxHeight = 182;
    doc.save();
    doc.roundedRect(40, boxTop, pageWidth - 80, boxHeight, 8).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.restore();
    const rows = [
        { label: 'رقم وثيقة التغطية المعتمدة:', value: certNumber },
        { label: 'اسم الطبيب / المنشأة المسجلة:', value: holderName },
        { label: 'التخصص الطبي والفئة:', value: specialty },
        { label: 'فترة التغطية التأمينية:', value: `من ${issuedAt} حتى ${expiresAt} (سنة مالية كاملة)` },
        { label: 'موقف سريان التغطية القانونية:', value: statusText },
    ];
    let currentY = boxTop + 14;
    rows.forEach((r, idx) => {
        if (idx > 0) {
            doc.save();
            doc.lineWidth(0.5).strokeColor('#e2e8f0');
            doc.moveTo(50, currentY - 5).lineTo(pageWidth - 50, currentY - 5).stroke();
            doc.restore();
        }
        // Right label
        doc.font('Amiri-Bold').fontSize(10.5).fillColor('#334155');
        doc.text(formatArabic(r.label), pageWidth - 260, currentY, { width: 210, align: 'right' });
        // Left value
        const isStatus = idx === 4;
        doc.font(isStatus ? 'Amiri-Bold' : 'Amiri').fontSize(10.5).fillColor(isStatus ? '#059669' : '#0f172a');
        doc.text(formatArabic(r.value), 50, currentY, { width: pageWidth - 320, align: 'right' });
        currentY += 32;
    });
    // Statutory Legal Attestation Box
    const attestationTop = 398;
    const attestationHeight = 118;
    doc.save();
    doc.roundedRect(40, attestationTop, pageWidth - 80, attestationHeight, 6).fillAndStroke('#fefce8', '#fef08a');
    doc.restore();
    doc.font('Amiri-Bold').fontSize(11).fillColor('#854d0e');
    doc.text(formatArabic('الإقرار القانوني والصفة الرسمية:'), 55, attestationTop + 10, {
        width: pageWidth - 110,
        align: 'right',
    });
    doc.font('Amiri').fontSize(9.5).fillColor('#475569');
    const attestationText = 'تفيد هذه الوثيقة باستيفاء العضو لكافة اشتراطات القيد والتسجيل وسداد الاشتراكات المقررة قانوناً طبقاً لأحكام القانون رقم (13) لسنة 2025 وقرار رئيس مجلس الوزراء رقم (303) لسنة 2025. توفر هذه الوثيقة تغطية قانونية وتأمينية رسمية ضد مخاطر وأضرار الأخطاء المهنية الطبية تحت إشراف وإدارة مجلس إدارة الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الاخطاء الطبية، وتعتد بها لجان التفتيش والعلاج الحر وجهات التحقيق القضائي والإداري.';
    const attLines = wrapAndFormatArabic(doc, attestationText, pageWidth - 110);
    let attY = attestationTop + 32;
    for (const line of attLines) {
        doc.text(line, 55, attY, { width: pageWidth - 110, align: 'right' });
        attY += 16;
    }
    // Live QR Verification Box
    const qrBoxTop = 530;
    const qrBoxHeight = 126;
    doc.save();
    doc.roundedRect(40, qrBoxTop, pageWidth - 80, qrBoxHeight, 6).fillAndStroke('#f0fdf4', '#bbf7d0');
    doc.restore();
    // QR Code Image on left
    doc.image(qrBuffer, 52, qrBoxTop + 11, { width: 104, height: 104 });
    // Verification instructions on right
    doc.font('Amiri-Bold').fontSize(11).fillColor('#166534');
    doc.text(formatArabic('منظومة التحقق الرقمي اللحظي (QR Verification)'), 175, qrBoxTop + 14, {
        width: pageWidth - 230,
        align: 'right',
    });
    doc.font('Amiri').fontSize(9.5).fillColor('#1e293b');
    const qrDescription = 'يمكن لمسؤولي التفتيش الصحي، اللجان القضائية، والمنشآت الطبية مسح الرمز الإلكتروني المقابل عبر الهاتف المحمول للتحقق اللحظي المباشر من سريان وصحة بيانات هذه الوثيقة في السجلات المركزية للصندوق.';
    const qrLines = wrapAndFormatArabic(doc, qrDescription, pageWidth - 230);
    let qrTextY = qrBoxTop + 36;
    for (const line of qrLines) {
        doc.text(line, 175, qrTextY, { width: pageWidth - 230, align: 'right' });
        qrTextY += 16;
    }
    doc.font('Amiri-Bold').fontSize(8.5).fillColor('#0d9488');
    doc.text(formatArabic('الرابط الرقمي المباشر للوثيقة:'), 175, qrTextY + 4, {
        width: pageWidth - 230,
        align: 'right',
    });
    doc.font('Amiri').fontSize(8).fillColor('#0284c7');
    doc.text(verificationUrl, 175, qrTextY + 18, {
        width: pageWidth - 230,
        align: 'right',
    });
    // Bottom Official Seals and Signatures
    const footerTop = 684;
    // Right column: Fund Executive Seal
    doc.font('Amiri-Bold').fontSize(10.5).fillColor('#0f3e46');
    doc.text(formatArabic('خاتم اعتماد الصندوق الرسمي'), pageWidth - 250, footerTop, { width: 210, align: 'center' });
    doc.font('Amiri').fontSize(8).fillColor('#64748b');
    doc.text(formatArabic('الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الاخطاء الطبية'), pageWidth - 250, footerTop + 20, { width: 210, align: 'center' });
    doc.text(formatArabic('جمهورية مصر العربية'), pageWidth - 250, footerTop + 36, { width: 210, align: 'center' });
    // Center: Official Stamp circle
    doc.save();
    doc.lineWidth(1.5).strokeColor('#0d9488');
    doc.circle(pageWidth / 2, footerTop + 35, 30).stroke();
    doc.restore();
    doc.font('Amiri-Bold').fontSize(8.5).fillColor('#0d9488');
    doc.text(formatArabic('خاتم الصندوق'), pageWidth / 2 - 40, footerTop + 24, { width: 80, align: 'center' });
    doc.text(formatArabic('المعتمد'), pageWidth / 2 - 40, footerTop + 38, { width: 80, align: 'center' });
    // Left column: Registrar General Signature
    doc.font('Amiri-Bold').fontSize(11).fillColor('#0f3e46');
    doc.text(formatArabic('أمانة السجل الرقمي والتوثيق'), 50, footerTop, { width: 190, align: 'center' });
    doc.font('Amiri').fontSize(9).fillColor('#64748b');
    doc.text(formatArabic('وحدة إصدار وثائق التغطية الإلكترونية'), 50, footerTop + 20, { width: 190, align: 'center' });
    doc.text(formatArabic('وثيقة مؤمنة إلكترونياً'), 50, footerTop + 36, { width: 190, align: 'center' });
    // Bottom Security Line
    doc.font('Amiri').fontSize(8).fillColor('#94a3b8');
    doc.text(formatArabic('وثيقة تغطية رسمية مؤمنة بقانون تنظيم المسئولية الطبية رقم 13 لسنة 2025 — أي كشط أو تعديل يُلغي صلاحية هذه الوثيقة ويعرض الفاعل للمساءلة الجنائية.'), 40, pageHeight - 34, { width: pageWidth - 80, align: 'center' });
    doc.end();
    return donePromise;
}
//# sourceMappingURL=certificatePdf.js.map