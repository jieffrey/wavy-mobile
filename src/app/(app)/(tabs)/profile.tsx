import { router } from 'expo-router';
import { Bell, ChevronRight, LogOut, Sparkles } from 'lucide-react-native';
import { useEffect, useRef, type ReactNode } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { LevelRing } from '@/components/profile/level-ring';
import { ProfileName } from '@/components/profile/profile-name';
import { PageHeader, Screen } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useApiResource } from '@/hooks/use-api-resource';
import { useNotifications } from '@/hooks/use-notifications';
import { t } from '@/i18n';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useOnboarding } from '@/store/onboarding';
import { useSession } from '@/store/session';
import { colors } from '@/theme/tokens';
import type { CustomerLevel, CustomerProfile, Order } from '@/types/api';

// Minimal konser (order paid, event berbeda) untuk level 1..5. Sama dengan web & customerService.level backend.
const LEVEL_THRESHOLDS = [0, 1, 3, 5, 10];

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 gap-0.5 p-2">
      <Text variant="label" className="text-[10px]">
        {label}
      </Text>
      <Text variant="display" className="text-lg">
        {value}
      </Text>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  detail,
  onPress,
  danger,
}: {
  icon: ReactNode;
  label: string;
  detail?: ReactNode;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-muted">
      {icon}
      <Text className={cn('flex-1 font-sans-medium text-base', danger && 'text-destructive')}>{label}</Text>
      {detail}
      {!danger ? <ChevronRight color={colors['muted-foreground']} size={18} /> : null}
    </Pressable>
  );
}

function LevelSection({ data, orders }: { data: CustomerLevel; orders: number | null }) {
  const next = LEVEL_THRESHOLDS[data.level]; // threshold level berikutnya (index = level sekarang)
  const prev = LEVEL_THRESHOLDS[data.level - 1] ?? 0;
  const atMax = next === undefined;
  const progress = atMax ? 1 : (data.attended_concerts - prev) / Math.max(1, next - prev);

  return (
    <View className="gap-4 rounded-xl border border-border bg-surface p-4">
      <View className="gap-1">
        <Text variant="display" className="text-lg">
          {t('Profile.level.title')}
        </Text>
        <Text className="text-xs text-muted-foreground">{t('Profile.level.subtitle')}</Text>
      </View>

      <View className="items-center gap-2">
        <LevelRing level={data.level} progress={progress} />
        <Text className="font-sans-semibold text-primary">
          {t('Profile.level.current', { level: data.level, label: data.level_label })}
        </Text>
        <Text variant="mono" className="text-xs text-muted-foreground">
          {atMax
            ? t('Profile.level.max')
            : `${t('Profile.level.toNext', { level: data.level + 1 })} · ${t('Profile.level.progress', {
                count: data.attended_concerts,
                target: next,
              })}`}
        </Text>
      </View>

      {/* Statistik mengelilingi ring */}
      <View className="flex-row flex-wrap border-t border-border pt-2">
        <Stat label={t('Profile.level.statLevel')} value={data.level_label} />
        <Stat label={t('Profile.level.statAttended')} value={String(data.attended_concerts)} />
        <Stat
          label={t('Profile.level.statNext')}
          value={
            atMax ? t('Profile.level.max') : t('Profile.level.remaining', { count: next - data.attended_concerts })
          }
        />
        <Stat label={t('Profile.level.statOrders')} value={orders === null ? '-' : String(orders)} />
      </View>

      <View className="gap-2">
        <Text variant="label" className="text-[10px]">
          {t('Profile.level.tiersLabel')}
        </Text>
        <View className="flex-row gap-1.5">
          {LEVEL_THRESHOLDS.map((min, i) => {
            const reached = data.level >= i + 1;
            return (
              <View
                key={min}
                className={cn('flex-1 items-center rounded-lg py-2', reached ? 'bg-primary/10' : 'bg-muted')}>
                <Text
                  variant="mono"
                  className={cn('font-mono-semibold text-xs', reached ? 'text-primary' : 'text-muted-foreground')}>
                  {t('Profile.level.tierShort', { level: i + 1 })}
                </Text>
                <Text variant="mono" className="text-[10px] text-muted-foreground">
                  {t('Profile.level.tierMin', { count: min })}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { customer, signOut, updateCustomer } = useSession();
  const { replay } = useOnboarding();
  const level = useApiResource('me-level', () => apiGet<CustomerLevel>('/me/level'));
  const orders = useApiResource('orders-history-count', () => apiGet<Order[]>('/orders/history'));
  const notifications = useNotifications('notifications-profile');
  // GET /me = sumber utama nama/email; salinan di sesi disamakan bila berbeda (mis. diubah dari web)
  const me = useApiResource('me-profile', () => apiGet<CustomerProfile>('/me'));
  // Hanya sekali per hasil fetch: setelah nama diubah di layar ini, data /me lama tidak boleh menimpanya.
  const fresh = me.data;
  const synced = useRef<CustomerProfile | null>(null);
  useEffect(() => {
    if (!fresh || !customer || synced.current === fresh) return;
    synced.current = fresh;
    if (fresh.name !== customer.name || fresh.email !== customer.email)
      updateCustomer({ id: fresh.id, name: fresh.name, email: fresh.email });
  }, [fresh, customer, updateCustomer]);

  const initial = (customer?.name?.trim() || customer?.email || 'W').charAt(0).toUpperCase();

  function confirmLogout() {
    Alert.alert(t('Profile.logoutConfirm.title'), t('Profile.logoutConfirm.body'), [
      { text: t('Profile.logoutConfirm.cancel'), style: 'cancel' },
      { text: t('Profile.logoutConfirm.confirm'), style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <Screen>
      <PageHeader eyebrow={t('Profile.eyebrow')} title={t('Profile.title')} />
      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-10"
        refreshControl={
          <RefreshControl
            refreshing={level.refreshing}
            onRefresh={() => {
              level.refresh();
              orders.refresh();
              me.refresh();
              notifications.refresh();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Text variant="display" className="text-2xl text-primary-foreground">
              {initial}
            </Text>
          </View>
          <ProfileName name={customer?.name ?? null} email={customer?.email ?? ''} />
        </View>

        {level.loading ? (
          <LoadingState className="py-10" />
        ) : level.error || !level.data ? (
          <ErrorState error={level.error} onRetry={level.reload} className="rounded-xl border border-border py-6" />
        ) : (
          <LevelSection data={level.data} orders={orders.data ? orders.data.length : null} />
        )}

        <View className="overflow-hidden rounded-xl border border-border">
          <MenuRow
            icon={<Bell color={colors.foreground} size={20} />}
            label={t('Profile.menu.notifications')}
            detail={
              notifications.unread > 0 ? (
                <View className="rounded-full bg-primary px-2 py-0.5">
                  <Text variant="mono" className="font-mono-semibold text-xs text-primary-foreground">
                    {notifications.unread}
                  </Text>
                </View>
              ) : null
            }
            onPress={() => router.push('/notifications')}
          />
          <View className="h-px bg-border" />
          <MenuRow
            icon={<Sparkles color={colors.foreground} size={20} />}
            label={t('Profile.menu.replayOnboarding')}
            onPress={replay}
          />
          <View className="h-px bg-border" />
          <MenuRow
            icon={<LogOut color={colors.destructive} size={20} />}
            label={t('Profile.menu.logout')}
            onPress={confirmLogout}
            danger
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
