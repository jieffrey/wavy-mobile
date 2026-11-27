import { PageHeader, Screen } from '@/components/ui/screen';
import { t } from '@/i18n';

export default function TicketsScreen() {
  return (
    <Screen>
      <PageHeader title={t('Tabs.tickets')} />
    </Screen>
  );
}
