// xalaat-hub-mobile.jsx — "Mes salons" home hub: rooms, solo training, rank.
// Reuses Xalaat shared tokens/components (theme, type, Avatar, PatternLozenge…).

function HubProgressBar({ t, pct, color }) {
  return (
    <div style={{ height: 6, background: t.surface2, borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
    </div>
  );
}

function XalaatHubMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated' ? '0 12px 28px -10px rgba(26,20,16,0.18), 0 2px 6px rgba(26,20,16,0.05)' : 'none';
  const cardBorder = cardStyle === 'outlined' ? `1px solid ${t.line}` : 'none';
  const cardRadius = cardStyle === 'sharp' ? 8 : 22;

  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><PatternLozenge color={t.primary} opacity={0.05} size={26} /></div>

      {/* Top bar */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name="Momo Diallo" hue={30} size={36} ring={t.accent} />
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkSoft }}>Xalaat</div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 15, letterSpacing: '-0.01em' }}>Hub des salons</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: 'grid', placeItems: 'center', fontSize: 14 }}>🔔</div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'auto', padding: '10px 20px 0' }}>
        {/* Greeting */}
        <div style={{ margin: '8px 0 18px' }}>
          <h1 style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
            Contente de te revoir, <span style={{ color: t.primary }}>Momo</span>
          </h1>
          <p style={{ fontSize: 13.5, color: t.inkSoft, lineHeight: 1.4, margin: 0 }}>Tes buzzers sont prêts. Prêt à tester ta stratégie ?</p>
        </div>

        {/* New room / Join code */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div style={{ background: t.primary, color: t.primaryInk, borderRadius: cardRadius, padding: '20px 16px', boxShadow: cardShadow, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><PatternZigzag color={t.primaryInk} opacity={0.15} size={18} /></div>
            <div style={{ position: 'relative', width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.2)', display: 'grid', placeItems: 'center', fontSize: 18, marginBottom: 26 }}>+</div>
            <div style={{ position: 'relative', fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 16, letterSpacing: '-0.01em' }}>Nouveau salon</div>
          </div>
          <div style={{ background: t.surface, color: t.ink, border: `1px solid ${t.line}`, borderRadius: cardRadius, padding: '20px 16px', boxShadow: cardShadow }}>
            <div style={{ width: 34, height: 34, borderRadius: 999, border: `1.5px solid ${t.line}`, display: 'grid', placeItems: 'center', fontSize: 15, marginBottom: 26, color: t.primary }}>→</div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 16, letterSpacing: '-0.01em' }}>Code d'accès</div>
          </div>
        </div>

        {/* Solo mode banner */}
        <div style={{ position: 'relative', overflow: 'hidden', background: t.secondary, color: '#fff', borderRadius: cardRadius, padding: 18, boxShadow: cardShadow, marginBottom: 22 }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.6 }}><PatternLozenge color={t.accent} opacity={0.2} size={22} /></div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.accent, fontWeight: 700, marginBottom: 8 }}>◆ Mode solo</div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 21, letterSpacing: '-0.015em', marginBottom: 8 }}>Entraînement & carrière</div>
            <p style={{ fontSize: 13, lineHeight: 1.45, opacity: 0.82, margin: '0 0 16px', maxWidth: 260 }}>Défie l'IA, progresse sur 12 niveaux et gagne des xalaat-points.</p>
            <div style={{ background: t.accent, color: t.ink, borderRadius: 999, padding: '12px 0', textAlign: 'center', fontSize: 13.5, fontWeight: 700 }}>Jouer en solo →</div>
          </div>
        </div>

        {/* Your rooms */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 18, letterSpacing: '-0.015em' }}>Tes salons</div>
          <div style={{ fontSize: 12, color: t.inkSoft }}>Voir tout</div>
        </div>
        <div style={{ background: t.surface, borderRadius: cardRadius, border: cardBorder || `1px solid ${t.line}`, boxShadow: cardShadow, padding: 16, marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${t.accent}22`, display: 'grid', placeItems: 'center', fontSize: 17 }}>📁</div>
            <span style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkSoft, padding: '4px 10px', borderRadius: 999, background: t.surface2, fontWeight: 700 }}>Salon</span>
          </div>
          <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 17, letterSpacing: '-0.01em', marginBottom: 4 }}>Les buzzeurs de 36A</div>
          <div style={{ fontSize: 12.5, color: t.inkSoft, marginBottom: 14 }}>Actif il y a 43 j</div>
          <div style={{ height: 1, background: t.line, marginBottom: 14 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex' }}>
              {[{ n: 'Binta Sy', h: 60 }, { n: 'Alioune Ba', h: 30 }].map((p, i) => (
                <span key={i} style={{ marginLeft: i ? -8 : 0 }}><Avatar name={p.n} hue={p.h} size={26} ring={t.surface} /></span>
              ))}
              <span style={{ marginLeft: -8, width: 26, height: 26, borderRadius: '50%', background: t.surface2, border: `2px solid ${t.surface}`, display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 700, color: t.inkSoft }}>+33</span>
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: t.inkSoft }}>35 membres</span>
          </div>
        </div>

        {/* Global rank */}
        <div style={{ background: t.ink, color: t.bg, borderRadius: cardRadius, padding: '26px 20px', textAlign: 'center', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}><PatternLozenge color={t.accent} opacity={0.2} size={20} /></div>
          <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 12px', borderRadius: '50%', border: `3px solid ${t.accent}55`, display: 'grid', placeItems: 'center' }}>
            <div style={{ width: 78, height: 78, borderRadius: '50%', border: `3px solid ${t.accent}`, display: 'grid', placeItems: 'center' }}>
              <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 20, letterSpacing: '-0.01em', color: t.accent }}>#154</div>
            </div>
          </div>
          <div style={{ position: 'relative', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 4 }}>Classement mondial</div>
          <div style={{ position: 'relative', fontFamily: type.accent, fontStyle: 'italic', fontSize: 15 }}>Top 1% des joueurs</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 24 }}>
          <div style={{ background: t.surface, borderRadius: cardRadius, border: cardBorder || `1px solid ${t.line}`, boxShadow: cardShadow, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${t.accent}22`, display: 'grid', placeItems: 'center', fontSize: 14 }}>🏆</div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkSoft }}>Catégorie forte</div>
                <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 14.5 }}>Histoire du Sénégal</div>
              </div>
            </div>
            <HubProgressBar t={t} pct={82} color={t.primary} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: t.inkSoft, marginTop: 8 }}>
              <span>Précision</span><span style={{ color: t.primary, fontWeight: 700 }}>82%</span>
            </div>
          </div>
          <div style={{ background: t.surface, borderRadius: cardRadius, border: cardBorder || `1px solid ${t.line}`, boxShadow: cardShadow, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${t.secondary}22`, display: 'grid', placeItems: 'center', fontSize: 14 }}>⚡</div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkSoft }}>Facteur vitesse</div>
                <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 14.5 }}>Rapide</div>
              </div>
            </div>
            <HubProgressBar t={t} pct={68} color={t.secondary} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: t.inkSoft, marginTop: 8 }}>
              <span>Temps de réponse</span><span style={{ color: t.secondary, fontWeight: 700 }}>1.4s moy.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-around', padding: '10px 12px 22px', background: t.surface, borderTop: `1px solid ${t.line}` }}>
        {[{ ic: '◆', l: 'Accueil', on: true }, { ic: '▦', l: 'Salons' }, { ic: '★', l: 'Classement' }, { ic: '◯', l: 'Amis' }, { ic: '●', l: 'Profil' }].map((tab, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: tab.on ? t.primary : t.inkSoft, fontSize: 9.5, fontWeight: 600 }}>
            <div style={{ fontSize: 17 }}>{tab.ic}</div>{tab.l}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { XalaatHubMobile });

// ─── Join-room modal overlay on top of the hub ────────────────────────
function XalaatJoinModalMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardRadius = cardStyle === 'sharp' ? 8 : 22;
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(1.5px)', opacity: 0.5 }}>
        <XalaatHubMobile theme={theme} type={type} motion="off" cardStyle={cardStyle} />
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,15,10,0.55)' }} />
      <div style={{ position: 'absolute', left: 20, right: 20, top: '50%', transform: 'translateY(-50%)', background: t.surface, borderRadius: cardRadius, border: `1px solid ${t.line}`, boxShadow: '0 30px 60px -20px rgba(26,20,16,0.4)', padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 19, letterSpacing: '-0.01em' }}>Rejoindre</div>
          <div style={{ width: 28, height: 28, borderRadius: 999, background: t.surface2, display: 'grid', placeItems: 'center', fontSize: 13 }}>✕</div>
        </div>
        <div style={{ fontSize: 12.5, color: t.inkSoft, lineHeight: 1.5, marginBottom: 18 }}>Entre le code de la partie (6 chiffres) ou de la salle permanente pour la rejoindre.</div>
        <label style={{ fontSize: 12, fontWeight: 700, color: t.ink, display: 'block', marginBottom: 8 }}>Code secret</label>
        <input placeholder="Ex : ABC123" style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: `1px solid ${t.line}`, background: t.bg, color: t.ink, fontSize: 15, fontFamily: type.display, letterSpacing: '0.1em', marginBottom: 16, outline: 'none', boxSizing: 'border-box' }} />
        <button style={{ width: '100%', padding: '14px 18px', borderRadius: 999, background: t.surface2, color: t.inkSoft, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'default', marginBottom: 10 }}>Rejoindre</button>
        <div style={{ textAlign: 'center', fontSize: 13, color: t.primary, fontWeight: 700 }}>▦ Scanner un QR code</div>
      </div>
    </div>
  );
}

Object.assign(window, { XalaatJoinModalMobile });
