'use client';

import { createContext, useContext } from 'react';

/**
 * MODE SOMBRE DÉSACTIVÉ — tous les joueurs sont en thème clair (Teranga).
 *
 * L'API du provider est conservée à l'identique pour ne rien casser chez les
 * consommateurs : `theme` vaut toujours 'light' et les setters sont inertes.
 * Pour réactiver le sombre :
 *   1. décommenter le bloc [data-theme='dark'] dans global.css ;
 *   2. restaurer la logique ci-dessous (voir le bloc commenté) ;
 *   3. retirer le data-theme="light" en dur de app/layout.tsx ;
 *   4. réafficher les boutons soleil/lune (DashboardHeader, dashboard/page).
 */
type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const LIGHT_ONLY: ThemeContextValue = {
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value={LIGHT_ONLY}>{children}</ThemeContext.Provider>;
}

/*
// ─── Bascule clair/sombre — à restaurer quand on reprendra le mode sombre ───
const STORAGE_KEY = 'theme';

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
*/

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
