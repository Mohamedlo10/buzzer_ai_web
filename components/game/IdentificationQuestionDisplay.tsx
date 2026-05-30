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
    <div className="bg-[#342D5B] rounded-2xl border border-[#3E3666] overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <p className="text-[#00D397] text-[10px] font-bold tracking-widest uppercase">
          {category} — Identification
        </p>
        {text && (
          <p className="text-white text-base font-medium mt-1">{text}</p>
        )}
      </div>

      <div className="relative w-full" style={{ minHeight: 200 }}>
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#292349]">
            <div className="w-8 h-8 border-2 border-[#00D397] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 bg-[#292349]">
            <ImageOff size={36} className="text-white/30" />
            <span className="text-white/30 text-sm">Image indisponible</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Question d'identification"
            className={`w-full object-cover max-h-56 transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            onError={() => { setError(true); setLoaded(true); }}
          />
        )}
      </div>
    </div>
  );
}
