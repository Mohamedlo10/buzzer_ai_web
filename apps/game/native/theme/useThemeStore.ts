import { create } from 'zustand';
import { colorScheme } from 'nativewind';
import { appStorage } from '~/lib/utils/storage';
import { applyPalette, type ThemeMode } from '~/lib/theme/tokens';

const STORAGE_KEY = 'theme';

interface ThemeState {
  theme: ThemeMode;
  /** Faux tant que le choix enregistré n'a pas été relu : la racine attend avant d'afficher. */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggleTheme: () => void;
}

/**
 * Bascule les deux sources de couleur de l'app :
 *  - `palette` (styles inline), réécrite en place ;
 *  - les variables CSS de NativeWind (classes `bg-surface`, `text-txt`…), via `.dark:root`
 *    émis par tailwind.config.js.
 * Les deux doivent changer AVANT le rendu qui suit, d'où l'appel avant `set()`.
 */
function apply(theme: ThemeMode) {
  applyPalette(theme);
  colorScheme.set(theme);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  // Clair par défaut : c'est l'identité Teranga, le sombre reste un choix du joueur.
  theme: 'light',
  hydrated: false,

  hydrate: async () => {
    const stored = await appStorage.getItem(STORAGE_KEY);
    const theme: ThemeMode = stored === 'dark' ? 'dark' : 'light';
    apply(theme);
    set({ theme, hydrated: true });
  },

  toggleTheme: () => {
    const theme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    apply(theme);
    set({ theme });
    appStorage.setItem(STORAGE_KEY, theme);
  },
}));
