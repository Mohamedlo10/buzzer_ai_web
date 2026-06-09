'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
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
        className="w-full max-w-md bg-surface border border-line rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-line shrink-0">
          <h2 className="text-txt font-bold text-xl text-center">Choisissez votre avatar</h2>
          <p className="text-txt-60 text-sm text-center mt-1">Personnalisez votre profil avant de commencer</p>
        </div>

        <div className="overflow-y-auto flex-grow" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {/* Preview */}
          <div className="flex flex-col items-center py-6">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-4 shadow-lg border-accent"
              style={{ boxShadow: '0 0 20px rgba(0,211,151,0.3)' }}
            >
              <img src={previewUrl} alt="Aperçu avatar" className="w-full h-full object-cover" />
            </div>
            <p className="text-txt-60 text-xs mt-2">{selectedStyle} · {selectedSeed}</p>
          </div>

          {/* Style selector */}
          <div className="mb-6">
            <p className="text-txt-60 text-xs font-semibold uppercase tracking-wider mb-3 px-4">Style</p>
            <div className="flex flex-row gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
              {AVATAR_STYLES.map((style) => {
                const isActive = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className="flex flex-col items-center flex-shrink-0 transition-all cursor-pointer"
                  >
                    <div
                      className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all mb-1.5 ${
                        isActive
                          ? 'border-accent shadow-md shadow-accent/20 bg-accent/10'
                          : 'border-line bg-surface-2'
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
                        isActive ? 'text-accent' : 'text-txt-60'
                      }`}
                    >
                      {style.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seed selector (Grid representation like profile edit page) */}
          <div className="px-4 mb-6">
            <p className="text-txt-60 text-xs font-semibold uppercase tracking-wider mb-3">Choisir une variante</p>
            <div className="grid grid-cols-6 gap-2.5">
              {AVATAR_SEEDS.map((seed) => {
                const isSelected = selectedSeed === seed;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setSelectedSeed(seed)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-accent shadow-md shadow-accent/20'
                        : 'border-line hover:border-accent/50'
                    }`}
                    style={{ aspectRatio: '1' }}
                  >
                    <img
                      src={getAvatarUrl(selectedStyle, seed)}
                      alt={seed}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-accent/20">
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <Check size={11} className="text-btn-fg" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-6 pt-3 border-t border-line shrink-0 bg-surface">
          <button
            type="button"
            onClick={() => onComplete(selectedStyle, selectedSeed)}
            className="w-full py-4 rounded-2xl font-bold text-lg text-btn-fg bg-accent shadow-[0_0_15px_rgba(0,211,151,0.3)] transition-opacity hover:opacity-90 cursor-pointer"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}
