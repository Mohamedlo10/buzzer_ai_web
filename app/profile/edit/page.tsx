'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Save, Pencil } from 'lucide-react';
import { useAuthStore } from '~/stores/useAuthStore';
import { useMutation } from '@tanstack/react-query';
import * as usersApi from '~/lib/api/users';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';
import { AVATAR_STYLES, AVATAR_SEEDS, getAvatarUrl } from '~/lib/utils/avatar';

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function EditProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const paramStyle = searchParams.get('style') || '';
  const paramSeed  = searchParams.get('seed')  || '';

  // Extract user's current avatar style & seed if available
  const parsedFromUrl = (() => {
    if (!user?.avatarUrl) return { style: null, seed: null };
    try {
      const match = user.avatarUrl.match(/dicebear\.com\/[^/]+\/([^/]+)\/svg\?seed=([^&]+)/);
      if (match) {
        return { style: match[1], seed: decodeURIComponent(match[2]) };
      }
    } catch {
      /* ignore */
    }
    return { style: null, seed: null };
  })();

  const rawStyle = user?.avatarStyle || parsedFromUrl.style || paramStyle;
  const initialStyle = AVATAR_STYLES.some((s) => s.id === rawStyle) ? rawStyle : 'adventurer';

  const initialSeed = user?.avatarSeed || parsedFromUrl.seed || paramSeed || user?.username || 'Felix';

  const seeds = AVATAR_SEEDS.includes(initialSeed)
    ? AVATAR_SEEDS
    : [initialSeed, ...AVATAR_SEEDS];

  const [selectedStyle, setSelectedStyle] = useState(initialStyle);
  const [selectedSeed,  setSelectedSeed]  = useState(initialSeed);
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const previewUrl = getAvatarUrl(selectedStyle, selectedSeed);
  const hasChanges =
    username.trim() !== (user?.username || '') ||
    email.trim()    !== (user?.email || '') ||
    selectedStyle   !== initialStyle ||
    selectedSeed    !== initialSeed;

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      setErrorMsg(null);
      let updated = await usersApi.updateProfile({
        username: username.trim(),
        email: email.trim(),
      });
      if (user?.id) {
        const withAvatar = await usersApi.updateAvatar(user.id, selectedStyle, selectedSeed);
        updated = withAvatar;
      }
      return updated;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      router.back();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Une erreur est survenue lors de la modification du profil.';
      setErrorMsg(msg);
    },
  });

  if (!user) return null;

  return (
    <SafeScreen>
      <div className="flex flex-col min-h-screen bg-bg">
        {/* Header */}
        <div className="flex flex-row items-center px-4 pt-12 pb-4 bg-bg border-b border-line">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mr-3 hover:bg-surface-2 transition-colors text-txt"
          >
            <ArrowLeft size={20} />
          </button>
          <p className="text-txt font-bold text-xl flex-1">Modifier le profil</p>
          <button
            onClick={() => updateProfileMutation.mutate()}
            disabled={updateProfileMutation.isPending || !username.trim() || !hasChanges}
            className={`flex flex-row items-center gap-2 px-4 py-2 rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${
              hasChanges && username.trim()
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500'
                : 'bg-surface-2'
            }`}
          >
            {updateProfileMutation.isPending ? (
              <Spinner />
            ) : (
              <>
                <Save size={16} className="text-white" />
                <span className="text-txt text-sm font-semibold">Sauvegarder</span>
              </>
            )}
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Avatar preview */}
          <div className="flex flex-col items-center py-6">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-team shadow-lg shadow-indigo-500/30 mb-2">
                <img src={previewUrl} alt="Avatar preview" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarPicker((prev) => !prev)}
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-accent text-btn-fg border-2 border-bg flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer"
                title="Modifier l'avatar"
              >
                <Pencil size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAvatarPicker((prev) => !prev)}
              className="px-3.5 py-1.5 rounded-full bg-surface-2 border border-line text-txt-60 hover:text-txt font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer mt-1"
            >
              <Pencil size={13} className="text-accent" />
              <span>{showAvatarPicker ? "Masquer les avatars" : "Modifier l'avatar"}</span>
            </button>
          </div>

          {/* Style & Avatar Grid — Hidden by default until clicking pencil button */}
          {showAvatarPicker && (
            <div className="animate-[fadein_.2s_ease-out_both] border-y border-line bg-surface/50 py-4 mb-6">
              {/* Style selector */}
              <div className="mb-6">
                <p className="text-txt-60 text-xs font-semibold uppercase tracking-wider mb-3 px-4">Style</p>
                <div className="flex flex-row gap-3 overflow-x-auto px-4 pb-2 scrollbar-none">
                  {AVATAR_STYLES.map((style) => {
                    const isActive = selectedStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className="flex flex-col items-center flex-shrink-0 transition-all"
                      >
                        <div
                          className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all mb-1.5 ${
                            isActive ? 'border-indigo-500 shadow-md shadow-indigo-500/40 bg-indigo-500/10' : 'border-line bg-surface'
                          }`}
                        >
                          <img
                            src={getAvatarUrl(style.id, selectedSeed)}
                            alt={style.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span
                          className={`text-[10px] font-semibold text-center leading-tight max-w-[64px] ${
                            isActive ? 'text-team' : 'text-txt-60'
                          }`}
                        >
                          {style.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seed / avatar grid */}
              <div className="px-4">
                <p className="text-txt-60 text-xs font-semibold uppercase tracking-wider mb-3">Choisir un avatar</p>
                <div className="grid grid-cols-6 gap-3">
                  {seeds.map((seed) => {
                    const isSelected = selectedSeed === seed;
                    return (
                      <button
                        key={seed}
                        onClick={() => setSelectedSeed(seed)}
                        className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                          isSelected
                            ? 'border-team shadow-md shadow-indigo-500/40'
                            : 'border-line hover:border-team/50'
                        }`}
                        style={{ aspectRatio: '1' }}
                      >
                        <img
                          src={getAvatarUrl(selectedStyle, seed)}
                          alt={seed}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-team/25">
                            <div className="w-6 h-6 rounded-full bg-team flex items-center justify-center">
                              <Check size={14} color="#fff" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Info fields */}
          <div className="px-4 mb-10">
            <p className="text-txt-60 text-xs font-semibold uppercase tracking-wider mb-3">Informations</p>
            <div className="bg-surface rounded-2xl border border-line overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-line">
                <p className="text-txt-60 text-xs mb-1.5">Nom d&apos;utilisateur</p>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent text-txt text-base font-medium focus:outline-none placeholder:text-txt-40"
                  placeholder="Votre pseudo"
                  autoCapitalize="none"
                />
              </div>
              <div className="px-4 pt-3 pb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-txt-60 text-xs">Adresse Email</p>
                  {user.emailVerified ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-good/15 text-good">
                      Email confirmé ✓
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bad/15 text-bad">
                      Non confirmé
                    </span>
                  )}
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-txt text-base font-medium focus:outline-none placeholder:text-txt-40"
                  placeholder="votre.email@exemple.com"
                  autoCapitalize="none"
                />
                <p className="text-txt-40 text-[11px] mt-1.5 leading-snug">
                  En modifiant ton adresse email, un lien de confirmation te sera automatiquement envoyé et ton statut passera en non confirmé.
                </p>
              </div>
            </div>
          </div>

          {(errorMsg || updateProfileMutation.isError) && (
            <div className="mx-4 mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm text-center">
                {errorMsg || 'Une erreur est survenue. Veuillez réessayer.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </SafeScreen>
  );
}
