import { t } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import type { SalesStatus } from '@/types/api';

// Teks status penjualan dari sales_status backend (sama dengan hooks/use-sales-text.ts web).

/** null kalau event tidak punya batas penjualan sama sekali. */
export function salesWindow(start: string | null | undefined, end: string | null | undefined): string | null {
  if (start && end) return t('Sales.window.range', { start: formatDateTime(start), end: formatDateTime(end) });
  if (end) return t('Sales.window.until', { end: formatDateTime(end) });
  if (start) return t('Sales.window.from', { start: formatDateTime(start) });
  return null;
}

/** Alasan tombol beli nonaktif (status selain open). */
export function salesNotOpen(status: Exclude<SalesStatus, 'open'>, start: string | null | undefined): string {
  if (status === 'upcoming' && start) return t('Sales.notOpen.upcomingAt', { start: formatDateTime(start) });
  return t(`Sales.notOpen.${status}`);
}
