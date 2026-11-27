import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { InlineError, ErrorState } from '@/components/ui/states';
import { Text } from '@/components/ui/text';
import { t } from '@/i18n';
import { isExternalScheme, isSnapFinishUrl } from '@/lib/payment';
import { colors } from '@/theme/tokens';

// Halaman Snap Midtrans (redirect_url) di dalam app. Selesai/ditutup → kembali ke detail order,
// yang lalu memanggil GET /orders/:id/payment-status.
export default function PayScreen() {
  const { url } = useLocalSearchParams<{ id: string; url: string }>();
  const [loadError, setLoadError] = useState(false);
  const [appError, setAppError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const done = useRef(false);

  function close() {
    if (done.current) return;
    done.current = true;
    router.back();
  }

  function onRequest(req: WebViewNavigation): boolean {
    if (isSnapFinishUrl(req.url)) {
      close();
      return false;
    }
    if (isExternalScheme(req.url)) {
      // e-wallet/bank membuka aplikasinya sendiri
      Linking.openURL(req.url).catch(() => setAppError(true));
      return false;
    }
    return true;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <View className="h-14 flex-row items-center justify-between border-b border-border px-4">
        <Text variant="display" className="text-lg">
          {t('OrderDetail.pay.title')}
        </Text>
        <Pressable
          onPress={close}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('OrderDetail.pay.close')}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-muted">
          <X color={colors.foreground} size={22} />
        </Pressable>
      </View>
      {appError ? <InlineError message={t('OrderDetail.pay.openAppFailed')} className="m-3" /> : null}
      {!url || loadError ? (
        <ErrorState
          message={t('OrderDetail.pay.loadFailed')}
          onRetry={
            url
              ? () => {
                  setLoadError(false);
                  setReloadKey((k) => k + 1);
                }
              : undefined
          }
        />
      ) : (
        <WebView
          key={reloadKey}
          source={{ uri: url }}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={onRequest}
          onNavigationStateChange={(nav) => {
            // Android kadang tidak memanggil onShouldStartLoadWithRequest untuk redirect server
            if (isSnapFinishUrl(nav.url)) close();
          }}
          onError={() => setLoadError(true)}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 500) setLoadError(true);
          }}
          startInLoadingState
          renderLoading={() => (
            <View className="absolute inset-0 items-center justify-center bg-background">
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          )}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
        />
      )}
    </SafeAreaView>
  );
}
