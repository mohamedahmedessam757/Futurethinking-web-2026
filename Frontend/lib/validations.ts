import * as z from 'zod';

// --- Security Patterns ---

// Regex to catch common SQL Injection vectors
// 1. Checks for common SQL commands (SELECT, INSERT, etc.)
// 2. Checks for comment indicators (-- or /*)
// 3. Checks for statement terminators (;)
// 4. Checks for extended stored procedure calls (xp_)
const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|XH|XP_)\b)|(;)|(--)|(\/\*)/i;

// Custom Zod refinement for SQLi protection
const noSQLInjection = (val: string) => {
  if (sqlInjectionPattern.test(val)) {
    return false;
  }
  return true;
};

const securityMessage = "تم اكتشاف رموز غير مسموح بها لأسباب أمنية";

// --- Auth Schemas ---

export const loginSchema = z.object({
  email: z.string()
    .email({ message: "البريد الإلكتروني غير صحيح" })
    .refine(noSQLInjection, { message: securityMessage }),
  password: z.string()
    .min(1, { message: "كلمة المرور مطلوبة" })
    // We allow special chars in passwords, but reject obvious SQLi command sequences
    .refine((val) => !/(' OR ')/i.test(val), { message: securityMessage }), 
});

export const registerSchema = z.object({
  name: z.string()
    .min(3, { message: "الاسم يجب أن يكون 3 أحرف على الأقل" })
    .max(50)
    .refine(noSQLInjection, { message: securityMessage }),
  email: z.string()
    .email({ message: "البريد الإلكتروني غير صحيح" })
    .refine(noSQLInjection, { message: securityMessage }),
  phone: z.string()
    .regex(/^(05)(5|0|3|6|4|9|1|8|7)([0-9]{7})$/, { message: "رقم الجوال غير صحيح (يجب أن يبدأ بـ 05)" }),
  password: z.string()
    .min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" })
    .regex(/[A-Z]/, { message: "يجب أن تحتوي على حرف كبير واحد على الأقل" })
    .regex(/[0-9]/, { message: "يجب أن تحتوي على رقم واحد على الأقل" }),
  confirmPassword: z.string(),
  role: z.enum(['student', 'instructor', 'admin']).optional(), // Optional for initial register form
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

// --- AI & Content Safety Schemas ---

export const aiPromptSchema = z.object({
  topic: z.string()
    .min(3)
    .max(100, { message: "الموضوع يجب ألا يتجاوز 100 حرف" })
    .refine(noSQLInjection, { message: "النص يحتوي على عبارات محظورة" }),
  complexity: z.enum(['beginner', 'intermediate', 'advanced']),
  format: z.enum(['video_script', 'quiz', 'summary']),
});

export const bookingSchema = z.object({
  consultantId: z.string().refine(noSQLInjection),
  date: z.string().refine((date) => new Date(date) > new Date(), {
    message: "تاريخ الحجز يجب أن يكون في المستقبل",
  }),
  notes: z.string().max(500).optional().refine((val) => !val || noSQLInjection(val), { message: securityMessage }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
