import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Shuffle } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SvgXml } from 'react-native-svg';

import {
  catalog,
  findColor,
  formatSpec,
  randomSpec,
  renderSpec,
  startingSpec,
  suppressedSlots,
  withSlot,
  type AvatarSpec,
} from '@xalaat/avatar';
import { useAuthStore } from '~/stores/useAuthStore';
import * as usersApi from '~/lib/api/users';
import { palette, font } from '~/lib/theme/tokens';
import { notify, notifyApiError } from '~/lib/ui/notify';
import { PopView, RiseView } from '~/components/anim';

/**
 * L'Avatar Creator.
 *
 * <h2>Un emplacement à la fois</h2>
 * Afficher toutes les rangées de choix en même temps aurait signifié composer plus de cent
 * aperçus SVG simultanément, sur un téléphone, à chaque tap. L'écran montre donc une seule
 * rangée — celle de l'emplacement sélectionné — ce qui plafonne le travail à une quinzaine
 * d'aperçus et laisse, sur un petit écran, la place de voir les propositions en grand.
 *
 * <h2>Chaque pastille montre l'avatar entier</h2>
 * Une pastille de voile n'affiche pas un voile détouré, mais l'avatar en cours <b>portant</b> ce
 * voile. C'est ce qui permet de comparer huit drapés d'un coup d'œil, avec le bon teint, la bonne
 * couleur et la bonne tenue.
 *
 * <h2>Rien ne se perd en changeant de catégorie</h2>
 * Les specs des quatre catégories sont conservées séparément : passer de Femme à Animaux puis
 * revenir restitue la composition précédente. Sous un voile, la coiffure reste dans la spec pour
 * la même raison.
 */

/** Ordre d'affichage des catégories, indépendant de l'ordre du catalogue. */
const KIND_ORDER = ['m', 'f', 'a', 'p'] as const;

const PREVIEW_SIZE = 168;
const SWATCH_SIZE = 68;

export default function AvatarCreatorScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const initial = useMemo(() => {
    const kind = (() => {
      try {
        return user?.avatarSpec?.split(':')[1] ?? 'f';
      } catch {
        return 'f';
      }
    })();
    return KIND_ORDER.includes(kind as (typeof KIND_ORDER)[number]) ? kind : 'f';
  }, [user?.avatarSpec]);

  const [kind, setKind] = useState<string>(initial);

  /** Une spec par catégorie, pour qu'un aller-retour entre onglets ne perde aucun choix. */
  const [specs, setSpecs] = useState<Record<string, AvatarSpec>>(() => {
    const seeded: Record<string, AvatarSpec> = {};
    for (const k of KIND_ORDER) seeded[k] = startingSpec(user?.avatarSpec, k);
    return seeded;
  });

  const spec = specs[kind];
  const kindDef = catalog.kinds[kind];
  const hidden = useMemo(() => suppressedSlots(spec, kindDef), [spec, kindDef]);

  /** Les emplacements réellement modifiables : ceux qu'un voile rend caducs disparaissent. */
  const slotKeys = useMemo(
    () => Object.keys(kindDef.slots).filter((key) => !hidden.has(key)),
    [kindDef, hidden],
  );

  const [activeSlot, setActiveSlot] = useState<string>(() => Object.keys(kindDef.slots)[0]);
  const currentSlot = slotKeys.includes(activeSlot) ? activeSlot : slotKeys[0];

  const previewSvg = useMemo(() => renderSpec(spec), [spec]);
  const specString = useMemo(() => formatSpec(spec), [spec]);
  const changed = specString !== user?.avatarSpec;

  const update = (next: AvatarSpec) => setSpecs((prev) => ({ ...prev, [kind]: next }));

  const save = useMutation({
    mutationFn: () => usersApi.updateAvatarSpec(specString),
    onSuccess: (updated) => {
      setUser(updated);
      // Les listes portent chacune leur copie de l'avatar : sans invalidation, le classement et
      // la liste d'amis garderaient l'ancien jusqu'à leur prochain rechargement spontané.
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboards'] });
      notify.success('Ton avatar est prêt !');
      router.back();
    },
    onError: (error: unknown) => notifyApiError(error, "Impossible d'enregistrer ton avatar"),
  });

  if (!user) return null;

  const slotDef = kindDef.slots[currentSlot];
  const options = slotDef?.group
    ? catalog.groups[slotDef.group].items
    : catalog.palettes[slotDef?.palette ?? ''] ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Revenir en arrière"
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.line,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color={palette.txt} />
        </TouchableOpacity>

        <Text
          style={{
            flex: 1,
            color: palette.txt,
            fontSize: 20,
            fontFamily: font.nativeFamily.display,
          }}
        >
          Ton avatar
        </Text>

        <TouchableOpacity
          onPress={() => update(randomSpec(kind))}
          activeOpacity={0.8}
          accessibilityLabel="Surprends-moi"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 14,
            height: 38,
            borderRadius: 19,
            backgroundColor: palette.violet,
          }}
        >
          <Shuffle size={16} color={palette.primaryInk} />
          <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 13 }}>
            Surprends-moi
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Aperçu ────────────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
          <PopView>
            <View
              style={{
                width: PREVIEW_SIZE,
                height: PREVIEW_SIZE,
                borderRadius: PREVIEW_SIZE / 2,
                overflow: 'hidden',
                borderWidth: 4,
                borderColor: palette.primary,
                backgroundColor: palette.surface2,
              }}
            >
              <SvgXml xml={previewSvg} width={PREVIEW_SIZE} height={PREVIEW_SIZE} />
            </View>
          </PopView>

          <Text style={{ color: palette.inkSoft, fontSize: 12, marginTop: 10 }}>
            {describe(spec, kind)}
          </Text>
        </View>

        {/* ── Catégories ────────────────────────────────────────────────── */}
        <SectionLabel>Catégorie</SectionLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 4 }}
        >
          {KIND_ORDER.map((k) => {
            const active = k === kind;
            return (
              <TouchableOpacity
                key={k}
                onPress={() => {
                  setKind(k);
                  setActiveSlot(Object.keys(catalog.kinds[k].slots)[0]);
                }}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: active ? palette.primary : palette.surface,
                  borderWidth: 1.5,
                  borderColor: active ? palette.primary : palette.line,
                }}
              >
                <Text
                  style={{
                    color: active ? palette.primaryInk : palette.txt,
                    fontWeight: '700',
                    fontSize: 14,
                  }}
                >
                  {catalog.kinds[k].label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Emplacements ──────────────────────────────────────────────── */}
        {slotKeys.length > 1 && (
          <>
            <SectionLabel>Personnalise</SectionLabel>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 4 }}
            >
              {slotKeys.map((key) => {
                const active = key === currentSlot;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setActiveSlot(key)}
                    activeOpacity={0.8}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: active ? `${palette.indigo}18` : 'transparent',
                      borderWidth: 1.5,
                      borderColor: active ? palette.indigo : palette.line,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? palette.indigo : palette.inkSoft,
                        fontWeight: active ? '700' : '500',
                        fontSize: 13,
                      }}
                    >
                      {kindDef.slots[key].label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── Choix de l'emplacement courant ────────────────────────────── */}
        <RiseView key={`${kind}-${currentSlot}`}>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
              paddingHorizontal: 20,
              paddingTop: 16,
            }}
          >
            {options.map((option) => {
              const selected = spec.values[currentSlot] === option.id;
              const isColor = Boolean(slotDef?.palette);

              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => update(withSlot(spec, currentSlot, option.id))}
                  activeOpacity={0.85}
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected }}
                  style={{ alignItems: 'center', width: SWATCH_SIZE }}
                >
                  <View
                    style={{
                      width: SWATCH_SIZE,
                      height: SWATCH_SIZE,
                      borderRadius: SWATCH_SIZE / 2,
                      overflow: 'hidden',
                      borderWidth: selected ? 3 : 1.5,
                      borderColor: selected ? palette.primary : palette.line,
                      backgroundColor: isColor
                        ? findColor(slotDef.palette!, option.id)?.hex ?? palette.surface2
                        : palette.surface2,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {!isColor && (
                      <SvgXml
                        xml={renderSpec(withSlot(spec, currentSlot, option.id))}
                        width={SWATCH_SIZE}
                        height={SWATCH_SIZE}
                      />
                    )}
                    {isColor && selected && (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: palette.primaryInk,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={14} color={palette.primary} />
                      </View>
                    )}
                  </View>

                  <Text
                    numberOfLines={1}
                    style={{
                      marginTop: 6,
                      fontSize: 10,
                      textAlign: 'center',
                      color: selected ? palette.primary : palette.inkSoft,
                      fontWeight: selected ? '700' : '500',
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </RiseView>
      </ScrollView>

      {/* ── Validation ──────────────────────────────────────────────────── */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 20,
          borderTopWidth: 1,
          borderTopColor: palette.line,
          backgroundColor: palette.bg,
        }}
      >
        <TouchableOpacity
          onPress={() => save.mutate()}
          disabled={save.isPending || !changed}
          activeOpacity={0.85}
          style={{
            height: 54,
            borderRadius: 16,
            backgroundColor: changed ? palette.primary : palette.surface2,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: save.isPending ? 0.7 : 1,
          }}
        >
          {save.isPending ? (
            <ActivityIndicator color={palette.primaryInk} />
          ) : (
            <Text
              style={{
                color: changed ? palette.primaryInk : palette.inkSoft,
                fontSize: 16,
                fontWeight: '700',
              }}
            >
              {changed ? 'Valider mon avatar' : 'Aucun changement'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 8,
        color: palette.inkSoft,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </Text>
  );
}

/**
 * La légende sous l'aperçu — deux ou trois mots qui nomment ce qu'on regarde.
 *
 * Elle donne un retour lisible à chaque tap, y compris pour les choix qui se voient mal à cette
 * taille, comme une nuance de teint.
 */
function describe(spec: AvatarSpec, kind: string): string {
  const kindDef = catalog.kinds[kind];
  const parts: string[] = [kindDef.label];

  const label = (slotKey: string) => {
    const slot = kindDef.slots[slotKey];
    if (!slot) return null;
    const value = spec.values[slotKey];
    if (slot.group) {
      return catalog.groups[slot.group].items.find((item) => item.id === value)?.label ?? null;
    }
    return findColor(slot.palette!, value)?.label ?? null;
  };

  if (kind === 'a' || kind === 'p') {
    const name = label('id');
    if (name) parts.push(name);
    return parts.join(' · ');
  }

  // Un voile est une coiffure comme une autre : même emplacement, même couleur. La légende n'a
  // donc plus à distinguer les deux cas.
  const headline = label('hr');
  if (headline) parts.push(headline);

  const tint = label('hc');
  if (tint) parts.push(tint.toLowerCase());

  return parts.join(' · ');
}
