import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginBackdrop } from '@/components/brand/login-backdrop';
import { WavyLogo } from '@/components/brand/wavy-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlineError } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { apiPatch, apiPost, ApiError, setApiToken } from '@/lib/api';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/error-message';
import { loginSchema, nameSchema, otpSchema, validateForm, type FieldErrors } from '@/lib/validation';
import { useSession } from '@/store/session';
import { colors } from '@/theme/tokens';
import type { Customer, CustomerProfile } from '@/types/api';

// Masuk/daftar customer satu alur (sama dengan web):
//   email -> POST /auth/send-otp -> OTP -> POST /auth/verify-otp
//   -> bila needs_name (akun baru / nama kosong): isi nama -> PATCH /me -> masuk.
// Sesi baru disimpan setelah nama terisi, jadi user tidak masuk ke app tanpa nama.
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

type Field = 'name' | 'email' | 'code';

interface VerifyResult {
  access_token: string;
  customer: Customer;
  needs_name: boolean;
}

function sendError(err: unknown): string {
  if (err instanceof ApiError && (err.status === 0 || err.status === 429 || err.code)) return errorMessage(err);
  return t('Auth.otpSendFailed');
}

export function AuthScreen() {
  const { signIn, expired } = useSession();
  const [step, setStep] = useState<'email' | 'otp' | 'name'>('email');
  // token dari verify-otp yang menunggu nama diisi (belum disimpan sebagai sesi)
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Field>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const codeInput = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const trimmedEmail = email.trim();

  function clearField(field: Field) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setError('');
  }

  async function handleSend() {
    const checked = validateForm<typeof loginSchema, Field>(loginSchema, { email });
    setFieldErrors(checked.errors ?? {});
    if (!checked.data) return;
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await apiPost('/auth/send-otp', { email: checked.data.email });
      setStep('otp');
      setCode('');
      setResendIn(RESEND_SECONDS);
      setTimeout(() => codeInput.current?.focus(), 250);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && typeof err.details?.field === 'string') {
        // validasi backend sebagai cadangan: tampilkan di field yang sama
        setFieldErrors({ [err.details.field as Field]: errorMessage(err) });
      } else setError(sendError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(value = code) {
    const checked = validateForm<typeof otpSchema, Field>(otpSchema, { code: value });
    setFieldErrors(checked.errors ?? {});
    if (!checked.data) return;
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const res = await apiPost<VerifyResult>('/auth/verify-otp', { email: trimmedEmail, code: checked.data.code });
      if (res.needs_name) {
        // token dipakai untuk PATCH /me saja; sesi disimpan setelah nama terisi
        setApiToken(res.access_token);
        setPendingToken(res.access_token);
        setStep('name');
        return;
      }
      await signIn(res.access_token, res.customer);
      // Stack.Protected memindahkan ke tab Beranda setelah status = signed-in.
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setFieldErrors({ code: t('Auth.otpWrong') });
      else setError(errorMessage(err));
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName() {
    const checked = validateForm<typeof nameSchema, Field>(nameSchema, { name });
    setFieldErrors(checked.errors ?? {});
    if (!checked.data || !pendingToken) return;
    setError('');
    setLoading(true);
    try {
      const profile = await apiPatch<CustomerProfile>('/me', { name: checked.data.name });
      await signIn(pendingToken, { id: profile.id, name: profile.name, email: profile.email });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') setFieldErrors({ name: errorMessage(err) });
      else setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendIn > 0 || loading) return;
    setError('');
    setFieldErrors({});
    setNotice('');
    setLoading(true);
    try {
      await apiPost('/auth/send-otp', { email: trimmedEmail });
      setResendIn(RESEND_SECONDS);
      setCode('');
      setNotice(t('Auth.resent'));
    } catch (err) {
      setError(sendError(err));
    } finally {
      setLoading(false);
    }
  }

  function onCodeChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCode(digits);
    setFieldErrors({});
    setError('');
    if (digits.length === OTP_LENGTH && !loading) handleVerify(digits);
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      {/* Panel brand: latar yang sama dengan panel kiri login web (login-otp.png) */}
      <View className="overflow-hidden pb-10">
        <LoginBackdrop />
        <SafeAreaView edges={['top']} className="items-start gap-3 px-6 pt-10">
          <View className="flex-row items-center gap-3">
            <WavyLogo size={44} color={colors['primary-foreground']} />
            <Text variant="display" className="text-4xl text-primary-foreground">
              Wavy
            </Text>
          </View>
          <Text className="text-base text-primary-foreground/90">{t('Auth.tagline')}</Text>
        </SafeAreaView>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="-mt-6 flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="flex-1 rounded-t-3xl bg-background"
          contentContainerClassName="gap-5 px-6 pb-10 pt-8">
          {expired && step === 'email' ? (
            <View className="rounded-lg bg-info-subtle p-3">
              <Text className="text-info">{t('Auth.sessionExpired')}</Text>
            </View>
          ) : null}

          {step === 'email' ? (
            <Animated.View key="email" entering={FadeInLeft.duration(250).reduceMotion(ReduceMotion.System)}>
              <View className="gap-5">
                <View className="gap-1">
                  <Text variant="display" className="text-2xl" accessibilityRole="header">
                    {t('Auth.welcomeBack')}
                  </Text>
                  <Text className="text-muted-foreground">
                    {t('Auth.emailPrompt')}
                  </Text>
                </View>
                <Input
                  label={t('Auth.emailLabel')}
                  placeholder={t('Auth.emailPlaceholder')}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    clearField('email');
                  }}
                  error={fieldErrors.email}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  editable={!loading}
                />
                {error ? <InlineError message={error} /> : null}
                <Button
                  label={loading ? t('Auth.sending') : t('Auth.continue')}
                  loading={loading}
                  onPress={handleSend}
                  size="lg"
                />
              </View>
            </Animated.View>
          ) : step === 'name' ? (
            <Animated.View key="name" entering={FadeInRight.duration(250).reduceMotion(ReduceMotion.System)}>
              <View className="gap-5">
                <View className="gap-1">
                  <Text variant="display" className="text-2xl" accessibilityRole="header">
                    {t('Auth.nameTitle')}
                  </Text>
                  <Text className="text-muted-foreground">{t('Auth.namePrompt')}</Text>
                </View>
                <Input
                  label={t('Auth.nameLabel')}
                  placeholder={t('Auth.namePlaceholder')}
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    clearField('name');
                  }}
                  error={fieldErrors.name}
                  autoFocus
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  maxLength={80}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  editable={!loading}
                />
                {error ? <InlineError message={error} /> : null}
                <Button
                  label={loading ? t('Auth.saving') : t('Auth.nameSubmit')}
                  loading={loading}
                  onPress={handleSaveName}
                  size="lg"
                />
              </View>
            </Animated.View>
          ) : (
            <Animated.View key="otp" entering={FadeInRight.duration(250).reduceMotion(ReduceMotion.System)}>
              <View className="gap-5">
                <View className="gap-1">
                  <Text variant="display" className="text-2xl" accessibilityRole="header">
                    {t('Auth.enterOtpTitle')}
                  </Text>
                  <Text className="text-muted-foreground">
                    {t('Auth.otpPrompt')} <Text className="font-sans-semibold">{trimmedEmail}</Text>
                  </Text>
                </View>

                {/* Satu TextInput tersembunyi + 6 kotak: mendukung tempel & isi otomatis kode */}
                <View className="gap-1.5">
                  <Pressable onPress={() => codeInput.current?.focus()} accessibilityLabel={t('Auth.otpLabel')}>
                    <View className="flex-row justify-between gap-2">
                      {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                        const focused = i === Math.min(code.length, OTP_LENGTH - 1);
                        return (
                          <View
                            key={i}
                            className={cn(
                              'h-14 flex-1 items-center justify-center rounded-xl border-2',
                              fieldErrors.code ? 'border-destructive' : focused ? 'border-primary' : 'border-border'
                            )}>
                            <Text variant="mono" className="text-xl">
                              {code[i] ?? ''}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                    <TextInput
                      ref={codeInput}
                      value={code}
                      onChangeText={onCodeChange}
                      keyboardType="number-pad"
                      textContentType="oneTimeCode"
                      autoComplete="one-time-code"
                      maxLength={OTP_LENGTH}
                      editable={!loading}
                      caretHidden
                      className="absolute h-full w-full opacity-0"
                    />
                  </Pressable>
                  {fieldErrors.code ? (
                    <Text className="text-xs text-destructive" accessibilityRole="alert">
                      {fieldErrors.code}
                    </Text>
                  ) : null}
                </View>

                {error ? <InlineError message={error} /> : null}
                {notice ? <Text className="text-success">{notice}</Text> : null}

                <Button
                  label={loading ? t('Auth.verifying') : t('Auth.signIn')}
                  loading={loading}
                  onPress={() => handleVerify()}
                  size="lg"
                />

                <View className="items-center gap-1">
                  <Text className="text-muted-foreground">{t('Auth.noOtpReceived')}</Text>
                  {resendIn > 0 ? (
                    <Text variant="mono" className="text-muted-foreground">
                      {t('Auth.resendIn', { count: resendIn })}
                    </Text>
                  ) : (
                    <Button label={t('Auth.resendButton')} variant="ghost" onPress={handleResend} disabled={loading} />
                  )}
                </View>

                <Button
                  label={t('Auth.changeEmail')}
                  variant="outline"
                  onPress={() => {
                    setStep('email');
                    setCode('');
                    setError('');
                    setFieldErrors({});
                    setNotice('');
                  }}
                  disabled={loading}
                />
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
