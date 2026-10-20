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
 {id:'gp',name:'General Practitioner',nameAr:'طبيب عام',entityType:'individual',fee:1800,risk:'standard'},
 {id:'surgery',name:'Surgery',nameAr:'جراحة',entityType:'individual',fee:4200,risk:'high'},
 {id:'obgyn',name:'Obstetrics & Gynecology',nameAr:'نساء وتوليد',entityType:'individual',fee:3900,risk:'high'},
 {id:'orthopedics',name:'Orthopedics',nameAr:'عظام',entityType:'individual',fee:3600,risk:'high'},
 {id:'cosmetic',name:'Cosmetic Surgery',nameAr:'جراحة تجميل',entityType:'individual',fee:5200,risk:'very-high'},
 {id:'cardiology',name:'Cardiology',nameAr:'قلب',entityType:'individual',fee:3000,risk:'medium'},
 {id:'pediatrics',name:'Pediatrics',nameAr:'أطفال',entityType:'individual',fee:2400,risk:'medium'},
 {id:'dentistry',name:'Dentistry',nameAr:'أسنان',entityType:'individual',fee:2100,risk:'standard'},
 {id:'pharmacist',name:'Pharmacist',nameAr:'صيدلي',entityType:'individual',fee:1500,risk:'standard'},
 {id:'nurse',name:'Nurse',nameAr:'تمريض',entityType:'individual',fee:1100,risk:'standard'},
 {id:'lab-tech',name:'Lab Technician',nameAr:'فني معمل',entityType:'individual',fee:1300,risk:'standard'},
 {id:'hospital',name:'Hospital',nameAr:'مستشفى',entityType:'facility',fee:18000,risk:'high'},
 {id:'clinic',name:'Clinic',nameAr:'عيادة',entityType:'facility',fee:5200,risk:'standard'},
 {id:'lab',name:'Laboratory',nameAr:'معمل',entityType:'facility',fee:6500,risk:'medium'},
 {id:'pharmacy',name:'Pharmacy',nameAr:'صيدلية',entityType:'facility',fee:3200,risk:'standard'},
 {id:'medical-center',name:'Medical Center',nameAr:'مركز طبي',entityType:'facility',fee:9000,risk:'high'}
] as const;
