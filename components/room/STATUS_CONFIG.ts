import { Users, Zap, Swords, Clock, Trophy } from 'lucide-react';

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<{ size: number; color: string }> }> = {
  LOBBY: { label: 'Lobby', color: 'var(--primary)', bg: 'rgb(var(--primary-rgb) / 0.125)', icon: Users },
  GENERATING: { label: 'Génération...', color: 'var(--gold)', bg: 'rgb(var(--gold-rgb) / 0.125)', icon: Zap },
  PLAYING: { label: 'En cours', color: 'var(--indigo)', bg: 'rgb(var(--indigo-rgb) / 0.125)', icon: Swords },
  PAUSED: { label: 'Pause', color: 'var(--warn)', bg: 'rgb(var(--warn-rgb) / 0.125)', icon: Clock },
  RESULTS: { label: 'Terminée', color: '#C0C0C0', bg: '#C0C0C020', icon: Trophy },
};
