import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import {
  Trophy,
  Search,
  X,
  Info,
  Award,
  Crown,
  Sparkles,
} from 'lucide-react-native';

import { useAuthStore } from '~/stores/useAuthStore';
import * as rankingsApi from '~/lib/api/rankings';
import type { GlobalRanking } from '~/types/api';
import { palette } from '~/lib/theme/tokens';
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

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  const renderRankingItem = ({ item, index }: { item: GlobalRanking; index: number }) => {
    const isMe = item.userId === user?.id;
    const rankNumber = index + 4; // Because first 3 are in the podium header

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isMe ? palette.primary + '1A' : palette.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: isMe ? palette.primary + '60' : palette.line,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 8,
          gap: 12,
        }}
      >
        <Text
          style={{
            width: 32,
            fontSize: 14,
            fontWeight: '800',
            color: palette.inkSoft,
            fontVariant: ['tabular-nums'],
          }}
        >
          #{rankNumber}
        </Text>

        <Avatar
          name={item.username}
          avatarUrl={item.avatarUrl}
          size={38}
        />

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: isMe ? palette.primary : palette.txt }} numberOfLines={1}>
            {item.username} {isMe ? '(Moi)' : ''}
          </Text>
          <Text style={{ fontSize: 11, color: palette.inkSoft }}>
            {item.totalGames || 0} partie{item.totalGames > 1 ? 's' : ''} · {Math.round(item.winRate || 0)}% victoires
          </Text>
        </View>

        <Text
          style={{
            fontSize: 14,
            fontWeight: '800',
            color: palette.gold,
            fontVariant: ['tabular-nums'],
          }}
        >
          {item.totalScore || 0} pts
        </Text>
      </View>
    );
  };

  const ListHeader = () => (
    <View style={{ gap: 16, marginBottom: 12 }}>
      {/* Top 3 Podium Cards */}
      {!searchUsername && top3.length >= 3 && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, paddingTop: 10, paddingBottom: 6 }}>
          {/* 2nd Place */}
          <View
            style={{
              flex: 1,
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.silver + '60',
              padding: 12,
              alignItems: 'center',
              gap: 6,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: palette.silver + '33',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: palette.silver, fontSize: 12, fontWeight: '800' }}>2</Text>
            </View>
            <Avatar name={top3[1]?.username} avatarUrl={top3[1]?.avatarUrl} size={48} hue={210} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }} numberOfLines={1}>
              {top3[1]?.username}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: palette.gold }}>
              {top3[1]?.totalScore || 0} pts
            </Text>
          </View>

          {/* 1st Place */}
          <View
            style={{
              flex: 1.15,
              backgroundColor: palette.surface,
              borderRadius: 22,
              borderWidth: 1.5,
              borderColor: palette.gold,
              padding: 16,
              alignItems: 'center',
              gap: 6,
              transform: [{ translateY: -10 }],
              shadowColor: palette.gold,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Crown size={22} color={palette.gold} />
            <Avatar name={top3[0]?.username} avatarUrl={top3[0]?.avatarUrl} size={56} hue={45} ring={palette.gold} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: palette.txt }} numberOfLines={1}>
              {top3[0]?.username}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: palette.gold }}>
              {top3[0]?.totalScore || 0} pts
            </Text>
          </View>

          {/* 3rd Place */}
          <View
            style={{
              flex: 1,
              backgroundColor: palette.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: palette.bronze + '60',
              padding: 12,
              alignItems: 'center',
              gap: 6,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: palette.bronze + '33',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: palette.bronze, fontSize: 12, fontWeight: '800' }}>3</Text>
            </View>
            <Avatar name={top3[2]?.username} avatarUrl={top3[2]?.avatarUrl} size={48} hue={30} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: palette.txt }} numberOfLines={1}>
              {top3[2]?.username}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: palette.gold }}>
              {top3[2]?.totalScore || 0} pts
            </Text>
          </View>
        </View>
      )}

      {/* Search Input */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: palette.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.line,
          paddingHorizontal: 14,
          paddingVertical: 8,
          gap: 10,
        }}
      >
        <Search size={18} color={palette.inkSoft} />
        <TextInput
          value={searchUsername}
          onChangeText={handleSearchChange}
          placeholder="Chercher un joueur dans le classement…"
          placeholderTextColor={palette.inkSoft}
          autoCapitalize="none"
          style={{
            flex: 1,
            color: palette.txt,
            fontSize: 14,
            paddingVertical: 6,
          }}
        />
        {searchUsername.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchUsername('');
              fetchRankings(0, '');
            }}
            activeOpacity={0.7}
          >
            <X size={16} color={palette.inkSoft} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: palette.line,
          backgroundColor: palette.bg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Trophy size={24} color={palette.gold} />
          <Text style={{ fontSize: 24, fontWeight: '800', color: palette.txt }}>
            Classement
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
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: palette.line,
          }}
        >
          <Info size={18} color={palette.inkSoft} />
        </TouchableOpacity>
      </View>

      {/* Main FlashList */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
        {isLoading && !isRefreshing ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={palette.primary} />
            <Text style={{ color: palette.inkSoft, fontSize: 14 }}>
              Chargement du classement…
            </Text>
          </View>
        ) : (
          <FlashList
            data={searchUsername ? rankings : rest}
            renderItem={({ item, index }) =>
              renderRankingItem({
                item,
                index: searchUsername ? index - 3 : index,
              })
            }
            ListHeaderComponent={ListHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 110 }}
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: palette.inkSoft, fontSize: 14 }}>
                  Aucun joueur trouvé
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Glicko-2 Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: palette.surface,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: palette.line,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: palette.txt }}>
                Système de classement
              </Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)} activeOpacity={0.7}>
                <X size={20} color={palette.inkSoft} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: palette.txt, fontSize: 14, lineHeight: 22 }}>
              Le classement mondial s'appuie sur le modèle mathématique <Text style={{ color: palette.primary, fontWeight: '700' }}>Glicko-2</Text>.
            </Text>

            <Text style={{ color: palette.inkSoft, fontSize: 13, lineHeight: 20 }}>
              • Chaque victoire contre un adversaire redoutable augmente significativement votre cote.{'\n'}
              • La régularité et l'activité affinent votre rang.{'\n'}
              • Les scores se mettent à jour automatiquement à l'issue de chaque session.
            </Text>

            <TouchableOpacity
              onPress={() => setShowInfoModal(false)}
              activeOpacity={0.8}
              style={{
                backgroundColor: palette.primary,
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
                marginTop: 6,
              }}
            >
              <Text style={{ color: palette.primaryInk, fontWeight: '700', fontSize: 14 }}>
                Compris !
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
