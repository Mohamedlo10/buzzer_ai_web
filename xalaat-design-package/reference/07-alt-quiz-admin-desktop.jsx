// xalaat-mobile-screens.jsx — mobile-first quiz + regie screens.
// Companions to xalaat-mobile.jsx (accueil) and xalaat-buzzer.jsx (BuzzDisc, Avatar via shared).

const ORD = (i) => (i === 0 ? '1er' : `${i + 1}e`);

function MobileTopBar({ t, type, left, right }) {
  return (
    <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 10px' }}>
      {left}
      {right}
    </div>
  );
}

// ═══ Quiz — question in play ══════════════════════════════════════════
function XalaatQuizPlayingMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated' ? '0 12px 28px -10px rgba(26,20,16,0.18)' : 'none';
  const cardRadius = cardStyle === 'sharp' ? 8 : 20;

  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><PatternLozenge color={t.primary} opacity={0.06} size={26} /></div>

      <MobileTopBar t={t} type={type}
        left={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: 'grid', placeItems: 'center', fontSize: 14 }}>←</div>
          <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 14, letterSpacing: '-0.01em' }}>Lutte sénégalaise</div>
        </div>}
        right={<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: t.ink, color: t.bg, fontFamily: type.display, fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>⏱ 00:14</div>}
      />

      <div style={{ position: 'relative', zIndex: 2, padding: '4px 20px 0', display: 'flex', gap: 5 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < 3 ? t.primary : i === 3 ? t.accent : t.line }} />
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'auto', padding: '18px 20px 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, fontSize: 11, color: t.inkSoft, marginBottom: 14 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent, animation: motion !== 'off' ? 'xqm-pulse 1.4s ease-in-out infinite' : 'none' }} />
          Question 4 / 10
        </div>

        <h1 style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 26, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '0 0 20px', textWrap: 'balance' }}>
          <TypewriterText text="Qui a remporté le combat du siècle au Sénégal en 2002 ?" speed={30} motion={motion} />
        </h1>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, marginBottom: 22 }}>
          <BuzzDisc t={t} type={type} motion={motion} size={168} label="BUZZ" />
        </div>

        <div style={{ background: t.surface, borderRadius: cardRadius, border: `1px solid ${t.line}`, boxShadow: cardShadow, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkSoft, fontWeight: 700, marginBottom: 10 }}>
            <span>En course</span>
            <span style={{ color: t.primary }}>4 joueurs</span>
          </div>
          {[
            { name: 'Modou Fall', hue: 60, pct: 72, status: 'buzze dans 2s' },
            { name: 'Awa Diop', hue: 350, pct: 45, status: 'réfléchit' },
            { name: 'Cheikh Sarr', hue: 200, pct: 18, status: 'lit la question' },
          ].map((p, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < arr.length - 1 ? `1px solid ${t.line}` : 'none' }}>
              <Avatar name={p.name} hue={p.hue} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{p.name}</div>
                <div style={{ height: 3, background: t.surface2, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${p.pct}%`, height: '100%', background: t.primary }} />
                </div>
              </div>
              <div style={{ fontSize: 10, color: t.inkSoft, fontFamily: type.accent, fontStyle: 'italic', whiteSpace: 'nowrap' }}>{p.status}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes xqm-pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

// ═══ Quiz — answer feedback ═══════════════════════════════════════════
function XalaatQuizFeedbackMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const good = '#2D8559';
  const cardShadow = cardStyle === 'elevated' ? '0 12px 28px -10px rgba(26,20,16,0.16)' : 'none';
  const cardRadius = cardStyle === 'sharp' ? 8 : 20;

  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}><PatternLozenge color={good} opacity={0.08} size={24} /></div>
      <MobileTopBar t={t} type={type}
        left={<div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 14 }}>Lutte sénégalaise</div>}
        right={<div style={{ padding: '6px 12px', borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, fontSize: 11, color: t.inkSoft }}>4 / 10</div>}
      />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'auto', padding: '10px 20px 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 10px', borderRadius: 999, background: good, color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', marginBottom: 18 }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800 }}>✓</span>
          BONNE RÉPONSE !
        </div>

        <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 52, lineHeight: 0.95, letterSpacing: '-0.03em', color: good, marginBottom: 4 }}>+280</div>
        <div style={{ fontFamily: type.accent, fontStyle: 'italic', fontSize: 20, color: t.inkSoft, marginBottom: 16 }}>points en poche</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ padding: '6px 11px', borderRadius: 999, background: t.accent, color: t.ink, fontSize: 11.5, fontWeight: 700 }}>⚡ +120 VITESSE</span>
          <span style={{ padding: '6px 11px', borderRadius: 999, background: t.surface, color: t.ink, border: `1px solid ${t.line}`, fontSize: 11.5, fontWeight: 700 }}>🔥 SÉRIE x4</span>
        </div>

        <div style={{ background: t.surface, borderRadius: cardRadius, border: `1px solid ${t.line}`, padding: 18, boxShadow: cardShadow, marginBottom: 20 }}>
          <div style={{ fontFamily: type.accent, fontStyle: 'italic', fontSize: 13, color: t.primary, marginBottom: 8 }}>Saviez-vous que…</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.5, color: t.ink, margin: 0 }}>
            <strong>Bombardier</strong> a battu Tyson le 27 juillet 2002 à Dakar, un combat suivi par plus de 50 000 spectateurs au stade Demba Diop.
          </p>
        </div>

        <button style={{ width: '100%', background: t.primary, color: t.primaryInk, border: 'none', borderRadius: 999, padding: '16px 22px', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'default', boxShadow: `0 12px 26px -10px ${t.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          Question suivante →
        </button>
      </div>
    </div>
  );
}

// ═══ Quiz — final results ═════════════════════════════════════════════
function XalaatQuizResultsMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated' ? '0 12px 28px -10px rgba(26,20,16,0.16)' : 'none';
  const cardRadius = cardStyle === 'sharp' ? 8 : 18;

  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><PatternLozenge color={t.primary} opacity={0.07} size={26} /></div>
      <MobileTopBar t={t} type={type}
        left={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><XalaatMark size={22} color={t.primary} accent={t.accent} /><span style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 15 }}>Xalaat</span></div>}
        right={<div style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${t.line}`, fontSize: 11, color: t.inkSoft }}>✕</div>}
      />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'auto', padding: '6px 20px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: t.primary, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Quiz terminé</div>
        <h1 style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 27, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          <span style={{ fontFamily: type.accent, fontStyle: 'italic', color: t.inkSoft, fontWeight: 400, fontSize: 18 }}>Mashallah, </span>
          tu es <span style={{ color: t.primary }}>borom xalaat</span>.
        </h1>
        <p style={{ fontSize: 13, color: t.inkSoft, margin: '0 0 24px' }}>Top 8% des joueurs cette semaine.</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginBottom: 26 }}>
          <div style={{ position: 'relative', width: 84, height: 84 }}>
            <svg width="84" height="84" viewBox="0 0 160 160">
              <path d="M80 8 L152 80 L80 152 L8 80 Z" fill={t.accent} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: type.display, fontWeight: 700, fontSize: 13, color: t.ink }}>OR</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: t.inkSoft, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Score final</div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 56, lineHeight: 1, letterSpacing: '-0.03em' }}><AnimatedCounter to={2840} motion={motion} duration={1600} /></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18, textAlign: 'left' }}>
          {[
            { n: 8, total: 10, label: 'Bonnes réponses', color: t.primary },
            { n: 6, label: 'Série max 🔥', color: t.accent },
            { n: 4, label: 'Bonus vitesse ⚡', color: t.secondary },
            { n: '3m 42s', label: 'Temps total', color: t.ink, raw: true },
          ].map((s, i) => (
            <div key={i} style={{ background: t.surface, borderRadius: cardRadius, padding: 14, border: `1px solid ${t.line}`, boxShadow: cardShadow }}>
              <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 24, color: s.color, letterSpacing: '-0.02em' }}>
                {s.raw ? s.n : <AnimatedCounter to={s.n} motion={motion} />}{s.total && <span style={{ fontSize: 14, color: t.inkSoft }}>/{s.total}</span>}
              </div>
              <div style={{ fontSize: 11.5, color: t.inkSoft, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: t.ink, color: t.bg, borderRadius: cardRadius, padding: 16, display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.25 }}><PatternLozenge color={t.accent} opacity={0.2} size={18} /></div>
          <div style={{ position: 'relative', width: 44, height: 44, flex: '0 0 auto' }}>
            <svg width="44" height="44" viewBox="0 0 64 64"><path d="M32 4 L60 32 L32 60 L4 32 Z" fill={t.accent} /></svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 17 }}>🤼</div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 9.5, color: t.accent, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>★ Badge débloqué</div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 16 }}>Lamb dëkk-dëkk</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button style={{ background: t.primary, color: t.primaryInk, border: 'none', padding: '15px 20px', borderRadius: 999, fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>↻ Rejouer ce thème</button>
          <button style={{ background: t.surface2, color: t.ink, border: 'none', padding: '15px 20px', borderRadius: 999, fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'default' }}>✨ Nouveau thème IA</button>
          <button style={{ background: 'transparent', color: t.ink, border: `1.5px solid ${t.line}`, padding: '15px 20px', borderRadius: 999, fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit', cursor: 'default' }}>🎯 Défier un ami</button>
        </div>
      </div>
    </div>
  );
}

// ═══ Régie admin — phone ═════════════════════════════════════════════
function XalaatAdminMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardRadius = cardStyle === 'sharp' ? 8 : 18;
  const cardShadow = cardStyle === 'elevated' ? '0 12px 28px -10px rgba(26,20,16,0.16)' : 'none';
  const queue = [
    { name: 'Modou Fall', hue: 30, delta: 0.00 },
    { name: 'Awa Diop', hue: 60, delta: 0.41 },
    { name: 'Cheikh Sarr', hue: 205, delta: 0.88 },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4 }}><PatternLozenge color={t.primary} opacity={0.06} size={26} /></div>

      <MobileTopBar t={t} type={type}
        left={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D14A2E', animation: motion !== 'off' ? 'xam-pulse 1.3s ease-in-out infinite' : 'none' }} />
          <div>
            <div style={{ fontSize: 9.5, color: t.inkSoft, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Régie · en direct</div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 13 }}>Soirée Tabaski</div>
          </div>
        </div>}
        right={<div style={{ display: 'flex', gap: 6 }}>
          <span style={{ padding: '5px 10px', borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, fontSize: 12, fontFamily: type.display, fontWeight: 700, color: t.primary, letterSpacing: '0.1em' }}>7B2K</span>
          <span style={{ padding: '5px 10px', borderRadius: 999, background: t.ink, color: t.bg, fontSize: 12, fontFamily: type.display, fontWeight: 700 }}>⏱14</span>
        </div>}
      />

      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'auto', padding: '10px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 7px', borderRadius: 999, background: t.primary, color: t.primaryInk, fontSize: 11.5, fontWeight: 700 }}>
            <span style={{ width: 17, height: 17, borderRadius: 5, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.2)', fontSize: 9.5, fontWeight: 800 }}>04</span>
            Q4 / 10
          </span>
          <span style={{ fontSize: 11, color: t.inkSoft }}>🔊 lis à voix haute</span>
        </div>

        <h1 style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 21, lineHeight: 1.15, letterSpacing: '-0.015em', margin: '0 0 14px' }}>
          Qui a remporté le combat du siècle au Sénégal en 2002 ?
        </h1>

        <div style={{ background: t.surface, borderRadius: cardRadius, border: `1px solid ${t.line}`, boxShadow: cardShadow, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkSoft, fontWeight: 700, marginBottom: 8 }}>Réponse correcte · masquée à l'écran</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: '#2D8559', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: type.display, fontWeight: 700, fontSize: 12 }}>B</span>
            <span style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 19 }}>Bombardier</span>
          </div>
        </div>

        <div style={{ background: t.surface, borderRadius: cardRadius, border: `1px solid ${t.line}`, boxShadow: cardShadow, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 15, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#D14A2E', animation: motion !== 'off' ? 'xam-pulse 1.3s ease-in-out infinite' : 'none' }} />
              File de buzz
            </div>
            <span style={{ fontSize: 11, color: t.inkSoft, fontWeight: 600 }}>4 ont buzzé</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {queue.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: i === 0 ? '10px 12px' : '8px 10px', borderRadius: cardRadius === 8 ? 6 : 12, background: i === 0 ? t.primary : t.surface2, color: i === 0 ? t.primaryInk : t.ink }}>
                <div style={{ width: i === 0 ? 30 : 26, height: i === 0 ? 30 : 26, borderRadius: 8, background: i === 0 ? 'rgba(255,255,255,0.18)' : t.surface, display: 'grid', placeItems: 'center', fontFamily: type.display, fontWeight: 700, fontSize: 12 }}>{ORD(i)}</div>
                <Avatar name={p.name} hue={p.hue} size={24} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums', opacity: 0.85 }}>{i === 0 ? '0.00s' : `+${p.delta.toFixed(2)}s`}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.line}` }}>
            <div style={{ fontSize: 11.5, color: t.inkSoft, marginBottom: 9 }}><strong style={{ color: t.ink }}>Modou Fall</strong> répond — juge :</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ flex: 1, padding: '12px 10px', borderRadius: 999, background: '#2D8559', color: '#fff', border: 'none', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, cursor: 'default' }}>✓ Bonne +200</button>
              <button style={{ flex: 1, padding: '12px 10px', borderRadius: 999, background: 'transparent', color: t.ink, border: `1.5px solid ${t.line}`, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'default' }}>✗ Refuser</button>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkSoft, fontWeight: 700, marginBottom: 9 }}>Contrôles régie</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button style={{ padding: '11px 16px', borderRadius: 999, background: t.ink, color: t.bg, border: 'none', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, cursor: 'default' }}>🔒 Verrouiller</button>
          <button style={{ padding: '11px 16px', borderRadius: 999, background: 'transparent', color: t.ink, border: `1.5px solid ${t.line}`, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'default' }}>↺ Réinitialiser</button>
          <button style={{ padding: '11px 16px', borderRadius: 999, background: 'transparent', color: t.ink, border: `1.5px solid ${t.line}`, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, cursor: 'default' }}>👁 Révéler</button>
        </div>
        <button style={{ marginTop: 10, width: '100%', padding: '14px 20px', borderRadius: 999, background: t.primary, color: t.primaryInk, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'default', boxShadow: `0 12px 26px -10px ${t.primary}` }}>Question suivante →</button>
      </div>
      <style>{`@keyframes xam-pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

Object.assign(window, { XalaatQuizPlayingMobile, XalaatQuizFeedbackMobile, XalaatQuizResultsMobile, XalaatAdminMobile });
