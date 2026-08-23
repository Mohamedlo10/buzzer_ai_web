import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import {
  Trophy,
  Search,
  X,
  Info,
  Crown,
  ChevronRight,
} from 'lucide-react-native';

import { useAuthStore } from '~/stores/useAuthStore';
import * as rankingsApi from '~/lib/api/rankings';
import type { GlobalRanking } from '~/types/api';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';

const PAGE_SIZE = 30;

export default function RankingsScreen() {
  const user = useAuthStore((s) => s.user);

  const [rankings, setRankings] = useState<GlobalRanking[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRankings = useCallback(async (page: number, username?: string) => {
    try {
      const params: rankingsApi.SearchRankingsParams = { page, size: PAGE_SIZE };
      if (username && username.trim()) params.username = username.trim();
      const data = await rankingsApi.getGlobalRankings(params);
      if (page === 0) {
        setRankings(data.content || []);
      } else {
        setRankings((prev) => [...prev, ...(data.content || [])]);
      }
      setTotalElements(data.totalElements ?? 0);
      setCurrentUserRank(data.currentUserRank ?? null);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to load rankings:', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchRankings(0);
      setIsLoading(false);
    })();
  }, [fetchRankings]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchRankings(0, searchUsername);
    setIsRefreshing(false);
  };

  const handleSearchChange = (text: string) => {
    setSearchUsername(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setIsLoading(true);
      await fetchRankings(0, text);
      setIsLoading(false);
    }, 400);
  };

  const podiumList = rankings.length >= 3 ? [rankings[1], rankings[0], rankings[2]] : [];
  const listItems = !searchUsername && rankings.length >= 3 ? rankings.slice(3) : rankings;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 10 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <View>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 26,
                letterSpacing: -0.4,
                color: palette.txt,
              }}
            >
              Classement
            </Text>
            <Text style={{ fontSize: 12.5, color: palette.inkSoft, marginTop: 2 }}>
              {totalElements} joueurs classés
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowInfoModal(true)}
            activeOpacity={0.7}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Info size={16} color={palette.inkSoft} />
          </TouchableOpacity>
        </View>

        {/* Podium Section (when not searching) */}
        {!searchUsername && podiumList.length === 3 && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
            {podiumList.map((p, i) => {
              const rankNum = i === 1 ? 1 : i === 0 ? 2 : 3;
              const isFirst = rankNum === 1;
              const isSecond = rankNum === 2;
              const name = p?.username || 'Joueur';
              const score = Math.round(p?.glickoRating ?? p?.totalScore ?? 0);

              return (
                <View key={p?.userId || rankNum} style={{ flex: isFirst ? 1.15 : 1, alignItems: 'center' }}>
                  <View style={{ position: 'relative', marginBottom: 8 }}>
                    <Avatar
                      name={name}
                      avatarUrl={p?.avatarUrl}
                      size={isFirst ? 64 : 50}
                      hue={isFirst ? 45 : isSecond ? 320 : 200}
                    />
                    {isFirst && (
                      <View style={{ position: 'absolute', top: -14, left: '50%', transform: [{ translateX: -10 }] }}>
                        <Text style={{ fontSize: 18 }}>👑</Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={{
                      width: '100%',
                      backgroundColor: palette.surface,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: isFirst ? palette.gold : palette.line,
                      paddingVertical: 10,
                      paddingHorizontal: 6,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 16, marginBottom: 2 }}>
                      {isFirst ? '🥇' : isSecond ? '🥈' : '🥉'}
                    </Text>
                    <Text
                      style={{
                        fontFamily: font.nativeFamily.display,
                        fontSize: 13,
                        color: palette.txt,
                      }}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <Text style={{ fontSize: 10.5, color: palette.inkSoft, marginTop: 1 }}>
                      {score.toLocaleString('fr-FR')} pts
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: palette.surface,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: palette.line,
            paddingHorizontal: 14,
            paddingVertical: 8,
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Search size={16} color={palette.inkSoft} />
          <TextInput
            value={searchUsername}
            onChangeText={handleSearchChange}
            placeholder="Rechercher un joueur…"
            placeholderTextColor={palette.inkSoft}
            style={{ flex: 1, color: palette.txt, fontSize: 13.5 }}
          />
          {searchUsername ? (
            <TouchableOpacity onPress={() => handleSearchChange('')} activeOpacity={0.7}>
              <X size={16} color={palette.inkSoft} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Rankings List */}
        {isLoading && rankings.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={palette.primary} />
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 110 }}>
            {listItems.map((item, index) => {
              const rankNumber = !searchUsername && rankings.length >= 3 ? index + 4 : index + 1;
              const isMe = item.userId === user?.id;
              const score = Math.round(item.glickoRating ?? item.totalScore ?? 0);

              return (
                <View
                  key={item.userId}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isMe ? 'rgba(224, 86, 36, 0.1)' : palette.surface,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isMe ? palette.primary : palette.line,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: font.nativeFamily.display,
                        fontSize: 14,
                        color: rankNumber <= 3 ? palette.gold : palette.inkSoft,
                        width: 28,
                        textAlign: 'center',
                      }}
                    >
                      #{rankNumber}
                    </Text>
                    <Avatar name={item.username} avatarUrl={item.avatarUrl} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: font.nativeFamily.display,
                          fontSize: 14,
                          color: palette.txt,
                        }}
                        numberOfLines={1}
                      >
                        {item.username} {isMe ? '(toi)' : ''}
                      </Text>
                      <Text style={{ fontSize: 11, color: palette.inkSoft }}>
                        {item.totalGames || 0} parties · {item.totalWins || 0} victoires
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      fontFamily: font.nativeFamily.display,
                      fontSize: 14,
                      color: palette.txt,
                    }}
                  >
                    {score.toLocaleString('fr-FR')} pts
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Info Modal */}
      <Modal visible={showInfoModal} transparent animationType="fade" onRequestClose={() => setShowInfoModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 20,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontFamily: font.nativeFamily.display, fontSize: 18, color: palette.txt }}>
                Système de classement
              </Text>
              <TouchableOpacity
                onPress={() => setShowInfoModal(false)}
                activeOpacity={0.7}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: palette.surface2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color={palette.txt} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: palette.inkSoft, fontSize: 13.5, lineHeight: 20, marginBottom: 12 }}>
              Le classement utilise l&apos;algorithme <Text style={{ color: palette.txt, fontWeight: '700' }}>Glicko-2</Text>. Il évalue votre niveau de jeu relatif par rapport aux autres compétiteurs en temps réel.
            </Text>

            <Text style={{ color: palette.inkSoft, fontSize: 13.5, lineHeight: 20 }}>
              <Text style={{ color: palette.primary, fontWeight: '700' }}>Bonus de série :</Text> Plus vous enchaînez de victoires consécutives, plus votre cote grimpe rapidement.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
