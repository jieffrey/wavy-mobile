import { PageHeader, Screen } from '@/components/ui/screen';
import { t } from '@/i18n';

export default function HomeScreen() {
  return (
    <Screen>
      <PageHeader title={t('Tabs.home')} />
    </Screen>
  );
}
