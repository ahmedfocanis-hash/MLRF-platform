import argon2 from 'argon2';
import { DEMO_TIERS, GOVERNORATES, ROLE_PERMISSIONS } from '@mlrf/shared';
import { initDb } from './config/db.js';
import { RoleModel, UserModel, SpecialtyTierModel, SubscriberProfileModel, SubscriptionModel, PaymentModel, CertificateModel, ClaimModel, AuditLogModel, SmsOutboxModel, BulkBatchModel, CompletionTokenModel } from './models/index.js';
const fiscalYear = 2026;
const seededAdminRoles = ['super_admin', 'finance_admin', 'practitioner_analyst', 'facility_analyst', 'claims_admin'];
const adminNames = { super_admin: 'Super Admin', finance_admin: 'Finance Admin', practitioner_analyst: 'Practitioner Analyst', facility_analyst: 'Facility Analyst', claims_admin: 'Claims Admin', inspector: 'Ahmed Inspector' };
const specialties = [...DEMO_TIERS];
async function main() {
    await initDb();
    try {
        if (process.argv.includes('--reset')) {
            await Promise.all([RoleModel, UserModel, SpecialtyTierModel, SubscriberProfileModel, SubscriptionModel, PaymentModel, CertificateModel, ClaimModel, AuditLogModel, SmsOutboxModel, BulkBatchModel, CompletionTokenModel].map(model => model.deleteMany({})));
        }
        for (const role of ['super_admin', 'finance_admin', 'practitioner_analyst', 'facility_analyst', 'claims_admin', 'inspector', 'subscriber']) {
            await RoleModel.updateOne({ name: role }, { $set: { permissionsJson: [...ROLE_PERMISSIONS[role]] } }, { upsert: true });
        }
        for (const tier of specialties) {
            await SpecialtyTierModel.updateOne({ code: tier.id }, { $set: { code: tier.id, name: tier.name, nameAr: tier.nameAr, entityType: tier.entityType, fee: tier.fee, risk: tier.risk, active: true } }, { upsert: true });
        }
        const passwordHash = await argon2.hash('Demo123!');
        const usersByIndex = new Map();
        const adminUsers = [
            ...seededAdminRoles.map((role, i) => ({ name: adminNames[role], email: `${role}@mlrf.demo`, phone: `010${String(i + 1).padStart(8, '0')}`, role })),
            { name: adminNames.inspector, email: 'inspector@mlrf.demo', phone: '01012345678', role: 'inspector' },
        ];
        for (const admin of adminUsers) {
            await UserModel.updateOne({ email: admin.email }, { $set: { ...admin, passwordHash, status: 'active' } }, { upsert: true });
        }
        const names = ['Dr. Mariam Hassan', 'Dr. Omar Ali', 'Dr. Nour Ibrahim', 'Dr. Youssef Mahmoud', 'Dr. Salma Fathy', 'Dr. Karim Adel'];
        for (let i = 0; i < 2500; i++) {
            const key = `seed-${String(i + 1).padStart(4, '0')}`;
            const email = `${key}@mlrf.demo`;
            const tier = specialties[i % specialties.length];
            const governorate = GOVERNORATES[i % GOVERNORATES.length][0];
            const status = i % 7 === 0 ? 'expired' : 'active';
            const user = await UserModel.findOneAndUpdate({ email }, { $set: { name: names[i % names.length], email, phone: `011${String(i + 1).padStart(8, '0')}`, passwordHash, role: 'subscriber', status } }, { upsert: true, new: true, setDefaultsOnInsert: true });
            const userId = String(user._id ?? user.id);
            usersByIndex.set(i, userId);
            const profile = await SubscriberProfileModel.findOneAndUpdate({ userId }, { $set: { userId, entityType: tier.entityType, governorate, completionPercent: 100 } }, { upsert: true, new: true });
            const tierRecord = await SpecialtyTierModel.findOne({ code: tier.id });
            const tierId = String(tierRecord?._id ?? tierRecord?.id ?? tier.id);
            const subscription = await SubscriptionModel.findOneAndUpdate({ userId, fiscalYear }, { $set: { userId, tierId, fiscalYear, renewalStatus: i % 5 === 0 ? 'renewed' : 'new', status: status === 'active' ? 'active' : 'expired', amountDue: tier.fee, startsAt: new Date(Date.UTC(fiscalYear, 0, 1)), expiresAt: new Date(Date.UTC(fiscalYear + 1, 0, 1)) } }, { upsert: true, new: true });
            if (i < 120) {
                await PaymentModel.updateOne({ gatewayReference: `seed-payment-${i + 1}` }, { $set: { userId, subscriptionId: subscription._id ?? subscription.id, amount: tier.fee, currency: 'EGP', channel: i % 6 === 0 ? 'bank_bulk' : 'gateway', status: 'paid', gatewayReference: `seed-payment-${i + 1}`, paidAt: new Date(Date.UTC(fiscalYear, i % 12, 1 + i % 27)) } }, { upsert: true });
            }
            if (i === 0) {
                await CertificateModel.updateOne({ certNumber: 'MLRF-2026-000123' }, { $set: { userId, subscriptionId: subscription._id ?? subscription.id, certNumber: 'MLRF-2026-000123', qrHash: 'demo-qr-valid-7f0c1a', issuedAt: new Date(Date.UTC(fiscalYear, 0, 1)), expiresAt: new Date(Date.UTC(fiscalYear + 1, 0, 1)), status: 'valid' } }, { upsert: true });
            }
            void profile;
        }
        const claimStages = ['incident', 'claim_filed', 'legal_review', 'court_verdict', 'payout'];
        for (let i = 0; i < 120; i++) {
            const userId = usersByIndex.get(i);
            const incidentAt = new Date(Date.UTC(2025, i % 12, 1 + (i % 27)));
            await ClaimModel.updateOne({ claimNumber: `CLM-2026-${String(i + 1).padStart(4, '0')}` }, { $set: { claimNumber: `CLM-2026-${String(i + 1).padStart(4, '0')}`, subscriberId: userId, facilityName: ['Cairo Medical Center', 'Alexandria General', 'Nile Hospital'][i % 3], specialty: specialties[i % specialties.length].name, governorate: GOVERNORATES[i % GOVERNORATES.length][0], stage: claimStages[i % claimStages.length], incidentAt, filedAt: i % 5 > 0 ? new Date(incidentAt.getTime() + 7 * 86400000) : null, verdictAt: i % 5 > 2 ? new Date(incidentAt.getTime() + 60 * 86400000) : null, payoutAt: i % 5 === 4 ? new Date(incidentAt.getTime() + 90 * 86400000) : null, awardedAmount: 50000 + (i * 13750) % 250000, paidAmount: i % 4 === 0 ? 50000 : 0, beneficiary: ['Patient family', 'Patient', 'Insurer'][i % 3] } }, { upsert: true });
        }
        for (let i = 0; i < 300; i++) {
            const email = `${['super_admin', 'finance_admin', 'practitioner_analyst', 'facility_analyst', 'claims_admin'][i % 5]}@mlrf.demo`;
            const role = ['super_admin', 'finance_admin', 'practitioner_analyst', 'facility_analyst', 'claims_admin'][i % 5];
            await AuditLogModel.updateOne({ entityId: `seed-audit-${i + 1}` }, { $set: { userLabel: email, role, action: ['LOGIN', 'PROFILE_UPDATED', 'PAYMENT_SUCCESS', 'EXPORT_REQUESTED'][i % 4], entityType: 'seed', entityId: `seed-audit-${i + 1}`, ipAddress: `192.0.2.${(i % 250) + 1}`, userAgent: 'MLRF deterministic seed', metadata: { seeded: true } } }, { upsert: true });
        }
        const counts = await Promise.all([RoleModel.countDocuments(), UserModel.countDocuments(), SpecialtyTierModel.countDocuments(), SubscriberProfileModel.countDocuments(), SubscriptionModel.countDocuments(), PaymentModel.countDocuments(), CertificateModel.countDocuments(), ClaimModel.countDocuments(), AuditLogModel.countDocuments()]);
        console.log(JSON.stringify({ database: 'turso', roles: counts[0], users: counts[1], specialtyTiers: counts[2], profiles: counts[3], subscriptions: counts[4], payments: counts[5], certificates: counts[6], claims: counts[7], auditLogs: counts[8], demoPassword: 'Demo123!' }, null, 2));
    }
    finally {
        // completed
    }
}
main().catch(async (error) => { console.error('Seed failed', error); process.exitCode = 1; });
//# sourceMappingURL=seed.js.map