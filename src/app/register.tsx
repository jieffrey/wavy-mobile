import { AuthScreen } from '@/components/auth/auth-screen';

// Daftar customer (layar terpisah dari Masuk): nama + email -> OTP (POST /auth/register -> POST /auth/verify-otp).
export default function RegisterScreen() {
  return <AuthScreen mode="register" />;
}
