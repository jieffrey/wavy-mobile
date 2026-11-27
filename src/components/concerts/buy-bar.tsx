import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { formatIDR } from '@/lib/format';
import { salesNotOpen } from '@/lib/sales';
import type { ConcertDetail } from '@/types/api';

/** Bar beli sticky di bawah layar detail konser (DESIGN §4 mobile): harga mulai + aksi + alasan bila tutup. */
export function BuyBar({ concert, action }: { concert: ConcertDetail; action?: ReactNode }) {
  const prices = concert.ticket_categories.map((c) => Number(c.price)).filter((n) => Number.isFinite(n) && n > 0);
  const from = prices.length ? Math.min(...prices) : null;
  const status = concert.sales_status;
  return (
    <SafeAreaView edges={['bottom']} className="border-t border-border bg-background px-4 pt-3">
      {status !== 'open' ? (
        <Text className="pb-2 text-center text-sm text-muted-foreground">
          {salesNotOpen(status, concert.sales_start_at)}
        </Text>
      ) : null}
      <View className="flex-row items-center gap-3 pb-3">
        <View className="flex-1">
          <Text className="text-[11px] text-muted-foreground">{t('Common.startingFrom')}</Text>
          <Text variant="mono" className="font-mono-semibold text-lg">
            {from != null ? formatIDR(from) : '-'}
          </Text>
        </View>
        {action}
      </View>
    </SafeAreaView>
  );
}
