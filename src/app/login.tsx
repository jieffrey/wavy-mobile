import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WavyLogo } from '@/components/brand/wavy-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlineError } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { apiPost, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/error-message';
import { useSession } from '@/store/session';
import { colors } from '@/theme/tokens';
import type { Customer } from '@/types/api';

// Login customer: OTP email (POST /auth/send-otp → POST /auth/verify-otp), sama dengan login-otp.tsx web.
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface VerifyResult {
  access_token: string;
  customer: Customer;
}

function sendError(err: unknown): string {
  if (err instanceof ApiError && (err.status === 0 || err.status === 429 || err.code)) return errorMessage(err);
  return t('Auth.otpSendFailed');
}

export default function LoginScreen() {
  const { signIn, expired } = useSession();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
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

  async function handleSend() {
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError(t('Auth.invalidEmail'));
      return;
    }
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await apiPost('/auth/send-otp', { email: trimmedEmail });
      setStep('otp');
      setCode('');
      setResendIn(RESEND_SECONDS);
      setTimeout(() => codeInput.current?.focus(), 250);
    } catch (err) {
      setError(sendError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(value = code) {
    if (value.length < OTP_LENGTH) {
      setError(t('Auth.invalidOtp'));
      return;
    }
    setError('');
    setNotice('');
    setLoading(true);
    try {
      const res = await apiPost<VerifyResult>('/auth/verify-otp', { email: trimmedEmail, code: value });
      await signIn(res.access_token, res.customer);
      // Stack.Protected memindahkan ke tab Beranda setelah status = signed-in.
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? t('Auth.otpWrong') : errorMessage(err));
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendIn > 0 || loading) return;
    setError('');
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
    setError('');
    if (digits.length === OTP_LENGTH && !loading) handleVerify(digits);
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      {/* Panel brand: gradient pink → ungu seperti panel kiri login web */}
      <LinearGradient
        colors={[colors.primary, colors['primary-glow']]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pb-10">
        <SafeAreaView edges={['top']} className="items-start gap-3 px-6 pt-10">
          <View className="flex-row items-center gap-3">
            <WavyLogo size={44} color={colors['primary-foreground']} />
            <Text variant="display" className="text-4xl text-primary-foreground">
              Wavy
            </Text>
          </View>
          <Text className="text-base text-primary-foreground/90">{t('Auth.tagline')}</Text>
        </SafeAreaView>
      </LinearGradient>

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
                  <Text className="text-muted-foreground">{t('Auth.emailPrompt')}</Text>
                </View>
                <Input
                  label={t('Auth.emailLabel')}
                  placeholder={t('Auth.emailPlaceholder')}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setError('');
                  }}
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
                <Pressable onPress={() => codeInput.current?.focus()} accessibilityLabel={t('Auth.otpLabel')}>
                  <View className="flex-row justify-between gap-2">
                    {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                      const focused = i === Math.min(code.length, OTP_LENGTH - 1);
                      return (
                        <View
                          key={i}
                          className={cn(
                            'h-14 flex-1 items-center justify-center rounded-xl border-2',
                            error ? 'border-destructive' : focused ? 'border-primary' : 'border-border'
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
