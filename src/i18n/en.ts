import type { Messages } from './id';

// Terjemahan Inggris boleh menyusul: kunci yang belum ada otomatis memakai teks Indonesia.
type DeepPartial<T> = { [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]> };

export const en: DeepPartial<Messages> = {
  Tabs: { home: 'Home', explore: 'Explore', tickets: 'Tickets', orders: 'Orders', profile: 'Profile' },
  States: { loading: 'Loading...', errorTitle: 'Failed to load data', retry: 'Try again', login: 'Sign in' },
};
