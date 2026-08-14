import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Plus, X, Sparkles, AlertCircle, ChevronRight } from 'lucide-react-native';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import * as sessionsApi from '~/lib/api/sessions';
import * as categoriesApi from '~/lib/api/categories';
import * as roomsApi from '~/lib/api/rooms';
import { appStorage } from '~/lib/utils/storage';
import type { CategoryRequest, Difficulty, TeamResponse } from '~/types/api';
import { teamColor as resolveTeamColor } from '~/lib/game/teamColors';
import { palette } from '~/lib/theme/tokens';
import { notify } from '~/lib/ui/notify';

const PREDEFINED_CATEGORIES = [
  { name: 'Histoire', emoji: '📜', hexColor: palette.gold },
  { name: 'Science', emoji: '🔬', hexColor: palette.primary },
  { name: 'Sports', emoji: '🏆', hexColor: palette.bad },
  { name: 'Géographie', emoji: '🌍', hexColor: palette.indigo },
  { name: 'Culture G', emoji: '🌐', hexColor: palette.violet },
  { name: 'Cinéma', emoji: '🎬', hexColor: palette.bad },
];

const DIFFICULTIES: { value: Difficulty; label: string; hexColor: string }[] = [
  { value: 'FACILE', label: 'Facile', hexColor: palette.primary },
  { value: 'INTERMEDIAIRE', label: 'Intermédiaire', hexColor: palette.gold },
  { value: 'EXPERT', label: 'Expert', hexColor: palette.bad },
];

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
  const [customDifficulty, setCustomDifficulty] = useState<Difficulty | null>(null);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

        const alreadyJoined = detail.players.some(p => p.userId === user.id);
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
          if (detail.session.questionMode === 'MANUAL') {
            setIsManualMode(true);
            setCurrentStep('team');
          } else {
            setCurrentStep('categories');
          }
          setIsCheckingJoined(false);
          return;
        }

        if (detail.session.questionMode === 'MANUAL') {
          setIsManualMode(true);
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
          router.replace(`/session/${code}/lobby` as any);
          return;
        }
      } catch {
        // ignore
      }
      setIsCheckingJoined(false);
    };

    checkAlreadyJoined();
  }, [user?.id, code]); // eslint-disable-line react-hooks/exhaustive-deps

  const canAddMore = selectedCategories.length < maxCategories;

  const toggleCategory = (name: string) => {
    const exists = selectedCategories.find((c) => c.name === name);
    if (exists) {
      setSelectedCategories((prev) => prev.filter((c) => c.name !== name));
      setError(null);
    } else if (canAddMore) {
      setSelectedCategories((prev) => [...prev, { name, difficulty: 'INTERMEDIAIRE' }]);
      setError(null);
    } else {
      setError(`Maximum ${maxCategories} catégories permises`);
    }
  };

  const updateDifficulty = (name: string, difficulty: Difficulty) => {
    setSelectedCategories((prev) =>
      prev.map((c) => (c.name === name ? { ...c, difficulty } : c))
    );
  };

  const commitCustomCategory = (textToCommit?: string): boolean => {
    const raw = textToCommit !== undefined ? textToCommit : customCategory;
    const trimmed = raw.replace(/[,;\n]/g, '').trim();
    if (!trimmed) return false;
    if (trimmed.length < 2) {
      setError('Minimum 2 caractères pour une catégorie');
      return false;
    }
    const exists = selectedCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setError(`Catégorie "${trimmed}" déjà sélectionnée`);
      setCustomCategory('');
      return false;
    }
    if (selectedCategories.length >= maxCategories) {
      setError(`Maximum ${maxCategories} catégories permises`);
      return false;
    }
    setSelectedCategories((prev) => [
      ...prev,
      { name: trimmed, difficulty: customDifficulty || 'INTERMEDIAIRE' },
    ]);
    setCustomCategory('');
    setCustomDifficulty(null);
    setSearchResults([]);
    setShowDropdown(false);
    setError(null);
    return true;
  };

  const handleCustomCategoryChange = (text: string) => {
    setError(null);
    if (text.includes(',') || text.includes(';') || text.includes('\n')) {
      const parts = text.split(/[,;\n]/);
      for (const part of parts) {
        if (part.trim().length >= 2) commitCustomCategory(part.trim());
      }
      setCustomCategory('');
      return;
    }
    setCustomCategory(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    const trimmed = text.trim();
    if (trimmed.length >= 2) {
      setIsSearching(true);
      setShowDropdown(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await categoriesApi.searchCategories(trimmed);
          setSearchResults(results);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
      setIsSearching(false);
    }
  };

  const removeCategory = (name: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c.name !== name));
    setError(null);
  };

  const handleSubmit = async () => {
    let targetList = [...selectedCategories];
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
        <Text style={{ color: palette.txt, fontWeight: '600', fontSize: 16 }}>Vérification...</Text>
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
            <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 18 }}>Choisis ton équipe</Text>
            <Text style={{ color: palette.inkSoft, fontSize: 12, marginTop: 2 }}>Mode équipes · le buzz est partagé entre coéquipiers</Text>
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
                        <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 16 }}>{team.name}</Text>
                        <Text style={{ color: palette.inkSoft, fontSize: 12 }}>
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
                <Text style={{ color: selectedTeamId ? '#FFFFFF' : palette.inkSoft, fontWeight: '700', fontSize: 18 }}>
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
          <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 18 }}>
            {isEditMode ? `Catégories de ${playerName || 'joueur'}` : 'Choisis tes catégories'}
          </Text>
          <Text style={{ color: palette.primary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
            {selectedCategories.length} / {maxCategories} · l'IA génère tes questions
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 18 }} showsVerticalScrollIndicator={false}>
        {/* Progress bar */}
        <View style={{ backgroundColor: palette.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: palette.line }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: palette.inkSoft, fontSize: 13 }}>Progression</Text>
            <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 13 }}>
              {selectedCategories.length}/{maxCategories}
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: palette.surface2, borderRadius: 9999, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                width: `${(selectedCategories.length / maxCategories) * 100}%`,
                backgroundColor: palette.primary,
                borderRadius: 9999,
              }}
            />
          </View>
        </View>

        {/* Selected categories */}
        {selectedCategories.length > 0 && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Check size={14} color={palette.primary} />
              <Text style={{ color: palette.inkSoft, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Sélectionnées
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              {selectedCategories.map((category) => {
                const catInfo = PREDEFINED_CATEGORIES.find(c => c.name === category.name);
                return (
                  <View
                    key={category.name}
                    style={{ backgroundColor: palette.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: palette.line, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: (catInfo?.hexColor ?? palette.violet) + '30' }}>
                      <Text style={{ fontSize: 17 }}>{catInfo?.emoji ?? '✨'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.txt, fontWeight: '700', fontSize: 14 }}>{category.name}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        {DIFFICULTIES.map((diff) => (
                          <TouchableOpacity
                            key={diff.value}
                            onPress={() => updateDifficulty(category.name, diff.value)}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 6,
                              backgroundColor: category.difficulty === diff.value ? diff.hexColor : palette.surface2,
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: category.difficulty === diff.value ? '#1A1410' : palette.inkSoft }}>
                              {diff.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeCategory(category.name)}
                      activeOpacity={0.7}
                      style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: palette.bad + '2E', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={14} color={palette.bad} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Predefined grid — 2 colonnes via flexWrap */}
        <View>
          <Text style={{ color: palette.inkSoft, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
            Catégories populaires
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {PREDEFINED_CATEGORIES.map((cat) => {
              const isSelected = !!selectedCategories.find(c => c.name === cat.name);
              const disabled = !isSelected && !canAddMore;
              return (
                <TouchableOpacity
                  key={cat.name}
                  onPress={() => toggleCategory(cat.name)}
                  disabled={disabled}
                  activeOpacity={0.75}
                  style={{
                    width: '47%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    padding: 12,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: isSelected ? cat.hexColor : palette.line,
                    backgroundColor: isSelected ? cat.hexColor + '28' : palette.surface,
                    opacity: disabled ? 0.4 : 1,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                  <Text style={{ color: palette.txt, fontWeight: '600', fontSize: 13, flex: 1 }}>{cat.name}</Text>
                  {isSelected && <Check size={16} color={cat.hexColor} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom category input */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: palette.inkSoft, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Catégorie sur mesure
            </Text>
            <Text style={{ color: palette.inkSoft, fontSize: 10 }}>Virgule ou bouton</Text>
          </View>

          <View style={{ backgroundColor: palette.surface, borderRadius: 16, borderWidth: 1, borderColor: palette.line, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: palette.line }}>
              <Sparkles size={16} color={palette.primary} />
              <TextInput
                value={customCategory}
                onChangeText={handleCustomCategoryChange}
                onSubmitEditing={() => commitCustomCategory()}
                placeholder="Ton thème (ex: Manga, Jazz, Pâtisserie)"
                placeholderTextColor={palette.inkSoft}
                returnKeyType="done"
                style={{ flex: 1, color: palette.txt, fontSize: 14, fontWeight: '500' }}
              />
              {customCategory.trim() ? (
                <TouchableOpacity
                  onPress={() => commitCustomCategory()}
                  activeOpacity={0.8}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: palette.primary }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Ajouter</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {showDropdown && customCategory.trim().length >= 2 && (
              <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {isSearching ? (
                  <View style={{ width: '100%', paddingVertical: 8, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={palette.primary} />
                  </View>
                ) : (
                  searchResults.map((result) => (
                    <TouchableOpacity
                      key={result}
                      onPress={() => commitCustomCategory(result)}
                      activeOpacity={0.7}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, backgroundColor: palette.surface2, borderWidth: 1, borderColor: palette.line }}
                    >
                      <Plus size={12} color={palette.primary} />
                      <Text style={{ color: palette.txt, fontSize: 12, fontWeight: '600' }}>{result}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        </View>

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
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 18 }}>
                {isEditMode ? 'Enregistrement...' : 'Connexion...'}
              </Text>
            </>
          ) : (
            <>
              <Text style={{ color: footerDisabled ? palette.inkSoft : '#FFFFFF', fontWeight: '700', fontSize: 18 }}>
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
