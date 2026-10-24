import { z } from 'zod';
export declare const ROLES: readonly ["super_admin", "finance_admin", "practitioner_analyst", "facility_analyst", "claims_admin", "inspector", "subscriber"];
export type Role = typeof ROLES[number];
export declare const ACCOUNT_STATUSES: readonly ["pending_verification", "incomplete", "pending_completion", "active", "expired"];
export declare const PAYMENT_CHANNELS: readonly ["gateway", "bank_bulk"];
export declare const VERIFICATION_RESULTS: readonly ["VALID", "EXPIRED", "INVALID"];
export declare const PERMISSIONS: readonly ["users:manage", "bulk:upload", "payments:read", "analytics:individuals", "analytics:facilities", "claims:read", "audit:read", "inspections:verify", "export:run"];
export declare const ROLE_PERMISSIONS: Record<Role, readonly string[]>;
export declare const GOVERNORATES: readonly [readonly ["Cairo", "القاهرة"], readonly ["Alexandria", "الإسكندرية"], readonly ["Giza", "الجيزة"], readonly ["Qalyubia", "القليوبية"], readonly ["Port Said", "بورسعيد"], readonly ["Suez", "السويس"], readonly ["Damietta", "دمياط"], readonly ["Dakahlia", "الدقهلية"], readonly ["Sharqia", "الشرقية"], readonly ["Gharbia", "الغربية"], readonly ["Monufia", "المنوفية"], readonly ["Kafr El Sheikh", "كفر الشيخ"], readonly ["Beheira", "البحيرة"], readonly ["Ismailia", "الإسماعيلية"], readonly ["Fayoum", "الفيوم"], readonly ["Beni Suef", "بني سويف"], readonly ["Minya", "المنيا"], readonly ["Asyut", "أسيوط"], readonly ["Sohag", "سوهاج"], readonly ["Qena", "قنا"], readonly ["Luxor", "الأقصر"], readonly ["Aswan", "أسوان"], readonly ["Red Sea", "البحر الأحمر"], readonly ["New Valley", "الوادي الجديد"], readonly ["Matrouh", "مطروح"], readonly ["North Sinai", "شمال سيناء"], readonly ["South Sinai", "جنوب سيناء"]];
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    phone: string;
    email: string;
    password: string;
}, {
    name: string;
    phone: string;
    email: string;
    password: string;
}>;
export declare const otpSchema: z.ZodObject<{
    phone: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    code: string;
}, {
    phone: string;
    code: string;
}>;
export declare const professionalProfileSchema: z.ZodObject<{
    nationalId: z.ZodOptional<z.ZodString>;
    syndicateId: z.ZodOptional<z.ZodString>;
    facilityLicense: z.ZodOptional<z.ZodString>;
    governorate: z.ZodString;
    entityType: z.ZodEnum<["individual", "facility"]>;
}, "strip", z.ZodTypeAny, {
    governorate: string;
    entityType: "individual" | "facility";
    nationalId?: string | undefined;
    syndicateId?: string | undefined;
    facilityLicense?: string | undefined;
}, {
    governorate: string;
    entityType: "individual" | "facility";
    nationalId?: string | undefined;
    syndicateId?: string | undefined;
    facilityLicense?: string | undefined;
}>;
export declare const tierSchema: z.ZodObject<{
    tierId: z.ZodString;
    entityType: z.ZodEnum<["individual", "facility"]>;
}, "strip", z.ZodTypeAny, {
    entityType: "individual" | "facility";
    tierId: string;
}, {
    entityType: "individual" | "facility";
    tierId: string;
}>;
export type ApiEnvelope<T> = {
    success: boolean;
    data: T | null;
    error: {
        code: string;
        message: string;
        details?: unknown;
    } | null;
};
export declare const DEMO_TIERS: readonly [{
    readonly id: "human_doctor_gp";
    readonly name: "Human Doctors: General Practitioner";
    readonly nameAr: "الأطباء البشريين - ممارس عام";
    readonly entityType: "individual";
    readonly fee: 240;
    readonly risk: "standard";
}, {
    readonly id: "human_doctor_specialist";
    readonly name: "Human Doctors: Other Specialties";
    readonly nameAr: "الأطباء البشريين - الدرجات التخصصية الأخرى";
    readonly entityType: "individual";
    readonly fee: 920;
    readonly risk: "high";
}, {
    readonly id: "dentist_pt_gp";
    readonly name: "Dentists & Physiotherapists: General Practitioner";
    readonly nameAr: "أطباء الأسنان والعلاج الطبيعي - ممارس عام";
    readonly entityType: "individual";
    readonly fee: 160;
    readonly risk: "standard";
}, {
    readonly id: "dentist_pt_specialist";
    readonly name: "Dentists & Physiotherapists: Other Specialties";
    readonly nameAr: "أطباء الأسنان والعلاج الطبيعي - الدرجات التخصصية";
    readonly entityType: "individual";
    readonly fee: 400;
    readonly risk: "medium";
}, {
    readonly id: "pharmacist";
    readonly name: "Pharmacists";
    readonly nameAr: "الصيادلة";
    readonly entityType: "individual";
    readonly fee: 240;
    readonly risk: "standard";
}, {
    readonly id: "other_medical_staff";
    readonly name: "Nursing, Technicians & Applied Health Sciences";
    readonly nameAr: "التمريض والفنيين والفئات الطبية الأخرى";
    readonly entityType: "individual";
    readonly fee: 100;
    readonly risk: "standard";
}, {
    readonly id: "facility_hospital";
    readonly name: "Hospital (Up to 50 beds)";
    readonly nameAr: "مستشفى (حتى 50 سرير)";
    readonly entityType: "facility";
    readonly fee: 24000;
    readonly risk: "high";
}, {
    readonly id: "facility_medical_center";
    readonly name: "Medical Center";
    readonly nameAr: "مركز طبي";
    readonly entityType: "facility";
    readonly fee: 9600;
    readonly risk: "medium";
}, {
    readonly id: "facility_radiology";
    readonly name: "Radiology Center";
    readonly nameAr: "مركز أشعة";
    readonly entityType: "facility";
    readonly fee: 3600;
    readonly risk: "standard";
}, {
    readonly id: "facility_lab";
    readonly name: "Lab Center";
    readonly nameAr: "مركز تحاليل";
    readonly entityType: "facility";
    readonly fee: 2400;
    readonly risk: "standard";
}, {
    readonly id: "facility_pharmacy";
    readonly name: "Pharmacy Facility";
    readonly nameAr: "صيدلية (منشأة)";
    readonly entityType: "facility";
    readonly fee: 1200;
    readonly risk: "standard";
}];
