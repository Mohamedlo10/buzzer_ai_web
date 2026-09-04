import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

import {
  Trophy,
  Search,
  X,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';

import { useLeaderboard } from '~/lib/query/hooks';
import type { LeaderboardPeriodType } from '~/types/leaderboards';
import { LoadingState, EmptyState, ErrorState } from '~/components/ui';
import { palette, font } from '~/lib/theme/tokens';
import { Avatar } from '~/components/shared/Avatar';
import { AppTopBar } from '~/components/shared/AppTopBar';

const PAGE_SIZE = 20;

/**
 * Les trois périodes du §11.
 *
 * Le classement global cumulé n'y figure pas : il repose sur Glicko-2, que le §2.2 reporte
 * après la V1 et que rien n'explique au joueur. Il reste calculé côté serveur, mais la V1
 * met en avant les périodes, qui sont lisibles sans explication.
 */
const PERIODS: { key: LeaderboardPeriodType; label: string }[] = [
  { key: 'DAY', label: 'Jour' },
  { key: 'WEEK', label: 'Semaine' },
  { key: 'SEASON', label: 'Saison' },
];

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

  const [period, setPeriod] = useState<LeaderboardPeriodType>('SEASON');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // react-query remplace le couple useState/useEffect précédent, dont le catch avalait
  // l'erreur dans un console.error : en cas d'échec, la liste restait vide et muette.
  const { data, isLoading, isError, error, refetch } = useLeaderboard(
    period,
    currentPage,
    searchUsername || undefined,
  );

  const entries = data?.entries ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const myEntry = data?.me ?? null;

  const handleSearchChange = (text: string) => {
    setSearchInput(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchUsername(text.trim());
      setCurrentPage(0);
    }, 400);
  };

  const changePeriod = (next: LeaderboardPeriodType) => {
    if (next === period) return;
    setPeriod(next);
    setCurrentPage(0);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const goToPage = (page: number) => {
    if (page < 0 || page >= totalPages || page === currentPage) return;
    setCurrentPage(page);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  /** Saute à la page qui contient ma ligne — §14, mettre l'utilisateur en évidence. */
  const handleGoToMyRank = () => {
    if (!myEntry) return;
    setSearchInput('');
    setSearchUsername('');
    setCurrentPage(Math.floor((myEntry.rank - 1) / PAGE_SIZE));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const showPodium = currentPage === 0 && !searchUsername && entries.length >= 3;
  const podiumList = showPodium ? [entries[1], entries[0], entries[2]] : [];
  const listItems = showPodium ? entries.slice(3) : entries;

  const paginationItems = getPaginationRange(currentPage + 1, totalPages);

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <AppTopBar title="Xalaat" tag="CLASSEMENT" />

      {/* Whole page is scrollable */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 110,
          maxWidth: 540,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* Sélecteur de période (§11). Un seul écran pour les trois classements : le
            contrat de sortie est identique, seule la période change. */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: palette.surface2,
            borderRadius: 999,
            padding: 4,
            marginBottom: 14,
          }}
        >
          {PERIODS.map((p) => {
            const active = p.key === period;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => changePeriod(p.key)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 999,
                  alignItems: 'center',
                  backgroundColor: active ? palette.primary : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: active ? palette.primaryInk : palette.inkSoft,
                  }}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Libellé calculé serveur : « Aujourd'hui », « Cette semaine »,
            « Saison septembre 2026 ». */}
        {data?.periodLabel ? (
          <Text
            style={{
              fontFamily: font.nativeFamily.serif,
              fontStyle: 'italic',
              fontSize: 14,
              color: palette.inkSoft,
              marginBottom: 12,
            }}
          >
            {data.periodLabel} · {data.totalPlayers} joueur{data.totalPlayers > 1 ? 's' : ''}
          </Text>
        ) : null}

        {/* "Ton classement" Card (Click to jump to your page) */}
        {myEntry ? (
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
              marginBottom: 12,
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
                    paddingTop: 3,
                    paddingBottom: 1,
                  }}
                >
                  Rang #{myEntry.rank}
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

        {/* Search Bar + Info button row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: palette.surface,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: palette.line,
              paddingHorizontal: 14,
              paddingVertical: 8,
              gap: 8,
            }}
          >
            <Search size={16} color={palette.inkSoft} />
            <TextInput
              value={searchInput}
              onChangeText={handleSearchChange}
              placeholder="Rechercher un joueur…"
              placeholderTextColor={palette.inkSoft}
              style={{ flex: 1, color: palette.txt, fontSize: 13.5 }}
            />
            {searchInput ? (
              <TouchableOpacity onPress={() => handleSearchChange('')} activeOpacity={0.7}>
                <X size={16} color={palette.inkSoft} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => setShowInfoModal(true)}
            activeOpacity={0.7}
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
            <Info size={17} color={palette.inkSoft} />
          </TouchableOpacity>
        </View>

        {/* Podium Section (shown on page 0 without search) */}
        {showPodium && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
            {podiumList.map((p, i) => {
              const rankNum = i === 1 ? 1 : i === 0 ? 2 : 3;
              const isFirst = rankNum === 1;
              const isSecond = rankNum === 2;
              const name = p?.username || 'Joueur';
              const score = p?.points ?? 0;

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
                        fontSize: 13,
                        fontWeight: '700',
                        color: palette.txt,
                      }}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: palette.primary, marginTop: 2 }}>
                      {score.toLocaleString('fr-FR')} pts
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* États du §29 : l'erreur était auparavant avalée dans un console.error, et la
            liste restait vide sans la moindre explication. */}
        {isError && !data ? (
          <ErrorState
            error={error}
            fallbackMessage="Impossible de charger le classement."
            onRetry={() => void refetch()}
          />
        ) : isLoading && !data ? (
          <LoadingState label="Chargement du classement…" />
        ) : listItems.length === 0 ? (
          <EmptyState
            title={searchUsername ? 'Aucun joueur trouvé' : 'Personne au classement'}
            description={
              searchUsername
                ? 'Essaie un autre pseudonyme.'
                : 'Sois le premier à jouer le Défi du Jour sur cette période.'
            }
          />
        ) : (
          <View style={{ gap: 8, marginBottom: 16 }}>
            {listItems.map((item, index) => {
              const rankNumber = showPodium
                ? index + 4
                : currentPage * PAGE_SIZE + (index + 1);
              const isMe = item.isMe;
              const score = item.points;

              return (
                <View
                  key={item.userId}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isMe ? `${palette.primary}12` : palette.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isMe ? palette.primary : palette.line,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
                    <Text
                      style={{
                        fontFamily: font.nativeFamily.display,
                        fontSize: 13,
                        lineHeight: 18,
                        color: rankNumber <= 3 ? palette.gold : palette.inkSoft,
                        minWidth: 36,
                        paddingTop: 3,
                        paddingBottom: 1,
                      }}
                      numberOfLines={1}
                    >
                      #{rankNumber}
                    </Text>
                    <Avatar name={item.username} avatarUrl={item.avatarUrl} size={34} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13.5,
                          fontWeight: '700',
                          color: isMe ? palette.primary : palette.txt,
                        }}
                        numberOfLines={1}
                      >
                        {item.username} {isMe ? '(toi)' : ''}
                      </Text>
                      <Text style={{ fontSize: 11, color: palette.inkSoft, marginTop: 1 }}>
                        {item.challengesPlayed} défis · {item.correctAnswers} bonnes réponses
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: '800',
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
              paddingVertical: 10,
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
                      width: 28,
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

            {/* La cote Glicko-2 n'est plus exposée : le §2.2 la reporte après la V1, et
                rien dans l'application ne l'expliquait au joueur. Elle continue d'ordonner
                le classement global côté serveur. */}
            <Text style={{ color: palette.inkSoft, fontSize: 13.5, lineHeight: 20, marginBottom: 12 }}>
              Chaque Défi du Jour rapporte des points. Ils alimentent trois classements :
              le <Text style={{ color: palette.txt, fontWeight: '700' }}>jour</Text>,
              la <Text style={{ color: palette.txt, fontWeight: '700' }}>semaine</Text>,
              et la <Text style={{ color: palette.txt, fontWeight: '700' }}>saison</Text>, qui dure un mois.
            </Text>

            <Text style={{ color: palette.inkSoft, fontSize: 13.5, lineHeight: 20, marginBottom: 12 }}>
              <Text style={{ color: palette.primary, fontWeight: '700' }}>À égalité de points :</Text> le
              nombre de bonnes réponses départage, puis le temps de réflexion cumulé.
            </Text>

            <Text style={{ color: palette.inkSoft, fontSize: 13.5, lineHeight: 20 }}>
              La saison repart de zéro chaque mois : personne n&apos;est jamais distancé pour de bon.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
