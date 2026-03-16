import type { Metadata } from 'next';
import { AppProviders } from '~/components/providers/AppProviders';
import '~/global.css';

export const metadata: Metadata = {
  title: 'BuzzMaster AI',
  description: 'Le jeu de buzzer multijoueur intelligent',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-dark-bg min-h-screen items-center justify-center p-2 md:px-12 md:min-w-2xl text-white antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
