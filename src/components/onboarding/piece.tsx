import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Elemen animasi onboarding. Gerakan diambil dari onboarding SWMS (spring pop / snap / drop + drift),
// tampilannya bebas: isi `children` dengan kartu bertoken Wavy.

export type Motion = 'pop' | 'snapLeft' | 'snapRight' | 'drop';

interface PieceProps {
  /** slide sedang tampil: (ulang) putar animasi masuk */
  active: boolean;
  motion?: Motion;
  delay?: number;
  /** melayang pelan naik-turun setelah masuk */
  drift?: boolean;
  /** sudut diam, derajat */
  rotate?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  children?: ReactNode;
}

export function Piece({
  active,
  motion = 'pop',
  delay = 0,
  drift = false,
  rotate = 0,
  style,
  className,
  children,
}: PieceProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  const float = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    if (!active) {
      progress.value = 0;
      float.value = 0;
      return;
    }
    progress.value = withDelay(delay, withSpring(1, { damping: 11, stiffness: 170, mass: 0.8 }));
    if (drift) {
      float.value = withDelay(
        delay + 500,
        withRepeat(
          withSequence(
            withTiming(-7, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
            withTiming(7, { duration: 1700, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        )
      );
    }
  }, [active, delay, drift, reduceMotion, progress, float]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const enter = 1 - p;
    const base = [{ translateY: float.value }, { rotate: `${rotate + (motion === 'pop' ? -18 * enter : 0)}deg` }];
    switch (motion) {
      case 'snapLeft':
        return { opacity: Math.min(1, p * 2), transform: [{ translateX: -220 * enter }, ...base] };
      case 'snapRight':
        return { opacity: Math.min(1, p * 2), transform: [{ translateX: 220 * enter }, ...base] };
      case 'drop':
        return {
          opacity: Math.min(1, p * 2),
          transform: [{ translateY: float.value - 160 * enter }, { rotate: `${rotate}deg` }],
        };
      default:
        return { opacity: Math.min(1, p * 3), transform: [...base, { scale: Math.max(0, p) }] };
    }
  });

  return (
    <Animated.View style={[style, animatedStyle]}>
      {/* className di View biasa: NativeWind tidak memetakan className pada Animated.View */}
      <View className={className}>{children}</View>
    </Animated.View>
  );
}
