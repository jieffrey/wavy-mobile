import type { Messages } from './id';

// Terjemahan Inggris boleh menyusul: kunci yang belum ada otomatis memakai teks Indonesia.
type DeepPartial<T> = { [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]> };

export const en: DeepPartial<Messages> = {
  Onboarding: {
    skip: 'Skip',
    next: 'Next',
    start: 'Get started',
    progress: 'Step {step} of {total}',
    slide1: {
      kicker: '01 · discover',
      title: 'Your favorite gigs,\nin your hand.',
      body: 'Search artists or concerts, filter by category, and see ticket sales status at a glance.',
      search: 'Search concerts, artists...',
    },
    slide2: {
      kicker: '02 · secure',
      title: 'Pick tickets,\nhold for 15 min.',
      body: 'One category, up to 4 tickets per order. Pay with Midtrans before the timer runs out.',
    },
    slide3: {
      kicker: '03 · get in',
      title: 'Show the QR,\nwalk right in.',
      body: 'Official e-tickets live on your phone. One QR, scanned once at the gate.',
      valid: 'Valid',
      gate: 'Gate pass',
    },
  },
  Auth: {
    tagline: 'Official concert tickets, in your hand.',
    welcomeBack: 'Welcome back!',
    emailPrompt: 'Enter your email to continue to your account.',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    invalidEmail: 'Enter a valid email.',
    sending: 'Sending...',
    continue: 'Continue',
    otpSendFailed: 'Failed to send the OTP. Try again.',
    changeEmail: 'Change email',
    enterOtpTitle: 'Enter the OTP code',
    otpPrompt: 'Check your email. The OTP code was sent to',
    otpLabel: '6-digit OTP code',
    invalidOtp: 'Enter the 6-digit OTP code.',
    otpWrong: 'The OTP code is wrong or expired.',
    noOtpReceived: "Didn't get the code?",
    resendIn: 'Resend in {count} s',
    resendButton: 'Resend code',
    resent: 'A new code has been sent.',
    verifying: 'Verifying...',
    signIn: 'Sign in',
    sessionExpired: 'Your session has ended. Please sign in again.',
  },
  Tabs: { home: 'Home', explore: 'Explore', tickets: 'Tickets', orders: 'Orders', profile: 'Profile' },
  States: { loading: 'Loading...', errorTitle: 'Failed to load data', retry: 'Try again', login: 'Sign in' },
};
