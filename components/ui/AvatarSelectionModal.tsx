'use client';

import { useState } from 'react';
import { AVATAR_STYLES, AVATAR_SEEDS, getAvatarUrl } from '~/lib/utils/avatar';

interface AvatarSelectionModalProps {
  open: boolean;
  defaultStyle?: string;
  defaultSeed?: string;
  onComplete: (style: string, seed: string) => void;
}

export function AvatarSelectionModal({
  open,
  defaultStyle = 'adventurer',
  defaultSeed = 'Felix',
  onComplete,
}: AvatarSelectionModalProps) {
  const [selectedStyle, setSelectedStyle] = useState(defaultStyle);
  const [selectedSeed, setSelectedSeed] = useState(defaultSeed);

  if (!open) return null;

  const previewUrl = getAvatarUrl(selectedStyle, selectedSeed);

  return (
    <div className="fixed inset-0 bg-scrim flex items-end justify-center z-[100] backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-md bg-surface border border-line rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-line">
          <h2 className="text-txt font-bold text-xl text-center">Choisissez votre avatar</h2>
          <p className="text-txt-60 text-sm text-center mt-1">Personnalisez votre profil avant de commencer</p>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {/* Preview */}
          <div className="flex flex-col items-center py-6">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-4 shadow-lg"
              style={{ borderColor: '#00D397', boxShadow: '0 0 20px rgba(0,211,151,0.3)' }}
            >
              <img src={previewUrl} alt="Aperçu avatar" className="w-full h-full object-cover" />
            </div>
            <p className="text-txt-60 text-xs mt-2">{selectedStyle} · {selectedSeed}</p>
          </div>

          {/* Style selector */}
          <div className="px-4 mb-5">
            <p className="text-txt-60 text-xs font-semibold uppercase tracking-wider mb-3">Style</p>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStyle(s.id)}
                  className={`flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer ${
                    selectedStyle === s.id
                      ? 'border-accent bg-accent/10'
                      : 'border-line bg-surface-2 hover:border-accent/50'
                  }`}
                >
                  <span className="text-xl mb-0.5">{s.emoji}</span>
                  <span className="text-txt text-[10px] font-medium leading-tight text-center line-clamp-1">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Seed selector */}
          <div className="px-4 mb-6">
            <p className="text-txt-60 text-xs font-semibold uppercase tracking-wider mb-3">Variante</p>
            <div className="flex flex-wrap gap-2">
              {AVATAR_SEEDS.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setSelectedSeed(seed)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                    selectedSeed === seed
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line bg-surface-2 text-txt-60 hover:border-accent/50'
                  }`}
                >
                  {seed}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-6 pt-3 border-t border-line">
          <button
            type="button"
            onClick={() => onComplete(selectedStyle, selectedSeed)}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-buzz shadow-[0_0_15px_rgba(213,68,47,0.4)] transition-opacity hover:opacity-90 cursor-pointer"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
