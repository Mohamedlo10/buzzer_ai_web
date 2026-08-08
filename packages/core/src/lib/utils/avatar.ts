export const AVATAR_STYLES = [
  { id: 'adventurer',         label: 'Aventurier',       emoji: '🧝' },
  { id: 'adventurer-neutral', label: 'Aventurier 2',     emoji: '🧑' },
  { id: 'avataaars',          label: 'Cartoon',          emoji: '😎' },
  { id: 'avataaars-neutral',  label: 'Cartoon 2',        emoji: '🙂' },
  { id: 'big-ears',           label: 'Grandes oreilles', emoji: '👂' },
  { id: 'big-smile',          label: 'Grand sourire',    emoji: '😁' },
  { id: 'lorelei',            label: 'Lorelei',          emoji: '👩‍🎨' },
  { id: 'lorelei-neutral',    label: 'Lorelei 2',        emoji: '👩‍🎨' },
  { id: 'micah',              label: 'Micah',            emoji: '🧑‍💼' },
  { id: 'open-peeps',         label: 'Open Peeps',       emoji: '🙋' },
  { id: 'personas',           label: 'Personas',         emoji: '🧑‍🦱' },
  { id: 'notionists',         label: 'Notionists',       emoji: '📝' },
  { id: 'dylan',              label: 'Dylan',            emoji: '🎨' },
  { id: 'fun-emoji',          label: 'Emoji',            emoji: '😜' },
  { id: 'pixel-art',          label: 'Pixel',            emoji: '👾' },
  { id: 'bottts',             label: 'Robot',            emoji: '🤖' },
  { id: 'bottts-neutral',     label: 'Robot 2',          emoji: '⚙️' },
  { id: 'thumbs',             label: 'Pouces',           emoji: '👍' },
  { id: 'shapes',             label: 'Formes',           emoji: '🔷' },
  { id: 'rings',              label: 'Cercles',          emoji: '⭕' },
  { id: 'identicon',          label: 'Identicon',        emoji: '🔲' },
];

export const AVATAR_SEEDS = [
  'Felix', 'Luna', 'Oscar', 'Zara', 'Max',
  'Aria', 'Leo', 'Nova', 'Sam', 'Kira',
  'Rio', 'Mia', 'Ace', 'Ivy', 'Axel',
  'Zoe', 'Rex', 'Nora', 'Jay', 'Jade',
  'Kai', 'Lena', 'Dex', 'Lyra', 'Ash',
  'Ember', 'Storm', 'Blaze', 'Sage', 'Onyx',
];

export function getAvatarUrl(style: string, seed: string): string {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
}
