import { StatusBar } from 'expo-status-bar';
import { useRef, useState, type ComponentRef, type ComponentType } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginBackdrop } from '@/components/brand/login-backdrop';
import { DiscoverComposition, EnterComposition, SecureComposition } from '@/components/onboarding/compositions';
import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

// Onboarding pertama kali buka app. Alur & perilaku mengikuti SWMS: 3 slide geser, segmen progres,
// "Lewati" di kanan atas (kecuali slide terakhir), tombol besar "Lanjut" → "Mulai" (ke login).
// Latar ketiga slide = latar login web (login-otp.png), sama dengan splash, tidak ikut bergeser.

interface Slide {
  key: 'slide1' | 'slide2' | 'slide3';
  Composition: ComponentType<{ active: boolean }>;
}

// Ketiga slide memakai latar yang sama dengan splash & panel login web (LoginBackdrop), jadi teks,
// segmen progres, dan tombol memakai satu set warna terang di atas pink.
const SLIDES: Slide[] = [
  { key: 'slide1', Composition: DiscoverComposition },
  { key: 'slide2', Composition: SecureComposition },
  { key: 'slide3', Composition: EnterComposition },
];

const TEXT = 'text-primary-foreground';
const MUTED = 'text-primary-foreground/90';

export function Onboarding({ onSkip, onStart }: { onSkip: () => void; onStart: () => void }) {
  const { width } = useWindowDimensions();
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const [index, setIndex] = useState(0);
  const last = SLIDES.length - 1;

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  function goTo(next: number) {
    scroller.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  }

  return (
    <Animated.View
      entering={FadeIn.duration(200).reduceMotion(ReduceMotion.System)}
      exiting={FadeOut.duration(200).reduceMotion(ReduceMotion.System)}
      style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>
      <StatusBar style="light" />
      <LoginBackdrop />
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}>
        {SLIDES.map((slide, slideIndex) => {
          const isLast = slideIndex === last;
          const { Composition } = slide;
          return (
            <View key={slide.key} style={{ width, flex: 1 }}>
              <SafeAreaView edges={['top', 'bottom', 'left', 'right']} className="flex-1 justify-between px-6 pb-4">
                <View className="flex-row items-center justify-between gap-4 pt-4">
                  <View
                    className="flex-row gap-1.5"
                    accessible
                    accessibilityLabel={t('Onboarding.progress', { step: slideIndex + 1, total: SLIDES.length })}>
                    {SLIDES.map((s, segment) => (
                      <View
                        key={s.key}
                        className={cn(
                          'h-3 w-8 rounded-full border-2',
                          segment <= slideIndex ? 'border-primary-foreground bg-primary-foreground' : 'border-primary-foreground'
                        )}
                      />
                    ))}
                  </View>
                  {!isLast ? (
                    <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={12} className="active:opacity-70">
                      <Text className={cn('font-sans-semibold text-base underline', TEXT)}>
                        {t('Onboarding.skip')}
                      </Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}
                </View>

                <Composition active={index === slideIndex} />

                <View className="gap-2">
                  <Text variant="label" className={MUTED}>
                    {t(`Onboarding.${slide.key}.kicker`)}
                  </Text>
                  <Text
                    variant="display"
                    accessibilityRole="header"
                    className={cn('text-[40px] leading-[44px] tracking-tighter', TEXT)}>
                    {t(`Onboarding.${slide.key}.title`)}
                  </Text>
                  <Text className={cn('text-base leading-6', MUTED)}>{t(`Onboarding.${slide.key}.body`)}</Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => (isLast ? onStart() : goTo(slideIndex + 1))}
                  className="min-h-14 items-center justify-center rounded-lg bg-primary-foreground active:opacity-80">
                  <Text className="font-sans-bold text-lg text-primary">
                    {isLast ? t('Onboarding.start') : t('Onboarding.next')}
                  </Text>
                </Pressable>
              </SafeAreaView>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
