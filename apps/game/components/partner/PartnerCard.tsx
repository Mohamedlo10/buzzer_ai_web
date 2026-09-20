import { useId, useState } from 'react';
import {
  Image,
  Linking,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { ChevronRight, Heart, MessageCircle } from 'lucide-react-native';

import { MediaCarousel } from './MediaCarousel';
import { PartnerVideoSlide } from './PartnerVideoSlide';
import { useAdVisibility, useAdVisibilityScroll } from './AdVisibilityProvider';
import { palette, font } from '~/lib/theme/tokens';
import type { PartnerSummaryResponse } from '~/types/api';

interface PartnerCardProps {
  partner: PartnerSummaryResponse;
  /** Lien de la campagne. Si absent ou vide, le bouton bascule vers WhatsApp avec le téléphone du partenaire. */
  targetUrl?: string | null;
  onOpenProfile: () => void;
  onToggleFavorite: () => void;
  /** Marge horizontale de l'écran, pour calculer la largeur des volets. */
  horizontalPadding?: number;
}

/**
 * Carte d'un partenaire : carrousel de médias, nom, accroche, cœur et accès à la fiche.
 *
 * Aucune redirection automatique : le site du partenaire ne s'ouvre que sur appui explicite
 * du bouton « Découvrir ». La carte elle-même ouvre la fiche, pas un lien externe — un joueur
 * qui touche une carte s'attend à en savoir plus, pas à quitter l'application.
 */
export function PartnerCard({
  partner,
  targetUrl,
  onOpenProfile,
  onToggleFavorite,
  horizontalPadding = 32,
}: PartnerCardProps) {
  const { width } = useWindowDimensions();
  const [logoFailed, setLogoFailed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Suivi de visibilité : sans provider sur l'écran, `tracked` est faux et la vidéo est
  // considérée visible — dégradation gracieuse plutôt qu'une carte muette.
  const cardId = useId();
  const { tracked } = useAdVisibility(cardId, setVisible);
  const { setCardLayout } = useCardLayout(cardId);
  const cardVisible = tracked ? visible : true;

  const cardWidth = width - horizontalPadding;
  const mediaHeight = Math.round(cardWidth * 0.5);
  const media = partner.media ?? [];

  // Première image du partenaire : sert d'affiche au volet vidéo.
  const posterUri = media.find((m) => m.kind === 'IMAGE')?.url ?? null;

  return (
    <View
      onLayout={(e) => {
        const { y, height } = e.nativeEvent.layout;
        setCardLayout(y, height);
      }}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: palette.surface,
        borderWidth: 1,
        borderColor: palette.line,
      }}
    >
      {media.length > 0 && (
        <TouchableOpacity activeOpacity={0.9} onPress={onOpenProfile}>
          <MediaCarousel
            media={media}
            width={cardWidth}
            height={mediaHeight}
            renderVideo={(item, isActive) => (
              <PartnerVideoSlide
                uri={item.url}
                width={cardWidth}
                height={mediaHeight}
                isActiveSlide={isActive}
                isCardVisible={cardVisible}
                posterUri={posterUri}
              />
            )}
          />
        </TouchableOpacity>
      )}

      <View style={{ padding: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {partner.logoUrl && !logoFailed ? (
            <Image
              source={{ uri: partner.logoUrl }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: palette.surface2,
              }}
              onError={() => setLogoFailed(true)}
            />
          ) : null}

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                fontWeight: '700',
                fontSize: 10,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: palette.inkSoft,
                marginBottom: 1,
              }}
            >
              Partenaire Xalaat
            </Text>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 16,
                color: palette.txt,
                paddingTop: 2,
              }}
              numberOfLines={1}
            >
              {partner.name}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onToggleFavorite}
            activeOpacity={0.7}
            hitSlop={10}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: palette.surface2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart
              size={17}
              color={partner.favorite ? palette.bad : palette.inkSoft}
              fill={partner.favorite ? palette.bad : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {partner.tagline ? (
          <Text
            style={{
              fontFamily: font.nativeFamily.ui,
              fontSize: 13,
              color: palette.inkSoft,
            }}
            numberOfLines={2}
          >
            {partner.tagline}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={onOpenProfile}
            activeOpacity={0.8}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: palette.surface2,
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            <Text
              style={{
                fontFamily: font.nativeFamily.ui,
                fontWeight: '600',
                fontSize: 13,
                color: palette.txt,
              }}
            >
              Voir la fiche
            </Text>
            <ChevronRight size={14} color={palette.inkSoft} />
          </TouchableOpacity>

          {(() => {
            const trimmedTargetUrl = targetUrl?.trim();
            const rawPhone = partner.whatsapp || partner.phone;
            const cleanPhone = rawPhone ? rawPhone.replace(/[^\d]/g, '') : '';

            if (trimmedTargetUrl) {
              return (
                <TouchableOpacity
                  onPress={() => WebBrowser.openBrowserAsync(trimmedTargetUrl)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: palette.primary,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.ui,
                      fontWeight: '700',
                      fontSize: 13,
                      color: palette.primaryInk,
                    }}
                  >
                    Découvrir
                  </Text>
                </TouchableOpacity>
              );
            }

            if (cleanPhone) {
              return (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://wa.me/${cleanPhone}`)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: '#25D366',
                  }}
                >
                  <MessageCircle size={15} color="#FFFFFF" />
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.ui,
                      fontWeight: '700',
                      fontSize: 13,
                      color: '#FFFFFF',
                    }}
                  >
                    WhatsApp
                  </Text>
                </TouchableOpacity>
              );
            }

            return null;
          })()}
        </View>
      </View>
    </View>
  );
}

/**
 * Déclare la position de la carte au fournisseur de visibilité.
 *
 * Dans une `ScrollView`, `onLayout` donne déjà des coordonnées dans l'espace de contenu :
 * c'est exactement ce qu'il faut, sans `measureInWindow` ni course asynchrone.
 */
function useCardLayout(cardId: string) {
  const ctx = useAdVisibilityScroll();
  return {
    setCardLayout: (y: number, height: number) => ctx?.setCardLayout(cardId, y, height),
  };
}
