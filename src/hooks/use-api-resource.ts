import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface Resource<T> {
  data: T | null;
  error: unknown;
  /** muat pertama / coba lagi (tampilkan state loading) */
  loading: boolean;
  /** tarik-untuk-muat-ulang: data lama tetap tampil */
  refreshing: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  setData: (next: T | null) => void;
}

interface State<T> {
  key: string | null;
  data: T | null;
  error: unknown;
  pending: 'load' | 'refresh' | null;
}

/**
 * Ambil data dari API dengan state loading / error yang jelas. Tidak pernah mengisi data cadangan:
 * kalau request gagal, `data` tetap null (atau nilai terakhir yang berhasil) dan `error` terisi.
 * `key` null = jangan ambil apa-apa. Ganti `key` = ambil ulang dari awal.
 */
export function useApiResource<T>(key: string | null, fetcher: () => Promise<T>): Resource<T> {
  const [state, setState] = useState<State<T>>({ key: null, data: null, error: null, pending: null });
  const fetcherRef = useRef(fetcher);
  useLayoutEffect(() => {
    fetcherRef.current = fetcher;
  });
  const requestId = useRef(0);

  const start = useCallback(async (forKey: string) => {
    const id = ++requestId.current;
    try {
      const data = await fetcherRef.current();
      if (id === requestId.current) setState({ key: forKey, data, error: null, pending: null });
    } catch (error) {
      if (id === requestId.current) {
        setState((prev) => ({ key: forKey, data: prev.key === forKey ? prev.data : null, error, pending: null }));
      }
    }
  }, []);

  useEffect(() => {
    if (key !== null) start(key);
  }, [key, start]);

  const rerun = useCallback(
    async (mode: 'load' | 'refresh') => {
      if (key === null) return;
      setState((prev) => ({ ...prev, key, data: prev.key === key ? prev.data : null, pending: mode }));
      await start(key);
    },
    [key, start]
  );

  const reload = useCallback(() => rerun('load'), [rerun]);
  const refresh = useCallback(() => rerun('refresh'), [rerun]);
  const setData = useCallback(
    (next: T | null) => setState((prev) => (prev.key === key ? { ...prev, data: next } : prev)),
    [key]
  );

  const current = key !== null && state.key === key;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: key !== null && (!current || state.pending === 'load'),
    refreshing: current && state.pending === 'refresh',
    reload,
    refresh,
    setData,
  };
}
