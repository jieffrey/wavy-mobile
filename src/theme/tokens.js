// Satu-satunya file yang boleh berisi nilai warna mentah.
// Disalin dari wavy-next/src/app/globals.css (:root = terang, .dark = "Concert Spotlight"),
// lihat wavy-next/docs/DESIGN.md §2.1. Layar & komponen hanya memakai kelas token
// (bg-primary, text-muted-foreground, ...) atau objek `colors` di bawah, tidak pernah hex.

/** Tema terang (= :root web). Dipakai app mobile, sama dengan halaman customer web. */
const light = {
  background: '#FFFFFF',
  foreground: '#1B1A3A',
  surface: '#FAFAF8',
  'surface-raised': '#FFFFFF',
  card: '#FFFFFF',
  'card-foreground': '#1B1A3A',
  popover: '#FFFFFF',
  'popover-foreground': '#1B1A3A',
  muted: '#F0EFF7',
  'muted-foreground': '#6E6B80',
  secondary: '#F0EFF7',
  'secondary-foreground': '#1B1A3A',
  accent: '#F0EFF7',
  'accent-foreground': '#1B1A3A',
  border: '#EDEBF2',
  input: '#D8D5E8',
  ring: '#FF5470',
  primary: '#FF5470',
  'primary-foreground': '#FFFFFF',
  'primary-glow': '#7C3AED',
  stage: '#10191D',
  success: '#047857',
  warning: '#B45309',
  destructive: '#DC2626',
  info: '#2563EB',
  'info-foreground': '#FFFFFF',
  'info-subtle': '#EFF6FF',
  // warna dasar gambar latar login web (wavy-next/public/images/login-otp.png, disampel di tengah gambar).
  // Dipakai splash native & latar sebelum gambar termuat, supaya tidak ada kedipan warna lain.
  backdrop: '#FB589C',
};

/** Tema gelap (= .dark web). Disalin untuk nanti; belum dipakai layar mana pun. */
const dark = {
  ...light,
  background: '#14131C',
  foreground: '#F4F2F8',
  surface: '#211F2B',
  'surface-raised': '#2B2937',
  card: '#211F2B',
  'card-foreground': '#F4F2F8',
  popover: '#2B2937',
  'popover-foreground': '#F4F2F8',
  muted: '#2B2937',
  'muted-foreground': '#A19DB3',
  secondary: '#2B2937',
  'secondary-foreground': '#F4F2F8',
  accent: '#2B2937',
  'accent-foreground': '#F4F2F8',
  border: 'rgba(255, 255, 255, 0.1)',
  input: 'rgba(255, 255, 255, 0.16)',
  'primary-glow': '#8B5CF6',
  success: '#34D399',
  warning: '#FBBF24',
  destructive: '#F87171',
  info: '#60A5FA',
  'info-foreground': '#14131C',
  'info-subtle': 'rgba(96, 165, 250, 0.14)',
};

/** --radius 0.5rem web: sm/md/lg/xl = 4/6/8/12. Card 12, input/tombol 8, badge full (DESIGN §6). */
const radius = { sm: 4, md: 6, lg: 8, xl: 12 };

/**
 * Nama font hasil useFonts (@expo-google-fonts). Di React Native tiap ketebalan = family sendiri,
 * jadi pakai kelas font-* di bawah, bukan font-bold.
 * Space Grotesk = display/heading, Inter = body/form, IBM Plex Mono = harga/kode/tanggal/label.
 */
const fonts = {
  display: 'SpaceGrotesk_700Bold',
  'display-medium': 'SpaceGrotesk_500Medium',
  'display-semibold': 'SpaceGrotesk_600SemiBold',
  sans: 'Inter_400Regular',
  'sans-medium': 'Inter_500Medium',
  'sans-semibold': 'Inter_600SemiBold',
  'sans-bold': 'Inter_700Bold',
  mono: 'IBMPlexMono_400Regular',
  'mono-medium': 'IBMPlexMono_500Medium',
  'mono-semibold': 'IBMPlexMono_600SemiBold',
};

/** Lapisan transparan di atas gambar (overlay poster, scrim). */
const overlay = {
  scrim: 'rgba(16, 25, 29, 0.55)',
  'scrim-strong': 'rgba(16, 25, 29, 0.85)',
  clear: 'rgba(16, 25, 29, 0)',
};

module.exports = { light, dark, colors: light, radius, fonts, overlay };
