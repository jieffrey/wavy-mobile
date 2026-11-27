import { getLocale } from '@/i18n';

const tag = () => (getLocale() === 'en' ? 'en-US' : 'id-ID');

/** Rp 150.000 (sama dengan formatIDR web). */
export function formatIDR(value: string | number | null | undefined): string {
  const n = Number(value ?? 0);
  return `Rp ${Math.round(Number.isFinite(n) ? n : 0).toLocaleString('id-ID')}`;
}

/** Jam & tanggal selalu WIB, seperti di web. */
const TZ = 'Asia/Jakarta';

export function formatDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(tag(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ, ...opts });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString(tag(), { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  return `${formatDate(iso)} · ${formatTime(iso)} WIB`;
}

/** 14:59 dari sisa detik. */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
