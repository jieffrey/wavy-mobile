import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { t, tMaybe } from '@/i18n';
import { cn } from '@/lib/cn';
import type { OrderStatus, SalesStatus } from '@/types/api';

// Warna badge sama dengan web: components/concerts/sales-badge.tsx & orders/order-status-badge.tsx.
const SALES_TONE: Record<SalesStatus, { box: string; text: string }> = {
  open: { box: 'bg-success/10', text: 'text-success' },
  sold_out: { box: 'bg-destructive/10', text: 'text-destructive' },
  upcoming: { box: 'bg-warning/10', text: 'text-warning' },
  closed: { box: 'bg-muted', text: 'text-muted-foreground' },
};

export function SalesBadge({ status, className }: { status: SalesStatus; className?: string }) {
  const tone = SALES_TONE[status] ?? SALES_TONE.closed;
  return (
    <View className={cn('self-start rounded-md px-3 py-1', tone.box, className)}>
      <Text className={cn('font-sans-medium text-xs', tone.text)}>{t(`Sales.badge.${status}`)}</Text>
    </View>
  );
}

// DESIGN §6: pending amber, paid hijau, expired/dibatalkan abu, ditolak/refund merah. Mono uppercase, pill.
const ORDER_TONE: Record<OrderStatus, { box: string; text: string }> = {
  pending_payment: { box: 'bg-warning/10', text: 'text-warning' },
  paid: { box: 'bg-success/10', text: 'text-success' },
  expired: { box: 'bg-muted', text: 'text-muted-foreground' },
  rejected: { box: 'bg-destructive/10', text: 'text-destructive' },
  refunded: { box: 'bg-destructive/10', text: 'text-destructive' },
  cancelled: { box: 'bg-muted', text: 'text-muted-foreground' },
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus | string; className?: string }) {
  const tone = ORDER_TONE[status as OrderStatus] ?? ORDER_TONE.expired;
  return (
    <View className={cn('self-start rounded-full px-3 py-1', tone.box, className)}>
      <Text className={cn('font-mono-semibold text-[10px] uppercase tracking-wider', tone.text)}>
        {tMaybe(`OrderStatus.${status}`) ?? status}
      </Text>
    </View>
  );
}
