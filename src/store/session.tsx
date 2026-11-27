import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { setApiToken, setUnauthorizedHandler } from '@/lib/api';
import { deviceStorage } from '@/lib/device-storage';
import type { Customer } from '@/types/api';

// Sesi customer: token JWT dari POST /auth/verify-otp disimpan di expo-secure-store (localStorage di Expo web).
// 401 dari request ber-token -> sesi dihapus -> Stack.Protected memindahkan user ke /login.
const TOKEN_KEY = 'wavy.auth.token';
const CUSTOMER_KEY = 'wavy.auth.customer';

export type SessionStatus = 'loading' | 'signed-out' | 'signed-in';

interface SessionValue {
  status: SessionStatus;
  customer: Customer | null;
  /** true kalau sesi terakhir berakhir karena 401 (ditampilkan di layar login). */
  expired: boolean;
  signIn: (token: string, customer: Customer) => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}

async function clearStored() {
  await Promise.all([deviceStorage.remove(TOKEN_KEY), deviceStorage.remove(CUSTOMER_KEY)]).catch(
    () => {}
  );
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [expired, setExpired] = useState(false);

  const endSession = useCallback((byServer: boolean) => {
    setApiToken(null);
    setCustomer(null);
    setExpired(byServer);
    setStatus('signed-out');
    clearStored();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => endSession(true));
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  useEffect(() => {
    (async () => {
      try {
        const [token, raw] = await Promise.all([
          deviceStorage.get(TOKEN_KEY),
          deviceStorage.get(CUSTOMER_KEY),
        ]);
        if (token) {
          setApiToken(token);
          setCustomer(raw ? (JSON.parse(raw) as Customer) : null);
          setStatus('signed-in');
          return;
        }
      } catch {
        // storage tidak terbaca: anggap belum login
      }
      setStatus('signed-out');
    })();
  }, []);

  const signIn = useCallback(async (token: string, next: Customer) => {
    await deviceStorage.set(TOKEN_KEY, token);
    await deviceStorage.set(CUSTOMER_KEY, JSON.stringify(next));
    setApiToken(token);
    setCustomer(next);
    setExpired(false);
    setStatus('signed-in');
  }, []);

  const signOut = useCallback(() => endSession(false), [endSession]);

  const value = useMemo(
    () => ({ status, customer, expired, signIn, signOut }),
    [status, customer, expired, signIn, signOut]
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
