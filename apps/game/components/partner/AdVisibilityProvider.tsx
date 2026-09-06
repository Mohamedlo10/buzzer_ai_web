import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * Sait quelles cartes partenaires sont réellement visibles à l'écran.
 *
 * <b>Pourquoi ce mécanisme.</b> Une vidéo qui joue hors écran consomme des données mobiles
 * pour rien — un vrai coût au Sénégal. `onViewableItemsChanged` n'existe que sur `FlatList`,
 * et les cartes vivent dans des `ScrollView` remplies par `.map()` ; `IntersectionObserver`
 * n'existe pas en React Native. On mesure donc soi-même.
 *
 * <b>Comment.</b> La `ScrollView` déclare son défilement et la hauteur de son viewport ; chaque
 * carte déclare sa position via `onLayout`, qui donne déjà des coordonnées dans l'espace de
 * contenu — pas de `measureInWindow`, pas de course asynchrone.
 *
 * <b>Le point de performance.</b> Position de défilement et hauteur vivent dans des `useRef`,
 * jamais dans du state : les mettre en state re-rendrait tout l'écran soixante fois par
 * seconde pendant le défilement. Les abonnés ne sont notifiés qu'aux <em>transitions</em>
 * visible ↔ caché, soit au plus deux fois par carte et par parcours.
 */

type Listener = (visible: boolean) => void;

interface CardEntry {
  y: number;
  height: number;
  listener: Listener;
  lastVisible: boolean;
}

interface AdVisibilityContextValue {
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onViewportLayout: (height: number) => void;
  register: (id: string, listener: Listener) => () => void;
  setCardLayout: (id: string, y: number, height: number) => void;
  /** Vrai si une carte est déjà enregistrée : sert à faire respecter « une par écran ». */
  hasCard: () => boolean;
}

const AdVisibilityContext = createContext<AdVisibilityContextValue | null>(null);

export function AdVisibilityProvider({ children }: { children: React.ReactNode }) {
  const scrollY = useRef(0);
  const viewportHeight = useRef(0);
  const cards = useRef(new Map<string, CardEntry>());

  /**
   * Une carte est « visible » lorsqu'elle recouvre la moitié centrale du viewport.
   *
   * Plus strict que « déborde d'un pixel » : une carte qui pointe à peine en bas de l'écran ne
   * déclenche aucun téléchargement. C'est ce seuil qui évite qu'un défilement rapide amorce
   * successivement plusieurs vidéos.
   */
  const evaluate = useCallback(() => {
    const vh = viewportHeight.current;
    if (vh === 0) return;

    const top = scrollY.current + vh * 0.25;
    const bottom = scrollY.current + vh * 0.75;

    cards.current.forEach((entry) => {
      const visible = entry.y + entry.height > top && entry.y < bottom;
      // Ne notifier qu'aux transitions : sinon chaque image de défilement rappellerait
      // l'abonné, qui reconfigurerait le lecteur pour rien.
      if (visible !== entry.lastVisible) {
        entry.lastVisible = visible;
        entry.listener(visible);
      }
    });
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.current = e.nativeEvent.contentOffset.y;
      viewportHeight.current = e.nativeEvent.layoutMeasurement.height;
      evaluate();
    },
    [evaluate],
  );

  const onViewportLayout = useCallback(
    (height: number) => {
      viewportHeight.current = height;
      evaluate();
    },
    [evaluate],
  );

  const register = useCallback((id: string, listener: Listener) => {
    cards.current.set(id, { y: 0, height: 0, listener, lastVisible: false });
    return () => {
      cards.current.delete(id);
    };
  }, []);

  const setCardLayout = useCallback(
    (id: string, y: number, height: number) => {
      const entry = cards.current.get(id);
      if (!entry) return;
      entry.y = y;
      entry.height = height;
      evaluate();
    },
    [evaluate],
  );

  const hasCard = useCallback(() => cards.current.size > 0, []);

  const value = useMemo(
    () => ({ onScroll, onViewportLayout, register, setCardLayout, hasCard }),
    [onScroll, onViewportLayout, register, setCardLayout, hasCard],
  );

  return (
    <AdVisibilityContext.Provider value={value}>{children}</AdVisibilityContext.Provider>
  );
}

/**
 * S'abonne à la visibilité d'une carte.
 *
 * Hors d'un provider, retourne `visible: true` en permanence : un écran qui n'a pas câblé le
 * suivi ne doit pas se retrouver avec une carte muette, seulement avec une vidéo moins
 * économe. La dégradation est gracieuse, pas silencieusement cassante.
 */
export function useAdVisibility(id: string, onChange: Listener): { tracked: boolean } {
  const ctx = useContext(AdVisibilityContext);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!ctx) {
      onChangeRef.current(true);
      return;
    }
    if (__DEV__ && ctx.hasCard()) {
      // Règle produit : une seule publicité visible par écran. La rendre exécutable ici vaut
      // mieux que la laisser à la vigilance d'une relecture.
      console.warn(
        `[AdSlot] Une carte partenaire est déjà montée sur cet écran (${id}). ` +
          'La règle est : une seule publicité visible par écran.',
      );
    }
    return ctx.register(id, (v) => onChangeRef.current(v));
  }, [ctx, id]);

  return { tracked: !!ctx };
}

/** Accès au provider pour câbler la ScrollView. Null si l'écran n'en a pas monté. */
export function useAdVisibilityScroll() {
  return useContext(AdVisibilityContext);
}
