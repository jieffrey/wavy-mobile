import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { LOCALES, t } from '@/i18n';
import { cn } from '@/lib/cn';
import { useLocale } from '@/store/locale';

/** Pilihan bahasa di Profil: ID | EN, tersimpan di storage perangkat. */
export function LocalePicker() {
  const { locale, changeLocale } = useLocale();
  return (
    <View className="min-h-14 flex-row items-center gap-3 px-4 py-3">
      <Text className="flex-1 font-sans-medium text-base">{t('Profile.language')}</Text>
      <View className="flex-row rounded-lg border border-border p-0.5" accessibilityRole="radiogroup" accessibilityLabel={t('Locale.label')}>
        {LOCALES.map((l) => {
          const active = l === locale;
          return (
            <Pressable
              key={l}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={t(`Locale.name.${l}`)}
              onPress={() => !active && changeLocale(l, '/profile')}
              hitSlop={6}
              className={cn('min-w-11 items-center rounded-md px-3 py-1.5', active ? 'bg-foreground' : 'active:bg-muted')}>
              <Text variant="mono" className={cn('font-mono-semibold text-xs', active ? 'text-background' : 'text-muted-foreground')}>
                {t(`Locale.short.${l}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
