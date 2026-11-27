import { PageHeader, Screen } from '@/components/ui/screen';
import { t } from '@/i18n';

export default function ProfileScreen() {
  return (
    <Screen>
      <PageHeader title={t('Tabs.profile')} />
    </Screen>
  );
}
