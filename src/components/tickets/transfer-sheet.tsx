import { TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlineError } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { apiPost, ApiError } from '@/lib/api';
import { errorMessage } from '@/lib/error-message';
import { colors } from '@/theme/tokens';
import type { Ticket } from '@/types/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Backend mengirim error transfer sebagai teks (tanpa kode). Petakan yang dikenal ke teks UI.
function transferError(err: unknown): string {
  if (err instanceof ApiError) {
    const msg = err.message.toLowerCase();
    if (err.status === 404 && msg.includes('customer')) return t('Tickets.transfer.recipientNotFound');
    if (err.status === 400 && msg.includes('yourself')) return t('Tickets.transfer.toSelf');
    if (err.status === 400 && msg.includes('scanned')) return t('Tickets.transfer.alreadyScanned');
    if (err.status === 400 && msg.includes('ended')) return t('Tickets.transfer.eventEnded');
  }
  return errorMessage(err);
}

/** Sheet transfer tiket: POST /tickets/:id/transfer { to_email }. */
export function TransferSheet({
  ticket,
  visible,
  onClose,
  onTransferred,
}: {
  ticket: Ticket;
  visible: boolean;
  onClose: () => void;
  onTransferred: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  function close() {
    if (sending) return;
    setEmail('');
    setError('');
    onClose();
  }

  async function submit() {
    const to = email.trim();
    if (!EMAIL_RE.test(to)) {
      setError(t('Tickets.transfer.invalidEmail'));
      return;
    }
    setError('');
    setSending(true);
    try {
      await apiPost(`/tickets/${ticket.id}/transfer`, { to_email: to });
      setEmail('');
      onTransferred(to);
    } catch (err) {
      setError(transferError(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <Pressable
          className="flex-1 bg-overlay-scrim"
          onPress={close}
          accessibilityLabel={t('Tickets.transfer.cancel')}
        />
        <SafeAreaView edges={['bottom']} className="gap-4 rounded-t-3xl bg-background px-5 pb-4 pt-5">
          <View className="h-1 w-10 self-center rounded-full bg-border" />
          <View className="gap-1">
            <Text variant="display" className="text-xl" accessibilityRole="header">
              {t('Tickets.transfer.title')}
            </Text>
            <Text className="text-muted-foreground">{t('Tickets.transfer.description', { title: ticket.title })}</Text>
          </View>
          <Input
            label={t('Tickets.transfer.email')}
            placeholder={t('Tickets.transfer.emailPlaceholder')}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!sending}
          />
          <View className="flex-row gap-3 rounded-lg bg-warning/10 p-3">
            <TriangleAlert color={colors.warning} size={18} />
            <View className="flex-1">
              <Text className="font-sans-semibold text-warning">{t('Tickets.transfer.warningTitle')}</Text>
              <Text className="text-xs text-warning">{t('Tickets.transfer.warningBody')}</Text>
            </View>
          </View>
          {error ? <InlineError message={error} /> : null}
          <View className="flex-row gap-3">
            <Button
              label={t('Tickets.transfer.cancel')}
              variant="outline"
              onPress={close}
              disabled={sending}
              className="flex-1"
            />
            <Button
              label={sending ? t('Tickets.transfer.sending') : t('Tickets.transfer.submit')}
              loading={sending}
              onPress={submit}
              className="flex-1"
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
