import { PageHeader, Screen } from '@/components/ui/screen';
import { t } from '@/i18n';

export default function ExploreScreen() {
  return (
    <Screen>
      <PageHeader title={t('Tabs.explore')} />
    </Screen>
  );
}
