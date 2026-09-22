import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
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
  ArrowLeft,
  Camera,
  Globe,
  Handshake,
  Heart,
  MapPin,
  MessageCircle,
  Music,
  Phone,
  Share2,
  X,
} from 'lucide-react-native';

import { MediaCarousel } from './MediaCarousel';
import { PartnerApplyForm } from './PartnerApplyForm';
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
 *
 * La feuille porte deux vues : la fiche, et le formulaire « devenir partenaire ». C'est une
 * bascule du contenu, pas un second `Modal` — empiler deux `Modal` natifs laisse sur iOS un
 * view controller orphelin qui avale les touchers, piège documenté dans `shared/ConfirmHost.tsx`.
 */
export function PartnerProfileModal({
  partnerId,
  visible,
  onClose,
  onToggleFavorite,
}: PartnerProfileModalProps) {
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<'profile' | 'apply'>('profile');
  const [applyDirty, setApplyDirty] = useState(false);

  // Sans cette remise à zéro, ouvrir la fiche d'un autre partenaire afficherait le formulaire
  // laissé ouvert sur la précédente.
  useEffect(() => {
    setMode('profile');
    setApplyDirty(false);
  }, [visible, partnerId]);

  const { data: partner, isLoading } = useQuery({
    queryKey: queryKeys.partnerDetail(partnerId ?? ''),
    queryFn: () => partnersApi.fetchPartner(partnerId!),
    enabled: visible && !!partnerId,
  });

  // Largeur du carrousel : la feuille occupe toute la largeur moins ses marges internes.
  const carouselWidth = width - 40;

  function backToProfile() {
    setMode('profile');
    setApplyDirty(false);
  }

  /**
   * Fermeture « douce » : tap sur le fond, ou retour matériel Android.
   *
   * Sur le formulaire, elle revient à la fiche au lieu de tout fermer, et ne fait rien du tout
   * si la saisie est entamée : huit champs perdus sur un tap à côté, c'est une candidature
   * perdue. La croix, elle, ferme toujours.
   */
  function requestClose() {
    if (mode === 'apply') {
      if (!applyDirty) backToProfile();
      return;
    }
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={requestClose}>
      {/* Le `KeyboardAvoidingView` tient la racine, et non la feuille : `maxHeight: '85%'` ne se
          résout que contre un parent de hauteur définie. En `padding`, c'est la zone tactile
          `flex: 1` au-dessus qui cède la place au clavier — la feuille, elle, remonte. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={requestClose} />

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

          {mode === 'apply' ? (
            <>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}
              >
                <TouchableOpacity
                  onPress={backToProfile}
                  activeOpacity={0.7}
                  hitSlop={8}
                  accessibilityLabel="Revenir à la fiche"
                >
                  <ArrowLeft size={20} color={palette.txt} />
                </TouchableOpacity>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: font.nativeFamily.display,
                    fontSize: 20,
                    color: palette.txt,
                    paddingTop: 3,
                  }}
                >
                  Devenir partenaire
                </Text>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  hitSlop={8}
                  accessibilityLabel="Fermer"
                >
                  <X size={20} color={palette.inkSoft} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                <PartnerApplyForm onDone={onClose} onDirtyChange={setApplyDirty} />
              </ScrollView>
            </>
          ) : isLoading || !partner ? (
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

              {/* Appel à candidature. Accent terracotta et sous-titre : sans cela, il se lirait
                  comme un lien de contact du partenaire affiché, alors qu'il s'adresse au joueur. */}
              <View
                style={{
                  height: 1,
                  backgroundColor: palette.line,
                  marginTop: 20,
                  marginBottom: 16,
                }}
              />

              <TouchableOpacity
                onPress={() => setMode('apply')}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 13,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  backgroundColor: palette.primary + '14',
                  borderWidth: 1,
                  borderColor: palette.primary + '4D',
                }}
              >
                <Handshake size={19} color={palette.primary} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.ui,
                      fontSize: 14,
                      fontWeight: '700',
                      color: palette.primary,
                    }}
                  >
                    Devenir partenaire
                  </Text>
                  <Text
                    style={{
                      fontFamily: font.nativeFamily.ui,
                      fontSize: 12,
                      color: palette.inkSoft,
                      marginTop: 2,
                    }}
                  >
                    Vous aussi, rejoignez les partenaires de Xalaat
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
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
