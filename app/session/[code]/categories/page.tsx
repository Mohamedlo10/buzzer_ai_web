'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Plus,
  X,
  Sparkles,
  Target,
  AlertCircle,
  ChevronRight,
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
  { name: 'Histoire', emoji: '📜', color: '#FFD700' },
  { name: 'Science', emoji: '🔬', color: '#00D397' },
  { name: 'Sports', emoji: '🏆', color: '#D5442F' },
  { name: 'Géographie', emoji: '🌍', color: '#4A90D9' },
  { name: 'Culture G', emoji: '🌐', color: '#9B59B6' },
  { name: 'Cinéma', emoji: '🎬', color: '#EC4899' },
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string; bg: string }[] = [
  { value: 'FACILE', label: 'Facile', color: '#00D397', bg: '#00D39720' },
  { value: 'INTERMEDIAIRE', label: 'Intermédiaire', color: '#FFD700', bg: '#FFD70020' },
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
  const [customDifficulty, setCustomDifficulty] = useState<Difficulty | null>(null);
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
    setSelectedCategories((prev) => [...prev, { name, difficulty: customDifficulty ?? 'INTERMEDIAIRE' }]);
    setCustomCategory('');
    setCustomDifficulty(null);
    setError(null);
  };

  const addCustomCategory = () => {
    const trimmed = customCategory.trim();
    if (!trimmed || !customDifficulty) return;

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
    setCustomDifficulty(null);
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
      <SafeScreen>
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#00D39720] flex items-center justify-center mb-4">
              <Sparkles size={40} color="#00D397" />
            </div>
            <p className="text-txt font-semibold">Vérification...</p>
          </div>
        </div>
      </SafeScreen>
    );
  }

  // Team picker step
  if (currentStep === 'team') {
    return (
      <SafeScreen>
        {/* Header */}
        <div className="bg-bg pt-6 pb-4 px-4 border-b border-line sticky top-0 z-10">
          <div className="flex flex-row items-center">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mr-3 hover:bg-surface-2 transition-colors"
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </button>
            <div className="flex-1">
              <p className="text-txt font-bold text-xl">Choisir ton équipe</p>
              <p className="text-txt-60 text-xs mt-0.5">Sélectionne l'équipe que tu veux rejoindre</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-4 pt-6 flex flex-col gap-4">
          {sessionTeams.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <p className="text-txt-60">Aucune équipe disponible</p>
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
                  className="bg-surface border border-line rounded-3xl overflow-hidden"
                  style={{ borderColor: team.color ? `40` : "var(--line)" }}
                >
                  <div
                    className="h-2 w-full"
                    style={{ backgroundColor: team.color ?? "var(--surface-2)" }}
                  />
                  <div className="p-5 flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center flex-1">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mr-4"
                        style={{ backgroundColor: team.color ? `25` : "var(--surface-2)" }}
                      >
                        <Target size={22} color={team.color ?? '#FFFFFF'} />
                      </div>
                      <div>
                        <p className="text-txt font-bold text-lg">{team.name}</p>
                        <p className="text-txt-60 text-sm">
                          {team.members.length} membre{team.members.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div
                      className="px-4 py-2 rounded-xl"
                      style={{ backgroundColor: team.color ? `20` : "var(--surface-2)" }}
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
              <p className="text-txt-60 text-sm mt-2">Connexion...</p>
            </div>
          )}
        </div>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      {/* Header */}
      <div className="bg-bg pt-6 pb-4 px-4 border-b border-line sticky top-0 z-10">
        <div className="flex flex-row items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors shrink-0"
          >
            <ArrowLeft size={20} className="text-txt" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-txt font-bold text-lg">
              {isEditMode ? `Catégories de ${playerName || 'joueur'}` : 'Choisis tes catégories'}
            </p>
            <p className="text-accent text-xs font-semibold mt-0.5">
              {selectedCategories.length} / {maxCategories} sélectionnées · l&apos;IA génère tes questions
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto pb-10 flex flex-col gap-[18px] px-4 pt-4">
        {/* Progress bar */}
        <div className="bg-surface rounded-2xl p-3.5 border border-line">
          <div className="flex flex-row items-center justify-between mb-2 text-[13px]">
            <span className="text-txt-60">Progression</span>
            <span className="text-accent font-bold">
              {selectedCategories.length}/{maxCategories}
            </span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${(selectedCategories.length / maxCategories) * 100}%` }}
            />
          </div>
        </div>

        {/* Selected Categories */}
        {selectedCategories.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Check size={14} className="text-accent" />
              <p className="text-txt-40 text-[10px] font-bold tracking-widest uppercase">Sélectionnées</p>
            </div>
            <div className="flex flex-col gap-2">
              {selectedCategories.map((category) => {
                const catInfo = PREDEFINED_CATEGORIES.find((c) => c.name === category.name);
                return (
                  <div
                    key={category.name}
                    className="bg-surface rounded-2xl p-3 border border-line flex items-center gap-2.5 animate-[rise_0.3s_both]"
                  >
                    <div
                      className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[17px] shrink-0"
                      style={{ backgroundColor: `${catInfo?.color ?? '#9B59B6'}30` }}
                    >
                      {catInfo?.emoji ?? '✨'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-txt font-bold text-sm">{category.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {DIFFICULTIES.map((diff) => (
                          <button
                            key={diff.value}
                            type="button"
                            onClick={() => updateDifficulty(category.name, diff.value)}
                            className="px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-colors"
                            style={{
                              backgroundColor: category.difficulty === diff.value ? diff.color : 'var(--surface-2)',
                              color: category.difficulty === diff.value ? '#11112a' : 'var(--txt-60)',
                            }}
                          >
                            {diff.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCategory(category.name)}
                      className="w-[30px] h-[30px] rounded-lg bg-buzz/18 text-buzz flex items-center justify-center hover:bg-buzz/25 transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Predefined grid */}
        <div>
          <p className="text-host text-[10px] font-bold tracking-widest uppercase mb-2.5">
            Catégories populaires
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PREDEFINED_CATEGORIES.map((cat) => {
              const isSelected = !!selectedCategories.find((c) => c.name === cat.name);
              const disabled = !isSelected && !canAddMore;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => toggleCategory(cat.name)}
                  disabled={disabled}
                  className={`flex items-center gap-2 p-3 rounded-[14px] text-left transition-all border-[1.5px] ${
                    disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${cat.color}28` : 'var(--surface)',
                    borderColor: isSelected ? cat.color : 'var(--line)',
                  }}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-txt font-semibold text-[13.5px] flex-1">{cat.name}</span>
                  {isSelected && <Check size={16} style={{ color: cat.color }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Category */}
        <div>
          <p className="text-host text-[10px] font-bold tracking-widest uppercase mb-2.5">
            Catégorie sur mesure
          </p>
          <div className="bg-surface rounded-2xl border border-line p-3.5">
            <textarea
              value={customCategory}
              onChange={(e) => handleCustomCategoryChange(e.target.value)}
              placeholder="Ex: Marvel, années 90, histoire de France…"
              rows={2}
              className={`w-full bg-bg rounded-xl px-3.5 py-3 text-txt text-sm font-medium border outline-none resize-none transition-colors focus:border-accent ${
                error ? 'border-buzz' : 'border-line'
              }`}
            />

            {showDropdown && customCategory.trim().length >= 2 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {isSearching ? (
                  <div className="w-full py-2 flex justify-center">
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    {searchResults.map((result) => (
                      <button
                        key={result}
                        type="button"
                        onClick={() => selectSuggestion(result)}
                        className="px-2.5 py-1 rounded-full bg-bg border border-line text-txt text-xs hover:bg-surface-2 transition-colors"
                      >
                        {result}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={addCustomCategory}
                      className="px-2.5 py-1 rounded-full bg-bg border border-line text-host text-xs hover:bg-surface-2 transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Utiliser &quot;{customCategory.trim()}&quot;
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-2.5">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.value}
                  type="button"
                  onClick={() => setCustomDifficulty(diff.value)}
                  className="px-2.5 py-1.5 rounded-lg text-[11.5px] font-bold border transition-colors"
                  style={{
                    backgroundColor: customDifficulty === diff.value ? diff.color : 'var(--bg)',
                    borderColor: customDifficulty === diff.value ? diff.color : 'var(--line)',
                    color: customDifficulty === diff.value ? '#11112a' : 'var(--txt-60)',
                  }}
                >
                  {diff.label}
                </button>
              ))}
              <button
                type="button"
                onClick={addCustomCategory}
                disabled={!customCategory.trim() || !customDifficulty || !canAddMore}
                className={`w-[38px] h-[38px] rounded-[11px] flex items-center justify-center ml-auto transition-colors ${
                  customCategory.trim() && customDifficulty && canAddMore
                    ? 'bg-accent text-btn-fg hover:bg-accent-d'
                    : 'bg-surface-2 text-txt-40 cursor-not-allowed'
                }`}
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-buzz/10 rounded-2xl p-3.5 border border-buzz/30 flex flex-row items-center gap-3">
            <AlertCircle size={18} className="text-buzz shrink-0" />
            <p className="text-buzz-h text-sm flex-1 font-medium">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || selectedCategories.length === 0 || isJoining}
          className={`w-full rounded-2xl py-4 px-6 flex flex-row items-center justify-center gap-2 transition-colors ${
            isSubmitting || selectedCategories.length === 0 || isJoining
              ? 'bg-surface-2 cursor-not-allowed'
              : 'bg-accent hover:bg-accent-d'
          }`}
        >
          {isSubmitting || isJoining ? (
            <>
              <div className="w-5 h-5 border-2 border-btn-fg border-t-transparent rounded-full animate-spin" />
              <span className="text-txt font-bold text-lg">
                {isEditMode ? 'Enregistrement...' : 'Connexion...'}
              </span>
            </>
          ) : (
            <>
              <span className={`font-bold text-lg ${selectedCategories.length > 0 ? 'text-btn-fg' : 'text-txt-40'}`}>
                {isEditMode ? 'Enregistrer' : 'Rejoindre la session'}
              </span>
              <ChevronRight size={22} className={selectedCategories.length > 0 ? 'text-btn-fg' : 'text-txt-40'} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </SafeScreen>
  );
}
