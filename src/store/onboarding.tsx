import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { flagStorage } from '@/lib/flag-storage';

// "Sudah lihat onboarding?" Satu flag di secure-store, localStorage di web (pola sama dengan app SWMS).
// Onboarding tampil saat app pertama kali dibuka, dan lagi setiap replay() (Profil → Lihat pengenalan).
const SEEN_KEY = 'wavy.onboarding.seen';

interface OnboardingValue {
  /** flag sudah selesai dibaca */
  ready: boolean;
  visible: boolean;
  finish: () => void;
  replay: () => void;
}

const OnboardingContext = createContext<OnboardingValue | null>(null);

export function useOnboarding() {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return value;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    flagStorage.get(SEEN_KEY)
      .then((seen) => setVisible(seen !== '1'))
      .catch(() => setVisible(false)) // storage tidak terbaca: jangan blokir app
      .finally(() => setReady(true));
  }, []);

  const finish = useCallback(() => {
    setVisible(false);
    flagStorage.set(SEEN_KEY, '1').catch(() => {});
  }, []);

  const replay = useCallback(() => setVisible(true), []);

  const value = useMemo(() => ({ ready, visible, finish, replay }), [ready, visible, finish, replay]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
