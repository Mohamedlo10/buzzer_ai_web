/**
 * `@xalaat/avatar` — le moteur d'avatars partagé.
 *
 * TypeScript pur, sans dépendance de plateforme : `renderAvatarSvg` rend une **chaîne** SVG, que
 * chaque hôte enveloppe à sa façon — `SvgXml` de `react-native-svg` dans `apps/game`, du SVG
 * inline dans `apps/admin`. C'est la même contrainte que celle qui garde `packages/core`
 * consommable par une application Vite comme par React Native.
 */
export * from './types.ts';
export * from './spec.ts';
export * from './render.ts';
export * from './random.ts';
export { catalog } from './generated/catalog.ts';
