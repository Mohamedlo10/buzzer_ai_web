// xalaat-buzzer.jsx — in-person buzzer game.
// Each "partie" has an ADMINISTRATEUR who reads the question aloud to the
// people around them; players BUZZ; the screen shows who buzzed and in
// which ORDER. Three artboards: admin console, projection screen, phone.

// ─── helpers ─────────────────────────────────────────────────────────
const ORDINAL = (i) => (i === 0 ? '1er' : `${i + 1}e`);

// Shared sample state for one live question
const BUZZ_QUEUE = [
  { name: 'Modou Fall', hue: 30, delta: 0.00 },
  { name: 'Awa Diop', hue: 60, delta: 0.41 },
  { name: 'Cheikh Sarr', hue: 205, delta: 0.88 },
  { name: 'Fatou Ndiaye', hue: 350, delta: 1.32 },
];
const STILL_READY = [
  { name: 'Ndeye Gueye', hue: 140 },
  { name: 'Pape Diouf', hue: 95 },
  { name: 'Sokhna Ba', hue: 320 },
  { name: 'Ibou Sané', hue: 250 },
];

// ─── Buzz disc (mobile + small) ──────────────────────────────────────
function BuzzDisc({ t, type, motion, size = 200, color, ink, label = 'BUZZ', disabled = false }) {
  const c = disabled ? t.line : (color || t.primary);
  const inkC = disabled ? t.inkSoft : (ink || t.primaryInk);
  return (
    <div style={{ position: 'relative', width: size + 56, height: size + 56, display: 'grid', placeItems: 'center' }}>
      {!disabled && motion !== 'off' && (
        <>
          <span style={{ position: 'absolute', width: size + 56, height: size + 56, borderRadius: '50%', background: c, opacity: 0.16, animation: 'xbz-halo 1.7s ease-out infinite' }} />
          <span style={{ position: 'absolute', width: size + 56, height: size + 56, borderRadius: '50%', background: c, opacity: 0.12, animation: 'xbz-halo 1.7s ease-out infinite', animationDelay: '0.55s' }} />
        </>
      )}
      <span style={{ position: 'absolute', width: size + 24, height: size + 24, borderRadius: '50%', background: c, opacity: 0.2 }} />
      <button style={{
        position: 'relative', width: size, height: size, borderRadius: '50%',
        background: c, color: inkC, border: 'none', cursor: 'default',
        boxShadow: disabled ? 'none' : `0 16px 36px -8px ${c}90, 0 5px 0 ${c}70, inset 0 -8px 0 rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,0.28)`,
        fontFamily: type.display, fontWeight: 700, letterSpacing: '0.04em',
        animation: (!disabled && motion !== 'off') ? 'xbz-press 1.5s ease-in-out infinite' : 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        <svg width={size * 0.3} height={size * 0.3} viewBox="0 0 80 80" style={{ opacity: 0.9 }}>
          <path d="M40 6 L74 40 L40 74 L6 40 Z" fill="none" stroke={inkC} strokeOpacity="0.4" strokeWidth="2.5" />
          <path d="M40 24 L56 40 L40 56 L24 40 Z" fill={inkC} fillOpacity="0.95" />
        </svg>
        <div style={{ fontSize: size * 0.15, lineHeight: 1, marginTop: 4 }}>{label}</div>
      </button>
    </div>
  );
}

// ─── A single row in the buzz queue ──────────────────────────────────
function QueueRow({ t, type, p, i, cardRadius, leader = false }) {
  const place = ORDINAL(i);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: leader ? '16px 16px' : '12px 14px',
      borderRadius: cardRadius,
      background: leader ? t.primary : t.surface,
      color: leader ? t.primaryInk : t.ink,
      border: leader ? 'none' : `1px solid ${t.line}`,
      boxShadow: leader ? `0 14px 30px -12px ${t.primary}` : 'none',
    }}>
      <div style={{
        width: leader ? 48 : 38, height: leader ? 48 : 38, borderRadius: cardRadius === 6 ? 6 : 12,
        background: leader ? 'rgba(255,255,255,0.18)' : t.surface2,
        color: leader ? t.primaryInk : t.inkSoft,
        display: 'grid', placeItems: 'center',
        fontFamily: type.display, fontWeight: 700,
        fontSize: leader ? 18 : 14, flex: '0 0 auto', letterSpacing: '-0.01em',
      }}>{place}</div>
      <Avatar name={p.name} hue={p.hue} size={leader ? 40 : 32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: leader ? 18 : 15, fontWeight: 700, fontFamily: type.display, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        {leader && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 1 }}>a buzzé en premier · à lui de répondre</div>}
      </div>
      <div style={{
        fontFamily: type.display, fontWeight: 700, fontSize: leader ? 18 : 14,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
        color: leader ? t.primaryInk : t.inkSoft, flex: '0 0 auto',
      }}>{i === 0 ? '0.00s' : `+${p.delta.toFixed(2)}s`}</div>
    </div>
  );
}

// ═══ SCREEN 1 — Admin console ════════════════════════════════════════
function XalaatAdmin({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardRadius = cardStyle === 'sharp' ? 6 : 18;
  const cardShadow = cardStyle === 'elevated' ? '0 20px 44px -18px rgba(26,20,16,0.18)' : 'none';

  return (
    <div style={{ width: 1280, minHeight: 920, background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
        <PatternLozenge color={t.primary} opacity={0.06} size={30} />
      </div>

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 36px', borderBottom: `1px solid ${t.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <XalaatMark size={28} color={t.primary} accent={t.accent} />
          <div>
            <div style={{ fontSize: 11, color: t.inkSoft, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D14A2E', animation: motion !== 'off' ? 'xbz-pulse 1.3s ease-in-out infinite' : 'none' }} />
              Partie en direct · Régie admin
            </div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 19, letterSpacing: '-0.015em' }}>Soirée Tabaski — Lutte sénégalaise</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: t.surface, border: `1px solid ${t.line}` }}>
            <span style={{ fontSize: 11, color: t.inkSoft, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Code</span>
            <span style={{ fontFamily: type.display, fontWeight: 700, fontSize: 16, letterSpacing: '0.14em', color: t.primary }}>7B2K</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: t.surface, border: `1px solid ${t.line}` }}>
            <span style={{ display: 'flex' }}>
              {STILL_READY.slice(0, 3).map((p, i) => (
                <span key={i} style={{ marginLeft: i ? -8 : 0 }}><Avatar name={p.name} hue={p.hue} size={24} ring={t.surface} /></span>
              ))}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>12 connectés</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: t.ink, color: t.bg, fontFamily: type.display, fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
            ⏱ 00:14
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1.32fr 1fr', gap: 36, padding: '28px 36px 36px', alignItems: 'start' }}>
        {/* LEFT — the question the admin reads aloud */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px 6px 8px', borderRadius: 999, background: t.primary, color: t.primaryInk, fontSize: 13, fontWeight: 700, letterSpacing: '0.03em' }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 800 }}>04</span>
              QUESTION 4 / 10
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 999, background: `${t.accent}22`, border: `1px dashed ${t.accent}77`, fontSize: 12.5, color: t.ink, fontWeight: 600 }}>
              🔊 Lis la question à voix haute
            </span>
          </div>

          <h1 style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 50, lineHeight: 1.06, letterSpacing: '-0.025em', margin: '0 0 24px', textWrap: 'balance', color: t.ink }}>
            Qui a remporté le combat du siècle au Sénégal en 2002 ?
          </h1>

          {/* Answer — visible to admin only */}
          <div style={{ background: t.surface, borderRadius: cardRadius, border: `1px solid ${t.line}`, boxShadow: cardShadow, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkSoft, fontWeight: 700 }}>Réponse correcte</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.inkSoft, padding: '4px 10px', borderRadius: 999, background: t.surface2 }}>
                👁 visible admin · masquée à l'écran
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: '#2D8559', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: type.display, fontWeight: 700, fontSize: 14 }}>B</span>
              <span style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 26, letterSpacing: '-0.02em' }}>Bombardier</span>
              <span style={{ fontSize: 13, color: t.inkSoft, fontFamily: type.accent, fontStyle: 'italic', marginLeft: 4 }}>· 27 juillet 2002, stade Demba Diop</span>
            </div>
          </div>

          {/* Admin controls */}
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkSoft, fontWeight: 700, marginBottom: 10 }}>Contrôles régie</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 20px', borderRadius: 999, background: t.ink, color: t.bg, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'default' }}>
              🔒 Verrouiller les buzz
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 20px', borderRadius: 999, background: 'transparent', color: t.ink, border: `1.5px solid ${t.line}`, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'default' }}>
              ↺ Réinitialiser la file
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 20px', borderRadius: 999, background: 'transparent', color: t.ink, border: `1.5px solid ${t.line}`, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'default' }}>
              👁 Révéler la réponse à l'écran
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 22px', borderRadius: 999, background: t.primary, color: t.primaryInk, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'default', boxShadow: `0 12px 26px -10px ${t.primary}` }}>
              Question suivante →
            </button>
          </div>
        </div>

        {/* RIGHT — the buzz queue */}
        <div style={{ background: t.surface, borderRadius: cardStyle === 'sharp' ? 8 : 24, border: `1px solid ${t.line}`, boxShadow: cardShadow, padding: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, opacity: 0.08, pointerEvents: 'none' }}>
            <svg width="160" height="160" viewBox="0 0 160 160"><path d="M80 8 L152 80 L80 152 L8 80 Z" fill="none" stroke={t.primary} strokeWidth="2" /><path d="M80 36 L124 80 L80 124 L36 80 Z" fill={t.accent} fillOpacity="0.4" /></svg>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 20, letterSpacing: '-0.015em', display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#D14A2E', animation: motion !== 'off' ? 'xbz-pulse 1.3s ease-in-out infinite' : 'none' }} />
              File de buzz
            </div>
            <span style={{ fontSize: 12, color: t.inkSoft, fontWeight: 600 }}>4 ont buzzé</span>
          </div>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {BUZZ_QUEUE.map((p, i) => (
              <QueueRow key={i} t={t} type={type} p={p} i={i} cardRadius={cardRadius} leader={i === 0} />
            ))}
          </div>

          {/* Judge the first answer */}
          <div style={{ position: 'relative', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.line}` }}>
            <div style={{ fontSize: 12, color: t.inkSoft, marginBottom: 10 }}>
              <strong style={{ color: t.ink, fontWeight: 700 }}>Modou Fall</strong> répond à voix haute — juge sa réponse :
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 16px', borderRadius: 999, background: '#2D8559', color: '#fff', border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'default' }}>
                ✓ Bonne réponse +200
              </button>
              <button style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 16px', borderRadius: 999, background: 'transparent', color: t.ink, border: `1.5px solid ${t.line}`, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'default' }}>
                ✗ Refuser · au 2e
              </button>
            </div>
            {/* Penalty — buzzed before the question was fully read */}
            <button style={{ marginTop: 10, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderRadius: 999, background: `${t.primary}14`, color: t.primary, border: `1.5px dashed ${t.primary}66`, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: 'default' }}>
              ⏱ Buzz anticipé — a répondu avant la fin · −50 pts
            </button>
          </div>

          {/* Still ready */}
          <div style={{ position: 'relative', marginTop: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'flex' }}>
              {STILL_READY.map((p, i) => (
                <span key={i} style={{ marginLeft: i ? -8 : 0 }}><Avatar name={p.name} hue={p.hue} size={26} ring={t.surface} /></span>
              ))}
            </span>
            <span style={{ fontSize: 12.5, color: t.inkSoft }}>8 prêts à buzzer · pas encore</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes xbz-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes xbz-press { 0%,100% { transform: scale(1); } 50% { transform: scale(1.035); } }
        @keyframes xbz-halo { 0% { transform: scale(0.85); opacity: 0.3; } 100% { transform: scale(1.35); opacity: 0; } }
      `}</style>
    </div>
  );
}

// ═══ SCREEN 2 — Projection (the shared big screen) ═══════════════════
function XalaatProjection({ theme, type, motion }) {
  const t = theme;
  const leader = BUZZ_QUEUE[0];
  const rest = BUZZ_QUEUE.slice(1);
  return (
    <div style={{ width: 1280, minHeight: 860, background: t.ink, color: t.bg, fontFamily: type.body, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
        <PatternLozenge color={t.accent} opacity={0.12} size={34} />
      </div>
      <svg width="900" height="900" viewBox="0 0 900 900" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', opacity: 0.14, pointerEvents: 'none' }}>
        <path d="M450 40 L860 450 L450 860 L40 450 Z" fill="none" stroke={t.accent} strokeWidth="2.5" />
        <path d="M450 160 L740 450 L450 740 L160 450 Z" fill="none" stroke={t.primary} strokeWidth="2.5" />
        <path d="M450 280 L620 450 L450 620 L280 450 Z" fill="none" stroke={t.accent} strokeWidth="2.5" />
      </svg>

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <XalaatMark size={32} color={t.accent} accent={t.primary} />
          <span style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 22, letterSpacing: '-0.02em' }}>Soirée Tabaski</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>Question 4 / 10</span>
          <span style={{ padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', fontFamily: type.display, fontWeight: 700, fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>⏱ 00:14</span>
        </div>
      </div>

      {/* Leader spotlight */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '20px 48px 0' }}>
        <div style={{ fontSize: 16, letterSpacing: '0.28em', textTransform: 'uppercase', color: t.accent, fontWeight: 700, marginBottom: 22 }}>A buzzé en premier</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 28 }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', inset: -14, borderRadius: '50%', background: t.accent, opacity: 0.25, animation: motion !== 'off' ? 'xbz-halo 1.7s ease-out infinite' : 'none' }} />
            <Avatar name={leader.name} hue={leader.hue} size={120} ring={t.accent} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <span style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 96, lineHeight: 0.9, color: t.accent, letterSpacing: '-0.04em' }}>1er</span>
              <span style={{ fontFamily: type.display, fontWeight: 700, fontSize: 30, fontVariantNumeric: 'tabular-nums', opacity: 0.7 }}>0.00s</span>
            </div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 64, letterSpacing: '-0.03em', lineHeight: 1 }}>{leader.name}</div>
            <div style={{ fontSize: 18, opacity: 0.7, marginTop: 8, fontFamily: type.accent, fontStyle: 'italic' }}>à toi de répondre…</div>
          </div>
        </div>
      </div>

      {/* Order queue */}
      <div style={{ position: 'relative', zIndex: 2, marginTop: 44, padding: '0 48px 48px' }}>
        <div style={{ fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.55, textAlign: 'center', marginBottom: 18 }}>Ordre des buzz</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 880, margin: '0 auto' }}>
          {rest.map((p, idx) => {
            const i = idx + 1;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 18, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <span style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 36, color: 'rgba(255,255,255,0.45)', letterSpacing: '-0.02em', width: 52 }}>{ORDINAL(i)}</span>
                <Avatar name={p.name} hue={p.hue} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: type.display, fontWeight: 700, fontSize: 19, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.6, fontVariantNumeric: 'tabular-nums' }}>+{p.delta.toFixed(2)}s</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══ SCREEN 3 — Player phone buzzer ══════════════════════════════════
function XalaatBuzzerPhone({ theme, type, motion, state = 'ready' }) {
  const t = theme;
  const buzzed = state === 'buzzed';
  const myPlace = 1; // index — "2e" (Awa is 2nd to buzz)

  return (
    <div style={{ width: '100%', height: '100%', background: buzzed ? t.primary : t.bg, color: buzzed ? t.primaryInk : t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: buzzed ? 0.18 : 0.5 }}>
        <PatternLozenge color={buzzed ? t.primaryInk : t.primary} opacity={buzzed ? 0.2 : 0.05} size={26} />
      </div>

      {/* header */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <XalaatMark size={24} color={buzzed ? t.primaryInk : t.primary} accent={t.accent} />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>Partie 7B2K</div>
            <div style={{ fontFamily: type.display, fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>Soirée Tabaski</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
          <Avatar name="Awa Diop" hue={60} size={28} ring={buzzed ? t.primaryInk : t.accent} /> Awa
        </div>
      </div>

      {/* main */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 24px' }}>
        {buzzed ? (
          <>
            <div style={{ fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 }}>Tu as buzzé !</div>
            <div style={{ position: 'relative', width: 180, height: 180, display: 'grid', placeItems: 'center' }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(255,255,255,0.16)' }} />
              <div style={{ position: 'relative', textAlign: 'center' }}>
                <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 92, lineHeight: 0.85, letterSpacing: '-0.04em' }}>{ORDINAL(myPlace)}</div>
                <div style={{ fontSize: 14, opacity: 0.85, marginTop: 6 }}>position</div>
              </div>
            </div>
            <div style={{ fontFamily: type.accent, fontStyle: 'italic', fontSize: 17, opacity: 0.9, textAlign: 'center' }}>
              Modou t'a devancé de 0,41s
            </div>
            <div style={{ width: '100%', maxWidth: 280, marginTop: 6, background: 'rgba(255,255,255,0.14)', borderRadius: 16, padding: 12 }}>
              {BUZZ_QUEUE.slice(0, 3).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', opacity: p.name === 'Awa Diop' ? 1 : 0.8 }}>
                  <span style={{ fontFamily: type.display, fontWeight: 700, fontSize: 15, width: 28 }}>{ORDINAL(i)}</span>
                  <Avatar name={p.name} hue={p.hue} size={26} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name === 'Awa Diop' ? 'Toi' : p.name}</span>
                  <span style={{ fontSize: 12, opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>{i === 0 ? '0.00s' : `+${p.delta.toFixed(2)}s`}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.inkSoft, fontWeight: 700, marginBottom: 6 }}>Question 4 / 10</div>
              <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.05 }}>Écoute l'animateur<br />puis buzze vite</div>
            </div>
            <BuzzDisc t={t} type={type} motion={motion} size={200} label="BUZZ" />
            <div style={{ fontSize: 13, color: t.inkSoft, textAlign: 'center', fontFamily: type.accent, fontStyle: 'italic' }}>
              le plus rapide répond en premier
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes xbz-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes xbz-press { 0%,100% { transform: scale(1); } 50% { transform: scale(1.035); } }
        @keyframes xbz-halo { 0% { transform: scale(0.85); opacity: 0.3; } 100% { transform: scale(1.35); opacity: 0; } }
      `}</style>
    </div>
  );
}

// ═══ SCREEN — Player in-game (desktop) ═══════════════════════════════
// The player's own screen: a big highlighted buzzer on the left, and the
// live order of who pressed (ordre d'appui) on the right. The player here
// is Awa Diop — she has just buzzed and sits 2e.
function XalaatPlayer({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardRadius = cardStyle === 'sharp' ? 6 : 18;
  const meName = 'Awa Diop';
  const myIndex = BUZZ_QUEUE.findIndex((p) => p.name === meName); // 1 → "2e"

  return (
    <div style={{ width: 1280, minHeight: 880, background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
        <PatternLozenge color={t.primary} opacity={0.06} size={30} />
      </div>

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: `1px solid ${t.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <XalaatMark size={28} color={t.primary} accent={t.accent} />
          <div>
            <div style={{ fontSize: 11, color: t.inkSoft, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Partie 7B2K · tu joues</div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 19, letterSpacing: '-0.015em' }}>Soirée Tabaski — Lutte sénégalaise</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', gap: 5 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} style={{ width: i < 4 ? 22 : 9, height: 7, borderRadius: 4, background: i < 3 ? t.primary : i === 3 ? t.accent : t.line }} />
            ))}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, fontSize: 13, fontWeight: 700 }}>
            <Avatar name={meName} hue={60} size={24} ring={t.accent} /> Awa · 1 240 pts
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: t.ink, color: t.bg, fontFamily: type.display, fontWeight: 700, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>⏱ 00:14</span>
        </div>
      </div>

      {/* Body: buzzer (left, highlighted) + order (right) */}
      <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 44, padding: '40px 48px 48px', alignItems: 'center' }}>

        {/* LEFT — the highlighted buzzer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: `${t.accent}22`, border: `1px dashed ${t.accent}77`, fontSize: 13, color: t.ink, fontWeight: 600, marginBottom: 14 }}>
              🔊 Écoute l'animateur lire la question
            </div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 34, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
              Dès que tu sais, <span style={{ color: t.primary }}>buzze</span>.
            </div>
          </div>

          <BuzzDisc t={t} type={type} motion={motion} size={300} label="BUZZ" />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 999, background: t.ink, color: t.bg, fontSize: 14, fontWeight: 600 }}>
            <span>Appuie sur</span>
            <kbd style={{ fontFamily: type.display, fontWeight: 700, fontSize: 13, padding: '4px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.18)', letterSpacing: '0.08em' }}>ESPACE</kbd>
            <span>pour buzzer</span>
          </div>
        </div>

        {/* RIGHT — ordre d'appui */}
        <div style={{ background: t.surface, borderRadius: cardStyle === 'sharp' ? 8 : 24, border: `1px solid ${t.line}`, boxShadow: cardStyle === 'elevated' ? '0 20px 44px -18px rgba(26,20,16,0.18)' : 'none', padding: 22, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -34, right: -34, opacity: 0.08, pointerEvents: 'none' }}>
            <svg width="170" height="170" viewBox="0 0 170 170"><path d="M85 8 L162 85 L85 162 L8 85 Z" fill="none" stroke={t.primary} strokeWidth="2" /><path d="M85 40 L130 85 L85 130 L40 85 Z" fill={t.accent} fillOpacity="0.4" /></svg>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 20, letterSpacing: '-0.015em', display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#D14A2E', animation: motion !== 'off' ? 'xbz-pulse 1.3s ease-in-out infinite' : 'none' }} />
              Ordre d'appui
            </div>
            <span style={{ fontSize: 12, color: t.inkSoft, fontWeight: 600 }}>4 ont buzzé</span>
          </div>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {BUZZ_QUEUE.map((p, i) => {
              const me = p.name === meName;
              const leader = i === 0;
              const hl = me ? t.accent : leader ? t.primary : t.surface;
              const fg = me ? t.ink : leader ? t.primaryInk : t.ink;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: me || leader ? '14px 16px' : '11px 14px',
                  borderRadius: cardRadius,
                  background: me || leader ? hl : t.surface,
                  color: fg,
                  border: me || leader ? (me ? `2px solid ${t.ink}` : 'none') : `1px solid ${t.line}`,
                  boxShadow: leader ? `0 14px 30px -12px ${t.primary}` : 'none',
                }}>
                  <div style={{
                    width: me || leader ? 44 : 36, height: me || leader ? 44 : 36,
                    borderRadius: cardRadius === 6 ? 6 : 12,
                    background: me ? 'rgba(0,0,0,0.12)' : leader ? 'rgba(255,255,255,0.18)' : t.surface2,
                    color: fg, display: 'grid', placeItems: 'center',
                    fontFamily: type.display, fontWeight: 700, fontSize: me || leader ? 17 : 14, flex: '0 0 auto',
                  }}>{ORDINAL(i)}</div>
                  <Avatar name={p.name} hue={p.hue} size={me || leader ? 38 : 32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: me || leader ? 17 : 15, fontWeight: 700, fontFamily: type.display, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {me ? 'Toi' : p.name}
                      {me && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 4, background: t.ink, color: t.accent }}>TOI</span>}
                    </div>
                  </div>
                  <div style={{ fontFamily: type.display, fontWeight: 700, fontSize: me || leader ? 16 : 14, fontVariantNumeric: 'tabular-nums', flex: '0 0 auto', opacity: me || leader ? 1 : 0.7 }}>
                    {i === 0 ? '0.00s' : `+${p.delta.toFixed(2)}s`}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ position: 'relative', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.line}`, fontSize: 13, color: t.inkSoft, textAlign: 'center' }}>
            Tu es <strong style={{ color: t.ink, fontWeight: 700 }}>{ORDINAL(myIndex)}</strong> · Modou t'a devancé de 0,41s
          </div>
        </div>
      </div>

      <style>{`
        @keyframes xbz-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes xbz-press { 0%,100% { transform: scale(1); } 50% { transform: scale(1.035); } }
        @keyframes xbz-halo { 0% { transform: scale(0.85); opacity: 0.3; } 100% { transform: scale(1.35); opacity: 0; } }
      `}</style>
    </div>
  );
}

Object.assign(window, { XalaatAdmin, XalaatProjection, XalaatBuzzerPhone, XalaatPlayer, BuzzDisc });
