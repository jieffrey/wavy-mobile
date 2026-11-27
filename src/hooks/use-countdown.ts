import { useEffect, useState } from 'react';

/** Sisa detik sampai `target` (ISO), diperbarui tiap detik. null kalau target kosong. */
export function useCountdown(target: string | null | undefined): number | null {
  const end = target ? new Date(target).getTime() : NaN;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!Number.isFinite(end)) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [end]);

  if (!Number.isFinite(end)) return null;
  return Math.max(0, Math.floor((end - now) / 1000));
}
