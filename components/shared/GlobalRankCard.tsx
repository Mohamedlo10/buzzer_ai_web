'use client';

import { useRouter } from 'next/navigation';
import { PatternLozenge } from './PatternLozenge';

/**
 * Carte « Classement mondial » — pastille de rang sur fond encre.
 *
 * Partagée entre le hub multijoueur et l'accueil (sous « Top de la semaine »).
 * Cliquable : mène au classement complet.
 */
interface GlobalRankCardProps {
  rank: number;
  /** Ligne en serif italique sous le libellé. */
  caption?: string;
  style?: React.CSSProperties;
}

export function GlobalRankCard({ rank, caption = 'Top 1% des joueurs', style }: GlobalRankCardProps) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push('/rankings')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push('/rankings');
        }
      }}
      style={{
        background: 'var(--color-ink)',
        color: 'var(--color-bg)',
        borderRadius: 'var(--card-radius)',
        padding: '24px 20px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }}>
        <PatternLozenge color="var(--color-accent)" opacity={0.2} size={20} />
      </div>

      <div
        style={{
          position: 'relative',
          width: 88,
          height: 88,
          margin: '0 auto 12px',
          borderRadius: '50%',
          border: '3px solid rgba(232, 166, 48, 0.35)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            border: '3px solid var(--color-accent)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 'var(--font-display-weight)' as any,
              fontSize: 18,
              letterSpacing: '-0.01em',
              color: 'var(--color-accent)',
            }}
          >
            #{rank}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          opacity: 0.6,
          marginBottom: 4,
        }}
      >
        Classement mondial
      </div>
      <div style={{ position: 'relative', fontFamily: 'var(--font-accent)', fontStyle: 'italic', fontSize: 14 }}>
        {caption}
      </div>
    </div>
  );
}
