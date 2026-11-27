import type { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { CircleAlert, Inbox } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/error-message';
import { colors } from '@/theme/tokens';

// Tiga state wajib tiap layar data (DESIGN §5/§8): loading, kosong, error. Tanpa data mock.

export function LoadingState({ label, className }: { label?: string; className?: string }) {
  return (
    <View className={cn('flex-1 items-center justify-center gap-3 p-8', className)} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.primary} size="large" />
      <Text className="text-muted-foreground">{label ?? t('States.loading')}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('flex-1 items-center justify-center gap-3 p-8', className)}>
      <View className="h-14 w-14 items-center justify-center rounded-full bg-muted">
        {icon ?? <Inbox color={colors['muted-foreground']} size={26} />}
      </View>
      <Text variant="display" className="text-center text-lg">
        {title}
      </Text>
      {description ? <Text className="text-center text-muted-foreground">{description}</Text> : null}
      {action ? <Button label={action.label} onPress={action.onPress} className="mt-2 self-stretch" /> : null}
    </View>
  );
}

export function ErrorState({
  error,
  message,
  onRetry,
  className,
}: {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <View className={cn('flex-1 items-center justify-center gap-3 p-8', className)} accessibilityRole="alert">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <CircleAlert color={colors.destructive} size={26} />
      </View>
      <Text variant="display" className="text-center text-lg">
        {t('States.errorTitle')}
      </Text>
      <Text className="text-center text-muted-foreground">{message ?? errorMessage(error)}</Text>
      {onRetry ? <Button label={t('States.retry')} variant="outline" onPress={onRetry} className="mt-2 self-stretch" /> : null}
    </View>
  );
}

/** Pesan error sebaris (di dalam form/kartu). */
export function InlineError({ message, className }: { message: string; className?: string }) {
  return (
    <View
      className={cn('flex-row items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3', className)}
      accessibilityRole="alert">
      <CircleAlert color={colors.destructive} size={18} />
      <Text className="flex-1 text-destructive">{message}</Text>
    </View>
  );
}
