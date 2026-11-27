// Teks UI bahasa Indonesia. Kunci dan isi mengikuti wavy-next/src/messages/id.json bila ada padanannya.
export const id = {
  Tabs: {
    home: 'Beranda',
    explore: 'Jelajah',
    tickets: 'Tiket',
    orders: 'Pesanan',
    profile: 'Profil',
  },
  States: {
    loading: 'Memuat...',
    errorTitle: 'Gagal memuat data',
    retry: 'Coba lagi',
    login: 'Masuk',
  },
  Errors: {
    generic: 'Terjadi kesalahan. Silakan coba lagi.',
    network: 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.',
    unauthorized: 'Sesi kamu sudah berakhir. Silakan masuk lagi.',
    notFound: 'Data tidak ditemukan.',
    tooMany: 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.',
    missingApiUrl: 'Alamat server belum diatur. Isi EXPO_PUBLIC_API_URL di file .env lalu jalankan ulang Expo.',
    codes: {
      SALES_CLOSED: 'Penjualan tiket untuk konser ini sudah ditutup.',
      SALES_NOT_STARTED: 'Penjualan tiket belum dibuka. Coba lagi saat penjualan dimulai.',
      SALES_ENDED: 'Masa penjualan tiket untuk konser ini sudah berakhir.',
      QUOTA_EXCEEDED: 'Sisa tiket tidak cukup untuk jumlah yang kamu pilih.',
      ORDER_EXPIRED: 'Pesanan ini sudah kedaluwarsa. Silakan pesan ulang.',
      ORGANIZER_SUSPENDED: 'Akun organizer ini sedang dinonaktifkan.',
      INVALID_QUANTITY: 'Jumlah tiket tidak valid. Pilih 1 sampai 4 tiket.',
      VALIDATION_ERROR: 'Data yang dikirim tidak valid. Periksa lagi isian kamu.',
      ORDER_NOT_PENDING: 'Pesanan ini sudah tidak menunggu pembayaran.',
      PAYMENT_NOT_CONFIGURED: 'Pembayaran online belum aktif. Tunggu verifikasi dari penyelenggara.',
      PAYMENT_GATEWAY_ERROR: 'Layanan pembayaran sedang bermasalah. Coba lagi sebentar lagi.',
    },
  },
  Sales: {
    badge: { open: 'Tersedia', sold_out: 'Habis', upcoming: 'Belum dibuka', closed: 'Ditutup' },
  },
  OrderStatus: {
    pending_payment: 'Menunggu bayar',
    paid: 'Lunas',
    expired: 'Kedaluwarsa',
    rejected: 'Ditolak',
    refunded: 'Refund',
  },
};

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Messages = Widen<typeof id>;
