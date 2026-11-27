import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Penyimpanan kunci-nilai di perangkat: expo-secure-store di Android/iOS.
// expo-secure-store tidak tersedia di web, jadi Expo web memakai localStorage (sama dengan
// wavy-next yang menyimpan token di localStorage) supaya app bisa didemokan dan diuji di browser.
const web = Platform.OS === 'web' && typeof localStorage !== 'undefined';

export const deviceStorage = {
  get: (key: string): Promise<string | null> =>
    web ? Promise.resolve(localStorage.getItem(key)) : SecureStore.getItemAsync(key),
  set: (key: string, value: string): Promise<void> =>
    web ? Promise.resolve(localStorage.setItem(key, value)) : SecureStore.setItemAsync(key, value),
  remove: (key: string): Promise<void> =>
    web ? Promise.resolve(localStorage.removeItem(key)) : SecureStore.deleteItemAsync(key),
};
