'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Plus,
  X,
  Sparkles,
  BookOpen,
  FlaskConical,
  Trophy,
  MapPin,
  Film,
  Music,
  Palette,
  Cpu,
  Globe,
  Zap,
  Target,
  AlertCircle,
  ChevronRight,
  Grid3X3,
  Star,
} from 'lucide-react';

import { SafeScreen } from '~/components/layout/SafeScreen';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import * as sessionsApi from '~/lib/api/sessions';
import * as categoriesApi from '~/lib/api/categories';
import * as roomsApi from '~/lib/api/rooms';
import { appStorage } from '~/lib/utils/storage';
import type { CategoryRequest, Difficulty, TeamResponse } from '~/types/api';

const PREDEFINED_CATEGORIES = [
  { name: 'Histoire', icon: BookOpen, color: '#FFD700', bg: '#FFD70020' },
  { name: 'Science', icon: FlaskConical, color: '#00D397', bg: '#00D39720' },
  { name: 'Sports', icon: Trophy, color: '#D5442F', bg: '#D5442F20' },
  { name: 'Géographie', icon: MapPin, color: '#4A90D9', bg: '#4A90D920' },
  { name: 'Culture G', icon: Globe, color: '#3498DB', bg: '#3498DB20' },
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string; bg: string }[] = [
  { value: 'FACILE', label: 'Facile', color: '#00D397', bg: '#00D39720' },
  { value: 'INTERMEDIAIRE', label: 'Moyen', color: '#FFD700', bg: '#FFD70020' },
  { value: 'EXPERT', label: 'Expert', color: '#D5442F', bg: '#D5442F20' },
];

export default function CategorySelectionPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const code = params.code;

  const sessionId = searchParams.get('sessionId') ?? undefined;
  const isSpectator = searchParams.get('isSpectator') ?? undefined;
  const playerId = searchParams.get('playerId') ?? undefined;
  const playerName = searchParams.get('playerName') ?? undefined;
  const isEditing = searchParams.get('isEditing') ?? undefined;

  const isEditMode = isEditing === 'true';

  const [selectedCategories, setSelectedCategories] = useState<CategoryRequest[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState<Difficulty>('INTERMEDIAIRE');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualSessionId, setActualSessionId] = useState<string | null>(sessionId || null);
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

  // Check if already joined / load data
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

      let sid = actualSessionId || sessionId || null;
      if (!sid && code) {
        try {
          const result = await joinCheck(code);
          sid = result.sessionId;
          setActualSessionId(sid);
        } catch {
          // joinCheck failed — the code might be a room code (QR code de salle mal configuré côté back)
          // Fallback : essayer de rejoindre comme salle
          try {
            const roomData = await roomsApi.joinRoom(code);
            router.replace(`/room/${roomData.room.id}`);
            return;
          } catch (roomErr: any) {
            // Room already joined → navigate to it
            if (roomErr?.response?.status === 409) {
              const roomId = roomErr?.response?.data?.roomId;
              if (roomId) {
                router.replace(`/room/${roomId}`);
                return;
              }
            }
          }
          setError('Impossible de trouver la session ou la salle. Veuillez réessayer.');
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
          router.replace(`/session/${code}/lobby`);
          return;
        }

        if (detail.session.isTeamMode && isSpectator !== '1') {
          setIsTeamMode(true);
          setSessionTeams(detail.teams || []);
          if (detail.session.questionMode === 'MANUAL') {
            setIsManualMode(true);
          }
          setCurrentStep('team');
          setIsCheckingJoined(false);
          return;
        }

        if (detail.session.questionMode === 'MANUAL') {
          setIsManualMode(true);
          await sessionsApi.joinSession(sid, { categories: [], isSpectator: isSpectator === '1' });
          const updated = await sessionsApi.getSession(sid);
          await appStorage.setActiveSession({ sessionId: updated.session.id, code: updated.session.code });
          useBuzzStore.setState({
            session: updated.session,
            players: updated.players || [],
            questions: updated.questions || [],
            teams: updated.teams || [],
            sessionCode: updated.session.code,
          });
          router.replace(`/session/${code}/lobby`);
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
    } else if (canAddMore) {
      setSelectedCategories((prev) => [
        ...prev,
        { name, difficulty: 'INTERMEDIAIRE' },
      ]);
    }
  };

  const updateDifficulty = (name: string, difficulty: Difficulty) => {
    setSelectedCategories((prev) =>
      prev.map((c) => (c.name === name ? { ...c, difficulty } : c))
    );
  };

  const handleCustomCategoryChange = (text: string) => {
    setCustomCategory(text);
    setError(null);

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

  const selectSuggestion = (name: string) => {
    setShowDropdown(false);
    setSearchResults([]);
    const exists = selectedCategories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      setError('Catégorie déjà sélectionnée');
      return;
    }
    if (!canAddMore) {
      setError(`Maximum ${maxCategories} catégories`);
      return;
    }
    setSelectedCategories((prev) => [...prev, { name, difficulty: customDifficulty }]);
    setCustomCategory('');
    setError(null);
  };

  const addCustomCategory = () => {
    const trimmed = customCategory.trim();
    if (!trimmed) return;

    if (trimmed.length < 3) {
      setError('Minimum 3 caractères');
      return;
    }

    const exists = selectedCategories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setError('Catégorie déjà sélectionnée');
      return;
    }

    if (!canAddMore) {
      setError(`Maximum ${maxCategories} catégories`);
      return;
    }

    setSelectedCategories((prev) => [
      ...prev,
      { name: trimmed, difficulty: customDifficulty },
    ]);
    setCustomCategory('');
    setSearchResults([]);
    setShowDropdown(false);
    setError(null);
  };

  const removeCategory = (name: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c.name !== name));
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      setError('Sélectionnez au moins une catégorie');
      return;
    }

    if (!actualSessionId) {
      setError('Erreur: ID de session manquant. Veuillez recommencer.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode && playerId) {
        await sessionsApi.updatePlayerCategories(actualSessionId, playerId, selectedCategories);
        router.back();
      } else {
        await joinSession(actualSessionId, selectedCategories, isSpectator === '1', false, selectedTeamId);
        router.replace(`/session/${code}/lobby`);
      }
    } catch (err: any) {
      if (err?.response?.status === 409 && err?.response?.data?.error === 'USER_ALREADY_EXISTS') {
        router.replace(`/session/${code}/lobby`);
        return;
      }

      const message = err?.response?.data?.message || (isEditMode ? 'Erreur lors de la mise à jour' : 'Erreur lors de la connexion');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTeamSelected = async (teamId: string) => {
    setSelectedTeamId(teamId);

    if (isManualMode && actualSessionId) {
      setIsSubmitting(true);
      try {
        await sessionsApi.joinSession(actualSessionId, {
          categories: [],
          isSpectator: false,
          teamId,
        });
        const updated = await sessionsApi.getSession(actualSessionId);
        await appStorage.setActiveSession({ sessionId: updated.session.id, code: updated.session.code });
        useBuzzStore.setState({
          session: updated.session,
          players: updated.players || [],
          questions: updated.questions || [],
          teams: updated.teams || [],
          sessionCode: updated.session.code,
        });
        router.replace(`/session/${code}/lobby`);
      } catch (err: any) {
        if (err?.response?.status === 409) {
          router.replace(`/session/${code}/lobby`);
          return;
        }
        setError(err?.response?.data?.message || 'Erreur lors de la connexion');
        setCurrentStep('team');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setCurrentStep('categories');
  };

  if (isCheckingJoined) {
    return (
      <SafeScreen className="bg-[#292349]">
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#00D39720] flex items-center justify-center mb-4">
              <Sparkles size={40} color="#00D397" />
            </div>
            <p className="text-white font-semibold">Vérification...</p>
          </div>
        </div>
      </SafeScreen>
    );
  }

  // Team picker step
  if (currentStep === 'team') {
    return (
      <SafeScreen className="bg-[#292349]">
        {/* Header */}
        <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666] sticky top-0 z-10">
          <div className="flex flex-row items-center">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </button>
            <div className="flex-1">
              <p className="text-white font-bold text-xl">Choisir ton équipe</p>
              <p className="text-white/50 text-xs mt-0.5">Sélectionne l'équipe que tu veux rejoindre</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-4 pt-6 flex flex-col gap-4">
          {sessionTeams.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <p className="text-white/50">Aucune équipe disponible</p>
            </div>
          ) : (
            sessionTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleTeamSelected(team.id)}
                disabled={isSubmitting}
                className="mb-4 rounded-3xl overflow-hidden hover:opacity-80 transition-opacity text-left"
              >
                <div
                  className="bg-[#342D5B] border border-[#3E3666] rounded-3xl overflow-hidden"
                  style={{ borderColor: team.color ? `${team.color}40` : '#3E3666' }}
                >
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: team.color ?? '#3E3666' }}
                  />
                  <div className="p-5 flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center flex-1">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4"
                        style={{ backgroundColor: team.color ? `${team.color}25` : '#3E3666' }}
                      >
                        <Target size={22} color={team.color ?? '#FFFFFF'} />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">{team.name}</p>
                        <p className="text-white/50 text-sm">
                          {team.members.length} membre{team.members.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div
                      className="px-4 py-2 rounded-xl"
                      style={{ backgroundColor: team.color ? `${team.color}20` : '#3E3666' }}
                    >
                      <span className="font-bold text-sm" style={{ color: team.color ?? '#FFFFFF' }}>
                        Rejoindre
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}

          {error && (
            <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/30 flex flex-row items-center mt-2">
              <AlertCircle size={18} color="#EF4444" />
              <p className="text-red-400 flex-1 ml-3">{error}</p>
            </div>
          )}

          {isSubmitting && (
            <div className="flex flex-col items-center py-6">
              <div className="w-8 h-8 border-4 border-[#00D397] border-t-transparent rounded-full animate-spin" />
              <p className="text-white/60 text-sm mt-2">Connexion...</p>
            </div>
          )}
        </div>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="bg-[#292349]">
      {/* Header */}
      <div className="bg-[#292349] pt-6 pb-4 px-4 border-b border-[#3E3666] sticky top-0 z-10">
        <div className="flex flex-row items-center">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold text-xl">
              {isEditMode ? `Catégories de ${playerName || 'joueur'}` : 'Choisir tes catégories'}
            </p>
            <div className="flex flex-row items-center mt-0.5">
              <Grid3X3 size={12} color="#00D397" />
              <span className="text-white/60 text-xs ml-1.5">
                {selectedCategories.length} / {maxCategories} sélectionnées
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto pb-10">
        {/* Progress bar */}
        <div className="px-4 pt-4">
          <div className="bg-[#342D5B] rounded-2xl p-4 border border-[#3E3666]">
            <div className="flex flex-row items-center justify-between mb-3">
              <span className="text-white/70 text-sm">Progression</span>
              <span className="text-[#00D397] font-bold">
                {selectedCategories.length}/{maxCategories}
              </span>
            </div>
            <div className="h-2 bg-[#3E3666] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00D397] rounded-full transition-all duration-300"
                style={{ width: `${(selectedCategories.length / maxCategories) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Selected Categories */}
        {selectedCategories.length > 0 && (
          <div className="px-4 pt-4">
            <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#3E3666]">
                <div className="flex flex-row items-center">
                  <Check size={18} color="#00D397" />
                  <p className="text-white font-bold text-lg ml-2">Sélectionnées</p>
                </div>
              </div>
              <div className="flex flex-row overflow-x-auto p-3 gap-2">
                {selectedCategories.map((category) => {
                  const catInfo = PREDEFINED_CATEGORIES.find((c) => c.name === category.name);
                  const Icon = catInfo?.icon || Star;
                  return (
                    <div
                      key={category.name}
                      className="bg-[#292349] rounded-2xl p-3 border border-[#3E3666] flex-shrink-0"
                    >
                      <div className="flex flex-row items-center">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center mr-2"
                          style={{ backgroundColor: catInfo?.bg || '#3E3666' }}
                        >
                          <Icon size={16} color={catInfo?.color || '#FFFFFF'} />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{category.name}</p>
                          <p className="text-white/50 text-xs">
                            {DIFFICULTIES.find(d => d.value === category.difficulty)?.label}
                          </p>
                        </div>
                        <button
                          onClick={() => removeCategory(category.name)}
                          className="ml-3 w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                        >
                          <X size={14} color="#EF4444" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Custom Category Input */}
        <div className="px-4 pt-6">
          {/* Difficulty selector */}
          <p className="text-white/60 text-sm mb-3">Difficulté</p>
          <div className="flex flex-row gap-2 pb-3">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff.value}
                onClick={() => setCustomDifficulty(diff.value)}
                className={`flex-1 py-3 rounded-xl transition-colors ${
                  customDifficulty === diff.value ? 'bg-[#00D397]' : 'bg-[#3E3666] hover:bg-[#4E4676]'
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    customDifficulty === diff.value ? 'text-[#292349]' : 'text-white/80'
                  }`}
                >
                  {diff.label}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-row items-center mb-4">
            <Zap size={18} color="#9B59B6" />
            <p className="text-white font-bold text-lg ml-2">Catégories</p>
          </div>

          <div className="bg-[#342D5B] rounded-3xl border border-[#3E3666] p-5">
            <div className="flex flex-row gap-3 relative">
              <input
                value={customCategory}
                onChange={(e) => handleCustomCategoryChange(e.target.value)}
                placeholder="Ex: Marvel, années 90..."
                className="flex-1 bg-[#292349] rounded-2xl px-4 py-3.5 text-white border border-[#3E3666] focus:border-[#00D397] outline-none"
                maxLength={50}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCustomCategory();
                }}
              />
              <button
                onClick={addCustomCategory}
                disabled={!customCategory.trim() || !canAddMore}
                className={`w-14 rounded-2xl flex items-center justify-center transition-colors ${
                  customCategory.trim() && canAddMore
                    ? 'bg-[#00D397] hover:bg-[#00B377]'
                    : 'bg-[#3E3666] cursor-not-allowed'
                }`}
              >
                <Plus
                  size={28}
                  color={customCategory.trim() && canAddMore ? '#292349' : '#FFFFFF40'}
                  strokeWidth={2.5}
                />
              </button>
            </div>

            {/* Autocomplete dropdown */}
            {showDropdown && customCategory.trim().length >= 2 && (
              <div className="mt-2 mb-2 bg-[#292349] rounded-2xl border border-[#3E3666] overflow-hidden">
                {isSearching ? (
                  <div className="py-3 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-[#00D397] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {searchResults.map((result, index) => (
                      <button
                        key={result}
                        onClick={() => selectSuggestion(result)}
                        className={`w-full px-4 py-3 text-left text-white hover:bg-[#3E3666] transition-colors ${
                          index < searchResults.length - 1 ? 'border-b border-[#3E3666]' : ''
                        }`}
                      >
                        {result}
                      </button>
                    ))}
                    <button
                      onClick={addCustomCategory}
                      className={`w-full px-4 py-3 flex flex-row items-center hover:bg-[#3E3666] transition-colors ${
                        searchResults.length > 0 ? 'border-t border-[#3E3666]' : ''
                      }`}
                    >
                      <Plus size={14} color="#9B59B6" />
                      <span className="text-[#9B59B6] ml-2">
                        Utiliser "{customCategory.trim()}"
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 mt-4">
            <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/30 flex flex-row items-center">
              <AlertCircle size={20} color="#EF4444" />
              <p className="text-red-400 flex-1 ml-3 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="px-4 pt-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedCategories.length === 0 || isJoining}
            className={`w-full rounded-2xl py-4 px-6 flex flex-row items-center justify-center transition-colors ${
              isSubmitting || selectedCategories.length === 0 || isJoining
                ? 'bg-[#3E3666] cursor-not-allowed'
                : 'bg-[#00D397] hover:bg-[#00B383]'
            }`}
          >
            {isSubmitting || isJoining ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                <span className="text-white font-bold text-lg">
                  {isEditMode ? 'Enregistrement...' : 'Connexion...'}
                </span>
              </>
            ) : (
              <>
                <span className={`font-bold text-lg ${selectedCategories.length > 0 ? 'text-[#292349]' : 'text-white/40'}`}>
                  {isEditMode ? 'Enregistrer' : 'Rejoindre la session'}
                </span>
                <ChevronRight size={24} color={selectedCategories.length > 0 ? '#292349' : '#FFFFFF40'} strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </SafeScreen>
  );
}
