const { colors, radius, fonts, overlay } = require('./src/theme/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // sama dengan web (.dark pada ancestor). Default 'media' membuat NativeWind web melempar error
  // "Cannot manually set color scheme" saat class <html> berubah di Expo web.
  darkMode: 'class',
  theme: {
    extend: {
      colors: { ...colors, overlay },
      borderRadius: { ...radius, DEFAULT: radius.lg },
      fontFamily: Object.fromEntries(Object.entries(fonts).map(([k, v]) => [k, [v]])),
    },
  },
  plugins: [],
};
