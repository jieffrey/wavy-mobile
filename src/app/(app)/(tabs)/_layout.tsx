import { Tabs } from 'expo-router/tabs';
import { Compass, House, ReceiptText, Ticket, UserRound, type LucideIcon } from 'lucide-react-native';
import type { ColorValue } from 'react-native';

import { t } from '@/i18n';
import { colors, fonts } from '@/theme/tokens';

function icon(Icon: LucideIcon) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Icon color={String(color)} size={size - 2} />;
  }
  return TabIcon;
}

// Tab bawah: Beranda, Jelajah, Tiket, Pesanan, Profil. Aktif = primary (aksen 10%).
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors['muted-foreground'],
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts['sans-medium'], fontSize: 11 },
      }}>
      <Tabs.Screen name="index" options={{ title: t('Tabs.home'), tabBarIcon: icon(House) }} />
      <Tabs.Screen name="explore" options={{ title: t('Tabs.explore'), tabBarIcon: icon(Compass) }} />
      <Tabs.Screen name="tickets" options={{ title: t('Tabs.tickets'), tabBarIcon: icon(Ticket) }} />
      <Tabs.Screen name="orders" options={{ title: t('Tabs.orders'), tabBarIcon: icon(ReceiptText) }} />
      <Tabs.Screen name="profile" options={{ title: t('Tabs.profile'), tabBarIcon: icon(UserRound) }} />
    </Tabs>
  );
}
