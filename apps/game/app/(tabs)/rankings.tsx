import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import {
  Trophy,
  Search,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

import { useAuthStore } from '~/stores/useAuthStore';
import * as rankingsApi from '~/lib/api/rankings';
import type { GlobalRanking } from '~/types/api';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { AppTopBar } from '~/components/shared/AppTopBar';

const PAGE_SIZE = 20;

function getPaginationRange(current: number, total: number): (number | 'dots')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'dots', total];
  }
  if (current >= total - 3) {
    return [1, 'dots', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'dots', current - 1, current, current + 1, 'dots', total];
}

export default function RankingsScreen() {
  const user = useAuthStore((s) => s.user);

  const [rankings, setRankings] = useState<GlobalRanking[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRankings = useCallback(async (page: number, username?: string) => {
    try {
      const params: rankingsApi.SearchRankingsParams = { page, size: PAGE_SIZE };
      if (username && username.trim()) params.username = username.trim();
      const data = await rankingsApi.getGlobalRankings(params);
      setRankings(data.content || []);
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

  const handleSearchChange = (text: string) => {
    setSearchUsername(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setIsLoading(true);
      await fetchRankings(0, text);
      setIsLoading(false);
    }, 400);
  };

  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));

  const goToPage = async (page: number) => {
    if (page < 0 || page >= totalPages || page === currentPage) return;
    setIsLoading(true);
    await fetchRankings(page, searchUsername);
    setIsLoading(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleGoToMyRank = async () => {
    if (!currentUserRank) return;
    const targetPage = Math.floor((currentUserRank - 1) / PAGE_SIZE);
    if (searchUsername) {
      setSearchUsername('');
    }
    setIsLoading(true);
    await fetchRankings(targetPage, '');
    setIsLoading(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Podium is displayed on page 0 when not searching and when at least 3 players exist
  const showPodium = currentPage === 0 && !searchUsername && rankings.length >= 3;
  const podiumList = showPodium ? [rankings[1], rankings[0], rankings[2]] : [];
  const listItems = showPodium ? rankings.slice(3) : rankings;

  const paginationItems = getPaginationRange(currentPage + 1, totalPages);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: palette.bg }}>
      <AppTopBar title="Xalaat" tag="CLASSEMENT" />

      {/* Whole page is scrollable */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 110,
          maxWidth: 540,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* Header Title & Info button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: font.nativeFamily.display,
                fontSize: 26,
                lineHeight: 34,
                letterSpacing: -0.4,
                color: palette.txt,
                paddingTop: 4,
              }}
            >
              Classement
            </Text>
            <Text style={{ fontSize: 12.5, color: palette.inkSoft, marginTop: 2 }}>
              {totalElements} joueurs classés · Page {currentPage + 1} sur {totalPages}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowInfoModal(true)}
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
            <Info size={17} color={palette.inkSoft} />
          </TouchableOpacity>
        </View>

        {/* "Ton classement" Card (Click to jump to your page) */}
        {currentUserRank ? (
          <TouchableOpacity
            onPress={handleGoToMyRank}
            activeOpacity={0.8}
            style={{
              backgroundColor: `${palette.primary}12`,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: `${palette.primary}38`,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: palette.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trophy size={18} color={palette.primaryInk} />
              </View>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: palette.primary, textTransform: 'uppercase' }}>
                  Ton classement
                </Text>
                <Text
                  style={{
                    fontFamily: font.nativeFamily.display,
                    fontSize: 16,
                    lineHeight: 22,
                    color: palette.txt,
                    paddingTop: 2,
                  }}
                >
                  Rang #{currentUserRank}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: palette.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: palette.primaryInk }}>
                Voir ma position
              </Text>
              <ChevronRight size={14} color={palette.primaryInk} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        ) : null}

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
            marginBottom: 14,
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

        {/* Podium Section (shown on page 0 without search) */}
        {showPodium && (
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

        {/* Loading Indicator or Player List */}
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={{ fontSize: 12.5, color: palette.inkSoft, marginTop: 10 }}>
              Chargement du classement…
            </Text>
          </View>
        ) : listItems.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, color: palette.inkSoft }}>
              Aucun joueur trouvé
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8, marginBottom: 20 }}>
            {listItems.map((item, index) => {
              const rankNumber = showPodium
                ? index + 4
                : currentPage * PAGE_SIZE + (index + 1);
              const isMe = item.userId === user?.id;
              const score = Math.round(item.glickoRating ?? item.totalScore ?? 0);

              return (
                <View
                  key={item.userId}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isMe ? `${palette.primary}12` : palette.surface,
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
                        lineHeight: 18,
                        color: rankNumber <= 3 ? palette.gold : palette.inkSoft,
                        minWidth: 38,
                        paddingTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      #{rankNumber}
                    </Text>
                    <Avatar name={item.username} avatarUrl={item.avatarUrl} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: font.nativeFamily.display,
                          fontSize: 14,
                          color: isMe ? palette.primary : palette.txt,
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
          </View>
        )}

        {/* Pagination Bar at the bottom (1 2 3 ... 67) */}
        {totalPages > 1 && (
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.line,
              paddingVertical: 12,
              paddingHorizontal: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 4,
            }}
          >
            {/* Prev Button */}
            <TouchableOpacity
              onPress={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0 || isLoading}
              activeOpacity={0.7}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: palette.bg,
                borderWidth: 1,
                borderColor: palette.line,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: currentPage === 0 ? 0.4 : 1,
              }}
            >
              <ChevronLeft size={18} color={palette.txt} />
            </TouchableOpacity>

            {/* Numeric Page Buttons & Dots */}
            {paginationItems.map((item, idx) => {
              if (item === 'dots') {
                return (
                  <View
                    key={`dots-${idx}`}
                    style={{
                      width: 32,
                      height: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: palette.inkSoft }}>
                      …
                    </Text>
                  </View>
                );
              }

              const pageIdx = item - 1;
              const isActive = pageIdx === currentPage;

              return (
                <TouchableOpacity
                  key={`page-${item}`}
                  onPress={() => goToPage(pageIdx)}
                  disabled={isLoading}
                  activeOpacity={0.75}
                  style={{
                    minWidth: 36,
                    height: 36,
                    paddingHorizontal: 6,
                    borderRadius: 12,
                    backgroundColor: isActive ? palette.primary : palette.bg,
                    borderWidth: 1,
                    borderColor: isActive ? palette.primary : palette.line,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: '800',
                      color: isActive ? palette.primaryInk : palette.txt,
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Next Button */}
            <TouchableOpacity
              onPress={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1 || isLoading}
              activeOpacity={0.7}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: palette.bg,
                borderWidth: 1,
                borderColor: palette.line,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: currentPage >= totalPages - 1 ? 0.4 : 1,
              }}
            >
              <ChevronRight size={18} color={palette.txt} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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
