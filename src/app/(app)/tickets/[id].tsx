import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Copy, Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Perforation, TicketStatus } from '@/components/tickets/ticket-card';
import { TransferSheet } from '@/components/tickets/transfer-sheet';
import { BackHeader } from '@/components/ui/back-header';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useApiResource } from '@/hooks/use-api-resource';
import { t } from '@/i18n';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate, formatTime } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type { Ticket } from '@/types/api';

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View className="w-1/2 gap-0.5 py-2 pr-2">
      <Text variant="label" className="text-[10px]">
        {label}
      </Text>
      <Text variant={mono ? 'mono' : 'body'} className="font-sans-medium">
        {value}
      </Text>
    </View>
  );
}

// Detail tiket (DESIGN §4 Axial): QR di tengah sumbu, info di atas & bawah, garis perforasi.
export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const ticket = useApiResource(id ? `ticket-${id}` : null, () => apiGet<Ticket>(`/tickets/${id}`));
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferredTo, setTransferredTo] = useState<string | null>(null);

  const tk = ticket.data;

  if (transferredTo) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title={t('Tickets.detailTitle')} fallback="/tickets" />
        <View className="flex-1 items-center justify-center gap-3 p-8">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <CircleCheck color={colors.success} size={28} />
          </View>
          <Text variant="display" className="text-center text-lg">
            {t('Tickets.transfer.success', { email: transferredTo })}
          </Text>
          <Button
            label={t('Tickets.transfer.backToTickets')}
            onPress={() => router.navigate('/tickets')}
            className="mt-2 self-stretch"
          />
        </View>
      </View>
    );
  }

  if (ticket.loading) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title={t('Tickets.detailTitle')} fallback="/tickets" />
        <LoadingState />
      </View>
    );
  }
  if (ticket.error || !tk) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title={t('Tickets.detailTitle')} fallback="/tickets" />
        <ErrorState error={ticket.error} onRetry={ticket.reload} />
      </View>
    );
  }

  const qrSize = Math.min(260, width - 112);

  async function copyCode() {
    try {
      await Clipboard.setStringAsync(tk!.qr_code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  return (
    <View className="flex-1 bg-background">
      <BackHeader title={t('Tickets.detailTitle')} fallback="/tickets" />
      <ScrollView
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={ticket.refreshing}
            onRefresh={ticket.refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        <View className="overflow-hidden rounded-xl border border-border bg-surface">
          <View className="items-center gap-2 px-5 pb-4 pt-5">
            <Text variant="label">{t('Tickets.gatePass')}</Text>
            <Text variant="display" className="text-center text-2xl" accessibilityRole="header">
              {tk.title}
            </Text>
            <TicketStatus used={tk.is_scanned} />
          </View>

          <Perforation />

          {/* QR di sumbu tengah; latar putih supaya mudah dipindai */}
          <View className="items-center gap-3 px-5 py-6">
            <View
              className={cn('rounded-xl bg-background p-4', tk.is_scanned && 'opacity-30')}
              accessible
              accessibilityRole="image"
              accessibilityLabel={tk.is_scanned ? t('Tickets.qr.used') : t('Tickets.qr.label')}>
              <QRCode
                value={tk.qr_code}
                size={qrSize}
                color={colors.stage}
                backgroundColor={colors.background}
                ecl="M"
              />
            </View>
            {tk.is_scanned ? (
              <Text className="font-sans-semibold text-muted-foreground">{t('Tickets.qr.used')}</Text>
            ) : (
              <Text className="text-center text-xs text-muted-foreground">{t('Tickets.gateHint')}</Text>
            )}
            <Pressable
              onPress={copyCode}
              accessibilityRole="button"
              className="flex-row items-center gap-1.5 rounded-full bg-muted px-4 py-2 active:opacity-80">
              <Copy color={colors.foreground} size={14} />
              <Text className="text-xs font-sans-medium">
                {copyState === 'copied'
                  ? t('Tickets.qr.copied')
                  : copyState === 'failed'
                    ? t('Tickets.qr.copyFailed')
                    : t('Tickets.qr.copy')}
              </Text>
            </Pressable>
          </View>

          <Perforation />

          <View className="flex-row flex-wrap px-5 py-3">
            <Detail label={t('Tickets.detail.date')} value={formatDate(tk.date)} mono />
            <Detail label={t('Tickets.detail.time')} value={`${formatTime(tk.date)} WIB`} mono />
            <Detail label={t('Tickets.detail.venue')} value={tk.venue || '-'} />
            {tk.category ? <Detail label={t('Tickets.detail.category')} value={tk.category} /> : null}
            <Detail label={t('Tickets.detail.ticket')} value={t('Tickets.code', { id: tk.id })} mono />
            <Pressable
              className="w-1/2 py-2"
              accessibilityRole="link"
              onPress={() => router.push({ pathname: '/orders/[id]', params: { id: String(tk.order_id) } })}>
              <Text variant="label" className="text-[10px]">
                {t('Tickets.detail.order')}
              </Text>
              <Text variant="mono" className="font-mono-semibold text-primary">
                {t('Orders.code', { id: tk.order_id })}
              </Text>
            </Pressable>
          </View>
        </View>

        {!tk.is_scanned ? (
          <Button
            label={t('Tickets.transfer.action')}
            variant="outline"
            icon={<Send color={colors.foreground} size={16} />}
            onPress={() => setTransferOpen(true)}
            className="mt-4"
          />
        ) : null}
      </ScrollView>

      <TransferSheet
        ticket={tk}
        visible={transferOpen}
        onClose={() => setTransferOpen(false)}
        onTransferred={(email) => {
          setTransferOpen(false);
          setTransferredTo(email);
        }}
      />
    </View>
  );
}
