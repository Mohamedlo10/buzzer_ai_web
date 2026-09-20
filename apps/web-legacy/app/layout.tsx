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
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Xalaat — Quiz & Jeu de Buzzer Multijoueur',
      },
      {
        url: `${APP_URL}/icon.png`,
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
    images: [`${APP_URL}/og-image.png`],
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
  manifest: '/site.webmanifest?v=3',
  icons: {
    icon: [
      { url: '/favicon.ico?v=3', sizes: 'any' },
      { url: '/favicon-48x48.png?v=3', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-32x32.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png?v=3', sizes: '16x16', type: 'image/png' },
      { url: '/android-chrome-192x192.png?v=3', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=3',
    apple: [
      { url: '/apple-touch-icon.png?v=3', sizes: '180x180', type: 'image/png' },
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
        {/* Favicons avec Cache-Busting (?v=3) et conformité Google Search Favicon (48x48, 192x192) */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=3" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png?v=3" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=3" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=3" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />

        {/* OpenGraph & Social Cards */}
        <meta property="og:title" content="Xalaat — Quiz & Jeu de Buzzer Multijoueur" />
        <meta
          property="og:description"
          content="Défiez vos amis, testez vos réflexes au buzzer et grimpez au classement avec le quiz intelligent Xalaat."
        />
        <meta property="og:image" content={`${APP_URL}/og-image.png?v=3`} />
        <meta property="og:image:secure_url" content={`${APP_URL}/og-image.png?v=3`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:url" content={APP_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Xalaat" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Xalaat — Quiz & Jeu de Buzzer Multijoueur" />
        <meta
          name="twitter:description"
          content="Défiez vos amis, testez vos réflexes au buzzer et grimpez au classement avec le quiz intelligent Xalaat."
        />
        <meta name="twitter:image" content={`${APP_URL}/og-image.png?v=3`} />
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
