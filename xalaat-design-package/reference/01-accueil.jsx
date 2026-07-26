// xalaat-mobile.jsx — mobile homepage rendered inside IOSDevice.

function XalaatMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated'
    ? '0 12px 28px -10px rgba(26,20,16,0.18), 0 2px 6px rgba(26,20,16,0.05)'
    : 'none';
  const cardBorder = cardStyle === 'outlined' ? `1px solid ${t.line}` : 'none';
  const cardRadius = cardStyle === 'sharp' ? 8 : 22;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: t.bg, color: t.ink,
      fontFamily: type.body, position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
        <PatternLozenge color={t.primary} opacity={0.05} size={26} />
      </div>

      {/* Top bar */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 20px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <XalaatMark size={26} color={t.primary} accent={t.accent} />
          <span style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 19, letterSpacing: '-0.02em' }}>Xalaat</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: 'grid', placeItems: 'center', fontSize: 14 }}>🔔</div>
          <Avatar name="Awa Diop" hue={60} size={36} />
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{
        position: 'relative', zIndex: 2,
        flex: 1, overflow: 'hidden',
        padding: '8px 20px 0',
      }}>
        {/* Greeting */}
        <div style={{ marginTop: 6, marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: t.inkSoft, marginBottom: 4 }}>
            Salaam, Awa <span style={{ fontFamily: type.accent, fontStyle: 'italic' }}>·</span> jeudi
          </div>
          <h1 style={{
            fontFamily: type.display, fontWeight: type.displayWeight,
            fontSize: 34, lineHeight: 1, letterSpacing: '-0.025em', margin: 0,
          }}>
            Que veux-tu<br /><span style={{ color: t.primary }}>deviner</span> aujourd'hui ?
          </h1>
        </div>

        {/* AI prompt */}
        <div style={{
          background: t.surface, borderRadius: 18,
          border: `1px solid ${t.line}`, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: cardShadow, marginBottom: 14,
        }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <span style={{ flex: 1, fontSize: 14, color: t.inkSoft }}>Tape un sujet…</span>
          <div style={{
            width: 32, height: 32, borderRadius: 999, background: t.primary,
            display: 'grid', placeItems: 'center', color: t.primaryInk, fontSize: 14, fontWeight: 700,
          }}>→</div>
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: 6, overflow: 'hidden', flexWrap: 'wrap', marginBottom: 22 }}>
          {['Mbalax', 'Cinéma', 'Histoire 🇸🇳', 'Géo'].map((c, i) => (
            <span key={c} style={{
              fontSize: 12, padding: '6px 10px', borderRadius: 999,
              background: i === 0 ? t.primary : 'transparent',
              color: i === 0 ? t.primaryInk : t.ink,
              border: i === 0 ? 'none' : `1px solid ${t.line}`,
              fontWeight: 500,
            }}>{c}</span>
          ))}
        </div>

        {/* Featured card */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: t.secondary, color: '#fff',
          borderRadius: cardRadius, padding: 18,
          boxShadow: cardShadow, marginBottom: 18,
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.7 }}>
            <PatternZigzag color={t.accent} opacity={0.22} size={20} />
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75 }}>Quiz du jour</div>
            <div style={{
              fontFamily: type.display, fontWeight: type.displayWeight,
              fontSize: 24, lineHeight: 1.05, letterSpacing: '-0.02em', margin: '8px 0 14px',
            }}>
              Lutte sénégalaise<br /><span style={{ fontFamily: type.accent, fontStyle: 'italic', fontWeight: 400, opacity: 0.85 }}>les années d'or</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.85 }}>
                <span>10 questions</span>·<span>4 min</span>·<span>+1 200 pts max</span>
              </div>
              <div style={{
                background: t.accent, color: t.ink,
                padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              }}>Jouer →</div>
            </div>
          </div>
        </div>

        {/* Mini leaderboard */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 18, letterSpacing: '-0.015em' }}>Top de la semaine</div>
          <div style={{ fontSize: 12, color: t.inkSoft }}>Voir tout</div>
        </div>
        <div style={{
          background: t.surface, borderRadius: cardRadius,
          border: cardBorder, boxShadow: cardShadow, overflow: 'hidden',
        }}>
          {[
            { rank: 1, name: 'Awa Diop', score: 18420, hue: 60 },
            { rank: 2, name: 'Modou Fall', score: 17105, hue: 30 },
            { rank: 3, name: 'Fatou Ndiaye', score: 16780, hue: 350 },
          ].map((p, i, arr) => (
            <div key={p.rank} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 14px',
              borderBottom: i < arr.length - 1 ? `1px solid ${t.line}` : 'none',
            }}>
              <div style={{
                fontFamily: type.display, fontWeight: type.displayWeight,
                fontSize: 14, width: 18,
                color: p.rank === 1 ? t.accent : p.rank === 2 ? t.primary : t.secondary,
              }}>{p.rank}</div>
              <Avatar name={p.name} hue={p.hue} size={30} ring={p.rank === 1 ? t.accent : null} />
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                <AnimatedCounter to={p.score} motion={motion} duration={1100 + i * 80} /> pts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'space-around',
        padding: '10px 12px 22px',
        background: t.surface, borderTop: `1px solid ${t.line}`,
      }}>
        {[
          { ic: '◆', l: 'Accueil', on: true },
          { ic: '✦', l: 'Thèmes' },
          { ic: '★', l: 'Top' },
          { ic: '◯', l: 'Profil' },
        ].map((tab, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: tab.on ? t.primary : t.inkSoft,
            fontSize: 10.5, fontWeight: 600,
          }}>
            <div style={{ fontSize: 18 }}>{tab.ic}</div>
            {tab.l}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { XalaatMobile });
