/**
 * Marque Xalaat — losange géométrique inspiré des motifs tissés.
 * Deux losanges concentriques + un point central : terracotta / or.
 *
 * Les couleurs suivent `currentColor` par défaut pour s'adapter au support
 * (posée sur une pastille terracotta, on passe `color`/`accent` en crème).
 */
interface XalaatMarkProps {
  size?: number;
  /** Couleur du losange extérieur et du point. Défaut : terracotta du thème. */
  color?: string;
  /** Couleur du losange intérieur. Défaut : or du thème. */
  accent?: string;
  className?: string;
}

export function XalaatMark({
  size = 36,
  color = 'var(--primary)',
  accent = 'var(--gold-bright)',
  className,
}: XalaatMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className={className}
      style={{ display: 'block' }}
      role="img"
      aria-label="Xalaat"
    >
      <path d="M18 2 L34 18 L18 34 L2 18 Z" fill={color} />
      <path d="M18 8 L28 18 L18 28 L8 18 Z" fill={accent} opacity="0.85" />
      <circle cx="18" cy="18" r="3" fill={color} />
    </svg>
  );
}

/**
 * Logo complet : la marque dans sa pastille + le mot-clé « Xalaat » et la
 * signature « Quiz by MouhaDev », qui reste visible partout où le nom
 * apparaît.
 */
export function XalaatLogo({
  size = 40,
  showTagline = true,
  className = '',
}: {
  size?: number;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-row items-center ${className}`}>
      <div
        className="rounded-xl mr-3 flex items-center justify-center shrink-0 bg-accent"
        style={{ width: size, height: size }}
      >
        <XalaatMark size={size * 0.55} color="var(--primary-ink)" accent="var(--gold-bright)" />
      </div>
      <div>
        <p className="text-txt font-display font-bold text-lg leading-tight tracking-[-0.02em]">
          Xalaat
        </p>
        {showTagline && (
          <p className="text-accent text-[10px] font-bold uppercase tracking-[0.18em]">
            Quiz by MouhaDev
          </p>
        )}
      </div>
    </div>
  );
}
