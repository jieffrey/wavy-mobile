import { LinearGradient } from 'expo-linear-gradient';
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

import { DiscoverComposition, EnterComposition, SecureComposition } from '@/components/onboarding/compositions';
import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

// Onboarding pertama kali buka app. Alur & perilaku mengikuti SWMS: 3 slide geser, segmen progres,
// "Lewati" di kanan atas (kecuali slide terakhir), tombol besar "Lanjut" → "Mulai" (ke login).
// Visual memakai token Wavy; slide 1–2 memakai gradient pink → ungu seperti panel login web.

interface Slide {
  key: 'slide1' | 'slide2' | 'slide3';
  /** warna latar (gradient atas → bawah) */
  background: [string, string];
  text: string;
  muted: string;
  segmentOn: string;
  segmentOff: string;
  cta: string;
  ctaLabel: string;
  Composition: ComponentType<{ active: boolean }>;
}

const SLIDES: Slide[] = [
  {
    key: 'slide1',
    background: [colors.stage, colors['primary-glow']],
    text: 'text-primary-foreground',
    muted: 'text-primary-foreground/80',
    segmentOn: 'bg-primary-foreground border-primary-foreground',
    segmentOff: 'border-primary-foreground',
    cta: 'bg-primary-foreground',
    ctaLabel: 'text-stage',
    Composition: DiscoverComposition,
  },
  {
    // pink di atas (judul besar), ungu di bawah (teks body tetap kontras)
    key: 'slide2',
    background: [colors.primary, colors['primary-glow']],
    text: 'text-primary-foreground',
    muted: 'text-primary-foreground/90',
    segmentOn: 'bg-primary-foreground border-primary-foreground',
    segmentOff: 'border-primary-foreground',
    cta: 'bg-primary-foreground',
    ctaLabel: 'text-primary-glow',
    Composition: SecureComposition,
  },
  {
    key: 'slide3',
    background: [colors.background, colors.muted],
    text: 'text-foreground',
    muted: 'text-muted-foreground',
    segmentOn: 'bg-foreground border-foreground',
    segmentOff: 'border-foreground',
    cta: 'bg-primary',
    ctaLabel: 'text-primary-foreground',
    Composition: EnterComposition,
  },
];

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
      <StatusBar style={index === last ? 'dark' : 'light'} />
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
            <LinearGradient key={slide.key} colors={slide.background} style={{ width, flex: 1 }}>
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
                          segment <= slideIndex ? slide.segmentOn : slide.segmentOff
                        )}
                      />
                    ))}
                  </View>
                  {!isLast ? (
                    <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={12} className="active:opacity-70">
                      <Text className={cn('font-sans-semibold text-base underline', slide.text)}>
                        {t('Onboarding.skip')}
                      </Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}
                </View>

                <Composition active={index === slideIndex} />

                <View className="gap-2">
                  <Text variant="label" className={slide.muted}>
                    {t(`Onboarding.${slide.key}.kicker`)}
                  </Text>
                  <Text
                    variant="display"
                    accessibilityRole="header"
                    className={cn('text-[40px] leading-[44px] tracking-tighter', slide.text)}>
                    {t(`Onboarding.${slide.key}.title`)}
                  </Text>
                  <Text className={cn('text-base leading-6', slide.muted)}>{t(`Onboarding.${slide.key}.body`)}</Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => (isLast ? onStart() : goTo(slideIndex + 1))}
                  className={cn('min-h-14 items-center justify-center rounded-lg active:opacity-80', slide.cta)}>
                  <Text className={cn('font-sans-bold text-lg', slide.ctaLabel)}>
                    {isLast ? t('Onboarding.start') : t('Onboarding.next')}
                  </Text>
                </Pressable>
              </SafeAreaView>
            </LinearGradient>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
