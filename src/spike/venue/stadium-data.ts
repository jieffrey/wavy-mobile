// SPIKE (tidak di-merge): data stadion rekaan dengan bentuk yang sama seperti rencana
// `venue_sections` di PLAN-v2 §1.2 (pos_x, pos_z, angle, width, depth, height, tier).
// Di v2 data ini dibangkitkan backend dari template dan datang dari GET /concerts/:id/sections.

import { colors } from '@/theme/tokens';

export type SpikeStatus = 'open' | 'sold_out';

export type SpikeSection = {
  id: number;
  code: string;
  name: string;
  kind: 'seated' | 'standing';
  tier: 0 | 1 | 2;
  capacity: number;
  pos_x: number;
  pos_z: number;
  /** rotasi sumbu Y (radian); sumbu z lokal mengarah keluar dari tengah */
  angle: number;
  width: number;
  depth: number;
  height: number;
  /** pusat ketinggian kotak */
  elevation: number;
  /** kemiringan tribun (radian, sumbu X lokal) */
  tilt: number;
  categoryId: number;
};

export type SpikeCategory = {
  id: number;
  name: string;
  price: number;
  remaining: number;
  status: SpikeStatus;
  color: string;
};

export const STAGE = { x: 0, z: -34, width: 26, depth: 8, height: 3 };
export const FIELD = { a: 28, b: 42 };

// Warna kategori: token yang ada di mobile (DESIGN §2). Sold out = muted-foreground.
export const CATEGORIES: SpikeCategory[] = [
  { id: 1, name: 'Festival', price: 1_250_000, remaining: 120, status: 'open', color: colors.primary },
  { id: 2, name: 'CAT 1', price: 950_000, remaining: 40, status: 'open', color: colors['primary-glow'] },
  { id: 3, name: 'CAT 2', price: 750_000, remaining: 0, status: 'sold_out', color: colors['muted-foreground'] },
  { id: 4, name: 'CAT 3', price: 450_000, remaining: 310, status: 'open', color: colors.info },
];

export const categoryOf = (s: SpikeSection) => CATEGORIES.find((c) => c.id === s.categoryId)!;

function ring(opts: {
  prefix: string;
  tier: 1 | 2;
  a: number;
  b: number;
  segments: number;
  depth: number;
  height: number;
  elevation: number;
  tilt: number;
  capacity: number;
  startId: number;
  category: (theta: number) => number;
}): SpikeSection[] {
  const out: SpikeSection[] = [];
  const avgR = (opts.a + opts.b) / 2;
  const width = ((2 * Math.PI * avgR) / opts.segments) * 0.9;
  let n = 0;
  for (let i = 0; i < opts.segments; i++) {
    const theta = (i / opts.segments) * Math.PI * 2;
    // sisi panggung (utara, z negatif) tidak punya tribun
    if (Math.sin(theta) < -0.8) continue;
    n++;
    out.push({
      id: opts.startId + n,
      code: `${opts.prefix}${n}`,
      name: `${opts.tier === 1 ? 'Tribun Bawah' : 'Tribun Atas'} ${n}`,
      kind: 'seated',
      tier: opts.tier,
      capacity: opts.capacity,
      pos_x: opts.a * Math.cos(theta),
      pos_z: opts.b * Math.sin(theta),
      angle: Math.PI / 2 - theta,
      width,
      depth: opts.depth,
      height: opts.height,
      elevation: opts.elevation,
      tilt: opts.tilt,
      categoryId: opts.category(theta),
    });
  }
  return out;
}

const isSide = (theta: number) => Math.abs(Math.cos(theta)) > 0.6;

export function buildStadium(): SpikeSection[] {
  const field: SpikeSection[] = [
    { code: 'FL-A', x: -7, z: -18 },
    { code: 'FL-B', x: 7, z: -18 },
    { code: 'FL-C', x: -7, z: -2 },
    { code: 'FL-D', x: 7, z: -2 },
  ].map((f, i) => ({
    id: i + 1,
    code: f.code,
    name: `Festival ${f.code.slice(3)}`,
    kind: 'standing' as const,
    tier: 0 as const,
    capacity: 1500,
    pos_x: f.x,
    pos_z: f.z,
    angle: 0,
    width: 12,
    depth: 14,
    height: 0.4,
    elevation: 0.2,
    tilt: 0,
    categoryId: 1,
  }));
  const lower = ring({
    prefix: 'L',
    tier: 1,
    a: 36,
    b: 50,
    segments: 16,
    depth: 8,
    height: 1.2,
    elevation: 3,
    tilt: -0.45,
    capacity: 800,
    startId: 100,
    category: (t) => (isSide(t) ? 2 : 3),
  });
  const upper = ring({
    prefix: 'U',
    tier: 2,
    a: 47,
    b: 61,
    segments: 20,
    depth: 9,
    height: 1.2,
    elevation: 10,
    tilt: -0.55,
    capacity: 900,
    startId: 200,
    category: () => 4,
  });
  return [...field, ...lower, ...upper];
}

/** Sudut kotak section dilihat dari atas (x, z), dipakai denah 2D. Sama dengan rotasi Y three.js. */
export function footprint(s: SpikeSection): [number, number][] {
  const c = Math.cos(s.angle);
  const sn = Math.sin(s.angle);
  const hw = s.width / 2;
  const hd = s.depth / 2;
  return [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ].map(([lx, lz]) => [s.pos_x + lx * c + lz * sn, s.pos_z - lx * sn + lz * c]);
}
