/**
 * Le contrat du catalogue d'avatars, jumeau TypeScript de `AvatarCatalog.java`.
 *
 * La source de vérité est `buzzer_back/src/main/resources/avatars/v1/catalog.json` ; ces types
 * décrivent sa forme pour que le rendu côté client soit typé de bout en bout.
 */

/** Une couleur choisissable. `shade` est sa variante assombrie, pour les ombres et les plis. */
export interface PaletteColor {
  id: string;
  label: string;
  hex: string;
  shade: string;
}

/**
 * Une pièce. `none` marque les entrées « Aucun » / « Sans voile » : des choix valides du
 * catalogue, qui ne correspondent à aucun fichier et ne dessinent rien.
 */
export interface CatalogItem {
  id: string;
  label: string;
  none?: boolean;
}

/** Une famille de pièces interchangeables. Le fichier d'une pièce est `prefix-id.svg`. */
export interface CatalogGroup {
  prefix: string;
  items: CatalogItem[];
}

/**
 * Un emplacement personnalisable : soit un calque (`group`), soit une couleur
 * (`palette` + `tokens`) — jamais les deux.
 *
 * `tokens` fait le lien entre le jeton écrit dans les fragments SVG et le champ de la couleur
 * retenue : `{ skin: 'hex', skinDark: 'shade' }` alimente `{{skin}}` et `{{skinDark}}`.
 */
export interface CatalogSlot {
  label: string;
  group?: string;
  palette?: string;
  tokens?: Record<string, 'hex' | 'shade'>;
}

/**
 * Une catégorie d'avatar.
 *
 * `layers` donne l'ordre de dessin, du fond vers l'avant. `exclusive` liste les emplacements
 * qu'une valeur rend caducs : un voile couvre toute la chevelure, mais la coiffure **reste dans
 * la spec**, si bien que retirer le voile restitue le choix précédent de la joueuse.
 */
export interface CatalogKind {
  label: string;
  layers: string[];
  exclusive?: Record<string, string[]>;
  slots: Record<string, CatalogSlot>;
}

export interface AvatarCatalog {
  version: number;
  viewBox: string;
  palettes: Record<string, PaletteColor[]>;
  groups: Record<string, CatalogGroup>;
  kinds: Record<string, CatalogKind>;
  defaults: Record<string, string>;
}

/** Une spec analysée : la catégorie, et la valeur retenue pour chaque emplacement. */
export interface AvatarSpec {
  kind: string;
  values: Record<string, string>;
}
