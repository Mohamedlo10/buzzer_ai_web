import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://quiz.mouhadev.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/login',
          '/register',
          '/onboarding',
          '/rooms',
          '/rankings',
          '/solo',
          '/join/*',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/dev',
          '/dev/*',
          '/session/*',
          '/solo/game/*',
          '/solo/results/*',
          '/notifications',
          '/profile',
          '/reset-password',
          '/confirm-email',
          '/api/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/*',
          '/dev/*',
          '/session/*',
          '/solo/game/*',
          '/reset-password',
          '/confirm-email',
          '/api/*',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
