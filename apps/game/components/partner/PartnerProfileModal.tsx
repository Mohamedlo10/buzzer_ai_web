import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
// lucide a retiré ses icônes de marque : ni Instagram, ni Facebook, ni TikTok n'existent.
// On prend des icônes neutres — le libellé de chaque ligne nomme déjà le réseau, l'icône
// n'est que décorative.
import {
  Camera,
  Globe,
  Heart,
  MapPin,
  MessageCircle,
  Music,
  Phone,
  Share2,
  X,
} from 'lucide-react-native';

import { MediaCarousel } from './MediaCarousel';
import { palette, font } from '~/lib/theme/tokens';
import { partnersApi } from '~/lib/api';
import { queryKeys } from '~/lib/query/keys';

interface PartnerProfileModalProps {
  partnerId: string | null;
  visible: boolean;
  onClose: () => void;
  onToggleFavorite: (partnerId: string, currentlyFavorite: boolean) => void;
}

/**
 * Fiche d'un partenaire, en feuille remontante.
 *
 * Calquée sur `components/friend/BlockedUsersModal.tsx` : `Modal transparent`, fond
 * `rgba(0,0,0,0.65)`, contenu aligné en bas, rayons hauts de 28, hauteur plafonnée à 80 %.
 * Le projet n'utilise aucune bibliothèque de modale — reprendre ce patron garde un seul
 * comportement d'ouverture dans toute l'application.
 *
 * Les liens web passent par `WebBrowser` plutôt que `Linking` : `expo-web-browser` est déjà
 * installé, et garder le joueur dans l'application vaut mieux que le renvoyer dans Safari.
 * Les schémas `tel:` et `wa.me` passent par `Linking`, seul capable de les traiter.
 */
export function PartnerProfileModal({
  partnerId,
  visible,
  onClose,
  onToggleFavorite,
}: PartnerProfileModalProps) {
  const { width } = useWindowDimensions();

  const { data: partner, isLoading } = useQuery({
    queryKey: queryKeys.partnerDetail(partnerId ?? ''),
    queryFn: () => partnersApi.fetchPartner(partnerId!),
    enabled: visible && !!partnerId,
  });

  // Largeur du carrousel : la feuille occupe toute la largeur moins ses marges internes.
  const carouselWidth = width - 40;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

        <View
          style={{
            backgroundColor: palette.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderWidth: 1,
            borderColor: palette.line,
            paddingTop: 12,
            paddingBottom: 36,
            paddingHorizontal: 20,
            maxHeight: '85%',
          }}
        >
          {/* Poignée */}
          <View
            style={{
              width: 44,
              height: 4,
              borderRadius: 2,
              backgroundColor: palette.line,
              alignSelf: 'center',
              marginBottom: 14,
            }}
          />

          {isLoading || !partner ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={palette.primary} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* En-tête : logo, nom, cœur */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {partner.logoUrl ? (
                  <Image
                    source={{ uri: partner.logoUrl }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: palette.surface2,
                    }}
                  />
                ) : null}

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.display,
                      fontSize: 20,
                      color: palette.txt,
                      paddingTop: 3,
                    }}
                    numberOfLines={2}
                  >
                    {partner.name}
                  </Text>
                  {partner.city ? (
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
                    >
                      <MapPin size={12} color={palette.inkSoft} />
                      <Text
                        style={{
                          fontFamily: font.nativeFamily.ui,
                          fontSize: 12,
                          color: palette.inkSoft,
                        }}
                      >
                        {partner.city}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={() => onToggleFavorite(partner.id, partner.favorite)}
                  activeOpacity={0.7}
                  hitSlop={8}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: palette.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Heart
                    size={19}
                    color={partner.favorite ? palette.bad : palette.inkSoft}
                    fill={partner.favorite ? palette.bad : 'transparent'}
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={onClose} activeOpacity={0.7} hitSlop={8}>
                  <X size={20} color={palette.inkSoft} />
                </TouchableOpacity>
              </View>

              {partner.tagline ? (
                <Text
                  style={{
                    fontFamily: font.nativeFamily.ui,
                    fontSize: 13,
                    color: palette.goldBright,
                    marginTop: 10,
                  }}
                >
                  {partner.tagline}
                </Text>
              ) : null}

              {partner.media.length > 0 && (
                <View
                  style={{
                    marginTop: 14,
                    borderRadius: 16,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: palette.line,
                  }}
                >
                  <MediaCarousel
                    media={partner.media}
                    width={carouselWidth}
                    height={Math.round(carouselWidth * 0.56)}
                  />
                </View>
              )}

              {partner.description ? (
                <Text
                  style={{
                    fontFamily: font.nativeFamily.ui,
                    fontSize: 14,
                    lineHeight: 21,
                    color: palette.txt,
                    marginTop: 14,
                  }}
                >
                  {partner.description}
                </Text>
              ) : null}

              {/* Contacts — seuls ceux renseignés apparaissent : pas de bouton mort. */}
              <View style={{ marginTop: 18, gap: 8 }}>
                {partner.websiteUrl ? (
                  <ContactRow
                    icon={<Globe size={17} color={palette.primary} />}
                    label="Visiter le site"
                    onPress={() => WebBrowser.openBrowserAsync(partner.websiteUrl!)}
                  />
                ) : null}

                {partner.whatsapp ? (
                  <ContactRow
                    icon={<MessageCircle size={17} color={palette.good} />}
                    label="Écrire sur WhatsApp"
                    onPress={() =>
                      Linking.openURL(`https://wa.me/${partner.whatsapp!.replace(/[^\d]/g, '')}`)
                    }
                  />
                ) : null}

                {partner.phone ? (
                  <ContactRow
                    icon={<Phone size={17} color={palette.indigo} />}
                    label={partner.phone}
                    onPress={() => Linking.openURL(`tel:${partner.phone}`)}
                  />
                ) : null}

                {partner.instagramUrl ? (
                  <ContactRow
                    icon={<Camera size={17} color={palette.violet} />}
                    label="Instagram"
                    onPress={() => WebBrowser.openBrowserAsync(partner.instagramUrl!)}
                  />
                ) : null}

                {partner.facebookUrl ? (
                  <ContactRow
                    icon={<Share2 size={17} color={palette.indigo} />}
                    label="Facebook"
                    onPress={() => WebBrowser.openBrowserAsync(partner.facebookUrl!)}
                  />
                ) : null}

                {partner.tiktokUrl ? (
                  <ContactRow
                    icon={<Music size={17} color={palette.txt} />}
                    label="TikTok"
                    onPress={() => WebBrowser.openBrowserAsync(partner.tiktokUrl!)}
                  />
                ) : null}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ContactRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 11,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: palette.surface2,
        borderWidth: 1,
        borderColor: palette.line,
      }}
    >
      {icon}
      <Text
        style={{ fontFamily: font.nativeFamily.ui, fontSize: 14, color: palette.txt, flex: 1 }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
