import { en } from './en';
import { id, type Messages } from './id';

export type Locale = 'id' | 'en';

// Semua kunci dalam bentuk "Namespace.sub.key".
type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];
export type MessageKey = Paths<Messages>;

const dictionaries: Record<Locale, unknown> = { id, en };
let locale: Locale = 'id';

export function setLocale(next: Locale) {
  locale = next;
}

export function getLocale(): Locale {
  return locale;
}

function lookup(dict: unknown, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export const LOCALES: readonly Locale[] = ['id', 'en'];
export const isLocale = (v: unknown): v is Locale => v === 'id' || v === 'en';

/** Ambil teks UI. `{nama}` di teks diganti dengan vars.nama. Kunci yang tidak ada jatuh ke bahasa Indonesia. */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const raw = lookup(dictionaries[locale], key) ?? lookup(id, key) ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** Untuk kunci dinamis (mis. kode error dari backend). Kembalikan undefined kalau tidak ada. */
export function tMaybe(key: string, vars?: Record<string, string | number>): string | undefined {
  if (lookup(id, key) === undefined) return undefined;
  return t(key as MessageKey, vars);
}
