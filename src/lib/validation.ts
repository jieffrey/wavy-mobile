import { z } from 'zod';

import { t, type MessageKey } from '@/i18n';

// Validasi form (login, daftar, data pemesan, transfer tiket) dengan zod.
// Pesan di skema = kunci i18n; `fieldErrors` menerjemahkannya dan mengembalikan satu pesan per field.
// Aturan disamakan dengan backend (auth.schema / POST /orders) supaya error tidak baru muncul setelah request.

const msg = (key: MessageKey) => ({ message: key });

const email = z.string().trim().min(1, msg('Validation.emailRequired')).email(msg('Validation.emailInvalid'));

export const loginSchema = z.object({ email });

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, msg('Validation.nameRequired'))
    .min(2, msg('Validation.nameShort'))
    .max(80, msg('Validation.nameLong')),
  email,
});

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, msg('Auth.invalidOtp')),
});

export const transferSchema = z.object({ to_email: email });

/** tanggal lahir valid, tidak di masa depan, tahun 4 digit sejak 1900 */
function isValidDob(day: string, month: string, year: string): boolean {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return false;
  if (year.length !== 4 || y < 1900 || y > new Date().getFullYear()) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && date <= new Date();
}

// Tanggal lahir divalidasi sebagai satu field `dob` (bukan refine di level objek) supaya pesannya
// tampil bersamaan dengan error field lain — refine objek di zod hanya jalan kalau semua field lolos.
const dob = z.object({ day: z.string(), month: z.string(), year: z.string() }).superRefine((v, ctx) => {
  if (!v.day || !v.month || !v.year)
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Checkout.errors.dobRequired' });
  else if (!isValidDob(v.day, v.month, v.year))
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Checkout.errors.dobInvalid' });
});

export const buyerSchema = z.object({
  firstName: z.string().trim().min(1, msg('Checkout.errors.firstName')),
  lastName: z.string().trim(),
  email: z.string().trim().min(1, msg('Checkout.errors.emailRequired')).email(msg('Checkout.errors.emailInvalid')),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().min(1, msg('Checkout.errors.phoneRequired')).min(9, msg('Checkout.errors.phoneShort'))),
  idNumber: z.string().trim().min(1, msg('Checkout.errors.idNumber')),
  dob,
  gender: z.enum(['L', 'P'], { errorMap: () => msg('Checkout.errors.gender') }),
  agreeTerms: z.literal(true, { errorMap: () => msg('Checkout.errors.agreeTerms') }),
  agreeData: z.literal(true, { errorMap: () => msg('Checkout.errors.agreeData') }),
});

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

/**
 * Validasi `values` dengan `schema`. Hasil: { data } bila valid, atau { errors } berisi
 * satu pesan (sudah diterjemahkan) per field — field pertama yang gagal pada path teratas.
 */
export function validateForm<S extends z.ZodTypeAny, K extends string = string>(
  schema: S,
  values: unknown
): { data: z.output<S>; errors: null } | { data: null; errors: FieldErrors<K> } {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data, errors: null };
  const errors: FieldErrors<K> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'form') as K;
    if (!errors[field]) errors[field] = t(issue.message as MessageKey);
  }
  return { data: null, errors };
}
