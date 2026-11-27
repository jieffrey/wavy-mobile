import { Text as RNText, type TextProps } from 'react-native';

import { cn } from '@/lib/cn';

type Variant = 'body' | 'display' | 'mono' | 'label';

const VARIANTS: Record<Variant, string> = {
  // Inter: body, form
  body: 'font-sans text-sm text-foreground',
  // Space Grotesk: judul & angka besar, tracking sedikit rapat (DESIGN §3)
  display: 'font-display text-xl tracking-tight text-foreground',
  // IBM Plex Mono: harga, kode, tanggal
  mono: 'font-mono text-sm text-foreground',
  // label kecil uppercase, tracking lebar
  label: 'font-mono-medium text-xs uppercase tracking-widest text-muted-foreground',
};

export function Text({ variant = 'body', className, ...props }: TextProps & { variant?: Variant }) {
  return <RNText className={cn(VARIANTS[variant], className)} {...props} />;
}
