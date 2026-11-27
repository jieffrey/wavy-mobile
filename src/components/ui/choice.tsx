import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

/** Checkbox dengan label panjang (persetujuan S&K). */
export function Checkbox({
  checked,
  onChange,
  label,
  error,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  error?: boolean;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={4}
      className="flex-row items-start gap-3 active:opacity-80">
      <View
        className={cn(
          'mt-0.5 h-6 w-6 items-center justify-center rounded-md border-2',
          checked ? 'border-primary bg-primary' : error ? 'border-destructive' : 'border-input'
        )}>
        {checked ? <Check color={colors['primary-foreground']} size={16} strokeWidth={3} /> : null}
      </View>
      <View className="flex-1">{typeof label === 'string' ? <Text className="leading-5">{label}</Text> : label}</View>
    </Pressable>
  );
}

/** Pilihan tunggal berbentuk tombol bersebelahan (jenis kelamin, Ya/Tidak). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  error,
  label,
}: {
  value: T | '';
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
  error?: string | null;
  label?: string;
}) {
  return (
    <View className="gap-1.5">
      {label ? <Text className="font-sans-medium">{label}</Text> : null}
      <View className="flex-row gap-2" accessibilityRole="radiogroup">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              className={cn(
                'min-h-12 flex-1 items-center justify-center rounded-lg border px-3 active:opacity-80',
                active ? 'border-primary bg-primary/10' : error ? 'border-destructive' : 'border-input'
              )}>
              <Text className={cn('font-sans-medium', active ? 'text-primary' : 'text-foreground')}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
