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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://quiz.mouhadev.com';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Xalaat — Quiz & Jeu de Buzzer Multijoueur en Temps Réel',
    template: '%s · Xalaat',
  },
  description:
    'Xalaat est la plateforme de quiz et de buzzer multijoueur en temps réel propulsée par l’IA. Défiez vos amis, testez vos réflexes, grimpez au classement et jouez en mode Solo ou Sprint.',
  applicationName: 'Xalaat',
  keywords: [
    'Xalaat',
    'quiz en ligne',
    'jeu de buzzer',
    'buzzer multijoueur',
    'quiz multijoueur',
    'quiz temps réel',
    'trivia buzzer',
    'quiz intelligence artificielle',
    'quiz culture générale',
    'jeu de société en ligne',
    'mouhadev',
  ],
  authors: [{ name: 'MouhaDev', url: 'https://mouhadev.com' }],
  creator: 'MouhaDev',
  publisher: 'Xalaat',
  category: 'game',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Xalaat — Quiz & Jeu de Buzzer Multijoueur en Temps Réel',
    description:
      'Défiez vos amis, testez vos réflexes au buzzer et grimpez au classement avec le quiz intelligent Xalaat.',
    url: APP_URL,
    siteName: 'Xalaat',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/icon.png',
        width: 500,
        height: 500,
        alt: 'Xalaat Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xalaat — Quiz & Jeu de Buzzer Multijoueur en Temps Réel',
    description:
      'Défiez vos amis, testez vos réflexes au buzzer et grimpez au classement avec le quiz intelligent Xalaat.',
    images: ['/icon.png'],
    creator: '@mouhadev',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Xalaat',
  alternateName: 'Xalaat Quiz',
  url: APP_URL,
  applicationCategory: 'GameApplication',
  genre: 'Trivia / Quiz',
  operatingSystem: 'All',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  inLanguage: 'fr-FR',
  description:
    'Plateforme de quiz et jeu de buzzer multijoueur en temps réel propulsée par l’intelligence artificielle.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  author: {
    '@type': 'Person',
    name: 'MouhaDev',
    url: 'https://mouhadev.com',
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-bg h-[100dvh] max-h-[100dvh] w-full overflow-hidden items-center justify-center md:py-2 md:px-12 md:min-w-2xl text-txt antialiased font-ui">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
