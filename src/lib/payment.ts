import { apiGet, apiPost } from '@/lib/api';

// Midtrans Snap lewat backend (wavy-next/docs/MIDTRANS.md):
// POST /orders/:id/pay → { token, redirect_url }; GET /orders/:id/payment-status → tanya Midtrans lalu terapkan.

export function createPayment(orderId: number | string) {
  return apiPost<{ token: string; redirect_url: string }>(`/orders/${orderId}/pay`);
}

export function syncPaymentStatus(orderId: number | string) {
  return apiGet<{ status: string; outcome: string }>(`/orders/${orderId}/payment-status`);
}

/**
 * Snap selesai kalau diarahkan ke "finish URL" dengan query Midtrans
 * (order_id=WAVY-...&transaction_status=...). Domain finish URL tergantung dashboard Midtrans,
 * jadi yang dicek isi query-nya, bukan host-nya.
 */
export function isSnapFinishUrl(url: string): boolean {
  return /[?&]transaction_status=/.test(url) && /[?&]order_id=WAVY-/i.test(url);
}

/** Deeplink e-wallet/bank (gojek://, intent://, shopeeid://) harus dibuka di luar WebView. */
export function isExternalScheme(url: string): boolean {
  return !/^(https?|about|data|blob):/i.test(url);
}
