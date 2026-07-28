'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';

interface ComingSoonModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  description?: string;
}

export function ComingSoonModal({
  visible,
  onClose,
  title = 'Quiz du jour',
  subtitle = 'Bientôt disponible !',
  description = 'Le Quiz du jour arrive très bientôt avec de nouveaux défis quotidiens, des récompenses exclusives et un classement réinitialisé toutes les 24h ! Restez connecté. 🚀',
}: ComingSoonModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!visible || !mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-surface border border-line p-6 relative flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-line)' }}
      >
        {/* Background decorative glow */}
        <div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 pointer-events-none blur-2xl"
          style={{ background: 'var(--color-primary)' }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full opacity-20 pointer-events-none blur-2xl"
          style={{ background: 'var(--color-accent)' }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-ink-soft)' }}
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        {/* Top Icon Badge */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mt-2 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
            color: '#FFFFFF',
          }}
        >
          <Sparkles size={32} className="animate-pulse" />
        </div>

        {/* Pill Tag */}
        <div
          className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2"
          style={{
            background: 'rgba(232, 166, 48, 0.15)',
            color: 'var(--color-accent)',
            border: '1px solid rgba(232, 166, 48, 0.3)',
          }}
        >
          {subtitle}
        </div>

        {/* Title */}
        <h3
          className="text-2xl font-bold mb-2 tracking-tight"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-ink)',
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: 'var(--color-ink-soft)' }}
        >
          {description}
        </p>

        {/* CTA Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all transform active:scale-95 cursor-pointer shadow-md"
          style={{
            background: 'var(--color-primary)',
            color: 'var(--color-primary-ink, #FFFFFF)',
            border: 'none',
          }}
        >
          Super, j'ai hâte ! 🔥
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
