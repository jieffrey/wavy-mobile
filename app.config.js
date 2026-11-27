// Konfigurasi Expo. Warna diambil dari src/theme/tokens.js supaya tidak ada hex di luar file theme.
const { colors } = require('./src/theme/tokens');

module.exports = {
  expo: {
    name: 'Wavy',
    slug: 'wavy-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'wavy',
    userInterfaceStyle: 'light',
    backgroundColor: colors.background,
    ios: {
      supportsTablet: false,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: colors.primary,
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: colors.primary,
          image: './assets/images/splash-icon.png',
          imageWidth: 96,
        },
      ],
      'expo-secure-store',
      'expo-font',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
