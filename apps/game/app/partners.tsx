import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Handshake, Heart, Search, X } from 'lucide-react-native';

import { PartnerCard } from '~/components/partner/PartnerCard';
import { PartnerProfileModal } from '~/components/partner/PartnerProfileModal';
import { EmptyState, ErrorState, LoadingState } from '~/components/ui/StateViews';
import { partnersApi } from '~/lib/api';
import { queryKeys } from '~/lib/query/keys';
import { notifyApiError } from '~/lib/ui/notify';
import { palette, font } from '~/lib/theme/tokens';
import type { PartnerSummaryResponse } from '~/types/api';

const PAGE_SIZE = 20;

type Tab = 'all' | 'favorites';

/**
 * « Les partenaires de Xalaat » — annuaire cherchable et favoris.
 *
 * Route plate, comme `support.tsx` et `privacy.tsx` : un écran unique ne justifie pas un
 * dossier. L'écran rend sa propre barre supérieure, conformément au patron de `app/profile/`.
 */
export default function PartnersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>('all');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [openPartnerId, setOpenPartnerId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Débounce de 400 ms, comme partout ailleurs dans l'application : on n'interroge pas le
  // serveur à chaque frappe.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(searchInput.trim()), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const listQuery = useInfiniteQuery({
    queryKey: tab === 'all' ? queryKeys.partners(query) : queryKeys.partnerFavorites,
    queryFn: ({ pageParam = 0 }) =>
      tab === 'all'
        ? partnersApi.searchPartners(query || undefined, pageParam, PAGE_SIZE)
        : partnersApi.fetchFavoritePartners(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  });

  const partners: PartnerSummaryResponse[] =
    listQuery.data?.pages.flatMap((p) => p.content) ?? [];

  const onEndReached = useCallback(() => {
    if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
      listQuery.fetchNextPage();
    }
  }, [listQuery]);

  /**
   * Bascule un favori.
   *
   * Le serveur reste l'autorité : on réinterroge plutôt que de deviner. Les deux listes et
   * toutes les cartes d'emplacement sont invalidées — sinon le cœur d'une carte d'accueil
   * resterait vide après un retrait fait depuis l'annuaire.
   */
  async function toggleFavorite(partner: PartnerSummaryResponse) {
    try {
      if (partner.favorite) {
        await partnersApi.removePartnerFavorite(partner.id);
      } else {
        await partnersApi.addPartnerFavorite(partner.id);
      }
      queryClient.invalidateQueries({ queryKey: ['partners'] });
      queryClient.invalidateQueries({ queryKey: ['ad'] });
    } catch (e) {
      notifyApiError(e, 'Impossible de modifier ce favori');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Barre supérieure */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
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
            fontFamily: font.nativeFamily.display,
            fontSize: 20,
            color: palette.txt,
            paddingTop: 4,
          }}
        >
          Partenaires de Xalaat
        </Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 12 }}>
        {/* Onglets */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Tous" active={tab === 'all'} onPress={() => setTab('all')} />
          <Chip
            label="Mes favoris"
            active={tab === 'favorites'}
            onPress={() => setTab('favorites')}
            icon={
              <Heart
                size={13}
                color={tab === 'favorites' ? palette.primaryInk : palette.inkSoft}
                fill={tab === 'favorites' ? palette.primaryInk : 'transparent'}
              />
            }
          />
        </View>

        {/* Recherche — masquée sur l'onglet Favoris : on ne cherche pas dans une liste
            qu'on a soi-même constituée et qui tient à l'écran. */}
        {tab === 'all' && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 12,
              height: 44,
              borderRadius: 14,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.line,
            }}
          >
            <Search size={17} color={palette.inkSoft} />
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Rechercher un partenaire…"
              placeholderTextColor={palette.inkSoft}
              autoCorrect={false}
              style={{
                flex: 1,
                color: palette.txt,
                fontFamily: font.nativeFamily.ui,
                fontSize: 14,
              }}
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={() => setSearchInput('')} hitSlop={10}>
                <X size={16} color={palette.inkSoft} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {listQuery.isLoading ? (
        <LoadingState label="Chargement des partenaires…" fullScreen />
      ) : listQuery.isError ? (
        <ErrorState
          fallbackMessage="Impossible de charger les partenaires."
          onRetry={listQuery.refetch}
          fullScreen
        />
      ) : partners.length === 0 ? (
        <EmptyState
          icon={<Handshake size={32} color={palette.inkSoft} />}
          title={
            tab === 'favorites'
              ? 'Aucun favori'
              : query
                ? 'Aucun partenaire trouvé'
                : 'Aucun partenaire pour l’instant'
          }
          description={
            tab === 'favorites'
              ? 'Touche le cœur sur une carte pour retrouver un partenaire ici.'
              : query
                ? 'Essaie un autre nom.'
                : 'Les partenaires de Xalaat apparaîtront ici.'
          }
        />
      ) : (
        <FlatList
          data={partners}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <PartnerCard
              partner={item}
              onOpenProfile={() => setOpenPartnerId(item.id)}
              onToggleFavorite={() => toggleFavorite(item)}
            />
          )}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            listQuery.isFetchingNextPage ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={palette.primary} />
              </View>
            ) : null
          }
        />
      )}

      <PartnerProfileModal
        partnerId={openPartnerId}
        visible={!!openPartnerId}
        onClose={() => setOpenPartnerId(null)}
        onToggleFavorite={(id, currentlyFavorite) =>
          toggleFavorite({ id, favorite: currentlyFavorite } as PartnerSummaryResponse)
        }
      />
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 9999,
        backgroundColor: active ? palette.primary : palette.surface,
        borderWidth: 1,
        borderColor: active ? palette.primary : palette.line,
      }}
    >
      {icon}
      <Text
        style={{
          fontFamily: font.nativeFamily.ui,
          fontWeight: '600',
          fontSize: 13,
          color: active ? palette.primaryInk : palette.txt,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
