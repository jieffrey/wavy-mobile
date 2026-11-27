import { PageHeader, Screen } from '@/components/ui/screen';
import { t } from '@/i18n';

export default function OrdersScreen() {
  return (
    <Screen>
      <PageHeader title={t('Tabs.orders')} />
    </Screen>
  );
}
