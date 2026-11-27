import '@/global.css';
import '@/components/ui/interop';

import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplash } from '@/components/brand/animated-splash';
import { Onboarding } from '@/components/onboarding/onboarding';
import { OnboardingProvider, useOnboarding } from '@/store/onboarding';
import { SessionProvider, useSession } from '@/store/session';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.foreground,
    border: colors.border,
    notification: colors.primary,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Poppins = font web (wavy-next lib/fonts.ts: --font-display/--font-sans/--font-mono semuanya Poppins)
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <SessionProvider>
            <OnboardingProvider>
              <StatusBar style="dark" />
              {/* Font gagal dimuat = pakai font sistem, jangan blokir app. */}
              {fontsLoaded || fontError ? <RootNavigator /> : null}
            </OnboardingProvider>
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { status } = useSession();
  const onboarding = useOnboarding();
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);

  // Splash native tetap tampil sampai sesi & flag onboarding terbaca; AnimatedSplash yang menyembunyikannya.
  if (status === 'loading' || !onboarding.ready) return null;

  const signedIn = status === 'signed-in';

  // App khusus customer yang sudah login. Belum login / sesi habis (401) → /login.
  // Onboarding "Mulai" cukup menutup overlay: user yang belum login sudah berada di /login.
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={signedIn} redirectTo="/login">
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn} redirectTo="/">
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>
      </Stack>
      {splashDone && onboarding.visible ? <Onboarding onSkip={onboarding.finish} onStart={onboarding.finish} /> : null}
      {!splashDone ? <AnimatedSplash onDone={finishSplash} /> : null}
    </>
  );
}
