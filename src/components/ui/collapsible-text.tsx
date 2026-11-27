import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { t } from '@/i18n';

/** Teks panjang yang dipotong dulu, bisa dibuka penuh. */
export function CollapsibleText({ text, lines = 5 }: { text: string; lines?: number }) {
  const [open, setOpen] = useState(false);
  const [truncated, setTruncated] = useState(false);
  return (
    <View className="gap-2">
      <Text
        className="leading-6 text-foreground/85"
        numberOfLines={open ? undefined : lines}
        onTextLayout={(e) => {
          if (!open && e.nativeEvent.lines.length >= lines) setTruncated(true);
        }}>
        {text}
      </Text>
      {truncated ? (
        <Pressable onPress={() => setOpen((v) => !v)} hitSlop={8} accessibilityRole="button" className="self-start">
          <Text className="font-sans-semibold text-primary">
            {open ? t('ConcertDetail.collapse') : t('ConcertDetail.expand')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
