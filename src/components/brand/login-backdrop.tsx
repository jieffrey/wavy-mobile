import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '@/theme/tokens';

// Gambar yang sama persis dengan panel login web (wavy-next: auth/login & admin/login memakai
// /images/login-otp.png dengan background-size: cover, background-position: center).
// contentFit "cover" + contentPosition "center" = perilaku CSS yang sama.
const SOURCE = require('../../../assets/images/login-backdrop.png');

/** Latar login Wavy (pink + lingkaran navy). Mengisi parent; taruh konten di atasnya. */
export function LoginBackdrop({ style }: { style?: ViewStyle }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }, style]}>
      <Image
        source={SOURCE}
        contentFit="cover"
        contentPosition="center"
        transition={0}
        style={StyleSheet.absoluteFill}
        accessible={false}
      />
    </View>
  );
}
