import { AuthScreen } from '@/components/auth/auth-screen';

// Masuk customer: email -> OTP (POST /auth/send-otp -> POST /auth/verify-otp), sama dengan login-otp.tsx web.
export default function LoginScreen() {
  return <AuthScreen mode="login" />;
}
