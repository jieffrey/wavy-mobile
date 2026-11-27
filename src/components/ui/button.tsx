import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

const BOX: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-muted',
  outline: 'border border-input bg-background',
  ghost: 'bg-transparent',
  destructive: 'bg-destructive/10',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-foreground',
  outline: 'text-foreground',
  ghost: 'text-primary',
  destructive: 'text-destructive',
};

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
  size?: 'md' | 'lg';
}

/** Tombol: radius 8 (DESIGN §6), min tinggi 48 supaya mudah ditekan di HP. */
export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  icon,
  className,
  size = 'md',
  ...props
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-lg px-4 active:opacity-80',
        size === 'lg' ? 'min-h-14' : 'min-h-12',
        BOX[variant],
        inactive && 'opacity-50',
        className
      )}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors['primary-foreground'] : colors.primary} />
      ) : (
        icon
      )}
      <Text className={cn('font-sans-semibold', size === 'lg' ? 'text-base' : 'text-sm', LABEL[variant])}>{label}</Text>
    </Pressable>
  );
}
