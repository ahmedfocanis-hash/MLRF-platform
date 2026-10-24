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
    const reshaper = arabicReshaper.convertArabic ? arabicReshaper : (arabicReshaper.default || arabicReshaper);
    const reshapedText = typeof reshaper.convertArabic === 'function'
        ? reshaper.convertArabic(String(text))
        : (typeof reshaper === 'function' ? reshaper(String(text)) : String(text));
    const embeddingLevels = bidi.getEmbeddingLevels(reshapedText, 'rtl');
    const visualText = bidi.getReorderedString(reshapedText, embeddingLevels);
    return visualText;
}
function wrapAndFormatArabic(doc, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentWords = [];
    for (const word of words) {
        const testWords = [...currentWords, word];
        const testFormatted = formatArabic(testWords.join(' '));
        if (doc.widthOfString(testFormatted) > maxWidth && currentWords.length > 0) {
            lines.push(formatArabic(currentWords.join(' ')));
            currentWords = [word];
        }
        else {
            currentWords = testWords;
        }
    }
    if (currentWords.length > 0) {
        lines.push(formatArabic(currentWords.join(' ')));
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
        margin: 15,
        autoFirstPage: true,
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
        width: 92,
        margin: 1,
        color: { dark: '#0a3a40', light: '#ffffff' },
    });
    const pageWidth = doc.page.width; // 595.28
    const pageHeight = doc.page.height; // 841.89
    // Outer decorative border (Dual frame: Primary Teal & Accent Gold)
    doc.save();
    doc.lineWidth(2.5).strokeColor('#0f766e');
    doc.rect(16, 16, pageWidth - 32, pageHeight - 32).stroke();
    doc.lineWidth(1).strokeColor('#d97706');
    doc.rect(20, 20, pageWidth - 40, pageHeight - 40).stroke();
    doc.restore();
    // Official State & Fund Header
    doc.font('Amiri-Bold').fontSize(15).fillColor('#0f3e46');
    doc.text(formatArabic('جمهورية مصر العربية'), 30, 32, { align: 'center', width: pageWidth - 60, lineBreak: false });
    doc.font('Amiri-Bold').fontSize(12.5).fillColor('#0d9488');
    doc.text(formatArabic('الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الاخطاء الطبية'), 30, 54, { align: 'center', width: pageWidth - 60, lineBreak: false });
    doc.font('Amiri').fontSize(9).fillColor('#4b5563');
    doc.text(formatArabic('صادر طبقاً لأحكام قانون تنظيم المسئولية الطبية وسلامة المريض رقم 13 لسنة 2025 ولائحته التنفيذية'), 30, 74, { align: 'center', width: pageWidth - 60, lineBreak: false });
    // Divider
    doc.save();
    doc.lineWidth(1).strokeColor('#0d9488');
    doc.moveTo(50, 92).lineTo(pageWidth - 50, 92).stroke();
    doc.restore();
    // Title badge
    doc.save();
    doc.roundedRect(45, 98, pageWidth - 90, 32, 5).fillAndStroke('#f0fdfa', '#0d9488');
    doc.restore();
    doc.font('Amiri-Bold').fontSize(13.5).fillColor('#0f766e');
    doc.text(formatArabic('وثيقة تغطية مخاطر المسؤولية الطبية الرسمية المعتمدة'), 45, 105, {
        align: 'center',
        width: pageWidth - 90,
        lineBreak: false,
    });
    // Certification statement
    doc.font('Amiri').fontSize(9.5).fillColor('#1f2937');
    doc.text(formatArabic('تشهد إدارة الصندوق بأن العضو المذكور أدناه مسجل ومقيد رسمياً ومسدد لاشتراكات الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الاخطاء الطبية:'), 30, 138, { align: 'center', width: pageWidth - 60, lineBreak: false });
    // Status mapping
    const upperStatus = String(status || '').toUpperCase();
    let statusText = 'سارية ومطابقة — سداد معتمد رسمياً';
    if (upperStatus.includes('EXPIRE')) {
        statusText = 'منتهية الصلاحية — يلزم تجديد الاشتراك';
    }
    else if (upperStatus.includes('PENDING') || upperStatus.includes('INCOMPLETE')) {
        statusText = 'قيد المراجعة والاستيفاء';
    }
    // Details box (Table)
    const boxTop = 158;
    const boxHeight = 146;
    doc.save();
    doc.roundedRect(36, boxTop, pageWidth - 72, boxHeight, 6).fillAndStroke('#f8fafc', '#cbd5e1');
    doc.restore();
    const rows = [
        { label: 'رقم وثيقة التغطية المعتمدة:', value: certNumber },
        { label: 'اسم الطبيب / المنشأة المسجلة:', value: holderName },
        { label: 'التخصص الطبي والفئة:', value: specialty },
        { label: 'فترة التغطية التأمينية:', value: `من ${issuedAt} حتى ${expiresAt} (سنة مالية كاملة)` },
        { label: 'موقف سريان التغطية القانونية:', value: statusText },
    ];
    let currentY = boxTop + 10;
    rows.forEach((r, idx) => {
        if (idx > 0) {
            doc.save();
            doc.lineWidth(0.5).strokeColor('#e2e8f0');
            doc.moveTo(46, currentY - 3).lineTo(pageWidth - 46, currentY - 3).stroke();
            doc.restore();
        }
        // Right label
        doc.font('Amiri-Bold').fontSize(9.5).fillColor('#334155');
        doc.text(formatArabic(r.label), pageWidth - 250, currentY, { width: 200, align: 'right', lineBreak: false });
        // Left value
        const isStatus = idx === 4;
        doc.font(isStatus ? 'Amiri-Bold' : 'Amiri').fontSize(9.5).fillColor(isStatus ? '#059669' : '#0f172a');
        doc.text(formatArabic(r.value), 46, currentY, { width: pageWidth - 305, align: 'right', lineBreak: false });
        currentY += 26;
    });
    // Statutory Legal Attestation Box
    const attestationTop = 314;
    const attestationHeight = 84;
    doc.save();
    doc.roundedRect(36, attestationTop, pageWidth - 72, attestationHeight, 6).fillAndStroke('#fefce8', '#fef08a');
    doc.restore();
    doc.font('Amiri-Bold').fontSize(10).fillColor('#854d0e');
    doc.text(formatArabic('الإقرار القانوني والصفة الرسمية:'), 50, attestationTop + 8, {
        width: pageWidth - 100,
        align: 'right',
        lineBreak: false,
    });
    doc.font('Amiri').fontSize(8.8).fillColor('#475569');
    const attestationText = 'تفيد هذه الوثيقة باستيفاء العضو لكافة اشتراطات القيد والتسجيل وسداد الاشتراكات المقررة قانوناً طبقاً لأحكام القانون رقم (13) لسنة 2025 وقرار رئيس مجلس الوزراء رقم (303) لسنة 2025. توفر هذه الوثيقة تغطية قانونية وتأمينية رسمية ضد مخاطر وأضرار الأخطاء المهنية الطبية تحت إشراف وإدارة مجلس إدارة الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الاخطاء الطبية، وتعتد بها لجان التفتيش والعلاج الحر وجهات التحقيق القضائي والإداري.';
    const attLines = wrapAndFormatArabic(doc, attestationText, pageWidth - 100);
    let attY = attestationTop + 26;
    for (const line of attLines) {
        doc.text(line, 50, attY, { width: pageWidth - 100, align: 'right', lineBreak: false });
        attY += 14;
    }
    // Live QR Verification Box
    const qrBoxTop = 408;
    const qrBoxHeight = 110;
    doc.save();
    doc.roundedRect(36, qrBoxTop, pageWidth - 72, qrBoxHeight, 6).fillAndStroke('#f0fdf4', '#bbf7d0');
    doc.restore();
    // QR Code Image on left
    doc.image(qrBuffer, 46, qrBoxTop + 9, { width: 92, height: 92 });
    // Verification instructions on right
    doc.font('Amiri-Bold').fontSize(10).fillColor('#166534');
    doc.text(formatArabic('منظومة التحقق الرقمي اللحظي (QR Verification)'), 150, qrBoxTop + 10, {
        width: pageWidth - 195,
        align: 'right',
        lineBreak: false,
    });
    doc.font('Amiri').fontSize(8.8).fillColor('#1e293b');
    const qrDescription = 'يمكن لمسؤولي التفتيش الصحي، اللجان القضائية، والمنشآت الطبية مسح الرمز الإلكتروني المقابل عبر الهاتف المحمول للتحقق اللحظي المباشر من سريان وصحة بيانات هذه الوثيقة في السجلات المركزية للصندوق.';
    const qrLines = wrapAndFormatArabic(doc, qrDescription, pageWidth - 195);
    let qrTextY = qrBoxTop + 28;
    for (const line of qrLines) {
        doc.text(line, 150, qrTextY, { width: pageWidth - 195, align: 'right', lineBreak: false });
        qrTextY += 14;
    }
    doc.font('Amiri-Bold').fontSize(8).fillColor('#0d9488');
    doc.text(formatArabic('الرابط الرقمي المباشر للوثيقة:'), 150, qrTextY + 2, {
        width: pageWidth - 195,
        align: 'right',
        lineBreak: false,
    });
    doc.font('Amiri').fontSize(7.5).fillColor('#0284c7');
    doc.text(verificationUrl, 150, qrTextY + 15, {
        width: pageWidth - 195,
        align: 'right',
        lineBreak: false,
    });
    // Bottom Official Seals and Signatures
    const footerTop = 532;
    // Right column: Fund Executive Seal
    doc.font('Amiri-Bold').fontSize(10).fillColor('#0f3e46');
    doc.text(formatArabic('خاتم اعتماد الصندوق الرسمي'), pageWidth - 240, footerTop, { width: 190, align: 'center', lineBreak: false });
    doc.font('Amiri').fontSize(7.5).fillColor('#64748b');
    doc.text(formatArabic('الصندوق الحكومي للتأمين ضد الأخطار الناجمة عن الاخطاء الطبية'), pageWidth - 240, footerTop + 18, { width: 190, align: 'center', lineBreak: false });
    doc.text(formatArabic('جمهورية مصر العربية'), pageWidth - 240, footerTop + 32, { width: 190, align: 'center', lineBreak: false });
    // Center: Official Stamp circle
    doc.save();
    doc.lineWidth(1.2).strokeColor('#0d9488');
    doc.circle(pageWidth / 2, footerTop + 28, 26).stroke();
    doc.restore();
    doc.font('Amiri-Bold').fontSize(8).fillColor('#0d9488');
    doc.text(formatArabic('خاتم الصندوق'), pageWidth / 2 - 35, footerTop + 18, { width: 70, align: 'center', lineBreak: false });
    doc.text(formatArabic('المعتمد'), pageWidth / 2 - 35, footerTop + 30, { width: 70, align: 'center', lineBreak: false });
    // Left column: Registrar General Signature
    doc.font('Amiri-Bold').fontSize(10).fillColor('#0f3e46');
    doc.text(formatArabic('أمانة السجل الرقمي والتوثيق'), 46, footerTop, { width: 180, align: 'center', lineBreak: false });
    doc.font('Amiri').fontSize(7.8).fillColor('#64748b');
    doc.text(formatArabic('وحدة إصدار وثائق التغطية الإلكترونية'), 46, footerTop + 18, { width: 180, align: 'center', lineBreak: false });
    doc.text(formatArabic('وثيقة مؤمنة إلكترونياً'), 46, footerTop + 32, { width: 180, align: 'center', lineBreak: false });
    // Bottom Security Line
    doc.font('Amiri').fontSize(7.5).fillColor('#94a3b8');
    doc.text(formatArabic('وثيقة تغطية رسمية مؤمنة بقانون تنظيم المسئولية الطبية رقم 13 لسنة 2025 — أي كشط أو تعديل يُلغي صلاحية هذه الوثيقة ويعرض الفاعل للمساءلة الجنائية.'), 36, 810, { width: pageWidth - 72, align: 'center', lineBreak: false });
    doc.end();
    return donePromise;
}
//# sourceMappingURL=certificatePdf.js.map