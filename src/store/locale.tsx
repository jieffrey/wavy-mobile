import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { isLocale, setLocale, type Locale } from '@/i18n';
import { deviceStorage } from '@/lib/device-storage';

// Bahasa app (id/en), tersimpan di storage perangkat. t() membaca locale global dari @/i18n,
// jadi saat bahasa berganti RootNavigator me-mount ulang navigator (key = locale) supaya semua layar
// dirender dengan teks baru, lalu kembali ke `returnTo`.
const LOCALE_KEY = 'wavy.locale';

interface LocaleValue {
  ready: boolean;
  locale: Locale;
  /** route yang dibuka lagi setelah navigator di-mount ulang (mis. '/profile') */
  returnTo: string | null;
  changeLocale: (next: Locale, returnTo?: string) => Promise<void>;
  clearReturnTo: () => void;
}

const LocaleContext = createContext<LocaleValue | null>(null);

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside <LocaleProvider>');
  return value;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [locale, setState] = useState<Locale>('id');
  const [returnTo, setReturnTo] = useState<string | null>(null);

  useEffect(() => {
    deviceStorage
      .get(LOCALE_KEY)
      .then((saved) => {
        if (isLocale(saved)) {
          setLocale(saved);
          setState(saved);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const changeLocale = useCallback(async (next: Locale, back?: string) => {
    setLocale(next);
    await deviceStorage.set(LOCALE_KEY, next).catch(() => {});
    setReturnTo(back ?? null);
    setState(next);
  }, []);

  const clearReturnTo = useCallback(() => setReturnTo(null), []);

  const value = useMemo(
    () => ({ ready, locale, returnTo, changeLocale, clearReturnTo }),
    [ready, locale, returnTo, changeLocale, clearReturnTo]
  );
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
