// SPIKE MO-0 (PLAN-v2 §5.3) — branch spike/venue-3d-expo-go, TIDAK di-merge.
// Buka dari tombol "Spike 3D" di layar Masuk (hanya __DEV__) atau deep link `/spike-venue`.
// Teks sengaja tidak lewat i18n karena layar ini hanya alat uji.

import { router } from 'expo-router';
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { formatIDR } from '@/lib/format';
import { cn } from '@/lib/cn';
import { zoomOrbit } from '@/spike/venue/camera';
import { metrics, recordTap, resetMetrics } from '@/spike/venue/metrics';
import { Stadium2D } from '@/spike/venue/stadium-2d';
import { buildStadium, categoryOf } from '@/spike/venue/stadium-data';
import { StadiumCanvas, type SceneMode } from '@/spike/venue/stadium-scene';

const FIRST_FRAME_TIMEOUT_MS = 4000;

class GLBoundary extends Component<{ onError: (e: Error) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function SpikeVenueScreen() {
  const sections = useMemo(() => buildStadium(), []);
  const [view, setView] = useState<'3d' | '2d'>('3d');
  const [fallbackReason, setFallbackReason] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mode, setMode] = useState<SceneMode>('overview');
  const [autoRotate, setAutoRotate] = useState(false);
  const [remountOnResume, setRemountOnResume] = useState(true);
  const [canvasKey, setCanvasKey] = useState(0);

  const selected = sections.find((s) => s.id === selectedId) ?? null;

  const fallback = useCallback((reason: string) => {
    metrics.lastError = reason;
    setFallbackReason(reason);
    setView('2d');
    setMode('overview');
  }, []);

  // ukur ulang tiap kali Canvas dipasang
  useEffect(() => {
    if (view !== '3d') return;
    resetMetrics();
    const timer = setTimeout(() => {
      if (metrics.firstFrameMs === null) fallback(`frame pertama tidak muncul dalam ${FIRST_FRAME_TIMEOUT_MS / 1000} dtk`);
    }, FIRST_FRAME_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [view, canvasKey, fallback]);

  // R7: konteks GL bisa hilang setelah background
  const remountRef = useRef(remountOnResume);
  useEffect(() => {
    remountRef.current = remountOnResume;
  }, [remountOnResume]);
  useEffect(() => {
    let prev = AppState.currentState;
    const sub = AppState.addEventListener('change', (next) => {
      if (prev?.match(/inactive|background/) && next === 'active') {
        metrics.resumes++;
        if (remountRef.current) setCanvasKey((k) => k + 1);
      }
      prev = next;
    });
    return () => sub.remove();
  }, []);

  const select = useCallback(
    (id: number) => {
      const s = sections.find((x) => x.id === id);
      if (s) recordTap(s.code);
      setSelectedId(id);
    },
    [sections]
  );

  const zoom = zoomOrbit;

  const cat = selected ? categoryOf(selected) : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={12}>
          <Text className="font-sans-semibold text-primary">‹ Kembali</Text>
        </Pressable>
        <Text className="font-display text-base">Spike stadion 3D</Text>
        <Pill
          label={view === '3d' ? '2D' : '3D'}
          onPress={() => {
            setFallbackReason('');
            setMode('overview');
            setView((v) => (v === '3d' ? '2d' : '3d'));
          }}
        />
      </View>

      <View className="flex-1 overflow-hidden bg-muted">
        {view === '3d' ? (
          <GLBoundary key={canvasKey} onError={(e) => fallback(`error render: ${e.message}`)}>
            <StadiumCanvas
              sections={sections}
              selectedId={selectedId}
              mode={mode}
              autoRotate={autoRotate}
              onSelect={select}
            />
          </GLBoundary>
        ) : (
          <View className="flex-1 p-3">
            <Stadium2D sections={sections} selectedId={selectedId} onSelect={select} />
          </View>
        )}

        <MetricsOverlay view={view} fallbackReason={fallbackReason} />

        {view === '3d' ? (
          <View className="absolute right-3 top-3 gap-2">
            {mode === 'overview' ? (
              <>
                <Pill label="+" onPress={() => zoom(0.85)} />
                <Pill label="−" onPress={() => zoom(1.18)} />
              </>
            ) : null}
            <Pill label={autoRotate ? 'Putar: on' : 'Putar: off'} onPress={() => setAutoRotate((v) => !v)} />
            <Pill
              label={remountOnResume ? 'Remount: on' : 'Remount: off'}
              onPress={() => setRemountOnResume((v) => !v)}
            />
          </View>
        ) : null}
      </View>

      <View className="gap-3 border-t border-border bg-card px-4 pb-2 pt-3">
        {selected && cat ? (
          <>
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text variant="label">
                  {selected.code} · {selected.kind === 'standing' ? 'Berdiri' : 'Duduk'} · kapasitas{' '}
                  {selected.capacity}
                </Text>
                <Text className="font-display text-lg">{cat.name}</Text>
                <Text className="text-muted-foreground">{selected.name}</Text>
              </View>
              <View className="items-end">
                <Text className="font-mono-semibold text-base">{formatIDR(cat.price)}</Text>
                <Text className={cn('text-xs', cat.status === 'sold_out' ? 'text-destructive' : 'text-success')}>
                  {cat.status === 'sold_out' ? 'Habis' : `Sisa ${cat.remaining}`}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <ActionButton
                label={mode === 'seat' ? 'Kembali ke overview' : 'Lihat dari sini'}
                variant="outline"
                disabled={view !== '3d'}
                onPress={() => setMode((m) => (m === 'seat' ? 'overview' : 'seat'))}
              />
              <ActionButton label="Pesan" disabled={cat.status === 'sold_out'} onPress={() => {}} />
            </View>
          </>
        ) : (
          <Text className="py-3 text-center text-muted-foreground">Tap section untuk melihat kategori & harga</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

function MetricsOverlay({ view, fallbackReason }: { view: '3d' | '2d'; fallbackReason: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);
  return (
    <View className="absolute left-3 top-3 max-w-[60%] rounded-lg bg-card/90 p-2">
      <Text className="font-mono-semibold text-xs">MO-0 · {view.toUpperCase()}</Text>
      {view === '3d' ? (
        <>
          <Text className="font-mono text-[10px]">frame pertama: {metrics.firstFrameMs ?? '…'} ms</Text>
          <Text className="font-mono text-[10px]">
            fps: {metrics.fps} · min saat gerak: {Number.isFinite(metrics.minFps) ? metrics.minFps : '–'}
          </Text>
          <Text className="font-mono text-[10px]" numberOfLines={1}>
            {metrics.webgl2 ? 'WebGL2' : 'WebGL1'} · {metrics.renderer || '?'}
          </Text>
        </>
      ) : null}
      <Text className="font-mono text-[10px]">resume: {metrics.resumes}</Text>
      <Text className="font-mono text-[10px]" numberOfLines={2}>
        tap: {metrics.taps.join(' ') || '–'}
      </Text>
      {fallbackReason ? (
        <Text className="font-mono text-[10px] text-destructive" numberOfLines={3}>
          fallback 2D: {fallbackReason}
        </Text>
      ) : null}
    </View>
  );
}

function Pill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="min-h-9 min-w-9 items-center justify-center rounded-full border border-border bg-card px-3 active:opacity-70">
      <Text className="font-sans-semibold text-xs">{label}</Text>
    </Pressable>
  );
}

function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'min-h-12 flex-1 items-center justify-center rounded-lg px-3 active:opacity-80',
        variant === 'primary' ? 'bg-primary' : 'border border-input bg-background',
        disabled && 'opacity-50'
      )}>
      <Text className={cn('font-sans-semibold text-sm', variant === 'primary' ? 'text-primary-foreground' : 'text-foreground')}>
        {label}
      </Text>
    </Pressable>
  );
}
