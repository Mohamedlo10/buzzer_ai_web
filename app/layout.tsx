import type { Metadata, Viewport } from 'next';
import { Boldonse, Manrope, Instrument_Serif } from 'next/font/google';
import { AppProviders } from '~/components/providers/AppProviders';
import '~/global.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Boldonse est la police d'affichage du design Xalaat. Elle était jusqu'ici
// chargée par un `@import` Google dans theme.css, et écrasait Bricolage
// Grotesque par simple ordre de déclaration — Bricolage était donc téléchargée
// pour ne servir que de fallback. Elle passe maintenant par next/font comme les
// deux autres : plus d'`@import` externe bloquant, plus de double téléchargement,
// et la résolution devient explicite au lieu d'être un accident de cascade.
const boldonse = Boldonse({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-accent',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Xalaat — Quiz by MouhaDev',
    template: '%s · Xalaat',
  },
  description: 'Xalaat — Quiz by MouhaDev. Le jeu de buzzer multijoueur intelligent.',
  applicationName: 'Xalaat',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Thème clair pour tout le monde. Le mode sombre est mis de côté (voir le
    // bloc [data-theme='dark'] commenté dans global.css) — data-theme est donc
    // posé en dur ici, sans lire localStorage ni prefers-color-scheme.
    <html
      lang="fr"
      data-theme="light"
      className={`${boldonse.variable} ${manrope.variable} ${instrumentSerif.variable}`}
    >
      <body className="bg-bg h-[100dvh] max-h-[100dvh] w-full overflow-hidden items-center justify-center md:py-2 md:px-12 md:min-w-2xl text-txt antialiased font-ui">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
