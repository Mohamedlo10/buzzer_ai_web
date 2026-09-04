export * as authApi from './auth';
export * as usersApi from './users';
export * as sessionsApi from './sessions';
export * as gameApi from './game';
export * as roomsApi from './rooms';
export * as friendsApi from './friends';
export * as rankingsApi from './rankings';
export * as dashboardApi from './dashboard';
export * as invitationsApi from './invitations';
export * as adminApi from './admin';
export * as devicesApi from './devices';

// Ces cinq modules existaient sans être réexportés : ils n'étaient donc atteignables que
// par chemin direct (`~/lib/api/solo`), ce qui faisait cohabiter deux conventions d'import
// pour une même couche. Namespacés, ils n'entrent en collision avec rien.
export * as soloApi from './solo';
export * as trainingApi from './training';
export * as categoriesApi from './categories';
export * as notificationsApi from './notifications';
export * as qrcodeApi from './qrcode';
export * as adsApi from './ads';

export { apiClient, getWebSocketUrl, getWebSocketBaseUrl } from './client';
