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
import { Avatar } from '~/components/ui/Avatar';
import { useBuzzStore } from '~/stores/useBuzzStore';
import { useAuthStore } from '~/stores/useAuthStore';
import * as sessionsApi from '~/lib/api/sessions';
import * as categoriesApi from '~/lib/api/categories';
import * as roomsApi from '~/lib/api/rooms';
import { appStorage } from '~/lib/utils/storage';
import type { CategoryRequest, Difficulty, TeamResponse } from '~/types/api';
import { teamColor as resolveTeamColor } from '~/lib/game/teamColors';

const PREDEFINED_CATEGORIES = [
  { name: 'Histoire', emoji: '📜', color: 'var(--gold)' },
  { name: 'Science', emoji: '🔬', color: 'var(--primary)' },
  { name: 'Sports', emoji: '🏆', color: 'var(--bad)' },
  { name: 'Géographie', emoji: '🌍', color: 'var(--indigo)' },
  { name: 'Culture G', emoji: '🌐', color: 'var(--violet)' },
  { name: 'Cinéma', emoji: '🎬', color: 'var(--bad)' },
];

const DIFFICULTIES: { value: Difficulty; label: string; color: string; bg: string }[] = [
  { value: 'FACILE', label: 'Facile', color: 'var(--primary)', bg: 'rgb(var(--primary-rgb) / 0.125)' },
  { value: 'INTERMEDIAIRE', label: 'Intermédiaire', color: 'var(--gold)', bg: 'rgb(var(--gold-rgb) / 0.125)' },
  { value: 'EXPERT', label: 'Expert', color: 'var(--bad)', bg: 'rgb(var(--bad-rgb) / 0.125)' },
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
            setCurrentStep('team');
          } else {
            setCurrentStep('categories');
          }
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
      setError(null);
    } else if (canAddMore) {
      setSelectedCategories((prev) => [
        ...prev,
        { name, difficulty: 'INTERMEDIAIRE' },
      ]);
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

    const exists = selectedCategories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setError(`Catégorie "${trimmed}" déjà sélectionnée`);
      setCustomCategory('');
      return false;
    }

    if (selectedCategories.length >= maxCategories) {
      setError(`Maximum ${maxCategories} catégories permises`);
      return false;
    }

    const difficultyToUse = customDifficulty || 'INTERMEDIAIRE';
    setSelectedCategories((prev) => [
      ...prev,
      { name: trimmed, difficulty: difficultyToUse },
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

    // Déclencheur automatique sur séparateurs (Virgule, Point-virgule, Saut de ligne)
    if (text.includes(',') || text.includes(';') || text.includes('\n')) {
      const parts = text.split(/[,;\n]/);
      for (const part of parts) {
        if (part.trim().length >= 2) {
          commitCustomCategory(part.trim());
        }
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

  const selectSuggestion = (name: string) => {
    commitCustomCategory(name);
  };

  const removeCategory = (name: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c.name !== name));
    setError(null);
  };

  const handleSubmit = async () => {
    // 🛡️ Safety Flow : Si du texte est présent dans le champ lors du clic sur "Continuer",
    // on l'ajoute automatiquement avant la validation de la page !
    let targetList = [...selectedCategories];
    if (customCategory.trim().length >= 2 && targetList.length < maxCategories) {
      const trimmed = customCategory.trim().replace(/[,;\n]/g, '');
      const exists = targetList.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
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
        await joinSession(actualSessionId, targetList, isSpectator === '1', false, selectedTeamId);
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

  if (isCheckingJoined) {
    return (
      <SafeScreen>
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mb-4">
              <Sparkles size={40} color="var(--primary)" />
            </div>
            <p className="text-txt font-semibold">Vérification...</p>
          </div>
        </div>
      </SafeScreen>
    );
  }

  // Team picker step
  if (currentStep === 'team') {
    const sortedTeams = [...sessionTeams].sort((a, b) => b.score - a.score);
    return (
      <SafeScreen className="h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden relative bg-transparent">
        {/* Header */}
        <div className="shrink-0 z-20 bg-bg pt-4 pb-4 px-4 border-b border-line">
          <div className="flex flex-row items-center gap-3">
            <button
              onClick={() => {
                if (isManualMode) {
                  router.back();
                } else {
                  setCurrentStep('categories');
                }
              }}
              className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft size={20} className="text-txt" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-txt font-bold text-lg">Choisis ton équipe</p>
              <p className="text-txt-60 text-xs mt-0.5">Mode équipes · le buzz est partagé entre coéquipiers</p>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4 pt-6 flex flex-col gap-4 pb-28">
          {sortedTeams.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <p className="text-txt-60">Aucune équipe disponible</p>
            </div>
          ) : (
            sortedTeams.map((team) => {
              const isSelected = selectedTeamId === team.id;
              // team.color est un jeton de palette, pas une couleur CSS.
              const teamColor = resolveTeamColor(team.color);
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setSelectedTeamId(team.id)}
                  disabled={isSubmitting}
                  className="rounded-[20px] overflow-hidden transition-all text-left w-full border-[1.5px] p-4 cursor-pointer"
                  style={{
                    backgroundColor: isSelected
                      ? `color-mix(in oklab, ${teamColor} 12%, var(--surface))`
                      : 'var(--surface)',
                    borderColor: isSelected ? teamColor : 'var(--line)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center flex-1">
                      {/* Round team badge */}
                      <div
                        className="w-[46px] h-[46px] rounded-2xl flex items-center justify-center mr-3 shrink-0"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${teamColor} 22%, transparent)`,
                          border: `1.5px solid ${teamColor}`,
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: teamColor }}
                        />
                      </div>
                      <div>
                        <p className="text-txt font-bold text-base">{team.name}</p>
                        <p className="text-txt-60 text-xs">
                          {team.members.length} joueur{team.members.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Selection badge */}
                    {isSelected ? (
                      <div
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: teamColor }}
                      >
                        ✓ Mon équipe
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-2 border border-line text-txt-60 shrink-0">
                        Rejoindre
                      </div>
                    )}
                  </div>

                  {/* Team Members Avatars */}
                  {team.members.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-line/40">
                      <span className="text-txt-40 text-[10px] uppercase font-bold tracking-wider mr-1">Membres :</span>
                      <div className="flex items-center -space-x-2.5">
                        {team.members.map((member) => (
                          <div key={member.id} className="relative rounded-full bg-surface">
                            <Avatar
                              avatarUrl={member.avatarUrl}
                              username={member.name}
                              size={28}
                              borderColor={teamColor}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}

          {error && (
            <div className="bg-buzz/10 rounded-2xl p-3.5 border border-buzz/30 flex flex-row items-center gap-3">
              <AlertCircle size={18} className="text-buzz shrink-0" />
              <p className="text-buzz-h text-sm flex-1 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer selector button */}
        <div className="p-4 border-t border-line bg-bg shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedTeamId || isSubmitting}
            className={`w-full rounded-2xl py-4 px-6 flex flex-row items-center justify-center gap-2 transition-colors ${
              !selectedTeamId || isSubmitting
                ? 'bg-surface-2 cursor-not-allowed text-txt-40'
                : 'bg-accent text-btn-fg hover:bg-accent-d shadow-glow-success'
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-btn-fg border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="font-bold text-lg text-btn-fg">Continuer vers le salon</span>
                <ChevronRight size={22} className="text-btn-fg" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen className="h-[100dvh] max-h-[100dvh] w-full flex flex-col overflow-hidden relative bg-transparent">
      {/* Header */}
      <div className="shrink-0 z-20 bg-bg pt-4 pb-4 px-4 border-b border-line">
        <div className="flex flex-row items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center hover:bg-surface-2 transition-colors shrink-0 cursor-pointer"
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

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y pb-36 flex flex-col gap-[18px] px-4 pt-4">
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
                      style={{ backgroundColor: `${catInfo?.color ?? 'var(--violet)'}30` }}
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
                              color: category.difficulty === diff.value ? '#1A1410' : 'var(--txt-60)',
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-host text-[10px] font-bold tracking-widest uppercase">
              Catégorie sur mesure (saisie libre)
            </p>
            <span className="text-txt-40 text-[10px]">Entrée / Virgule / Clic extérieur</span>
          </div>

          <div className="bg-surface rounded-2xl border border-line p-3.5">
            <div className="flex items-center gap-2 bg-bg rounded-xl px-3.5 py-2.5 border border-line focus-within:border-accent transition-colors">
              <Sparkles size={16} className="text-accent shrink-0" />
              <input
                type="text"
                value={customCategory}
                onChange={(e) => handleCustomCategoryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitCustomCategory();
                  }
                }}
                onBlur={() => {
                  if (customCategory.trim().length >= 2) {
                    commitCustomCategory();
                  }
                }}
                placeholder="Tape ton thème puis 'Entrée' ou ',' (ex: Manga, Histoire, Pop)"
                className="w-full bg-transparent text-txt text-sm font-medium outline-none"
              />
              {customCategory.trim() && (
                <button
                  type="button"
                  onClick={() => commitCustomCategory()}
                  className="px-3 py-1.5 rounded-lg bg-accent text-btn-fg text-xs font-bold shrink-0 hover:bg-accent-d transition-colors cursor-pointer"
                >
                  Ajouter
                </button>
              )}
            </div>

            {showDropdown && customCategory.trim().length >= 2 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5 animate-[fadeIn_0.2s_ease-out]">
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
                        className="px-3 py-1.5 rounded-full bg-surface-2 border border-line text-txt text-xs font-semibold hover:bg-accent/15 hover:border-accent transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={12} className="text-accent" />
                        {result}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
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
          disabled={isSubmitting || (selectedCategories.length === 0 && !customCategory.trim()) || isJoining}
          className={`w-full rounded-2xl py-4 px-6 flex flex-row items-center justify-center gap-2 transition-colors cursor-pointer ${
            isSubmitting || (selectedCategories.length === 0 && !customCategory.trim()) || isJoining
              ? 'bg-surface-2 cursor-not-allowed opacity-60'
              : 'bg-accent hover:bg-accent-d shadow-glow-success'
          }`}
        >
          {isSubmitting || isJoining ? (
            <>
              <div className="w-5 h-5 border-2 border-btn-fg border-t-transparent rounded-full animate-spin" />
              <span className="text-btn-fg font-bold text-lg">
                {isEditMode ? 'Enregistrement...' : 'Connexion...'}
              </span>
            </>
          ) : (
            <>
              <span className={`font-bold text-lg ${selectedCategories.length > 0 || customCategory.trim() ? 'text-btn-fg' : 'text-txt-40'}`}>
                {isEditMode
                  ? `Enregistrer ${selectedCategories.length + (customCategory.trim() ? 1 : 0)} catégorie${selectedCategories.length + (customCategory.trim() ? 1 : 0) > 1 ? 's' : ''}`
                  : (selectedCategories.length === 0 && !customCategory.trim())
                    ? 'Sélectionnez au moins 1 catégorie'
                    : `Continuer avec ${selectedCategories.length + (customCategory.trim() ? 1 : 0)} catégorie${selectedCategories.length + (customCategory.trim() ? 1 : 0) > 1 ? 's' : ''}`}
              </span>
              <ChevronRight size={22} className={selectedCategories.length > 0 || customCategory.trim() ? 'text-btn-fg' : 'text-txt-40'} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </SafeScreen>
  );
}
