import { router } from 'expo-router';
import { Bell, Search } from 'lucide-react-native';
import { FlatList, Pressable, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';

import { ConcertCard, FeaturedConcertCard } from '@/components/concerts/concert-card';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useApiResource } from '@/hooks/use-api-resource';
import { useNotifications } from '@/hooks/use-notifications';
import { t } from '@/i18n';
import { apiGet } from '@/lib/api';
import { useSession } from '@/store/session';
import { colors } from '@/theme/tokens';
import type { Concert, HomepageResponse } from '@/types/api';

const LATEST_COUNT = 6;

function SectionTitle({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View className="flex-row items-center justify-between px-4 pb-3">
      <Text variant="display" className="text-xl" accessibilityRole="header">
        {title}
      </Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="link">
          <Text className="font-sans-semibold text-primary">{t('Common.seeAll')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const { customer } = useSession();
  const { width } = useWindowDimensions();
  const featured = useApiResource('homepage', () => apiGet<HomepageResponse>('/homepage'));
  const latest = useApiResource('concerts-latest', () => apiGet<Concert[]>('/concerts'));
  // Hanya untuk titik "belum dibaca"; gagal memuat = titik tidak tampil (daftarnya punya state error sendiri).
  const notifications = useNotifications('notifications-home');

  const featuredList = featured.data?.featured_events ?? [];
  const latestList = (latest.data ?? []).slice(0, LATEST_COUNT);
  const name = customer?.name?.trim();
  const cardWidth = Math.min(280, width * 0.68);

  const goExplore = () => router.navigate('/explore');

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl
            refreshing={featured.refreshing || latest.refreshing}
            onRefresh={() => {
              featured.refresh();
              latest.refresh();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        <View className="flex-row items-start gap-3 px-4 pb-4 pt-2">
          <View className="flex-1 gap-1">
            <Text variant="display" className="text-2xl" accessibilityRole="header">
              {name ? t('Home.greeting', { name }) : t('Home.greetingFallback')}
            </Text>
            <Text className="text-muted-foreground">{t('Home.subtitle')}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel={
              notifications.unread > 0
                ? `${t('Profile.menu.notifications')}, ${t('Profile.menu.unread', { count: notifications.unread })}`
                : t('Profile.menu.notifications')
            }
            className="h-11 w-11 items-center justify-center rounded-full border border-border active:bg-muted">
            <Bell color={colors.foreground} size={20} />
            {notifications.unread > 0 ? (
              <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
            ) : null}
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.navigate({ pathname: '/explore', params: { focus: '1' } })}
          accessibilityRole="search"
          className="mx-4 mb-6 flex-row items-center gap-2 rounded-lg border border-input bg-surface px-4 py-3 active:opacity-80">
          <Search color={colors['muted-foreground']} size={18} />
          <Text className="text-muted-foreground">{t('Home.searchPlaceholder')}</Text>
        </Pressable>

        <SectionTitle title={t('Home.featuredTitle')} />
        {featured.loading ? (
          <LoadingState className="py-10" />
        ) : featured.error ? (
          <ErrorState error={featured.error} onRetry={featured.reload} className="py-6" />
        ) : featuredList.length === 0 ? (
          <EmptyState title={t('Home.featuredEmpty')} className="py-6" />
        ) : (
          <FlatList
            horizontal
            data={featuredList}
            keyExtractor={(c) => String(c.id)}
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + 16}
            decelerationRate="fast"
            contentContainerClassName="gap-4 px-4"
            renderItem={({ item }) => <FeaturedConcertCard concert={item} width={cardWidth} />}
          />
        )}

        <View className="mt-8">
          <SectionTitle title={t('Home.allTitle')} onSeeAll={latestList.length > 0 ? goExplore : undefined} />
          {latest.loading ? (
            <LoadingState className="py-10" />
          ) : latest.error ? (
            <ErrorState error={latest.error} onRetry={latest.reload} className="py-6" />
          ) : latestList.length === 0 ? (
            <EmptyState title={t('Home.allEmpty')} className="py-6" />
          ) : (
            <View className="gap-5 px-4">
              {latestList.map((c) => (
                <ConcertCard key={c.id} concert={c} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
