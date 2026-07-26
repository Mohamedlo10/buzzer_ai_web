'use client';

import { useRouter } from 'next/navigation';
import { PatternZigzag } from './PatternZigzag';

/**
 * Carte vedette « Quiz du jour ».
 *
 * Se transforme en « Partie active » dès qu'un salon de l'utilisateur a une
 * session en cours : c'est la même surface, mais l'appel à l'action bascule de
 * « Jouer » (entraînement solo sur le thème du jour) vers « Rejoindre ».
 *
 * Partagée entre l'accueil et le hub multijoueur — d'où les props plutôt qu'un
 * accès direct au store.
 */
export interface ActiveRoomSummary {
  id: string | number;
  name: string;
  ownerName: string;
  memberCount: number;
}

interface QuizOfTheDayCardProps {
  /** Salon avec session en cours, s'il y en a un. */
  activeRoom?: ActiveRoomSummary | null;
  /** Thème mis en avant quand aucune partie n'est active. */
  title?: string;
  subtitle?: string;
  style?: React.CSSProperties;
}

export function QuizOfTheDayCard({
  activeRoom = null,
  title = 'Lutte sénégalaise',
  subtitle = "les années d'or",
  style,
}: QuizOfTheDayCardProps) {
  const router = useRouter();
  const isLive = !!activeRoom;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--color-secondary)',
        color: '#FFFFFF',
        borderRadius: 'var(--card-radius)',
        padding: 18,
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, opacity: 0.7, pointerEvents: 'none' }}>
        <PatternZigzag color="var(--color-accent)" opacity={0.22} size={20} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75 }}>
          {isLive ? 'Partie active' : 'Quiz du jour'}
        </div>

        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--font-display-weight)' as any,
            fontSize: 24,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            margin: '8px 0 14px',
          }}
        >
          {isLive ? activeRoom!.name : title}
          <br />
          <span style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic', fontWeight: 400, opacity: 0.85 }}>
            {isLive ? `Hôte: ${activeRoom!.ownerName}` : subtitle}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.85 }}>
            <span>{isLive ? `${activeRoom!.memberCount} membres` : '10 questions'}</span>·
            <span>{isLive ? 'En direct' : '4 min'}</span>·<span>+1 200 pts max</span>
          </div>
          <button
            type="button"
            onClick={() =>
              isLive
                ? router.push(`/room/${activeRoom!.id}`)
                : router.push(`/solo/training?prompt=${encodeURIComponent(title)}`)
            }
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-ink)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 13,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {isLive ? 'Rejoindre →' : 'Jouer →'}
          </button>
        </div>
      </div>
    </div>
  );
}
