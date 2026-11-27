import { Link } from 'expo-router';
import { QrCode } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { EventPoster } from '@/components/ui/event-poster';
import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDate, formatTime } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type { Ticket } from '@/types/api';

/** Garis perforasi horizontal dengan dua takik setengah lingkaran (tiket fisik, DESIGN §4). */
export function Perforation({ notch = 'bg-background' }: { notch?: string }) {
  return (
    <View className="flex-row items-center" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View className={cn('-ml-3 h-6 w-6 rounded-full', notch)} />
      <View className="mx-1 flex-1 border-t border-dashed border-input" />
      <View className={cn('-mr-3 h-6 w-6 rounded-full', notch)} />
    </View>
  );
}

export function TicketStatus({ used }: { used: boolean }) {
  return (
    <View className={cn('self-start rounded-full px-3 py-1', used ? 'bg-muted' : 'bg-success/10')}>
      <Text
        className={cn(
          'font-mono-semibold text-[10px] uppercase tracking-wider',
          used ? 'text-muted-foreground' : 'text-success'
        )}>
        {used ? t('Tickets.status.used') : t('Tickets.status.active')}
      </Text>
    </View>
  );
}

/** Kartu di "Tiket saya": bagian atas info event, sobekan, bagian bawah kode + tombol QR. */
export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Link href={{ pathname: '/tickets/[id]', params: { id: String(ticket.id) } }} asChild>
      <Pressable
        accessibilityRole="link"
        className={cn(
          'overflow-hidden rounded-xl border border-border bg-surface active:opacity-80',
          ticket.is_scanned && 'opacity-70'
        )}>
        <View className="flex-row gap-3 p-4">
          <EventPoster src={ticket.poster_url} title={ticket.title} size="sm" className="h-20 w-16 rounded-lg" />
          <View className="min-w-0 flex-1 gap-1">
            <TicketStatus used={ticket.is_scanned} />
            <Text variant="display" className="text-base" numberOfLines={2}>
              {ticket.title}
            </Text>
            <Text variant="mono" className="text-xs text-muted-foreground">
              {formatDate(ticket.date)} · {formatTime(ticket.date)} WIB
            </Text>
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {ticket.venue}
            </Text>
          </View>
        </View>
        <Perforation />
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text variant="mono" className="font-mono-semibold">
            {t('Tickets.code', { id: ticket.id })}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <QrCode color={colors.primary} size={16} />
            <Text className="font-sans-semibold text-primary">{t('Tickets.showQr')}</Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
