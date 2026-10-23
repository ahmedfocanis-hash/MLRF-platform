import { z } from 'zod';
export const ROLES = ['super_admin','finance_admin','practitioner_analyst','facility_analyst','claims_admin','inspector','subscriber'] as const;
export type Role = typeof ROLES[number];
export const ACCOUNT_STATUSES = ['pending_verification','incomplete','pending_completion','active','expired'] as const;
export const PAYMENT_CHANNELS = ['gateway','bank_bulk'] as const;
export const VERIFICATION_RESULTS = ['VALID','EXPIRED','INVALID'] as const;
export const PERMISSIONS = ['users:manage','bulk:upload','payments:read','analytics:individuals','analytics:facilities','claims:read','audit:read','inspections:verify','export:run'] as const;
export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
 super_admin: PERMISSIONS,
 finance_admin:['bulk:upload','payments:read','export:run'],
 practitioner_analyst:['analytics:individuals','export:run'],
 facility_analyst:['analytics:facilities','export:run'],
 claims_admin:['claims:read','export:run'], inspector:['inspections:verify'], subscriber:[]
};
export const GOVERNORATES = [
 ['Cairo','القاهرة'],['Alexandria','الإسكندرية'],['Giza','الجيزة'],['Qalyubia','القليوبية'],['Port Said','بورسعيد'],['Suez','السويس'],['Damietta','دمياط'],['Dakahlia','الدقهلية'],['Sharqia','الشرقية'],['Gharbia','الغربية'],['Monufia','المنوفية'],['Kafr El Sheikh','كفر الشيخ'],['Beheira','البحيرة'],['Ismailia','الإسماعيلية'],['Fayoum','الفيوم'],['Beni Suef','بني سويف'],['Minya','المنيا'],['Asyut','أسيوط'],['Sohag','سوهاج'],['Qena','قنا'],['Luxor','الأقصر'],['Aswan','أسوان'],['Red Sea','البحر الأحمر'],['New Valley','الوادي الجديد'],['Matrouh','مطروح'],['North Sinai','شمال سيناء'],['South Sinai','جنوب سيناء']
] as const;
export const registerSchema = z.object({name:z.string().min(2).max(120),phone:z.string().regex(/^01[0125]\d{8}$/,'Use an Egyptian mobile number'),email:z.string().email(),password:z.string().min(8).max(100)});
export const otpSchema = z.object({phone:z.string(),code:z.string().length(6)});
export const professionalProfileSchema = z.object({nationalId:z.string().regex(/^\d{14}$/).optional(),syndicateId:z.string().max(40).optional(),facilityLicense:z.string().max(60).optional(),governorate:z.string().min(2),entityType:z.enum(['individual','facility'])});
export const tierSchema = z.object({tierId:z.string().min(1),entityType:z.enum(['individual','facility'])});
export type ApiEnvelope<T> = {success:boolean;data:T|null;error:{code:string;message:string;details?:unknown}|null};
export const DEMO_TIERS = [
 {id:'human_doctor_gp',name:'Human Doctors: General Practitioner',nameAr:'الأطباء البشريين - ممارس عام',entityType:'individual',fee:240,risk:'standard'},
 {id:'human_doctor_specialist',name:'Human Doctors: Other Specialties',nameAr:'الأطباء البشريين - الدرجات التخصصية الأخرى',entityType:'individual',fee:920,risk:'high'},
 {id:'dentist_pt_gp',name:'Dentists & Physiotherapists: General Practitioner',nameAr:'أطباء الأسنان والعلاج الطبيعي - ممارس عام',entityType:'individual',fee:160,risk:'standard'},
 {id:'dentist_pt_specialist',name:'Dentists & Physiotherapists: Other Specialties',nameAr:'أطباء الأسنان والعلاج الطبيعي - الدرجات التخصصية',entityType:'individual',fee:400,risk:'medium'},
 {id:'pharmacist',name:'Pharmacists',nameAr:'الصيادلة',entityType:'individual',fee:240,risk:'standard'},
 {id:'other_medical_staff',name:'Nursing, Technicians & Applied Health Sciences',nameAr:'التمريض والفنيين والفئات الطبية الأخرى',entityType:'individual',fee:100,risk:'standard'},
 {id:'facility_hospital',name:'Hospital (Up to 50 beds)',nameAr:'مستشفى (حتى 50 سرير)',entityType:'facility',fee:24000,risk:'high'},
 {id:'facility_medical_center',name:'Medical Center',nameAr:'مركز طبي',entityType:'facility',fee:9600,risk:'medium'},
 {id:'facility_radiology',name:'Radiology Center',nameAr:'مركز أشعة',entityType:'facility',fee:3600,risk:'standard'},
 {id:'facility_lab',name:'Lab Center',nameAr:'مركز تحاليل',entityType:'facility',fee:2400,risk:'standard'},
 {id:'facility_pharmacy',name:'Pharmacy Facility',nameAr:'صيدلية (منشأة)',entityType:'facility',fee:1200,risk:'standard'}
] as const;
