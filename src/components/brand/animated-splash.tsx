import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInLeft, FadeOut, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

import { LoginBackdrop } from '@/components/brand/login-backdrop';
import { WavyLogoAnimated } from '@/components/brand/wavy-logo';
import { Text } from '@/components/ui/text';
import { colors } from '@/theme/tokens';

const HOLD_MS = 600; // jeda setelah nama brand muncul, sebelum overlay memudar

/**
 * Splash animasi setelah splash native: latar sama persis dengan panel login web (login-otp.png),
 * logo Wavy "digambar" lalu nama brand masuk dari kiri (sama dengan login-otp.tsx web).
 * Overlay ini menutupi app di bawahnya, lalu memudar dan memanggil onDone.
 */
export function AnimatedSplash({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReducedMotion();
  const [showName, setShowName] = useState(false);

  // Sembunyikan splash native setelah overlay sudah tergambar, supaya tidak ada kedipan.
  const onLayout = useCallback(() => {
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    if (!showName) return;
    const timer = setTimeout(onDone, reduceMotion ? 300 : 500 + HOLD_MS);
    return () => clearTimeout(timer);
  }, [showName, onDone, reduceMotion]);

  return (
    <Animated.View
      style={StyleSheet.absoluteFill}
      exiting={FadeOut.duration(250).reduceMotion(ReduceMotion.System)}
      onLayout={onLayout}
      accessibilityLabel="Wavy">
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center">
        <LoginBackdrop />
        <View className="flex-row items-center gap-3">
          <WavyLogoAnimated
            size={72}
            color={colors['primary-foreground']}
            reduceMotion={reduceMotion}
            onDrawn={() => setShowName(true)}
          />
          {showName ? (
            <Animated.View entering={FadeInLeft.duration(500).reduceMotion(ReduceMotion.System)}>
              <Text variant="display" className="text-5xl text-primary-foreground">
                Wavy
              </Text>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}
