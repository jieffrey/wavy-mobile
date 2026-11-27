import { useEffect } from 'react';
import Animated, { Easing, ReduceMotion, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { WAVY_PATH, WAVY_PATH_LENGTH } from '@/components/brand/wavy-path';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Logo statis (fill). */
export function WavyLogo({ size = 48, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" accessibilityLabel="Wavy">
      <Path d={WAVY_PATH} fill={color} />
    </Svg>
  );
}

/**
 * Logo yang "digambar", sama dengan WavyIconAnimated di halaman login web:
 * siluet tipis (opacity 0.12) + garis yang menelusuri path dalam `drawDuration` detik (easeInOut).
 * Versi mobile hanya sekali jalan (tanpa loop), lalu memanggil onDrawn.
 */
export function WavyLogoAnimated({
  size = 96,
  color,
  drawDuration = 1.1,
  reduceMotion = false,
  onDrawn,
}: {
  size?: number;
  color: string;
  drawDuration?: number;
  reduceMotion?: boolean;
  onDrawn?: () => void;
}) {
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      onDrawn?.();
      return;
    }
    progress.value = withTiming(
      1,
      { duration: drawDuration * 1000, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.Never },
      (finished) => {
        if (finished && onDrawn) scheduleOnRN(onDrawn);
      }
    );
    // sekali saat mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strokeProps = useAnimatedProps(() => ({
    strokeDashoffset: WAVY_PATH_LENGTH * (1 - progress.value),
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" accessibilityLabel="Wavy">
      <Path d={WAVY_PATH} fill={color} opacity={0.12} />
      <AnimatedPath
        d={WAVY_PATH}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[WAVY_PATH_LENGTH, WAVY_PATH_LENGTH]}
        animatedProps={strokeProps}
      />
    </Svg>
  );
}
