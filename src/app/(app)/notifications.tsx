import { Bell } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';

import { BackHeader } from '@/components/ui/back-header';
import { EmptyState, ErrorState, InlineError, LoadingState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useNotifications } from '@/hooks/use-notifications';
import { t } from '@/i18n';
import { apiPost } from '@/lib/api';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/error-message';
import { formatDateTime } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type { NotificationItem } from '@/types/api';

export default function NotificationsScreen() {
  const notifications = useNotifications();
  const data = notifications.data ?? [];
  const [marking, setMarking] = useState<number | null>(null);
  const [markError, setMarkError] = useState<unknown>(null);

  // Tandai baca hanya setelah backend mengonfirmasi (tanpa perubahan palsu di layar).
  async function markRead(item: NotificationItem) {
    if (item.read || marking !== null) return;
    setMarking(item.id);
    setMarkError(null);
    try {
      await apiPost(`/notifications/${item.id}/read`);
      notifications.setData(data.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    } catch (err) {
      setMarkError(err);
    } finally {
      setMarking(null);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <BackHeader title={t('Notifications.title')} fallback="/profile" />
      {notifications.loading ? (
        <LoadingState />
      ) : notifications.error && data.length === 0 ? (
        <ErrorState error={notifications.error} onRetry={notifications.reload} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(n) => String(n.id)}
          contentContainerClassName="gap-3 p-4 pb-10 grow"
          ListHeaderComponent={markError ? <InlineError message={errorMessage(markError)} /> : undefined}
          ListEmptyComponent={
            <EmptyState
              icon={<Bell color={colors['muted-foreground']} size={26} />}
              title={t('Notifications.empty')}
              description={t('Notifications.emptyDescription')}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => markRead(item)}
              disabled={item.read}
              accessibilityRole="button"
              accessibilityHint={item.read ? undefined : t('Notifications.markRead')}
              className={cn(
                'gap-1 rounded-xl border p-4 active:opacity-80',
                item.read ? 'border-border bg-background' : 'border-primary/30 bg-primary/5'
              )}>
              <View className="flex-row items-start gap-2">
                {!item.read ? <View className="mt-1.5 h-2 w-2 rounded-full bg-primary" /> : null}
                <Text variant="display" className="flex-1 text-base">
                  {item.title}
                </Text>
                {marking === item.id ? <ActivityIndicator color={colors.primary} size="small" /> : null}
              </View>
              <Text className="text-foreground/85">{item.message}</Text>
              <View className="flex-row items-center justify-between pt-1">
                <Text variant="mono" className="text-xs text-muted-foreground">
                  {formatDateTime(item.created_at)}
                </Text>
                {!item.read ? (
                  <Text className="text-xs font-sans-semibold text-primary">{t('Notifications.unread')}</Text>
                ) : null}
              </View>
            </Pressable>
          )}
          refreshControl={
            <RefreshControl
              refreshing={notifications.refreshing}
              onRefresh={notifications.refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}
