// SPIKE: angka uji MO-0 (PLAN-v2 §5.3). Disimpan di objek mutable supaya Canvas tidak ikut re-render.

export const metrics = {
  mountedAt: 0,
  firstFrameMs: null as number | null,
  fps: 0,
  minFps: Infinity as number,
  frames: 0,
  windowStart: 0,
  renderer: '',
  webgl2: false,
  taps: [] as string[],
  resumes: 0,
  lastError: '' as string,
};

export function resetMetrics() {
  metrics.mountedAt = Date.now();
  metrics.firstFrameMs = null;
  metrics.fps = 0;
  metrics.minFps = Infinity;
  metrics.frames = 0;
  metrics.windowStart = 0;
}

/** dipanggil tiap frame dari useFrame */
export function tickFrame(rotating: boolean) {
  const now = Date.now();
  if (metrics.firstFrameMs === null) {
    metrics.firstFrameMs = now - metrics.mountedAt;
    metrics.windowStart = now;
    metrics.frames = 0;
    return;
  }
  metrics.frames++;
  const elapsed = now - metrics.windowStart;
  if (elapsed >= 1000) {
    metrics.fps = Math.round((metrics.frames * 1000) / elapsed);
    // fps minimum hanya dihitung saat kamera bergerak (kriteria "≥ 30 fps saat rotasi")
    if (rotating) metrics.minFps = Math.min(metrics.minFps, metrics.fps);
    metrics.frames = 0;
    metrics.windowStart = now;
  }
}

export function recordTap(code: string) {
  metrics.taps = [code, ...metrics.taps].slice(0, 10);
}
