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
export const claims = Array.from({ length: 28 }, (_, i) => ({
    id: `CLM-${2026}-${String(i + 1).padStart(4, '0')}`,
    doctor: ['Dr. Mariam Hassan', 'Dr. Omar Ali', 'Dr. Nour Ibrahim'][i % 3],
    hospital: ['Cairo Medical Center', 'Alexandria General', 'Nile Hospital'][i % 3],
    specialty: ['Surgery', 'Cardiology', 'Obstetrics'][i % 3],
    stage: ['Incident', 'Claim Filed', 'Legal Review', 'Court Verdict', 'Payout'][i % 5],
    awarded: 50000 + ((i * 13750) % 250000),
    paid: i % 4 === 0 ? 50000 : 0,
    beneficiary: ['Patient family', 'Patient', 'Insurer'][i % 3],
    daysInStage: 5 + ((i * 7) % 90),
    createdAt: new Date(Date.UTC(2025, i % 12, 1 + (i % 27))).toISOString(),
}));
export const batches = [];
export const audit = [];
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