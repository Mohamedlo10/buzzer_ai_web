'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface IdentificationQuestionDisplayProps {
  imageUrl: string;
  category: string;
  text?: string;
}

export function IdentificationQuestionDisplay({
  imageUrl,
  category,
  text,
}: IdentificationQuestionDisplayProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="bg-surface rounded-2xl border border-line overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <p className="text-accent text-[10px] font-bold tracking-widest uppercase">
          {category} — Identification
        </p>
        {text && <p className="text-txt text-base font-medium mt-1">{text}</p>}
      </div>

      <div className="relative w-full min-h-[200px]">
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 bg-bg">
            <ImageOff size={36} className="text-txt-40" />
            <span className="text-txt-40 text-sm">Image indisponible</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Question d'identification"
            className={`w-full object-cover max-h-56 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setError(true);
              setLoaded(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
