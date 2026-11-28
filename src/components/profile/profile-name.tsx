import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlineError } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { apiPatch, ApiError } from '@/lib/api';
import { errorMessage } from '@/lib/error-message';
import { nameSchema, validateForm } from '@/lib/validation';
import { useSession } from '@/store/session';
import { colors } from '@/theme/tokens';
import type { CustomerProfile } from '@/types/api';

/** Nama + email di Profil; nama bisa diubah lewat PATCH /me (2–80 karakter, dicek juga di backend). */
export function ProfileName({ name, email }: { name: string | null; email: string }) {
  const { customer, updateCustomer } = useSession();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name ?? '');
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function save() {
    const checked = validateForm<typeof nameSchema, 'name'>(nameSchema, { name: value });
    setFieldError(checked.errors?.name);
    if (!checked.data) return;
    setSaving(true);
    setError('');
    try {
      const profile = await apiPatch<CustomerProfile>('/me', { name: checked.data.name });
      await updateCustomer({ id: profile.id, name: profile.name, email: profile.email });
      setEditing(false);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') setFieldError(errorMessage(err));
      else setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!editing)
    return (
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1">
          <Text variant="display" className="flex-shrink text-lg" numberOfLines={1}>
            {name?.trim() || t('Profile.defaultName')}
          </Text>
          <Pressable
            onPress={() => {
              setValue(customer?.name ?? name ?? '');
              setSaved(false);
              setEditing(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={t('Profile.editName')}
            hitSlop={12}
            className="rounded-lg p-1.5 active:bg-muted">
            <Pencil color={colors['muted-foreground']} size={16} />
          </Pressable>
        </View>
        <Text className="text-muted-foreground" numberOfLines={1}>
          {email}
        </Text>
        {saved ? <Text className="text-xs text-success">{t('Profile.nameSaved')}</Text> : null}
      </View>
    );

  return (
    <View className="flex-1 gap-3">
      <Input
        label={t('Profile.nameLabel')}
        value={value}
        onChangeText={(v) => {
          setValue(v);
          setFieldError(undefined);
          setError('');
        }}
        error={fieldError}
        autoFocus
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={80}
        returnKeyType="done"
        onSubmitEditing={save}
        editable={!saving}
      />
      {error ? <InlineError message={error} /> : null}
      <View className="flex-row gap-2">
        <Button className="flex-1" label={saving ? t('Profile.saving') : t('Profile.save')} loading={saving} onPress={save} />
        <Button
          className="flex-1"
          label={t('Profile.cancel')}
          variant="outline"
          disabled={saving}
          onPress={() => {
            setEditing(false);
            setFieldError(undefined);
            setError('');
          }}
        />
      </View>
    </View>
  );
}
