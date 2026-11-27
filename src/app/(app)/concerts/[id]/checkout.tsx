import { router, useLocalSearchParams } from 'expo-router';
import { Minus, Plus } from 'lucide-react-native';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@/components/ui/back-header';
import { SalesBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox, Segmented } from '@/components/ui/choice';
import { EventPoster } from '@/components/ui/event-poster';
import { Input } from '@/components/ui/input';
import { ErrorState, InlineError, LoadingState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { useConcert } from '@/hooks/use-concert';
import { t } from '@/i18n';
import { apiPost, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/error-message';
import { formatDateTime, formatIDR } from '@/lib/format';
import { htmlToText } from '@/lib/plain-text';
import { salesNotOpen } from '@/lib/sales';
import { useSession } from '@/store/session';
import { colors } from '@/theme/tokens';
import type { TicketCategory } from '@/types/api';

// Checkout (DESIGN §4 Column, versi HP): kategori → jumlah → data pemesan → S&K → ringkasan bawah.
// Satu kategori per pesanan, maksimal 4 tiket (PRD + backend MAX_TICKETS_PER_ORDER).
const MAX_TICKETS = 4;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Kode yang berarti pilihan tiket harus diulang setelah kuota terbaru dimuat (sama dengan web).
const RESELECT_CODES = ['QUOTA_EXCEEDED', 'ORDER_EXPIRED', 'INVALID_QUANTITY'];

type Gender = 'L' | 'P';
type Consent = 'Ya' | 'Tidak';
type Field = 'firstName' | 'email' | 'phone' | 'idNumber' | 'dob' | 'gender' | 'agreeTerms' | 'agreeData';

const remainingOf = (c: TicketCategory) => c.remaining ?? Math.max(0, c.quota - c.sold);
const isBuyable = (c: TicketCategory) => (c.sales_status ?? 'open') === 'open' && remainingOf(c) > 0;

function validDob(day: string, month: string, year: string): boolean {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return false;
  if (year.length !== 4 || y < 1900 || y > new Date().getFullYear()) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && date <= new Date();
}

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customer } = useSession();
  const concert = useConcert(id);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);

  const [names] = useState(() => (customer?.name ?? '').trim().split(/\s+/));
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [firstName, setFirstName] = useState(names[0] ?? '');
  const [lastName, setLastName] = useState(names.slice(1).join(' '));
  const [email, setEmail] = useState(customer?.email ?? '');
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [waConsent, setWaConsent] = useState<Consent>('Tidak');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeData, setAgreeData] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState('');
  const [orderError, setOrderError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const c = concert.data;

  if (concert.loading) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title={t('Checkout.title')} />
        <LoadingState />
      </View>
    );
  }
  if (concert.error || !c) {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title={t('Checkout.title')} />
        <ErrorState error={concert.error} onRetry={concert.reload} />
      </View>
    );
  }

  const selected = c.ticket_categories.find((cat) => cat.id === categoryId) ?? null;
  const maxQty = selected ? Math.max(1, Math.min(MAX_TICKETS, remainingOf(selected))) : MAX_TICKETS;
  const total = selected ? Number(selected.price) * qty : 0;
  const terms = htmlToText(c.terms_conditions) || t('ConcertDetail.defaultTerms');

  // Event tidak sedang dijual: tampilkan alasan, tanpa form (backend juga menolak POST /orders).
  if (c.sales_status !== 'open') {
    return (
      <View className="flex-1 bg-background">
        <BackHeader title={t('Checkout.title')} />
        <View className="flex-1 items-center justify-center gap-3 p-8">
          <SalesBadge status={c.sales_status} />
          <Text variant="display" className="text-center text-lg">
            {t('Checkout.salesClosedTitle')}
          </Text>
          <Text className="text-center text-muted-foreground">{salesNotOpen(c.sales_status, c.sales_start_at)}</Text>
          <Button
            label={t('Checkout.orderError.backToConcert')}
            variant="outline"
            onPress={() => router.back()}
            className="mt-2 self-stretch"
          />
        </View>
      </View>
    );
  }

  function pickCategory(cat: TicketCategory) {
    setCategoryId(cat.id);
    setQty((q) => Math.min(q, Math.max(1, Math.min(MAX_TICKETS, remainingOf(cat)))));
    setFormError('');
  }

  function validate(): boolean {
    const next: Partial<Record<Field, string>> = {};
    const digits = phone.replace(/\D/g, '');
    if (!firstName.trim()) next.firstName = t('Checkout.errors.firstName');
    if (!email.trim()) next.email = t('Checkout.errors.emailRequired');
    else if (!EMAIL_RE.test(email.trim())) next.email = t('Checkout.errors.emailInvalid');
    if (!digits) next.phone = t('Checkout.errors.phoneRequired');
    else if (digits.length < 9) next.phone = t('Checkout.errors.phoneShort');
    if (!idNumber.trim()) next.idNumber = t('Checkout.errors.idNumber');
    if (!dobDay || !dobMonth || !dobYear) next.dob = t('Checkout.errors.dobRequired');
    else if (!validDob(dobDay, dobMonth, dobYear)) next.dob = t('Checkout.errors.dobInvalid');
    if (!gender) next.gender = t('Checkout.errors.gender');
    if (!agreeTerms) next.agreeTerms = t('Checkout.errors.agreeTerms');
    if (!agreeData) next.agreeData = t('Checkout.errors.agreeData');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    setOrderError(null);
    if (!selected) {
      setFormError(t('Checkout.errors.pickCategory'));
      scroller.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!validate()) {
      setFormError(t('Checkout.errors.completeForm'));
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const order = await apiPost<{ id: number }>('/orders', {
        event_id: Number(id),
        ticket_category_id: selected.id,
        quantity: qty,
        full_name: `${firstName} ${lastName}`.trim(),
        email: email.trim(),
        phone: phone.trim(),
        id_number: idNumber.trim(),
        birth_date: `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`,
        gender: gender || null,
        wa_consent: waConsent,
      });
      router.replace({ pathname: '/orders/[id]', params: { id: String(order.id) } });
    } catch (err) {
      setOrderError(err);
      scroller.current?.scrollTo({ y: 0, animated: true });
      if (err instanceof ApiError && err.code && RESELECT_CODES.includes(err.code)) concert.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const reselect = orderError instanceof ApiError && !!orderError.code && RESELECT_CODES.includes(orderError.code);

  return (
    <View className="flex-1 bg-background">
      <BackHeader title={t('Checkout.title')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView ref={scroller} keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 p-4 pb-8">
          {/* Event yang dibeli */}
          <View className="flex-row gap-3">
            <EventPoster src={c.poster_url} title={c.title} size="sm" className="h-20 w-16 rounded-lg" />
            <View className="flex-1 justify-center">
              <Text variant="display" className="text-base" numberOfLines={2}>
                {c.title}
              </Text>
              <Text variant="mono" className="text-xs text-muted-foreground">
                {formatDateTime(c.date)}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {c.venue}
              </Text>
            </View>
          </View>

          {orderError ? (
            <View
              className="gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
              accessibilityRole="alert">
              <Text variant="display" className="text-base text-destructive">
                {t('Checkout.orderError.title')}
              </Text>
              <Text className="text-destructive">{errorMessage(orderError)}</Text>
              {reselect ? (
                <Button
                  label={t('Checkout.orderError.reselect')}
                  variant="outline"
                  onPress={() => {
                    setOrderError(null);
                    setCategoryId(null);
                    setQty(1);
                  }}
                />
              ) : (
                <Button
                  label={t('Checkout.orderError.backToConcert')}
                  variant="outline"
                  onPress={() => router.back()}
                />
              )}
            </View>
          ) : null}

          {/* 1. Kategori + jumlah */}
          <View className="gap-3">
            <Text variant="display" className="text-xl" accessibilityRole="header">
              {t('Checkout.categoriesTitle')}
            </Text>
            <Text className="text-xs text-muted-foreground">{t('Checkout.oneCategoryHint')}</Text>
            {c.ticket_categories.length === 0 ? (
              <Text className="text-muted-foreground">{t('ConcertDetail.noCategories')}</Text>
            ) : (
              c.ticket_categories.map((cat) => {
                const buyable = isBuyable(cat);
                const active = cat.id === categoryId;
                return (
                  <Pressable
                    key={cat.id}
                    disabled={!buyable}
                    onPress={() => pickCategory(cat)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active, disabled: !buyable }}
                    className={cn(
                      'gap-1 rounded-xl border p-4 active:opacity-80',
                      active ? 'border-primary bg-primary/5' : 'border-border bg-surface',
                      !buyable && 'opacity-50'
                    )}>
                    <View className="flex-row items-center justify-between gap-2">
                      <Text variant="display" className="flex-1 text-base">
                        {cat.name}
                      </Text>
                      {!buyable ? (
                        <SalesBadge
                          status={cat.sales_status && cat.sales_status !== 'open' ? cat.sales_status : 'sold_out'}
                        />
                      ) : (
                        <View
                          className={cn(
                            'h-5 w-5 items-center justify-center rounded-full border-2',
                            active ? 'border-primary' : 'border-input'
                          )}>
                          {active ? <View className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                        </View>
                      )}
                    </View>
                    {cat.benefits ? <Text className="text-xs text-muted-foreground">{cat.benefits}</Text> : null}
                    <View className="flex-row items-end justify-between">
                      <Text variant="mono" className="font-mono-semibold">
                        {formatIDR(cat.price)}
                      </Text>
                      <Text variant="mono" className="text-xs text-muted-foreground">
                        {t('Common.remaining', { count: remainingOf(cat) })}
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}

            {selected ? (
              <View className="flex-row items-center justify-between rounded-xl border border-border p-4">
                <View className="flex-1">
                  <Text className="font-sans-medium">{t('Checkout.quantity')}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {t('Checkout.maxTickets', { max: MAX_TICKETS })}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Pressable
                    onPress={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    accessibilityLabel={t('Checkout.decrease')}
                    className={cn(
                      'h-10 w-10 items-center justify-center rounded-lg border border-input',
                      qty <= 1 && 'opacity-40'
                    )}>
                    <Minus color={colors.foreground} size={18} />
                  </Pressable>
                  <Text
                    variant="mono"
                    className="w-6 text-center font-mono-semibold text-lg"
                    accessibilityLiveRegion="polite">
                    {qty}
                  </Text>
                  <Pressable
                    onPress={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    accessibilityLabel={t('Checkout.increase')}
                    className={cn(
                      'h-10 w-10 items-center justify-center rounded-lg border border-input',
                      qty >= maxQty && 'opacity-40'
                    )}>
                    <Plus color={colors.foreground} size={18} />
                  </Pressable>
                </View>
              </View>
            ) : null}
            <Text className="text-xs text-muted-foreground">{t('Checkout.priceNote')}</Text>
          </View>

          {/* 2. Data pemesan */}
          <View className="gap-4">
            <Text variant="display" className="text-xl" accessibilityRole="header">
              {t('Checkout.form.title')}
            </Text>
            <View className="flex-row gap-3">
              <Input
                className="flex-1"
                label={t('Checkout.form.firstName')}
                value={firstName}
                onChangeText={setFirstName}
                error={errors.firstName}
                autoComplete="given-name"
              />
              <Input
                className="flex-1"
                label={t('Checkout.form.lastName')}
                value={lastName}
                onChangeText={setLastName}
                autoComplete="family-name"
              />
            </View>
            <Input
              label={t('Checkout.form.email')}
              placeholder={t('Checkout.form.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Input
              label={t('Checkout.form.phone')}
              placeholder={t('Checkout.form.phonePlaceholder')}
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            <Input
              label={t('Checkout.form.idNumber')}
              value={idNumber}
              onChangeText={setIdNumber}
              error={errors.idNumber}
              maxLength={50}
            />
            <View className="gap-1.5">
              <Text className="font-sans-medium">{t('Checkout.form.dob')}</Text>
              <View className="flex-row gap-2">
                <Input
                  className="flex-1"
                  placeholder="dd"
                  accessibilityLabel={t('Checkout.form.dobDay')}
                  value={dobDay}
                  onChangeText={(v) => setDobDay(v.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                />
                <Input
                  className="flex-1"
                  placeholder="mm"
                  accessibilityLabel={t('Checkout.form.dobMonth')}
                  value={dobMonth}
                  onChangeText={(v) => setDobMonth(v.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="number-pad"
                />
                <Input
                  className="flex-[1.4]"
                  placeholder="yyyy"
                  accessibilityLabel={t('Checkout.form.dobYear')}
                  value={dobYear}
                  onChangeText={(v) => setDobYear(v.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                />
              </View>
              {errors.dob ? <Text className="text-xs text-destructive">{errors.dob}</Text> : null}
            </View>
            <Segmented<Gender>
              label={t('Checkout.form.gender')}
              value={gender}
              onChange={setGender}
              error={errors.gender}
              options={[
                { value: 'L', label: t('Checkout.form.male') },
                { value: 'P', label: t('Checkout.form.female') },
              ]}
            />
            <Segmented<Consent>
              label={t('Checkout.form.waConsent')}
              value={waConsent}
              onChange={setWaConsent}
              options={[
                { value: 'Ya', label: t('Checkout.form.yes') },
                { value: 'Tidak', label: t('Checkout.form.no') },
              ]}
            />
          </View>

          {/* 3. S&K */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text variant="display" className="text-xl" accessibilityRole="header">
                {t('Checkout.form.termsTitle')}
              </Text>
              <Pressable onPress={() => setTermsOpen(true)} hitSlop={8} accessibilityRole="button">
                <Text className="font-sans-semibold text-primary">{t('Checkout.form.readTerms')}</Text>
              </Pressable>
            </View>
            <Checkbox
              checked={agreeTerms}
              onChange={setAgreeTerms}
              error={!!errors.agreeTerms}
              label={t('Checkout.form.agreeTerms')}
            />
            {errors.agreeTerms ? <Text className="text-xs text-destructive">{errors.agreeTerms}</Text> : null}
            <Checkbox
              checked={agreeData}
              onChange={setAgreeData}
              error={!!errors.agreeData}
              label={t('Checkout.form.agreeData')}
            />
            {errors.agreeData ? <Text className="text-xs text-destructive">{errors.agreeData}</Text> : null}
          </View>

          <View className="rounded-lg bg-info-subtle p-3">
            <Text className="text-xs text-info">{t('Checkout.paymentNotice')}</Text>
          </View>
        </ScrollView>

        {/* Ringkasan sebagai bar bawah (DESIGN §4 Checkout mobile) */}
        <SafeAreaView edges={['bottom']} className="gap-2 border-t border-border bg-background px-4 pt-3">
          {formError ? <InlineError message={formError} /> : null}
          <View className="flex-row items-center gap-3 pb-3">
            <View className="flex-1">
              <Text className="text-[11px] text-muted-foreground">
                {selected
                  ? t('Checkout.summary.line', { qty, price: formatIDR(selected.price) })
                  : t('Checkout.summary.empty')}
              </Text>
              <Text variant="mono" className="font-mono-semibold text-lg">
                {formatIDR(total)}
              </Text>
            </View>
            <Button
              label={submitting ? t('Checkout.cta.processing') : t('Checkout.cta.createOrder')}
              loading={submitting}
              onPress={submit}
              className="px-6"
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <Modal
        visible={termsOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTermsOpen(false)}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <Text variant="display" className="text-lg">
              {t('ConcertDetail.termsTitle')}
            </Text>
            <Button label={t('ConcertDetail.collapse')} variant="ghost" onPress={() => setTermsOpen(false)} />
          </View>
          <ScrollView contentContainerClassName="p-4">
            <Text className="leading-6 text-foreground/85">{terms}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
