import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

const APP_URL = 'https://quiz.mouhadev.com';

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

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, maximum-scale=1, user-scalable=no"
        />

        <title>Xalaat — Quiz & Jeu de Buzzer Multijoueur en Temps Réel</title>
        <meta
          name="description"
          content="Xalaat est la plateforme de quiz et de buzzer multijoueur en temps réel propulsée par l’IA. Défiez vos amis, testez vos réflexes, grimpez au classement et jouez en mode Solo ou Sprint."
        />
        <meta
          name="keywords"
          content="Xalaat, quiz en ligne, jeu de buzzer, buzzer multijoueur, quiz multijoueur, quiz temps réel, trivia buzzer, quiz intelligence artificielle"
        />
        <link rel="canonical" href={APP_URL} />

        {/* Favicons avec Cache-Busting (?v=3) et conformité Google Search Favicon (48x48, 192x192) */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=3" sizes="any" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png?v=3" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=3" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=3" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
        <link rel="manifest" href="/site.webmanifest?v=3" />

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

        {/* Données structurées JSON-LD pour Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
