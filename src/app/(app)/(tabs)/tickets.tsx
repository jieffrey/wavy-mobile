import { router, useFocusEffect } from 'expo-router';
import { Ticket as TicketIcon } from 'lucide-react-native';
import { useCallback, useRef } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { TicketCard } from '@/components/tickets/ticket-card';
import { PageHeader, Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useApiResource } from '@/hooks/use-api-resource';
import { t } from '@/i18n';
import { apiGet } from '@/lib/api';
import { colors } from '@/theme/tokens';
import type { Ticket } from '@/types/api';

export default function TicketsScreen() {
  const tickets = useApiResource('tickets', () => apiGet<Ticket[]>('/tickets'));
  const data = tickets.data ?? [];
  const { refresh } = tickets;

  // Tiket baru terbit setelah bayar / hilang setelah transfer: segarkan saat tab dibuka lagi.
  const firstFocus = useRef(true);
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
      <PageHeader eyebrow={t('Tickets.eyebrow')} title={t('Tickets.title')} />
      {tickets.loading ? (
        <LoadingState />
      ) : tickets.error && data.length === 0 ? (
        <ErrorState error={tickets.error} onRetry={tickets.reload} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(tk) => String(tk.id)}
          contentContainerClassName="gap-4 px-4 pb-10 grow"
          ListHeaderComponent={
            <View className="gap-3">
              <Text className="text-muted-foreground">{t('Tickets.subtitle')}</Text>
              {tickets.error ? (
                <ErrorState error={tickets.error} onRetry={tickets.reload} className="flex-none p-2" />
              ) : null}
            </View>
          }
          renderItem={({ item }) => <TicketCard ticket={item} />}
          ListEmptyComponent={
            <EmptyState
              icon={<TicketIcon color={colors['muted-foreground']} size={26} />}
              title={t('Tickets.emptyTitle')}
              description={t('Tickets.emptyDescription')}
              action={{ label: t('Tickets.browse'), onPress: () => router.navigate('/explore') }}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={tickets.refreshing}
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
