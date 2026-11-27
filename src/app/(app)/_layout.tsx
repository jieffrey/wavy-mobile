import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

// Semua layar customer yang butuh login. Root layout melindungi grup ini dengan Stack.Protected.
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
