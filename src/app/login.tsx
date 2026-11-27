import { Link } from 'expo-router';
import { View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { Text } from '@/components/ui/text';

// Masuk customer: email -> OTP (POST /auth/send-otp -> POST /auth/verify-otp), sama dengan login-otp.tsx web.
export default function LoginScreen() {
  return (
    <View style={{ flex: 1 }}>
      <AuthScreen mode="login" />
      {/* SPIKE MO-0: pintu masuk layar uji 3D, hanya di mode dev */}
      {__DEV__ ? (
        <Link href="/spike-venue" className="absolute bottom-10 right-4 rounded-full bg-stage px-3 py-2">
          <Text className="font-sans-semibold text-xs text-primary-foreground">Spike 3D</Text>
        </Link>
      ) : null}
    </View>
  );
}
