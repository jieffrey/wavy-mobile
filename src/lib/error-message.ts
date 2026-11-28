import { t, tMaybe } from '@/i18n';
import { ApiError, MISSING_API_URL } from '@/lib/api';

// Kode error aturan bisnis dari backend (PRD §4) yang punya teks sendiri. Sama dengan web.
export const KNOWN_ERROR_CODES = [
  'SALES_CLOSED',
  'SALES_NOT_STARTED',
  'SALES_ENDED',
  'QUOTA_EXCEEDED',
  'ORDER_EXPIRED',
  'INVALID_QUANTITY',
  'VALIDATION_ERROR',
  'ORDER_NOT_PENDING',
  'PAYMENT_NOT_CONFIGURED',
  'PAYMENT_GATEWAY_ERROR',
] as const;
export type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number];

export const isKnownErrorCode = (code: unknown): code is KnownErrorCode =>
  typeof code === 'string' && (KNOWN_ERROR_CODES as readonly string[]).includes(code);

/** Ubah error apa pun jadi pesan yang aman ditampilkan. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === MISSING_API_URL) return t('Errors.missingApiUrl');
    if (isKnownErrorCode(err.code)) return tMaybe(`Errors.codes.${err.code}`) ?? t('Errors.generic');
    if (err.status === 0) return t('Errors.network');
    if (err.status === 401) return t('Errors.unauthorized');
    if (err.status === 404) return t('Errors.notFound');
    if (err.status === 429) return t('Errors.tooMany');
  }
  return t('Errors.generic');
}

export const isUnauthorized = (err: unknown) => err instanceof ApiError && err.status === 401;
