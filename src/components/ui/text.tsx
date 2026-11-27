import { Text as RNText, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';

type Variant = 'body' | 'display' | 'mono' | 'label';

const VARIANTS: Record<Variant, string> = {
  // Poppins (sama dengan web): body, form
  body: 'font-sans text-sm text-foreground',
  // judul & angka besar, tracking sedikit rapat (DESIGN §3)
  display: 'font-display text-xl tracking-tight text-foreground',
  // harga, kode, tanggal (web juga memakai Poppins untuk peran mono)
  mono: 'font-mono text-sm text-foreground',
  // label kecil uppercase, tracking lebar
  label: 'font-mono-medium text-xs uppercase tracking-widest text-muted-foreground',
};

const SIZE = /^text-(xs|sm|base|lg|[2-9]?xl|\[.+\])$/;
const ALIGN = /^text-(left|center|right|justify|start|end)$/;

/** grup utilitas yang saling menimpa: warna teks, ukuran teks, keluarga font, tracking */
function group(cls: string): string | null {
  const base = cls.replace(/^.*:/, ''); // abaikan prefix varian (active:, dark:)
  const prefix = cls.slice(0, cls.length - base.length);
  if (SIZE.test(base)) return `${prefix}size`;
  if (ALIGN.test(base)) return null;
  if (base.startsWith('text-')) return `${prefix}color`;
  if (base.startsWith('font-')) return `${prefix}font`;
  if (base.startsWith('tracking-')) return `${prefix}tracking`;
  return null;
}

// cn hanya menggabung string; tanpa ini `text-foreground` dari varian bisa mengalahkan
// `text-destructive` dari pemanggil (urutan CSS), sehingga pesan error tidak berwarna merah.
function mergeVariant(variant: string, className?: string): string {
  if (!className) return variant;
  const taken = new Set(className.split(/\s+/).map(group).filter(Boolean));
  const kept = variant.split(' ').filter((c) => !taken.has(group(c) ?? ''));
  return cn(kept.join(' '), className);
}

export function Text({ variant = 'body', className, ...props }: TextProps & { variant?: Variant }) {
  return <RNText className={mergeVariant(VARIANTS[variant], className)} {...props} />;
}
