'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Save } from 'lucide-react';
import { useAuthStore } from '~/stores/useAuthStore';
import { useMutation } from '@tanstack/react-query';
import * as usersApi from '~/lib/api/users';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Spinner } from '~/components/loading/Spinner';

// ──────────────────────────────────────────────
// Avatar config
// ──────────────────────────────────────────────

const AVATAR_STYLES = [
  { id: 'adventurer', label: 'Aventurier' },
  { id: 'avataaars', label: 'Cartoon' },
  { id: 'bottts', label: 'Robot' },
  { id: 'fun-emoji', label: 'Emoji' },
  { id: 'pixel-art', label: 'Pixel' },
];

const AVATAR_SEEDS = [
  'Felix', 'Luna', 'Oscar', 'Zara', 'Max',
  'Aria', 'Leo', 'Nova', 'Sam', 'Kira',
  'Rio', 'Mia', 'Ace', 'Ivy', 'Axel',
  'Zoe', 'Rex', 'Nora', 'Jay', 'Jade',
  'Kai', 'Lena', 'Dex', 'Lyra',
];

function getAvatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
}

// ──────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────

export default function EditProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');

  // Parse current avatar style/seed from avatarUrl if it comes from DiceBear
  const parseCurrentAvatar = () => {
    if (!user?.avatarUrl) return { style: 'adventurer', seed: 'Felix' };
    const match = user.avatarUrl.match(/dicebear\.com\/[\d.]+\/([^/]+)\/svg\?seed=(.+)/);
    if (match) return { style: match[1], seed: match[2] };
    return { style: 'adventurer', seed: 'Felix' };
  };

  const initial = parseCurrentAvatar();
  const [selectedStyle, setSelectedStyle] = useState(initial.style);
  const [selectedSeed, setSelectedSeed] = useState(initial.seed);

  const previewUrl = getAvatarUrl(selectedStyle, selectedSeed);
  const hasChanges =
    username.trim() !== (user?.username || '') ||
    email.trim() !== (user?.email || '') ||
    selectedStyle !== initial.style ||
    selectedSeed !== initial.seed;

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // Update profile info (username + email)
      const updated = await usersApi.updateProfile({
        username: username.trim(),
        email: email.trim() || undefined,
      });
      // Update avatar if user exists
      if (user?.id) {
        const withAvatar = await usersApi.updateAvatar(user.id, selectedStyle, selectedSeed);
        return withAvatar;
      }
      return updated;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      router.back();
    },
  });

  if (!user) return null;

  return (
    <SafeScreen>
      <div className="flex flex-col min-h-screen bg-[#1E1A3A]">
        {/* Header */}
        <div className="flex flex-row items-center px-4 pt-12 pb-4 bg-[#292349] border-b border-[#3E3666]">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[#342D5B] flex items-center justify-center mr-3 hover:bg-[#3E3666] transition-colors"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </button>
          <p className="text-white font-bold text-xl flex-1">Modifier le profil</p>
          <button
            onClick={() => updateProfileMutation.mutate()}
            disabled={updateProfileMutation.isPending || !username.trim() || !hasChanges}
            className="flex flex-row items-center gap-2 px-4 py-2 rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: hasChanges && username.trim() ? 'linear-gradient(to right, #6366F1, #8B5CF6)' : '#3E3666' }}
          >
            {updateProfileMutation.isPending ? (
              <Spinner />
            ) : (
              <>
                <Save size={16} color="#fff" />
                <span className="text-white text-sm font-semibold">Sauvegarder</span>
              </>
            )}
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Avatar preview */}
          <div className="flex flex-col items-center py-8">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#6366F1] shadow-lg shadow-indigo-500/30 mb-2">
              <img
                src={previewUrl}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-white/50 text-xs mt-1">{selectedStyle} · {selectedSeed}</p>
          </div>

          {/* Style selector */}
          <div className="px-4 mb-6">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Style</p>
            <div className="flex flex-row gap-2 flex-wrap">
              {AVATAR_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    selectedStyle === style.id
                      ? 'text-white border border-[#6366F1]'
                      : 'text-white/60 bg-[#342D5B] border border-[#3E3666] hover:border-[#6366F1]/50'
                  }`}
                  style={selectedStyle === style.id ? { background: 'linear-gradient(to right, #6366F140, #8B5CF640)' } : {}}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Seed / avatar grid */}
          <div className="px-4 mb-8">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Choisir un avatar</p>
            <div className="grid grid-cols-6 gap-3">
              {AVATAR_SEEDS.map((seed) => {
                const isSelected = selectedSeed === seed;
                return (
                  <button
                    key={seed}
                    onClick={() => setSelectedSeed(seed)}
                    className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-[#6366F1] shadow-md shadow-indigo-500/40' : 'border-[#3E3666] hover:border-[#6366F1]/50'
                    }`}
                    style={{ aspectRatio: '1' }}
                  >
                    <img
                      src={getAvatarUrl(selectedStyle, seed)}
                      alt={seed}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#6366F140]">
                        <div className="w-6 h-6 rounded-full bg-[#6366F1] flex items-center justify-center">
                          <Check size={14} color="#fff" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info fields */}
          <div className="px-4 mb-10">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Informations</p>
            <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] overflow-hidden">
              {/* Username */}
              <div className="px-4 pt-4 pb-3 border-b border-[#3E3666]">
                <p className="text-white/50 text-xs mb-1.5">Nom d&apos;utilisateur</p>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent text-white text-base font-medium focus:outline-none placeholder:text-white/30"
                  placeholder="Votre pseudo"
                  autoCapitalize="none"
                />
              </div>
              {/* Email */}
              <div className="px-4 pt-3 pb-4">
                <p className="text-white/50 text-xs mb-1.5">Email</p>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full bg-transparent text-white text-base font-medium focus:outline-none placeholder:text-white/30"
                  placeholder="votre@email.com"
                  autoCapitalize="none"
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {updateProfileMutation.isError && (
            <div className="mx-4 mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm text-center">
                Une erreur est survenue. Veuillez réessayer.
              </p>
            </div>
          )}
        </div>
      </div>
    </SafeScreen>
  );
}
