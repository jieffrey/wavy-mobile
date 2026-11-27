import { forwardRef, type ComponentRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  className?: string;
}

/** Field teks: label di atas, border input, radius 8, error merah di bawah. */
export const Input = forwardRef<ComponentRef<typeof TextInput>, InputProps>(function Input(
  { label, error, hint, className, editable = true, ...props },
  ref
) {
  return (
    <View className={cn('gap-1.5', className)}>
      {label ? <Text className="font-sans-medium text-foreground">{label}</Text> : null}
      <TextInput
        ref={ref}
        editable={editable}
        placeholderTextColor={colors['muted-foreground']}
        accessibilityLabel={label}
        className={cn(
          'min-h-12 rounded-lg border bg-background px-4 font-sans text-base text-foreground',
          error ? 'border-destructive' : 'border-input',
          !editable && 'bg-muted text-muted-foreground'
        )}
        {...props}
      />
      {error ? (
        <Text className="text-xs text-destructive" accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-xs text-muted-foreground">{hint}</Text>
      ) : null}
    </View>
  );
});
