import { useLocalSearchParams } from 'expo-router';
import { Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, TextInput, View } from 'react-native';

import { ConcertCard } from '@/components/concerts/concert-card';
import { PageHeader, Screen } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useApiResource } from '@/hooks/use-api-resource';
import { t } from '@/i18n';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';
import type { Concert } from '@/types/api';

const DEBOUNCE_MS = 350;

/** Kategori diambil dari data konser (sama dengan halaman /concerts web), urut abjad, tanpa duplikat. */
function categoriesOf(list: Concert[]): string[] {
  const seen = new Map<string, string>();
  for (const c of list) {
    const cat = (c.category || '').trim();
    if (cat && !seen.has(cat.toLowerCase())) seen.set(cat.toLowerCase(), cat);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ focus?: string; q?: string; category?: string }>();
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [query, setQuery] = useState(params.q ?? '');
  const [debounced, setDebounced] = useState(query.trim());
  const [category, setCategory] = useState<string | null>(params.category ?? null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Dari kolom cari di Beranda: langsung fokus ke input.
  useEffect(() => {
    if (params.focus) setTimeout(() => input.current?.focus(), 300);
  }, [params.focus]);

  const all = useApiResource('concerts-all', () => apiGet<Concert[]>('/concerts'));
  const categories = useMemo(() => categoriesOf(all.data ?? []), [all.data]);

  const qs = new URLSearchParams();
  if (category) qs.set('category', category);
  if (debounced) qs.set('q', debounced);
  const path = `/concerts${qs.toString() ? `?${qs.toString()}` : ''}`;
  const filtered = !!category || !!debounced;
  const results = useApiResource(filtered ? path : null, () => apiGet<Concert[]>(path));

  // Tanpa filter, pakai daftar lengkap (tidak perlu request kedua).
  const list = filtered ? results : all;
  const data = list.data ?? [];

  function reset() {
    setQuery('');
    setDebounced('');
    setCategory(null);
  }

  return (
    <Screen>
      <PageHeader eyebrow={t('Explore.eyebrow')} title={t('Explore.title')} />

      <View className="mx-4 flex-row items-center gap-2 rounded-lg border border-input bg-background px-3">
        <Search color={colors['muted-foreground']} size={18} />
        <TextInput
          ref={input}
          value={query}
          onChangeText={setQuery}
          placeholder={t('Explore.searchPlaceholder')}
          placeholderTextColor={colors['muted-foreground']}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={t('Explore.searchPlaceholder')}
          className="min-h-12 flex-1 font-sans text-base text-foreground"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel={t('Explore.clear')}>
            <X color={colors['muted-foreground']} size={18} />
          </Pressable>
        ) : null}
      </View>

      {/* Chip kategori: filter sticky di atas daftar (DESIGN §4 Browse) */}
      <View className="border-b border-border pb-3 pt-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4">
          {[null, ...categories].map((cat) => {
            const active = category === cat;
            return (
              <Pressable
                key={cat ?? '__all'}
                onPress={() => setCategory(cat)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={cn(
                  'rounded-full border px-4 py-2 active:opacity-80',
                  active ? 'border-primary bg-primary' : 'border-border bg-muted'
                )}>
                <Text className={cn('font-sans-medium', active ? 'text-primary-foreground' : 'text-foreground')}>
                  {cat ?? t('Explore.all')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {list.loading ? (
        <LoadingState />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(c) => String(c.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-5 px-4 pb-10 pt-4 grow"
          ListHeaderComponent={
            data.length > 0 ? <Text variant="label">{t('Explore.resultCount', { count: data.length })}</Text> : undefined
          }
          ListEmptyComponent={
            filtered ? (
              <EmptyState
                title={t('Explore.emptyTitle')}
                description={t('Explore.emptyDescription')}
                action={{ label: t('Explore.resetFilters'), onPress: reset }}
              />
            ) : (
              <EmptyState title={t('Explore.emptyAllTitle')} description={t('Explore.emptyAllDescription')} />
            )
          }
          renderItem={({ item }) => <ConcertCard concert={item} />}
          refreshControl={
            <RefreshControl
              refreshing={list.refreshing}
              onRefresh={() => {
                list.refresh();
                if (filtered) all.refresh();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </Screen>
  );
}
