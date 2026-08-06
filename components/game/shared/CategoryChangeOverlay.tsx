'use client';

import { useEffect, useRef, useState } from 'react';
import { Layers } from 'lucide-react';
import type { QuestionResponse } from '~/types/api';

interface CategoryChangeOverlayProps {
  currentQuestion: QuestionResponse | null;
}

export function CategoryChangeOverlay({ currentQuestion }: CategoryChangeOverlayProps) {
  const [showCategoryOverlay, setShowCategoryOverlay] = useState(false);
  const prevCategoryRef = useRef<string | null>(null);
  const categoryOverlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!currentQuestion?.category) return;
    const prev = prevCategoryRef.current;
    prevCategoryRef.current = currentQuestion.category;
    if (prev === null) return;
    if (prev === currentQuestion.category) return;

    setShowCategoryOverlay(true);
    if (categoryOverlayTimeoutRef.current) clearTimeout(categoryOverlayTimeoutRef.current);
    categoryOverlayTimeoutRef.current = setTimeout(() => setShowCategoryOverlay(false), 2500);
  }, [currentQuestion?.category]);

  useEffect(() => {
    return () => {
      if (categoryOverlayTimeoutRef.current) clearTimeout(categoryOverlayTimeoutRef.current);
    };
  }, []);

  if (!showCategoryOverlay || !currentQuestion) return null;

  return (
    <div className="fixed inset-0 z-40 bg-team/90 flex items-center justify-center">
      <div className="flex flex-col items-center px-6 animate-in zoom-in-95 duration-300">
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-4">
          <Layers size={48} color="var(--indigo)" />
        </div>
        <p className="text-txt-60 text-base font-semibold uppercase tracking-widest mb-2">
          Nouvelle catégorie
        </p>
        <p className="text-txt font-bold text-4xl text-center">
          {currentQuestion.category}
        </p>
      </div>
    </div>
  );
}
