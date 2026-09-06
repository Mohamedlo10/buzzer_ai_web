import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View,
} from 'react-native';

import { palette } from '~/lib/theme/tokens';
import type { PartnerMediaResponse } from '~/types/api';

interface MediaCarouselProps {
  media: PartnerMediaResponse[];
  /** Largeur d'un volet. Fournie par le parent, qui connaît sa propre largeur. */
  width: number;
  height: number;
  /**
   * Rendu d'un volet vidéo, injecté par le parent.
   *
   * La vidéo n'est pas rendue ici : ce composant n'a aucune dépendance native, ce qui le
   * garde utilisable sans reconstruction de l'application. Le lecteur arrive plus tard, par
   * cette injection, et seulement lorsque le volet devient actif — un utilisateur qui ne fait
   * jamais défiler jusqu'au dernier volet ne télécharge alors pas un octet de vidéo.
   */
  renderVideo?: (item: PartnerMediaResponse, isActive: boolean) => React.ReactNode;
}

/**
 * Carrousel horizontal des médias d'un partenaire.
 *
 * Décalqué du seul motif de ce type existant dans le projet (`app/onboarding.tsx`) :
 * `FlatList` horizontale, `pagingEnabled`, `getItemLayout` pour éviter la mesure
 * asynchrone, et des indicateurs à points. Réutiliser ce motif plutôt qu'en introduire un
 * second — ou une bibliothèque — garde un seul comportement de défilement dans l'application.
 *
 * Les médias arrivent triés par le serveur : images d'abord, vidéo en dernier.
 */
export function MediaCarousel({ media, width, height, renderVideo }: MediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const listRef = useRef<FlatList<PartnerMediaResponse>>(null);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      setActiveIndex(index);
    },
    [width],
  );

  if (media.length === 0) return null;

  const single = media.length === 1;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={media}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled={!single}
        scrollEnabled={!single}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item, index }) => (
          <View style={{ width, height, backgroundColor: palette.surface2 }}>
            {item.kind === 'VIDEO' && renderVideo
              ? renderVideo(item, index === activeIndex)
              : !failed[item.id] && (
                  <Image
                    source={{ uri: item.url }}
                    style={{ width, height }}
                    resizeMode="cover"
                    // Une URL externe collée par l'administration peut casser. Sans ce
                    // repli, la carte afficherait un rectangle vide sans rien expliquer.
                    onError={() => setFailed((f) => ({ ...f, [item.id]: true }))}
                  />
                )}
          </View>
        )}
      />

      {/* Indicateurs : inutiles quand il n'y a qu'un volet. */}
      {!single && (
        <View
          style={{
            position: 'absolute',
            bottom: 8,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          {media.map((m, i) => (
            <View
              key={m.id}
              style={{
                width: i === activeIndex ? 16 : 5,
                height: 5,
                borderRadius: 3,
                backgroundColor:
                  i === activeIndex ? palette.goldBright : 'rgba(255,255,255,0.45)',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
