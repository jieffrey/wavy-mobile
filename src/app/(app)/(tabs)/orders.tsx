import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { OrderStatusBadge } from '@/components/ui/badge';
import { EventPoster } from '@/components/ui/event-poster';
import { PageHeader, Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useApiResource } from '@/hooks/use-api-resource';
import { t } from '@/i18n';
import { apiGet } from '@/lib/api';
import { formatDate, formatIDR } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type { Order } from '@/types/api';

// Riwayat order (DESIGN §4 Baseline → di HP tiap baris jadi kartu):
// kode & tanggal mono rata kiri, status & total rata kanan.
function OrderRow({ order }: { order: Order }) {
  const title = order.event_title || t('OrderDetail.eventUnavailable');
  return (
    <Link href={{ pathname: '/orders/[id]', params: { id: String(order.id) } }} asChild>
      <Pressable
        className="flex-row gap-3 rounded-xl border border-border bg-surface p-3 active:opacity-80"
        accessibilityRole="link">
        <EventPoster src={order.poster_url} title={title} size="sm" className="h-20 w-16 rounded-lg" />
        <View className="min-w-0 flex-1 justify-between">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1">
              <Text variant="mono" className="text-xs text-muted-foreground">
                {t('Orders.code', { id: order.id })} · {formatDate(order.created_at)}
              </Text>
              <Text variant="display" className="text-sm" numberOfLines={2}>
                {title}
              </Text>
            </View>
            <OrderStatusBadge status={order.status} />
          </View>
          <View className="flex-row items-end justify-between">
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {order.category_name ? `${order.category_name} · ` : ''}
              {t('Orders.quantity', { count: order.quantity })}
            </Text>
            <Text variant="mono" className="font-mono-semibold">
              {formatIDR(order.total_price)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

export default function OrdersScreen() {
  const orders = useApiResource('orders-history', () => apiGet<Order[]>('/orders/history'));
  const data = orders.data ?? [];

  // Status bisa berubah di layar lain (bayar, kedaluwarsa): muat ulang diam-diam saat tab dibuka lagi.
  const firstFocus = useRef(true);
  const { refresh } = orders;
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh])
  );

  return (
    <Screen>
      <PageHeader eyebrow={t('Orders.eyebrow')} title={t('Orders.title')} />
      {orders.loading ? (
        <LoadingState />
      ) : orders.error && data.length === 0 ? (
        <ErrorState error={orders.error} onRetry={orders.reload} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(o) => String(o.id)}
          contentContainerClassName="gap-3 px-4 pb-10 grow"
          renderItem={({ item }) => <OrderRow order={item} />}
          ListHeaderComponent={
            orders.error ? (
              <ErrorState error={orders.error} onRetry={orders.reload} className="flex-none p-4" />
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              title={t('Orders.emptyTitle')}
              description={t('Orders.emptyDescription')}
              action={{ label: t('Orders.browse'), onPress: () => router.navigate('/explore') }}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={orders.refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </Screen>
  );
}
