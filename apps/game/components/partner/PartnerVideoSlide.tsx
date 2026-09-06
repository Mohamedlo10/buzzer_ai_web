import { useEffect, useState } from 'react';
import { AppState, AppStateStatus, Image, View } from 'react-native';
// Réexporté par expo-router : @react-navigation/native n'est pas une dépendance directe.
import { useIsFocused } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';

import { palette } from '~/lib/theme/tokens';

interface PartnerVideoSlideProps {
  uri: string;
  width: number;
  height: number;
  /** Vrai lorsque ce volet du carrousel est celui affiché. */
  isActiveSlide: boolean;
  /** Vrai lorsque la carte est réellement visible dans le viewport. */
  isCardVisible: boolean;
  /** Première image du partenaire : affichée tant que la vidéo n'est pas prête. */
  posterUri?: string | null;
}

/**
 * Vidéo d'un partenaire : muette, en boucle, et lue seulement quand elle est vraiment vue.
 *
 * <b>Quatre garde-fous cumulés, du plus efficace au plus fin :</b>
 * <ol>
 *   <li><b>Le volet actif.</b> Ce composant n'est monté que lorsque la vidéo devient le volet
 *       affiché du carrousel. Un joueur qui ne fait jamais défiler jusqu'au dernier volet ne
 *       télécharge alors pas un seul octet de vidéo — c'est le levier le plus efficace, et il
 *       ne coûte rien.</li>
 *   <li><b>Le focus de l'onglet.</b> Un onglet quitté reste monté : sans {@code useIsFocused},
 *       la vidéo de l'onglet Salons continuerait de jouer pendant que le joueur est sur
 *       Profil. C'est la première fuite de données de ce dispositif, bien avant la
 *       géométrie.</li>
 *   <li><b>L'état de l'application.</b> Mise en pause en arrière-plan. Même précédent que
 *       {@code useAppStateReconnect} pour le WebSocket.</li>
 *   <li><b>La visibilité à l'écran</b>, mesurée par {@code AdVisibilityProvider}.</li>
 * </ol>
 *
 * Muette sans exception : une bannière qui parle toute seule dans un lieu public est le plus
 * sûr moyen de faire désinstaller l'application.
 */
export function PartnerVideoSlide({
  uri,
  width,
  height,
  isActiveSlide,
  isCardVisible,
  posterUri,
}: PartnerVideoSlideProps) {
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [ready, setReady] = useState(false);

  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      setAppActive(next === 'active');
    });
    return () => sub.remove();
  }, []);

  const shouldPlay = isActiveSlide && isCardVisible && isFocused && appActive;

  useEffect(() => {
    if (!player) return;
    try {
      if (shouldPlay) {
        player.play();
        setReady(true);
      } else {
        player.pause();
      }
    } catch {
      // Le lecteur peut avoir été libéré entre-temps : une vidéo publicitaire ne doit jamais
      // faire tomber l'écran qui la porte.
    }
  }, [player, shouldPlay]);

  // Nettoyage explicite au démontage : sans lui, quitter la branche « recherche » de l'onglet
  // Amis laisserait un lecteur en vie, invisible et toujours en train de consommer.
  useEffect(() => {
    return () => {
      try {
        player?.pause();
      } catch {
        // déjà libéré
      }
    };
  }, [player]);

  return (
    <View style={{ width, height, backgroundColor: palette.surface2 }}>
      <VideoView
        player={player}
        style={{ width, height }}
        nativeControls={false}
        contentFit="cover"
        allowsPictureInPicture={false}
      />

      {/* Affiche tant que la lecture n'a pas commencé : évite un rectangle gris au premier
          affichage du volet. */}
      {!ready && posterUri ? (
        <Image
          source={{ uri: posterUri }}
          style={{ position: 'absolute', top: 0, left: 0, width, height }}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
}
