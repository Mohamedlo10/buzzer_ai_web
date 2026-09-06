import { FlatList, FlatListProps, ScrollView, ScrollViewProps } from 'react-native';

import { AdVisibilityProvider, useAdVisibilityScroll } from './AdVisibilityProvider';

/**
 * Une `ScrollView` qui sait quelles cartes partenaires sont réellement à l'écran.
 *
 * <p>Le suivi de visibilité impose que le fournisseur soit <em>au-dessus</em> de la
 * `ScrollView`, laquelle doit pourtant lui déclarer son défilement. Les deux ne peuvent donc
 * pas cohabiter dans le même composant. Plutôt que de scinder trois écrans en deux composants
 * chacun, on emballe ici les deux ensemble : remplacer `ScrollView` par `AdAwareScrollView`
 * suffit, sans toucher à la structure de l'écran.
 *
 * <p>Se comporte exactement comme une `ScrollView` ordinaire. Un écran sans carte partenaire
 * peut donc l'utiliser sans conséquence, et un écran qui l'oublie garde une carte fonctionnelle
 * — seulement moins économe en données.
 */
export function AdAwareScrollView(props: ScrollViewProps) {
  return (
    <AdVisibilityProvider>
      <TrackedScrollView {...props} />
    </AdVisibilityProvider>
  );
}

function TrackedScrollView({ onScroll, onLayout, ...rest }: ScrollViewProps) {
  const ctx = useAdVisibilityScroll();

  return (
    <ScrollView
      {...rest}
      // 100 ms : on arbitre la lecture d'une vidéo, pas une animation. Une cadence plus fine
      // ne changerait rien au ressenti et multiplierait les passages sur le pont natif.
      scrollEventThrottle={100}
      onScroll={(e) => {
        ctx?.onScroll(e);
        onScroll?.(e);
      }}
      onLayout={(e) => {
        ctx?.onViewportLayout(e.nativeEvent.layout.height);
        onLayout?.(e);
      }}
    />
  );
}

/**
 * Équivalent pour une `FlatList` — l'annuaire des partenaires en utilise une.
 *
 * Sans elle, toutes les cartes de l'annuaire se croiraient visibles en permanence. L'effet
 * resterait limité, le lecteur vidéo n'étant instancié que lorsque son volet devient actif,
 * mais un joueur qui fait défiler après avoir ouvert un volet vidéo laisserait une lecture
 * tourner hors écran.
 */
export function AdAwareFlatList<T>(props: FlatListProps<T>) {
  return (
    <AdVisibilityProvider>
      <TrackedFlatList {...props} />
    </AdVisibilityProvider>
  );
}

function TrackedFlatList<T>({ onScroll, onLayout, ...rest }: FlatListProps<T>) {
  const ctx = useAdVisibilityScroll();

  return (
    <FlatList
      {...rest}
      scrollEventThrottle={100}
      onScroll={(e) => {
        ctx?.onScroll(e);
        onScroll?.(e);
      }}
      onLayout={(e) => {
        ctx?.onViewportLayout(e.nativeEvent.layout.height);
        onLayout?.(e);
      }}
    />
  );
}
