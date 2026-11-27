import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { colors } from '@/theme/tokens';

type PosterSize = 'sm' | 'md' | 'lg';

const initials = (title: string) =>
  title
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w))
    .slice(0, 2)
    .map((w) => w.match(/[\p{L}\p{N}]/u)?.[0] ?? '')
    .join('')
    .toUpperCase();

/** Poster pengganti (DESIGN §2.5): gradient stage → primary-glow + judul. Ukuran sm = inisial. */
export function PosterFallback({ title, size = 'md', className }: { title: string; size?: PosterSize; className?: string }) {
  return (
    <LinearGradient
      colors={[colors.stage, colors['primary-glow']]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className={cn('h-full w-full', size === 'sm' ? 'items-center justify-center' : 'justify-end p-3', className)}
      accessible
      accessibilityRole="image"
      accessibilityLabel={title}>
      <Text
        numberOfLines={size === 'lg' ? 2 : 3}
        className={cn(
          'font-display leading-tight tracking-tight text-primary-foreground',
          size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-3xl' : 'text-base'
        )}>
        {size === 'sm' ? initials(title) : title}
      </Text>
    </LinearGradient>
  );
}

/** Poster/banner event. `src` kosong atau gagal dimuat → PosterFallback. */
export function EventPoster({
  src,
  title,
  size = 'md',
  contentFit = 'cover',
  className,
}: {
  src?: string | null;
  title: string;
  size?: PosterSize;
  contentFit?: 'cover' | 'contain';
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const usable = src && src.trim() && failed !== src;
  return (
    <View className={cn('overflow-hidden bg-stage', className)}>
      {usable ? (
        <Image
          source={{ uri: src }}
          contentFit={contentFit}
          transition={150}
          onError={() => setFailed(src)}
          accessibilityLabel={title}
          className="h-full w-full"
        />
      ) : (
        <PosterFallback title={title} size={size} />
      )}
    </View>
  );
}
