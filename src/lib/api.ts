// Klien API wavy-backend (/api/v1). Perilaku sama dengan wavy-next/src/lib/api.ts:
// - error selalu ApiError dengan message string; status 0 = request tidak sampai ke server
// - dua bentuk error backend: { error: "pesan" } dan { error: { code, message } }
// Bedanya: token dipegang session store (expo-secure-store), dan 401 pada request ber-token
// memanggil handler logout supaya app kembali ke layar login.

const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
const TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Kode khusus mobile: EXPO_PUBLIC_API_URL kosong. */
export const MISSING_API_URL = 'MISSING_API_URL';

export function parseApiError(status: number, body: unknown): ApiError {
  const fallback = `Request failed (${status})`;
  const err = body && typeof body === 'object' ? (body as { error?: unknown }).error : undefined;
  if (typeof err === 'string' && err.trim()) return new ApiError(status, err);
  if (err && typeof err === 'object') {
    const { code, message } = err as { code?: unknown; message?: unknown };
    return new ApiError(
      status,
      typeof message === 'string' && message.trim() ? message : fallback,
      typeof code === 'string' ? code : undefined
    );
  }
  return new ApiError(status, fallback);
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setApiToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new ApiError(0, 'EXPO_PUBLIC_API_URL is not set', MISSING_API_URL);

  const token = authToken;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'Network request failed');
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    // Hanya keluarkan sesi kalau token yang dipakai request ini ditolak
    // (401 dari verify-otp = kode salah, bukan sesi habis).
    if (res.status === 401 && token && token === authToken) onUnauthorized?.();
    throw parseApiError(res.status, body);
  }
  return body as T;
}

export const apiGet = <T>(path: string) => api<T>(path);

export const apiPost = <T>(path: string, data?: unknown) =>
  api<T>(path, { method: 'POST', body: data === undefined ? undefined : JSON.stringify(data) });

export const apiDelete = <T>(path: string) => api<T>(path, { method: 'DELETE' });
