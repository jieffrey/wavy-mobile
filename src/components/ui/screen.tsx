import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';

/** Wadah layar: latar background, aman dari notch. Margin samping 16 (DESIGN §4, mobile). */
export function Screen({
  children,
  edges = ['top'],
  className,
}: {
  children: ReactNode;
  edges?: Edge[];
  className?: string;
}) {
  return (
    <SafeAreaView edges={edges} className={cn('flex-1 bg-background', className)}>
      {children}
    </SafeAreaView>
  );
}

/** Judul halaman: eyebrow mono kecil + judul Space Grotesk. */
export function PageHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <View className="flex-row items-end justify-between gap-3 px-4 pb-3 pt-2">
      <View className="flex-1">
        {eyebrow ? <Text variant="label">{eyebrow}</Text> : null}
        <Text variant="display" className="text-2xl" accessibilityRole="header">
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}
