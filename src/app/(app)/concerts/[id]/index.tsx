import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, MapPin, Star, UserRound } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { BuyBar } from '@/components/concerts/buy-bar';
import { BackHeader } from '@/components/ui/back-header';
import { Button } from '@/components/ui/button';
import { SalesBadge } from '@/components/ui/badge';
import { CollapsibleText } from '@/components/ui/collapsible-text';
import { EventPoster } from '@/components/ui/event-poster';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useConcert } from '@/hooks/use-concert';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { formatDate, formatIDR, formatTime } from '@/lib/format';
import { htmlToText } from '@/lib/plain-text';
import { salesWindow } from '@/lib/sales';
import { colors } from '@/theme/tokens';
import type { TicketCategory } from '@/types/api';

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-lg bg-muted">{icon}</View>
      <View className="flex-1">
        <Text variant="label" className="text-[10px]">
          {label}
        </Text>
        <Text className="font-sans-medium">{value}</Text>
      </View>
    </View>
  );
}

function remainingOf(c: TicketCategory) {
  return c.remaining ?? Math.max(0, c.quota - c.sold);
}

function CategoryRow({ category }: { category: TicketCategory }) {
  const status = category.sales_status;
  const soldOut = status === 'sold_out' || remainingOf(category) <= 0;
  return (
    <View className={cn('gap-2 rounded-xl border border-border bg-surface p-4', soldOut && 'opacity-60')}>
      <View className="flex-row items-start justify-between gap-3">
        <Text variant="display" className="flex-1 text-base">
          {category.name}
        </Text>
        {status && status !== 'open' ? <SalesBadge status={status} /> : null}
      </View>
      {category.benefits ? <Text className="text-xs text-muted-foreground">{category.benefits}</Text> : null}
      <View className="flex-row items-end justify-between">
        <Text variant="mono" className="font-mono-semibold text-base">
          {formatIDR(category.price)}
        </Text>
        <Text variant="mono" className="text-xs text-muted-foreground">
          {t('Common.remaining', { count: remainingOf(category) })}
        </Text>
      </View>
    </View>
  );
}

export default function ConcertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const concert = useConcert(id);
  const c = concert.data;

  if (concert.loading) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader />
        <LoadingState label={t('ConcertDetail.loading')} />
      </View>
    );
  }
  if (concert.error || !c) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader />
        <ErrorState error={concert.error} onRetry={concert.reload} />
      </View>
    );
  }

  const window = salesWindow(c.sales_start_at, c.sales_end_at);
  const description = htmlToText(c.description);
  const terms = htmlToText(c.terms_conditions) || t('ConcertDetail.defaultTerms');

  return (
    <View className="flex-1 bg-background">
      <BackHeader title={c.title} />
      <ScrollView
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl
            refreshing={concert.refreshing}
            onRefresh={concert.refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        {/* Hierarchical (DESIGN §4): poster dominan → info → tiket. Poster utuh, tidak dipotong. */}
        <EventPoster
          src={c.banner_url || c.poster_url}
          title={c.title}
          size="lg"
          contentFit="contain"
          className="aspect-[4/5] max-h-[460px] w-full"
        />

        <View className="gap-5 px-4 pt-5">
          <View className="gap-2">
            <View className="flex-row flex-wrap items-center gap-2">
              <SalesBadge status={c.sales_status} />
              {c.category ? (
                <View className="rounded-md bg-info-subtle px-3 py-1">
                  <Text className="text-xs text-info">{c.category}</Text>
                </View>
              ) : null}
            </View>
            <Text variant="display" className="text-3xl leading-9" accessibilityRole="header">
              {c.title}
            </Text>
            {c.review_count > 0 ? (
              <View className="flex-row items-center gap-1">
                <Star color={colors.warning} fill={colors.warning} size={14} />
                <Text variant="mono" className="text-xs text-muted-foreground">
                  {t('ConcertDetail.rating', { rating: Number(c.avg_rating).toFixed(1), count: c.review_count })}
                </Text>
              </View>
            ) : null}
            {window ? <Text className="text-xs text-muted-foreground">{window}</Text> : null}
          </View>

          <View className="gap-3 rounded-xl border border-border p-4">
            <InfoRow
              icon={<CalendarDays color={colors.foreground} size={18} />}
              label={t('ConcertDetail.schedule')}
              value={`${formatDate(c.date, { weekday: 'long', month: 'long' })} · ${formatTime(c.date)} WIB`}
            />
            {c.venue ? (
              <InfoRow
                icon={<MapPin color={colors.foreground} size={18} />}
                label={t('ConcertDetail.venue')}
                value={c.venue}
              />
            ) : null}
            {c.artist_name ? (
              <InfoRow
                icon={<UserRound color={colors.foreground} size={18} />}
                label={t('ConcertDetail.artist')}
                value={c.artist_name}
              />
            ) : null}
          </View>

          <View className="gap-3">
            <Text variant="display" className="text-xl" accessibilityRole="header">
              {t('ConcertDetail.ticketsTitle')}
            </Text>
            {c.ticket_categories.length === 0 ? (
              <Text className="text-muted-foreground">{t('ConcertDetail.noCategories')}</Text>
            ) : (
              c.ticket_categories.map((cat) => <CategoryRow key={cat.id} category={cat} />)
            )}
          </View>

          {description ? (
            <View className="gap-2">
              <Text variant="display" className="text-xl" accessibilityRole="header">
                {t('ConcertDetail.descTitle')}
              </Text>
              <CollapsibleText text={description} />
            </View>
          ) : null}

          <View className="gap-2">
            <Text variant="display" className="text-xl" accessibilityRole="header">
              {t('ConcertDetail.termsTitle')}
            </Text>
            <CollapsibleText text={terms} lines={4} />
          </View>
        </View>
      </ScrollView>
      <BuyBar
        concert={c}
        action={
          <Button
            label={t('Sales.buy')}
            disabled={c.sales_status !== 'open' || c.ticket_categories.length === 0}
            onPress={() => router.push({ pathname: '/concerts/[id]/checkout', params: { id: String(c.id) } })}
            className="px-6"
          />
        }
      />
    </View>
  );
}
