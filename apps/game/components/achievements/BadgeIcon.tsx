/**
 * BadgeIcon
 *
 * Mappe le nom logique renvoyé par le serveur vers une icône lucide-react-native.
 * Le serveur stocke 'trophy', 'flame', etc. — jamais un emoji — pour que le
 * design puisse évoluer sans migration de base de données.
 *
 * Noms connus : target, flame, brain, trophy, crown, globe, calendar, star, zap, check.
 * Un nom inconnu affiche Award par défaut.
 */
import { Award, Target, Flame, Brain, Trophy, Crown, Globe, Calendar, Star, Zap, CheckCircle } from 'lucide-react-native';

interface BadgeIconProps {
  icon: string;
  size?: number;
  color?: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  target: Target,
  flame: Flame,
  brain: Brain,
  trophy: Trophy,
  crown: Crown,
  globe: Globe,
  calendar: Calendar,
  star: Star,
  zap: Zap,
  check: CheckCircle,
  award: Award,
};

export function BadgeIcon({ icon, size = 24, color }: BadgeIconProps) {
  const Comp = ICON_MAP[icon.toLowerCase()] ?? Award;
  return <Comp size={size} color={color} />;
}
