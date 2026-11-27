import { Link } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { SalesBadge } from '@/components/ui/badge';
import { EventPoster } from '@/components/ui/event-poster';
import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDate, formatIDR } from '@/lib/format';
import { colors } from '@/theme/tokens';
import type { Concert } from '@/types/api';

function price(c: Concert) {
  return c.min_price != null && c.min_price !== '' && Number(c.min_price) > 0 ? formatIDR(c.min_price) : null;
}

/**
 * Kartu konser seperti web di bawah 640px: poster kecil kiri (4:5), info kanan.
 * Tanggal mono uppercase + badge status, judul Space Grotesk, lokasi, organizer, harga mono.
 */
export function ConcertCard({ concert, className }: { concert: Concert; className?: string }) {
  const from = price(concert);
  return (
    <Link href={{ pathname: '/concerts/[id]', params: { id: String(concert.id) } }} asChild>
      <Pressable className={cn('flex-row gap-3 active:opacity-80', className)} accessibilityRole="link">
        <EventPoster
          src={concert.poster_url}
          title={concert.title}
          size="sm"
          className="aspect-[4/5] w-28 rounded-xl border border-border"
        />
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center justify-between gap-1">
            <Text variant="label" className="text-[11px]" numberOfLines={1}>
              {formatDate(concert.date)}
            </Text>
            {concert.sales_status ? <SalesBadge status={concert.sales_status} /> : null}
          </View>
          <Text variant="display" className="mt-1 text-base leading-5" numberOfLines={2}>
            {concert.title}
          </Text>
          {concert.venue ? (
            <View className="mt-1 flex-row items-center gap-1">
              <MapPin color={colors['muted-foreground']} size={14} />
              <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
                {concert.venue}
              </Text>
            </View>
          ) : null}
          {concert.organizer_name ? (
            <Text className="mt-0.5 text-xs text-muted-foreground/80" numberOfLines={1}>
              {t('Common.byOrganizer', { organizer: concert.organizer_name })}
            </Text>
          ) : null}
          <View className="mt-auto border-t border-border pt-2">
            {from ? (
              <>
                <Text className="text-[10px] text-muted-foreground/80">{t('Common.startingFrom')}</Text>
                <Text variant="mono" className="font-mono-semibold">
                  {from}
                </Text>
              </>
            ) : (
              <Text className="text-xs text-muted-foreground">{t('Common.priceUnavailable')}</Text>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

/** Kartu poster besar untuk carousel "Konser unggulan". */
export function FeaturedConcertCard({ concert, width }: { concert: Concert; width: number }) {
  const from = price(concert);
  return (
    <Link href={{ pathname: '/concerts/[id]', params: { id: String(concert.id) } }} asChild>
      <Pressable style={{ width }} className="active:opacity-80" accessibilityRole="link">
        <EventPoster
          src={concert.poster_url}
          title={concert.title}
          className="aspect-[4/5] w-full rounded-xl border border-border"
        />
        <View className="mt-3 flex-row items-center justify-between gap-2">
          <Text variant="label" className="text-[11px]" numberOfLines={1}>
            {formatDate(concert.date)}
          </Text>
          {concert.sales_status ? <SalesBadge status={concert.sales_status} /> : null}
        </View>
        <Text variant="display" className="mt-1 text-lg leading-6" numberOfLines={2}>
          {concert.title}
        </Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          {concert.venue}
        </Text>
        {from ? (
          <Text variant="mono" className="mt-1 font-mono-semibold">
            {t('Common.startingFrom')} {from}
          </Text>
        ) : null}
      </Pressable>
    </Link>
  );
}
