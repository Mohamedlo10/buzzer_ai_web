import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,

  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Crown,
  Medal,
  Award,
  Flame,
  TrendingUp,
} from 'lucide-react-native';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import * as sessionsApi from '~/lib/api/sessions';
import * as categoriesApi from '~/lib/api/categories';
import * as roomsApi from '~/lib/api/rooms';
import { appStorage } from '~/lib/utils/storage';
import type { CategoryRequest, Difficulty, TeamResponse } from '~/types/api';
import { teamColor as resolveTeamColor } from '~/lib/game/teamColors';
import { palette, font } from '~/lib/theme/tokens';
import { CategoryPicker } from '~/components/session/CategoryPicker';

const PREDEFINED_CATEGORIES = [
  { name: 'Histoire', emoji: '📜', hexColor: palette.gold },
  { name: 'Science', emoji: '🔬', hexColor: palette.primary },
  { name: 'Sports', emoji: '🏆', hexColor: palette.bad },
  { name: 'Géographie', emoji: '🌍', hexColor: palette.indigo },
  { name: 'Culture G', emoji: '🌐', hexColor: palette.violet },
  { name: 'Cinéma', emoji: '🎬', hexColor: palette.bad },
];

const _DIFFICULTIES: { value: Difficulty; label: string; hexColor: string }[] = [
  { value: 'FACILE', label: 'Facile', hexColor: palette.primary },
  { value: 'INTERMEDIAIRE', label: 'Intermédiaire', hexColor: palette.gold },
  { value: 'EXPERT', label: 'Expert', hexColor: palette.bad },
];

const _getRankBadgeStyle = (index: number) => {
  switch (index) {
    case 0:
      return {
        bg: palette.gold + '24',
        text: palette.gold,
        border: palette.gold + '44',
        icon: <Crown size={12} color={palette.gold} strokeWidth={2.5} />,
      };
    case 1:
      return {
        bg: '#64748B20',
        text: '#475569',
        border: '#64748B38',
        icon: <Medal size={12} color="#475569" strokeWidth={2.5} />,
      };
    case 2:
      return {
        bg: palette.bronze + '20',
        text: palette.bronze,
        border: palette.bronze + '44',
        icon: <Award size={12} color={palette.bronze} strokeWidth={2.5} />,
      };
    case 3:
      return {
        bg: palette.primary + '1A',
        text: palette.primary,
        border: palette.primary + '38',
        icon: <Flame size={12} color={palette.primary} strokeWidth={2.5} />,
      };
    case 4:
      return {
        bg: palette.indigo + '1A',
        text: palette.indigo,
        border: palette.indigo + '38',
        icon: <TrendingUp size={12} color={palette.indigo} strokeWidth={2.5} />,
      };
    case 5:
    default:
      return {
        bg: palette.surface2,
        text: palette.inkSoft,
        border: palette.line,
        icon: <Sparkles size={12} color={palette.inkSoft} strokeWidth={2.5} />,
      };
  }
};

/**
 * Sélection des catégories et/ou de l'équipe avant de rejoindre le lobby.
 *
 * Porte la logique de web-legacy (session/[code]/categories/page.tsx).
 * CSS Grid → flexWrap + width 50% (2 colonnes).
 * Overlays absent (non requis ici).
 */
export default function CategoriesScreen() {
  const router = useRouter();
  const {
    code,
    sessionId: paramSessionId,
    isSpectator: paramIsSpectator,
    playerId,
    playerName,
    isEditing,
  } = useLocalSearchParams<{
    code: string;
    sessionId?: string;
    isSpectator?: string;
    playerId?: string;
    playerName?: string;
    isEditing?: string;
  }>();

  const isEditMode = isEditing === 'true';

  const [selectedCategories, setSelectedCategories] = useState<CategoryRequest[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [customDifficulty, _setCustomDifficulty] = useState<Difficulty | null>(null);
  const [_searchResults, _setSearchResults] = useState<string[]>([]);
  const [_showDropdown, _setShowDropdown] = useState(false);
  const [_isSearching, _setIsSearching] = useState(false);
  const _searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualSessionId, setActualSessionId] = useState<string | null>(paramSessionId || null);
  const [isCheckingJoined, setIsCheckingJoined] = useState(!isEditMode);
  const [isLoadingPlayerCategories, setIsLoadingPlayerCategories] = useState(isEditMode);
  const [isManualMode, setIsManualMode] = useState(false);
  const [maxCategories, setMaxCategories] = useState(3);
  const [sessionTeams, setSessionTeams] = useState<TeamResponse[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [currentStep, setCurrentStep] = useState<'team' | 'categories'>('categories');

  const [_popularCategories, setPopularCategories] = useState<{ name: string; hexColor: string }[]>(PREDEFINED_CATEGORIES);
  const [_isLoadingPopular, setIsLoadingPopular] = useState(true);

  const joinSession = useBuzzStore((state) => state.joinSession);
  const joinCheck = useBuzzStore((state) => state.joinCheck);
  const isJoining = useBuzzStore((state) => state.isJoining);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (isEditMode) {
      const loadPlayerCategories = async () => {
        if (!actualSessionId || !playerId) {
          setIsLoadingPlayerCategories(false);
          return;
        }
        try {
          const detail = await sessionsApi.getSession(actualSessionId);
          setMaxCategories(detail.session.maxCategoriesPerPlayer || 3);
          const player = detail.players.find(p => p.id === playerId || p.userId === playerId);
          if (player?.selectedCategories?.length) {
            setSelectedCategories(
              player.selectedCategories.map(name => ({
                name,
                difficulty: 'INTERMEDIAIRE' as Difficulty,
              }))
            );
          }
        } catch {
          // ignore
        } finally {
          setIsLoadingPlayerCategories(false);
        }
      };
      loadPlayerCategories();
      return;
    }

    const checkAlreadyJoined = async () => {
      if (!user?.id) {
        setIsCheckingJoined(false);
        return;
      }

      let sid = actualSessionId || paramSessionId || null;
      if (!sid && code) {
        try {
          const result = await joinCheck(code);
          sid = result.sessionId;
          setActualSessionId(sid);
        } catch {
          try {
            const roomData = await roomsApi.joinRoom(code);
            router.replace(`/room/${roomData.room.id}` as any);
            return;
          } catch (roomErr: any) {
            if (roomErr?.response?.status === 409) {
              const rId = roomErr?.response?.data?.roomId;
              if (rId) {
                router.replace(`/room/${rId}` as any);
                return;
              }
            }
          }
          setError('Impossible de trouver la session ou la salle.');
          setIsCheckingJoined(false);
          return;
        }
      }

      if (!sid) {
        setIsCheckingJoined(false);
        return;
      }

      try {
        const detail = await sessionsApi.getSession(sid);
        setMaxCategories(detail.session.maxCategoriesPerPlayer || 3);

        const currentPlayer = detail.players.find(p => p.userId === user.id);
        const isSpectator = Boolean(currentPlayer?.isSpectator);
        const isManagerMode = detail.session.categorySelectionMode === 'MANAGER';
        const isManual = detail.session.questionMode === 'MANUAL';
        const hasSelectedCategories = Boolean(currentPlayer?.selectedCategories && currentPlayer.selectedCategories.length > 0);
        const alreadyJoined = Boolean(currentPlayer && (isSpectator || isManagerMode || isManual || hasSelectedCategories));
        if (alreadyJoined) {
          await appStorage.setActiveSession({ sessionId: detail.session.id, code: detail.session.code });
          useBuzzStore.setState({
            session: detail.session,
            players: detail.players || [],
            questions: detail.questions || [],
            teams: detail.teams || [],
            sessionCode: detail.session.code,
          });
          router.replace(`/session/${code}/lobby` as any);
          return;
        }

        if (detail.session.isTeamMode && paramIsSpectator !== '1') {
          setIsTeamMode(true);
          setSessionTeams(detail.teams || []);
          if (isManual || isManagerMode) {
            setIsManualMode(true);
            setCurrentStep('team');
          } else {
            setCurrentStep('categories');
          }
          setIsCheckingJoined(false);
          return;
        }

        if (isManual || isManagerMode) {
          setIsManualMode(true);
          try {
            await sessionsApi.joinSession(sid, { categories: [], isSpectator: paramIsSpectator === '1' });
            const updated = await sessionsApi.getSession(sid);
            await appStorage.setActiveSession({ sessionId: updated.session.id, code: updated.session.code });
            useBuzzStore.setState({
              session: updated.session,
              players: updated.players || [],
              questions: updated.questions || [],
              teams: updated.teams || [],
              sessionCode: updated.session.code,
            });
          } catch (e) {
            // Force redirect even on failure to avoid being stuck on categories screen
          } finally {
            router.replace(`/session/${code}/lobby` as any);
          }
          return;
        }
      } catch {
        // ignore
      }
      setIsCheckingJoined(false);
    };

    checkAlreadyJoined();
  }, [user?.id, code]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const loadPopularCategories = async () => {
      try {
        const catNames = await categoriesApi.getPopularCategories(6);
        let mapped = catNames.map(name => {
          const predefined = PREDEFINED_CATEGORIES.find(p => p.name.toLowerCase() === name.toLowerCase());
          if (predefined) return { name: predefined.name, hexColor: predefined.hexColor };
          const colors = [palette.primary, palette.gold, palette.bad, palette.indigo, palette.violet];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          return { name, hexColor: randomColor };
        });

        if (mapped.length < 6) {
          const needed = 6 - mapped.length;
          const toAdd = PREDEFINED_CATEGORIES.filter(p => !mapped.some(m => m.name.toLowerCase() === p.name.toLowerCase())).slice(0, needed)
            .map(p => ({ name: p.name, hexColor: p.hexColor }));
          mapped = [...mapped, ...toAdd];
        }
        setPopularCategories(mapped as any);
      } catch (err) {
        // Fallback to PREDEFINED_CATEGORIES which is already set
      } finally {
        setIsLoadingPopular(false);
      }
    };
    loadPopularCategories();
  }, []);

  const _canAddMore = selectedCategories.length < maxCategories;

  // toggleCategory, updateDifficulty, handleCustomCategoryChange, removeCategory
  // sont délégués au composant CategoryPicker via onChange={setSelectedCategories}.

  const handleSubmit = async () => {
    const targetList = [...selectedCategories];
    if (customCategory.trim().length >= 2 && targetList.length < maxCategories) {
      const trimmed = customCategory.trim().replace(/[,;\n]/g, '');
      const exists = targetList.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
      if (!exists) {
        targetList.push({ name: trimmed, difficulty: customDifficulty || 'INTERMEDIAIRE' });
        setSelectedCategories(targetList);
        setCustomCategory('');
      }
    }

    if (!isManualMode && targetList.length === 0) {
      setError('Sélectionnez au moins une catégorie');
      return;
    }
    if (!actualSessionId) {
      setError('Erreur: ID de session manquant. Veuillez recommencer.');
      return;
    }
    if (isTeamMode && currentStep === 'categories' && !isEditMode) {
      setCurrentStep('team');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      if (isEditMode && playerId) {
        await sessionsApi.updatePlayerCategories(actualSessionId, playerId, targetList);
        router.back();
      } else {
        await joinSession(actualSessionId, targetList, paramIsSpectator === '1', false, selectedTeamId);
        router.replace(`/session/${code}/lobby` as any);
      }
    } catch (err: any) {
      if (err?.response?.status === 409 && err?.response?.data?.error === 'USER_ALREADY_EXISTS') {
        router.replace(`/session/${code}/lobby` as any);
        return;
      }
      const message = err?.response?.data?.message || (isEditMode ? 'Erreur lors de la mise à jour' : 'Erreur lors de la connexion');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading states ────────────────────────────────────────────────────────

  if (isCheckingJoined || isLoadingPlayerCategories) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: palette.primary + '26', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Sparkles size={40} color={palette.primary} />
        </View>
        <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 16, lineHeight: 22, paddingTop: 6, paddingBottom: 2 }}>
          Vérification...
        </Text>
      </SafeAreaView>
    );
  }

  // ── Team picker step ──────────────────────────────────────────────────────

  if (currentStep === 'team') {
    const sortedTeams = [...sessionTeams].sort((a, b) => b.score - a.score);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: palette.line }}>
          <TouchableOpacity
            onPress={() => {
              if (isManualMode) router.back();
              else setCurrentStep('categories');
            }}
            activeOpacity={0.7}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <ArrowLeft size={20} color={palette.txt} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 18, lineHeight: 26, paddingTop: 6, paddingBottom: 2 }}>
              Choisis ton équipe
            </Text>
            <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.inkSoft, fontSize: 13, marginTop: 2 }}>
              Mode équipes · le buzz est partagé entre coéquipiers
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}>
          {sortedTeams.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <Text style={{ color: palette.inkSoft }}>Aucune équipe disponible</Text>
            </View>
          ) : (
            sortedTeams.map((team) => {
              const isSelected = selectedTeamId === team.id;
              const tColor = resolveTeamColor(team.color);
              return (
                <TouchableOpacity
                  key={team.id}
                  onPress={() => setSelectedTeamId(team.id)}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                  style={{
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: isSelected ? tColor : palette.line,
                    backgroundColor: palette.surface,
                    padding: 16,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                      <View style={{ width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: tColor + '38', borderWidth: 1.5, borderColor: tColor }}>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: tColor }} />
                      </View>
                      <View>
                        <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 16, lineHeight: 22, paddingTop: 4, paddingBottom: 2 }}>{team.name}</Text>
                        <Text style={{ color: palette.inkSoft, fontSize: 12, marginTop: 2 }}>
                          {team.members?.length ?? 0} joueur{(team.members?.length ?? 0) !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: isSelected ? tColor : palette.surface2 }}>
                      <Text style={{ color: isSelected ? '#FFFFFF' : palette.inkSoft, fontSize: 12, fontWeight: '600' }}>
                        {isSelected ? '✓ Mon équipe' : 'Rejoindre'}
                      </Text>
                    </View>
                  </View>
                  {(team.members?.length ?? 0) > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: palette.line + '66' }}>
                      <Text style={{ color: palette.inkSoft, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Membres :
                      </Text>
                      {team.members?.slice(0, 6).map((member) => (
                        <View key={member.id} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: tColor, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                            {member.name?.charAt(0).toUpperCase() || '?'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: palette.bad + '50', backgroundColor: palette.bad + '1A' }}>
              <AlertCircle size={18} color={palette.bad} />
              <Text style={{ color: palette.bad, fontSize: 14, flex: 1, fontWeight: '500' }}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: palette.bg }}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!selectedTeamId || isSubmitting}
            activeOpacity={0.8}
            style={{
              borderRadius: 16,
              paddingVertical: 16,
              backgroundColor: !selectedTeamId || isSubmitting ? palette.surface2 : palette.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: !selectedTeamId || isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={{ fontFamily: font.nativeFamily.display, color: selectedTeamId ? '#FFFFFF' : palette.inkSoft, fontSize: 16, lineHeight: 22, paddingTop: 6, paddingBottom: 2 }}>
                  Continuer vers le salon
                </Text>
                <ChevronRight size={22} color={selectedTeamId ? '#FFFFFF' : palette.inkSoft} strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Categories selection ──────────────────────────────────────────────────

  const footerDisabled = isSubmitting || (selectedCategories.length === 0 && !customCategory.trim()) || isJoining;
  const footerLabel = isEditMode
    ? `Enregistrer ${selectedCategories.length} catégorie${selectedCategories.length !== 1 ? 's' : ''}`
    : selectedCategories.length === 0 && !customCategory.trim()
      ? 'Sélectionnez au moins 1 catégorie'
      : `Continuer avec ${selectedCategories.length} catégorie${selectedCategories.length !== 1 ? 's' : ''}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: palette.line }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowLeft size={20} color={palette.txt} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: font.nativeFamily.display, color: palette.txt, fontSize: 18, lineHeight: 26, paddingTop: 6, paddingBottom: 2 }}>
            {isEditMode ? `Catégories de ${playerName || 'joueur'}` : 'Choisis tes catégories'}
          </Text>
          <Text style={{ fontFamily: font.nativeFamily.serif, fontStyle: 'italic', color: palette.primary, fontSize: 13, marginTop: 2 }}>
            {selectedCategories.length} / {maxCategories} · l'IA génère tes questions
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 18 }} showsVerticalScrollIndicator={false}>
        <CategoryPicker
          selectedCategories={selectedCategories}
          onChange={setSelectedCategories}
          maxCategories={maxCategories}
          showProgress={true}
        />

        {/* Error */}
        {error && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: palette.bad + '50', backgroundColor: palette.bad + '1A' }}>
            <AlertCircle size={18} color={palette.bad} />
            <Text style={{ color: palette.bad, fontSize: 14, flex: 1, fontWeight: '500' }}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Footer */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: palette.bg }}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={footerDisabled}
          activeOpacity={0.8}
          style={{
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: footerDisabled ? palette.surface2 : palette.primary,
            opacity: footerDisabled ? 0.6 : 1,
          }}
        >
          {isSubmitting || isJoining ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={{ fontFamily: font.nativeFamily.display, color: '#FFFFFF', fontSize: 16, lineHeight: 22, paddingTop: 6, paddingBottom: 2 }}>
                {isEditMode ? 'Enregistrement...' : 'Connexion...'}
              </Text>
            </>
          ) : (
            <>
              <Text style={{ fontFamily: font.nativeFamily.display, color: footerDisabled ? palette.inkSoft : '#FFFFFF', fontSize: 16, lineHeight: 22, paddingTop: 6, paddingBottom: 2 }}>
                {footerLabel}
              </Text>
              <ChevronRight size={22} color={footerDisabled ? palette.inkSoft : '#FFFFFF'} strokeWidth={2.5} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
