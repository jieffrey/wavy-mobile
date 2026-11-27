import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, Clock, Search } from 'lucide-react-native';
import { View } from 'react-native';

import { Piece } from '@/components/onboarding/piece';
import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { colors } from '@/theme/tokens';

// Satu komposisi animasi per slide onboarding (tinggi 290). Ilustrasi saja: tidak menampilkan data
// konser/harga, hanya bentuk kartu, kategori, timer aturan 15 menit, dan tiket QR.
export const COMPOSITION_HEIGHT = 290;

const POSTERS = [
  { from: colors.stage, to: colors['primary-glow'], label: 'Rock', rotate: -10, left: '4%', top: 70, delay: 120 },
  { from: colors.primary, to: colors['primary-glow'], label: 'Pop', rotate: 3, left: '34%', top: 40, delay: 260 },
  { from: colors['primary-glow'], to: colors.primary, label: 'Jazz', rotate: 12, left: '62%', top: 84, delay: 400 },
] as const;

// 01 · temukan: tiga poster jatuh berjajar, kolom cari pop di atas, badge "Tersedia" mendarat.
export function DiscoverComposition({ active }: { active: boolean }) {
  return (
    <View style={{ height: COMPOSITION_HEIGHT }} className="w-full">
      {POSTERS.map((p) => (
        <Piece
          key={p.label}
          active={active}
          motion="drop"
          delay={p.delay}
          drift
          rotate={p.rotate}
          style={{ position: 'absolute', left: p.left, top: p.top }}>
          <LinearGradient
            colors={[p.from, p.to]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-40 w-28 justify-end rounded-xl border border-primary-foreground/20 p-3">
            <Text variant="display" className="text-lg text-primary-foreground">
              {p.label}
            </Text>
          </LinearGradient>
        </Piece>
      ))}
      <Piece active={active} delay={40} rotate={-2} style={{ position: 'absolute', left: '8%', right: '8%', top: 0 }}>
        <View className="flex-row items-center gap-2 rounded-full bg-background px-4 py-3">
          <Search color={colors['muted-foreground']} size={18} />
          <Text className="text-muted-foreground">{t('Onboarding.slide1.search')}</Text>
        </View>
      </Piece>
      <Piece active={active} delay={720} rotate={-6} style={{ position: 'absolute', right: '6%', bottom: 4 }}>
        <View className="rounded-full bg-background px-4 py-2">
          <Text className="font-sans-semibold text-success">{t('Sales.badge.open')}</Text>
        </View>
      </Piece>
    </View>
  );
}

const CATEGORIES = [
  { name: 'Festival', qty: '× 2', motion: 'snapLeft', align: 'flex-start' },
  { name: 'VIP', qty: '× 1', motion: 'snapRight', align: 'flex-end' },
  { name: 'CAT 1', qty: '× 4', motion: 'snapLeft', align: 'flex-start' },
] as const;

// 02 · amankan: kategori tiket masuk dari kiri/kanan, timer 15:00 pop di pojok.
export function SecureComposition({ active }: { active: boolean }) {
  return (
    <View style={{ height: COMPOSITION_HEIGHT }} className="w-full justify-center">
      <View className="gap-3 pt-10">
        {CATEGORIES.map((c, i) => (
          <Piece
            key={c.name}
            active={active}
            motion={c.motion}
            delay={200 + i * 170}
            rotate={i === 1 ? 2 : -2}
            style={{ alignSelf: c.align }}>
            <View className="w-56 flex-row items-center justify-between rounded-xl bg-background px-4 py-4">
              <Text variant="display" className="text-lg">
                {c.name}
              </Text>
              <Text variant="mono" className="font-mono-semibold text-primary">
                {c.qty}
              </Text>
            </View>
          </Piece>
        ))}
      </View>
      <Piece active={active} delay={40} rotate={8} drift style={{ position: 'absolute', right: 0, top: 0 }}>
        <View className="flex-row items-center gap-2 rounded-full bg-stage px-4 py-3">
          <Clock color={colors['primary-foreground']} size={18} />
          <Text variant="mono" className="font-mono-semibold text-lg text-primary-foreground">
            15:00
          </Text>
        </View>
      </Piece>
    </View>
  );
}

// Pola QR dekoratif 7x7 (bukan QR sungguhan): 1 = kotak terisi.
const QR_ROWS = ['1110111', '1010001', '1110101', '0001010', '1101011', '1001101', '1110110'];

function DecorativeQr() {
  return (
    <View className="gap-1" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {QR_ROWS.map((row, r) => (
        <View key={r} className="flex-row gap-1">
          {row.split('').map((cell, c) => (
            <View key={c} className={cell === '1' ? 'h-4 w-4 rounded-sm bg-foreground' : 'h-4 w-4'} />
          ))}
        </View>
      ))}
    </View>
  );
}

// 03 · masuk: tiket berperforasi pop, stempel "Valid" jatuh dan melayang.
export function EnterComposition({ active }: { active: boolean }) {
  return (
    <View style={{ height: COMPOSITION_HEIGHT }} className="w-full items-center justify-center">
      <Piece active={active} delay={100} rotate={-4}>
        <View className="w-60 overflow-hidden rounded-xl border border-border bg-surface">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text variant="label">{t('Onboarding.slide3.gate')}</Text>
            <View className="h-2 w-2 rounded-full bg-primary" />
          </View>
          {/* garis perforasi dengan dua takik */}
          <View className="flex-row items-center">
            <View className="-ml-3 h-6 w-6 rounded-full bg-background" />
            <View className="mx-1 flex-1 border-t border-dashed border-input" />
            <View className="-mr-3 h-6 w-6 rounded-full bg-background" />
          </View>
          <View className="items-center p-5">
            <DecorativeQr />
          </View>
        </View>
      </Piece>
      <Piece active={active} motion="drop" delay={760} drift rotate={-10} style={{ position: 'absolute', right: 0, bottom: 10 }}>
        <View className="flex-row items-center gap-2 rounded-full bg-success px-5 py-3">
          <BadgeCheck color={colors['primary-foreground']} size={22} />
          <Text variant="display" className="text-xl text-primary-foreground">
            {t('Onboarding.slide3.valid')}
          </Text>
        </View>
      </Piece>
    </View>
  );
}
