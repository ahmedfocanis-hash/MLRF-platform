import { DEMO_TIERS } from '@mlrf/shared';
const adminRoles = [
    'super_admin',
    'finance_admin',
    'practitioner_analyst',
    'facility_analyst',
    'claims_admin',
];
export const users = [
    ...adminRoles.map((role, i) => ({
        id: `admin-${i + 1}`,
        name: [
            'Super Admin',
            'Finance Admin',
            'Practitioner Analyst',
            'Facility Analyst',
            'Claims Admin',
        ][i],
        email: `${role}@mlrf.demo`,
        phone: `0100000000${i + 1}`,
        role,
        status: 'active',
        governorate: 'Cairo',
        entityType: 'individual',
    })),
    {
        id: 'inspector-1',
        name: 'Ahmed Inspector',
        email: 'inspector@mlrf.demo',
        phone: '01099999999',
        role: 'inspector',
        status: 'active',
        governorate: 'Giza',
        entityType: 'individual',
    },
    {
        id: 'subscriber-1',
        name: 'د. أحمد محمد محمود',
        email: 'subscriber@mlrf.demo',
        phone: '01012345678',
        role: 'subscriber',
        status: 'active',
        governorate: 'Cairo',
        entityType: 'individual',
        tierId: 'human_doctor_gp',
        certificateNumber: 'MLRF-2026-000123',
    },
];
export const payments = [];
const rawClaimsData = [
    { doctor: 'د. طارق محمود الشناوي', hospital: 'مستشفى قصر العيني التعليمي', specialty: 'جراحة عامة', stage: 'Payout', awarded: 150000, paid: 150000, days: 12 },
    { doctor: 'د. منى عبد الرحمن إبراهيم', hospital: 'مستشفى عين شمس التخصصي', specialty: 'النساء والتوليد', stage: 'Court Verdict', awarded: 250000, paid: 0, days: 34 },
    { doctor: 'د. حسام الدين سليم', hospital: 'مستشفى دار الفؤاد', specialty: 'جراحة المخ والأعصاب', stage: 'Legal Review', awarded: 0, paid: 0, days: 18 },
    { doctor: 'د. نيفين مصطفى سامي', hospital: 'مستشفى السلام الدولي', specialty: 'التخدير والعناية المركزة', stage: 'Payout', awarded: 80000, paid: 80000, days: 8 },
    { doctor: 'د. هشام فؤاد بركات', hospital: 'مستشفى المواساة بالإسكندرية', specialty: 'جراحة العظام', stage: 'Court Verdict', awarded: 180000, paid: 0, days: 42 },
    { doctor: 'د. رانيا عصام الدين زكي', hospital: 'مستشفى المنصورة الجامعي', specialty: 'طب الأطفال وحديثي الولادة', stage: 'Claim Filed', awarded: 0, paid: 0, days: 6 },
    { doctor: 'د. وليد عبد المنعم صقر', hospital: 'المستشفى الجوي التخصصي', specialty: 'جراحة القلب والصدر', stage: 'Payout', awarded: 120000, paid: 120000, days: 25 },
    { doctor: 'د. دعاء فاروق رضوان', hospital: 'مستشفى وادي النيل', specialty: 'النساء والتوليد', stage: 'Court Verdict', awarded: 140000, paid: 0, days: 29 },
    { doctor: 'د. شريف عادل غنيم', hospital: 'مستشفى أسيوط الجامعي', specialty: 'جراحة عامة', stage: 'Legal Review', awarded: 0, paid: 0, days: 15 },
    { doctor: 'د. إيمان عبد العظيم حامد', hospital: 'مركز أورام طنطا', specialty: 'جراحة الأورام', stage: 'Payout', awarded: 200000, paid: 200000, days: 19 },
    { doctor: 'د. أحمد يسري النجار', hospital: 'مستشفى كليوباترا', specialty: 'طب وجراحة العيون', stage: 'Court Verdict', awarded: 210000, paid: 0, days: 38 },
    { doctor: 'د. لمياء توفيق مراد', hospital: 'مستشفى الأقصر الدولي', specialty: 'طب وجراحة الأسنان', stage: 'Incident', awarded: 0, paid: 0, days: 4 },
    { doctor: 'د. مصطفى كمال الجيار', hospital: 'مستشفى حميات العباسية', specialty: 'الباطنة العامة', stage: 'Payout', awarded: 90000, paid: 90000, days: 11 },
    { doctor: 'د. سهام رشاد بدر', hospital: 'مستشفى سوهاج التعليمي', specialty: 'النساء والتوليد', stage: 'Court Verdict', awarded: 95000, paid: 0, days: 22 },
    { doctor: 'د. تامر فاروق القاضي', hospital: 'مستشفى الهلال الأحمر', specialty: 'جراحة العظام', stage: 'Legal Review', awarded: 0, paid: 0, days: 16 },
    { doctor: 'د. نادية سراج الدين', hospital: 'مستشفى الزهراء الجامعي', specialty: 'التخدير والعناية المركزة', stage: 'Payout', awarded: 110000, paid: 110000, days: 14 },
    { doctor: 'د. عصام نبيل فهمي', hospital: 'مستشفى النزهة الدولي', specialty: 'جراحة عامة', stage: 'Court Verdict', awarded: 125000, paid: 0, days: 31 },
    { doctor: 'د. هالة عبد المجيد يوسف', hospital: 'مستشفى دمنهور التعليمي', specialty: 'النساء والتوليد', stage: 'Claim Filed', awarded: 0, paid: 0, days: 5 },
    { doctor: 'د. كريم حسن الألفي', hospital: 'مستشفى 6 أكتوبر للتأمين الصحي', specialty: 'ممارس عام', stage: 'Payout', awarded: 70000, paid: 70000, days: 9 },
    { doctor: 'د. ريهام كمال البنا', hospital: 'مستشفى الزقازيق الجامعي', specialty: 'طب الأطفال وحديثي الولادة', stage: 'Legal Review', awarded: 0, paid: 0, days: 21 },
    { doctor: 'د. أشرف فوزي والي', hospital: 'مستشفى بني سويف التخصصي', specialty: 'جراحة العظام', stage: 'Incident', awarded: 0, paid: 0, days: 3 },
    { doctor: 'د. داليا سمير المنشاوي', hospital: 'مستشفى قصر العيني التعليمي', specialty: 'جراحة عامة', stage: 'Payout', awarded: 160000, paid: 160000, days: 17 },
    { doctor: 'د. ياسر محمود الديب', hospital: 'مستشفى عين شمس التخصصي', specialty: 'النساء والتوليد', stage: 'Legal Review', awarded: 0, paid: 0, days: 13 },
    { doctor: 'د. سحر عبد الحميد شرف', hospital: 'مستشفى السلام الدولي', specialty: 'التخدير والعناية المركزة', stage: 'Claim Filed', awarded: 0, paid: 0, days: 7 },
    { doctor: 'د. عمرو عبد الله جودة', hospital: 'مستشفى دار الفؤاد', specialty: 'جراحة القلب والصدر', stage: 'Claim Filed', awarded: 0, paid: 0, days: 8 },
    { doctor: 'د. جيهان عزت زهران', hospital: 'مستشفى المواساة بالإسكندرية', specialty: 'الباطنة العامة', stage: 'Incident', awarded: 0, paid: 0, days: 2 },
    { doctor: 'د. إيهاب عبد المنعم حجازي', hospital: 'مستشفى أسوان الجامعي', specialty: 'جراحة العظام', stage: 'Claim Filed', awarded: 0, paid: 0, days: 6 },
    { doctor: 'د. نيرة طه الشافعي', hospital: 'مستشفى المنيا العام', specialty: 'النساء والتوليد', stage: 'Incident', awarded: 0, paid: 0, days: 1 },
];
export const claims = rawClaimsData.map((c, i) => ({
    id: `CLM-2026-${String(i + 1).padStart(4, '0')}`,
    doctor: c.doctor,
    hospital: c.hospital,
    specialty: c.specialty,
    stage: c.stage,
    awarded: c.awarded,
    paid: c.paid,
    beneficiary: 'المتضرر / ورثة المريض',
    daysInStage: c.days,
    createdAt: new Date(Date.UTC(2026, Math.floor(i / 3), 1 + (i % 25))).toISOString(),
}));
export const batches = [];
export const audit = [
    {
        id: 'a-1',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        user: 'Finance Admin',
        role: 'finance_admin',
        action: 'BULK_BATCH_COMMITTED',
        ip: '192.168.1.10',
        entity: 'دفعة سداد مؤسسي BATCH-2026-084 (نقابة الأطباء فرع القاهرة)',
    },
    {
        id: 'a-2',
        timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
        user: 'Claims Admin',
        role: 'claims_admin',
        action: 'PAYMENT_SUCCEEDED',
        ip: '192.168.1.18',
        entity: 'تحويل تعويض مطالبة رقم CLM-2026-0022 بمبلغ 160,000 ج.م',
    },
    {
        id: 'a-3',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        user: 'Super Admin',
        role: 'super_admin',
        action: 'EXPORT_REQUESTED',
        ip: '192.168.1.2',
        entity: 'تقرير التحليلات الشامل والمطالبات للربع الثالث Q3',
    },
    {
        id: 'a-4',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        user: 'Facility Analyst',
        role: 'facility_analyst',
        action: 'PROFILE_UPDATED',
        ip: '192.168.1.14',
        entity: 'اعتماد سريان وثيقة التغطية لمستشفى السلام الدولي (138 سرير)',
    },
    {
        id: 'a-5',
        timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
        user: 'Ahmed Inspector',
        role: 'inspector',
        action: 'INSPECTION_LOGGED',
        ip: '10.0.4.52',
        entity: 'محضر تفتيش ميداني دوري - مجمع عيادات المهندسين بالجيزة',
    },
    {
        id: 'a-6',
        timestamp: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
        user: 'Practitioner Analyst',
        role: 'practitioner_analyst',
        action: 'TIER_SELECTED',
        ip: '192.168.1.22',
        entity: 'اعتماد الشريحة التخصصية د. أحمد محمد محمود (MLRF-2026-000123)',
    },
    {
        id: 'a-7',
        timestamp: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        user: 'Claims Admin',
        role: 'claims_admin',
        action: 'PROFILE_UPDATED',
        ip: '192.168.1.18',
        entity: 'قيد بلاغ مطالبة مسؤولية طبية جديد CLM-2026-0028',
    },
    {
        id: 'a-8',
        timestamp: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
        user: 'Finance Admin',
        role: 'finance_admin',
        action: 'PAYMENT_SUCCESS',
        ip: '192.168.1.10',
        entity: 'سداد اشتراك سنوي إلكتروني عبر بطاقة فيزا البنكية',
    },
];
export const certificates = [
    {
        id: 'cert-1',
        number: 'MLRF-2026-000123',
        qrHash: 'demo-qr-valid-7f0c1a',
        userId: 'subscriber-1',
        issuedAt: '2026-01-01T00:00:00.000Z',
        expiry: '2027-01-01T00:00:00.000Z',
        status: 'valid',
    },
];
export function recordAudit(user, role, action, entity = 'system', ip = '127.0.0.1') {
    audit.unshift({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        user,
        role,
        action,
        ip,
        entity,
    });
    if (audit.length > 1000)
        audit.length = 1000;
}
export function feeFor(tierId) {
    const tier = DEMO_TIERS.find((t) => t.id === tierId);
    if (!tier)
        throw new Error('Unknown specialty tier');
    return tier.fee;
}
export function resetDemo() {
    payments.length = 0;
    batches.length = 0;
    audit.length = 0;
}
//# sourceMappingURL=demoStore.js.map