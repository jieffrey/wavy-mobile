// SPIKE: matematika kamera (kandidat isi venue-kit/camera.ts di v2).

import { STAGE, type SpikeSection } from './stadium-data';

export type Vec3 = [number, number, number];
export type CameraPose = { position: Vec3; target: Vec3 };

export type Orbit = { yaw: number; pitch: number; radius: number };

export const ORBIT_LIMITS = { minPitch: 0.25, maxPitch: 1.35, minRadius: 55, maxRadius: 170 };
export const DEFAULT_ORBIT: Orbit = { yaw: 0, pitch: 0.85, radius: 125 };

const OVERVIEW_TARGET: Vec3 = [0, 0, 4];
const STAGE_TARGET: Vec3 = [STAGE.x, STAGE.height + 1, STAGE.z];

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Status orbit satu instance (spike hanya punya satu layar 3D). Diubah lewat fungsi di bawah,
// bukan lewat prop/ref, supaya React Compiler tidak menganggapnya mutasi prop.
const orbit: Orbit = { ...DEFAULT_ORBIT };

export const getOrbit = (): Orbit => orbit;
export function rotateOrbit(dx: number, dy: number) {
  orbit.yaw -= dx * 2.2;
  orbit.pitch = clamp(orbit.pitch - dy * 1.4, ORBIT_LIMITS.minPitch, ORBIT_LIMITS.maxPitch);
}
export function spinOrbit(dt: number) {
  orbit.yaw += dt * 0.35;
}
export function zoomOrbit(factor: number) {
  orbit.radius = clamp(orbit.radius * factor, ORBIT_LIMITS.minRadius, ORBIT_LIMITS.maxRadius);
}

/** yaw 0 = kamera di selatan (z positif) menghadap panggung di utara. */
export function orbitPose(o: Orbit): CameraPose {
  const [tx, ty, tz] = OVERVIEW_TARGET;
  const horiz = o.radius * Math.cos(o.pitch);
  return {
    position: [tx + horiz * Math.sin(o.yaw), ty + o.radius * Math.sin(o.pitch), tz + horiz * Math.cos(o.yaw)],
    target: OVERVIEW_TARGET,
  };
}

/** "Lihat dari sini": mata penonton di atas section, menghadap panggung. */
export function seatPose(s: SpikeSection): CameraPose {
  const eye = 1.7;
  // tribun: bagian belakang section lebih tinggi (tilt), duduk sedikit di belakang tengah
  const back = s.tier === 0 ? 0 : s.depth * 0.2;
  const ox = Math.sin(s.angle) * back;
  const oz = Math.cos(s.angle) * back;
  const rise = s.tier === 0 ? 0 : -Math.sin(s.tilt) * back;
  return {
    position: [s.pos_x + ox, s.elevation + s.height / 2 + rise + eye, s.pos_z + oz],
    target: STAGE_TARGET,
  };
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
