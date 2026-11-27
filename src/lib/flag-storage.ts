import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Penyimpanan flag kecil yang tidak rahasia (mis. "onboarding sudah dilihat").
// expo-secure-store tidak tersedia di web, jadi Expo web memakai localStorage supaya
// alur pertama kali buka (splash -> onboarding) tetap bisa didemokan di browser.
const web = Platform.OS === 'web' && typeof localStorage !== 'undefined';

export const flagStorage = {
  get: (key: string): Promise<string | null> =>
    web ? Promise.resolve(localStorage.getItem(key)) : SecureStore.getItemAsync(key),
  set: (key: string, value: string): Promise<void> =>
    web ? Promise.resolve(localStorage.setItem(key, value)) : SecureStore.setItemAsync(key, value),
};
