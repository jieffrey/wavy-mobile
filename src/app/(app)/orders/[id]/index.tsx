import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CircleCheck, Clock } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/ui/back-header';
import { OrderStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventPoster } from '@/components/ui/event-poster';
import { ErrorState, InlineError, LoadingState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useApiResource } from '@/hooks/use-api-resource';
import { useCountdown } from '@/hooks/use-countdown';
import { t } from '@/i18n';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import { errorMessage } from '@/lib/error-message';
import { formatCountdown, formatDateTime, formatIDR } from '@/lib/format';
import { createPayment, syncPaymentStatus } from '@/lib/payment';
import { colors } from '@/theme/tokens';
import type { Order } from '@/types/api';

function Row({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <View className="flex-row items-start justify-between gap-4 py-1.5">
      <Text className="text-muted-foreground">{label}</Text>
      {typeof value === 'string' ? (
        <Text variant={mono ? 'mono' : 'body'} className="flex-1 text-right font-sans-medium">
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = useApiResource(id ? `order-${id}` : null, () => apiGet<Order>(`/orders/${id}`));
  const o = order.data;
  const pending = o?.status === 'pending_payment';
  const secondsLeft = useCountdown(pending ? o?.expires_at : null);

  const [paying, setPaying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [payError, setPayError] = useState<unknown>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<unknown>(null);
  const backFromPayment = useRef(false);

  const { refresh } = order;

  // Tanya Midtrans lewat backend (untuk localhost tanpa webhook), lalu muat ulang order.
  const sync = useCallback(async () => {
    if (!id) return;
    setChecking(true);
    setPayError(null);
    try {
      await syncPaymentStatus(id);
    } catch (err) {
      setPayError(err);
    } finally {
      await refresh();
      setChecking(false);
    }
  }, [id, refresh]);

  // Kembali dari WebView Midtrans (selesai atau ditutup) → cek status.
  useFocusEffect(
    useCallback(() => {
      if (!backFromPayment.current) return;
      backFromPayment.current = false;
      sync();
    }, [sync])
  );

  // Waktu habis → muat ulang: backend menandai expired (lazy expiry) dan melepas kuota.
  const expiredLocally = pending && secondsLeft === 0;
  useEffect(() => {
    if (expiredLocally) refresh();
  }, [expiredLocally, refresh]);

  async function pay() {
    if (!id) return;
    setPaying(true);
    setPayError(null);
    try {
      const { redirect_url } = await createPayment(id);
      backFromPayment.current = true;
      router.push({ pathname: '/orders/[id]/pay', params: { id, url: redirect_url } });
    } catch (err) {
      setPayError(err);
      // ORDER_EXPIRED / ORDER_NOT_PENDING: status di layar sudah basi
      if (err instanceof ApiError && err.status === 409) refresh();
    } finally {
      setPaying(false);
    }
  }

  // POST /orders/:id/cancel: status -> cancelled, kuota langsung lepas. Gagal = pesan error, order dimuat ulang.
  async function cancelOrder() {
    if (!id) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await apiPost(`/orders/${id}/cancel`);
      setConfirmCancel(false);
    } catch (err) {
      setCancelError(err);
    } finally {
      await refresh();
      setCancelling(false);
    }
  }

  if (order.loading) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title={t('OrderDetail.title')} fallback="/orders" />
        <LoadingState label={t('OrderDetail.loading')} />
      </View>
    );
  }
  if (order.error || !o) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title={t('OrderDetail.title')} fallback="/orders" />
        <ErrorState error={order.error} onRetry={order.reload} />
      </View>
    );
  }

  const notConfigured = payError instanceof ApiError && payError.code === 'PAYMENT_NOT_CONFIGURED';
  const title = o.event_title || t('OrderDetail.eventUnavailable');

  return (
    <View className="flex-1 bg-background">
      <BackHeader title={t('OrderDetail.title')} fallback="/orders" />
      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={order.refreshing}
            onRefresh={pending ? sync : refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        <View className="flex-row items-center justify-between">
          <View>
            <Text variant="label" className="text-[10px]">
              {t('OrderDetail.number')}
            </Text>
            <Text variant="mono" className="font-mono-semibold text-lg">
              {t('Orders.code', { id: o.id })}
            </Text>
          </View>
          <OrderStatusBadge status={o.status} />
        </View>

        {pending && secondsLeft !== null ? (
          <View className="flex-row items-center gap-3 rounded-xl bg-warning/10 p-4" accessibilityLiveRegion="polite">
            <Clock color={colors.warning} size={22} />
            <View className="flex-1">
              <Text className="font-sans-semibold text-warning">{t('OrderDetail.timeLeft')}</Text>
              <Text className="text-xs text-warning">{t('OrderDetail.payBefore')}</Text>
            </View>
            <Text variant="mono" className="font-mono-semibold text-2xl text-warning">
              {formatCountdown(secondsLeft)}
            </Text>
          </View>
        ) : null}

        {o.status === 'expired' ? (
          <View className="gap-2 rounded-xl bg-muted p-4">
            <Text variant="display" className="text-base">
              {t('OrderDetail.expiredTitle')}
            </Text>
            <Text className="text-muted-foreground">{t('OrderDetail.expiredBody')}</Text>
            <Button
              label={t('OrderDetail.orderAgain')}
              variant="outline"
              onPress={() => router.push({ pathname: '/concerts/[id]', params: { id: String(o.event_id) } })}
              className="mt-1"
            />
          </View>
        ) : null}

        {o.status === 'cancelled' ? (
          <View className="gap-2 rounded-xl bg-muted p-4" accessibilityLiveRegion="polite">
            <Text variant="display" className="text-base">
              {t('OrderDetail.cancelledTitle')}
            </Text>
            <Text className="text-muted-foreground">{t('OrderDetail.cancelledBody')}</Text>
            <Button
              label={t('OrderDetail.orderAgain')}
              variant="outline"
              onPress={() => router.push({ pathname: '/concerts/[id]', params: { id: String(o.event_id) } })}
              className="mt-1"
            />
          </View>
        ) : null}

        {o.status === 'paid' ? (
          <View className="gap-2 rounded-xl bg-success/10 p-4">
            <View className="flex-row items-center gap-2">
              <CircleCheck color={colors.success} size={20} />
              <Text variant="display" className="text-base text-success">
                {t('OrderDetail.paidTitle')}
              </Text>
            </View>
            <Text className="text-success">{t('OrderDetail.paidBody')}</Text>
            <Button label={t('OrderDetail.openTickets')} onPress={() => router.navigate('/tickets')} className="mt-1" />
          </View>
        ) : null}

        {o.status === 'rejected' || o.status === 'refunded' ? (
          <View className="rounded-xl bg-destructive/10 p-4">
            <Text className="text-destructive">
              {o.status === 'rejected' ? t('OrderDetail.rejectedBody') : t('OrderDetail.refundedBody')}
            </Text>
          </View>
        ) : null}

        {/* Ringkasan tiket */}
        <View className="gap-3 rounded-xl border border-border bg-surface p-4">
          <Text variant="label">{t('OrderDetail.summary')}</Text>
          <View className="flex-row gap-3">
            <EventPoster src={o.poster_url} title={title} size="sm" className="h-20 w-16 rounded-lg" />
            <View className="flex-1 justify-center">
              <Text variant="display" className="text-base" numberOfLines={2}>
                {title}
              </Text>
              {o.event_date ? (
                <Text variant="mono" className="text-xs text-muted-foreground">
                  {formatDateTime(o.event_date)}
                </Text>
              ) : null}
              {o.venue ? (
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {o.venue}
                </Text>
              ) : null}
            </View>
          </View>
          <View className="border-t border-border pt-2">
            <Row label={t('OrderDetail.category')} value={o.category_name ?? '-'} />
            <Row label={t('OrderDetail.quantity')} value={t('OrderDetail.tickets', { count: o.quantity })} />
            <Row label={t('OrderDetail.serviceFee')} value={t('OrderDetail.free')} />
            <Row label={t('OrderDetail.createdAt')} value={formatDateTime(o.created_at)} mono />
            {o.paid_at ? <Row label={t('OrderDetail.paidAt')} value={formatDateTime(o.paid_at)} mono /> : null}
          </View>
          <View className="flex-row items-center justify-between border-t border-border pt-3">
            <Text className="font-sans-semibold">{t('OrderDetail.total')}</Text>
            <Text variant="mono" className="font-mono-semibold text-lg text-primary">
              {formatIDR(o.total_price)}
            </Text>
          </View>
        </View>

        {o.full_name || o.email || o.phone ? (
          <View className="rounded-xl border border-border p-4">
            <Text variant="label" className="pb-1">
              {t('OrderDetail.buyer')}
            </Text>
            {o.full_name ? <Row label={t('OrderDetail.name')} value={o.full_name} /> : null}
            {o.email ? <Row label={t('OrderDetail.email')} value={o.email} /> : null}
            {o.phone ? <Row label={t('OrderDetail.phone')} value={o.phone} mono /> : null}
          </View>
        ) : null}

        {pending ? (
          <Text className="text-xs text-muted-foreground">
            {notConfigured ? t('OrderDetail.paymentManual') : t('OrderDetail.paymentOnline')}
          </Text>
        ) : null}
        {payError ? <InlineError message={errorMessage(payError)} /> : null}

        {pending && !expiredLocally ? (
          confirmCancel ? (
            <View className="gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4" accessibilityRole="alert">
              <Text className="font-sans-semibold">{t('OrderDetail.cancel.confirmTitle')}</Text>
              <Text className="text-xs text-muted-foreground">{t('OrderDetail.cancel.confirmBody')}</Text>
              {cancelError ? <InlineError message={errorMessage(cancelError)} /> : null}
              <Button
                label={cancelling ? t('OrderDetail.cancel.cancelling') : t('OrderDetail.cancel.confirm')}
                variant="destructive"
                loading={cancelling}
                onPress={cancelOrder}
              />
              <Button
                label={t('OrderDetail.cancel.keep')}
                variant="outline"
                disabled={cancelling}
                onPress={() => setConfirmCancel(false)}
              />
            </View>
          ) : (
            <View className="gap-2">
              <Button
                label={t('OrderDetail.cancel.cta')}
                variant="destructive"
                disabled={paying || checking}
                onPress={() => {
                  setCancelError(null);
                  setConfirmCancel(true);
                }}
              />
              {cancelError ? <InlineError message={errorMessage(cancelError)} /> : null}
            </View>
          )
        ) : null}
      </ScrollView>

      {pending && !expiredLocally ? (
        <SafeAreaView edges={['bottom']} className="gap-2 border-t border-border bg-background px-4 pb-3 pt-3">
          <Button
            label={paying ? t('OrderDetail.pay.processing') : t('OrderDetail.pay.cta')}
            loading={paying}
            disabled={checking || cancelling}
            onPress={pay}
            size="lg"
          />
          <Button
            label={checking ? t('OrderDetail.checking') : t('OrderDetail.checkStatus')}
            variant="outline"
            loading={checking}
            disabled={paying}
            onPress={sync}
          />
        </SafeAreaView>
      ) : null}
    </View>
  );
}
