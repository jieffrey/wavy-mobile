import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { colors } from '@/theme/tokens';

/** Ring progres level (DESIGN §4 Profil: Radial). `progress` 0..1 menuju level berikutnya. */
export function LevelRing({ level, progress, size = 168 }: { level: number; progress: number; size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.muted} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[circumference, circumference]}
          strokeDashoffset={circumference * (1 - p)}
        />
      </Svg>
      <Text variant="label" className="text-[10px]">
        {t('Profile.level.center')}
      </Text>
      <Text variant="display" className="text-5xl leading-[52px]">
        {level}
      </Text>
    </View>
  );
}
