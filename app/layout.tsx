import type { Metadata } from 'next';
import { Bricolage_Grotesque, Manrope, Instrument_Serif } from 'next/font/google';
import { AppProviders } from '~/components/providers/AppProviders';
import '~/global.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
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
    <html lang="fr" className={`${bricolage.variable} ${manrope.variable} ${instrumentSerif.variable}`}>
      <head>
        {/* Xalaat est un thème clair par défaut (Teranga) ; le sombre n'est
            servi que sur préférence explicite ou système. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-bg min-h-screen items-center justify-center md:py-2 md:px-12 md:min-w-2xl text-txt antialiased font-ui">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
