import { describe, it, expect } from 'vitest';
import { registerSchema, ROLE_PERMISSIONS, DEMO_TIERS } from './index';
describe('shared validation and constants', () => {
    it('accepts Egyptian mobile numbers and rejects invalid ones', () => { expect(registerSchema.safeParse({ name: 'Test User', phone: '01012345678', email: 'test@example.com', password: 'secret123' }).success).toBe(true); expect(registerSchema.safeParse({ name: 'Test User', phone: '123', email: 'test@example.com', password: 'secret123' }).success).toBe(false); });
    it('keeps role permissions scoped', () => { expect(ROLE_PERMISSIONS.inspector).toContain('inspections:verify'); expect(ROLE_PERMISSIONS.inspector).not.toContain('users:manage'); });
    it('charges specialists more than general practitioners and hospitals differ from both', () => { const gp = DEMO_TIERS.find(t => t.id === 'human_doctor_gp'); const specialist = DEMO_TIERS.find(t => t.id === 'human_doctor_specialist'); const hospital = DEMO_TIERS.find(t => t.id === 'facility_hospital'); expect(specialist.fee).toBeGreaterThan(gp.fee); expect(hospital.fee).not.toBe(gp.fee); });
});
//# sourceMappingURL=index.test.js.map