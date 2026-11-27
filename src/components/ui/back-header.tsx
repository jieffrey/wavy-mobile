import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { colors } from '@/theme/tokens';

/** Header layar turunan: tombol kembali + judul. Kembali ke tab Beranda kalau tidak ada riwayat. */
export function BackHeader({ title, right, fallback = '/' }: { title?: string; right?: ReactNode; fallback?: string }) {
  return (
    <SafeAreaView edges={['top']} className="border-b border-border bg-background">
      <View className="h-14 flex-row items-center gap-1 px-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('Common.back')}
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback as never))}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-muted">
          <ChevronLeft color={colors.foreground} size={24} />
        </Pressable>
        <Text variant="display" className="flex-1 text-lg" numberOfLines={1}>
          {title ?? ''}
        </Text>
        {right}
      </View>
    </SafeAreaView>
  );
}
