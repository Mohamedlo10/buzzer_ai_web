// xalaat-social-mobile.jsx — classement, amis, profil.

function XalaatLeaderboardMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated' ? '0 12px 28px -10px rgba(26,20,16,0.16)' : 'none';
  const cardRadius = cardStyle === 'sharp' ? 8 : 14;
  const podium = [
    { name: 'Moriarty 1', score: 1977, hue: 45, place: 2 },
    { name: 'Malickk', score: 2040, hue: 320, place: 1 },
    { name: 'Abdourahmane', score: 1954, hue: 200, place: 3 },
  ];
  const rest = [
    { r: 4, name: 'Laabeur 3.0', score: 1948, hue: 90 },
    { r: 5, name: 'Mame Rane', score: 1836, hue: 30 },
    { r: 6, name: 'Ghost 🐺', score: 1802, hue: 260 },
    { r: 7, name: 'Bayeeli', score: 1787, hue: 150 },
    { r: 8, name: 'Mohamed', score: 1873, hue: 200 },
    { r: 9, name: 'El Maestro', score: 1780, hue: 60 },
    { r: 10, name: 'Mouhadev', score: 1629, hue: 340 },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><PatternLozenge color={t.primary} opacity={0.05} size={26} /></div>
      <AppTopBar t={t} type={type} />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'auto', padding: '4px 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h1 style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 24, letterSpacing: '-0.02em', margin: '0 0 2px' }}>Classement</h1>
            <div style={{ fontSize: 12.5, color: t.inkSoft }}>567 joueurs classés</div>
          </div>
        </div>

        {/* Podium */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 10, alignItems: 'end', marginBottom: 20 }}>
          {[podium[0], podium[1], podium[2]].map((p) => (
            <div key={p.name} style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: p.place === 1 ? 64 : 52, height: p.place === 1 ? 64 : 52, margin: '0 auto 8px' }}>
                <Avatar name={p.name} hue={p.hue} size={p.place === 1 ? 64 : 52} ring={p.place === 1 ? t.accent : p.place === 2 ? t.inkSoft : t.secondary} />
                {p.place === 1 && <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 18 }}>♛</span>}
              </div>
              <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: cardRadius, padding: '10px 6px', boxShadow: cardShadow }}>
                <div style={{ fontSize: 16 }}>{p.place === 1 ? '🥇' : p.place === 2 ? '🥈' : '🥉'}</div>
                <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: 10.5, color: t.inkSoft }}>{p.score} pts</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: t.surface, border: `1px solid ${t.line}`, borderRadius: 999, padding: '11px 16px', marginBottom: 14 }}>
          <span style={{ fontSize: 14, opacity: 0.6 }}>🔍</span>
          <span style={{ fontSize: 13.5, color: t.inkSoft }}>Rechercher un joueur…</span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, background: t.surface, border: `1px solid ${t.line}`, borderRadius: cardRadius, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 20, color: t.ink }}>567</div>
            <div style={{ fontSize: 11, color: t.inkSoft }}>Joueurs</div>
          </div>
          <div style={{ flex: 1, background: t.surface, border: `1px solid ${t.line}`, borderRadius: cardRadius, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 20, color: t.primary }}>154</div>
            <div style={{ fontSize: 11, color: t.inkSoft }}>Ton rang</div>
          </div>
        </div>

        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkSoft, fontWeight: 700, marginBottom: 10 }}>Classement complet</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {rest.map((p) => (
            <div key={p.r} style={{ display: 'flex', alignItems: 'center', gap: 12, background: t.surface, border: `1px solid ${t.line}`, borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ width: 22, textAlign: 'center', fontSize: 13, fontWeight: 700, color: t.inkSoft }}>{p.r}</div>
              <Avatar name={p.name} hue={p.hue} size={30} />
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: t.primary }}>{p.score}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 18, fontSize: 12.5, color: t.inkSoft }}>
          <span>‹</span><span style={{ color: t.primary, fontWeight: 700 }}>1</span><span>2</span><span>…</span><span>23</span><span>›</span>
        </div>
      </div>
      <BottomTabBar t={t} active="classement" />
    </div>
  );
}

function XalaatFriendsMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated' ? '0 12px 28px -10px rgba(26,20,16,0.16)' : 'none';
  const cardRadius = cardStyle === 'sharp' ? 8 : 14;
  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><PatternLozenge color={t.primary} opacity={0.05} size={26} /></div>
      <AppTopBar t={t} type={type} />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'auto', padding: '4px 20px 24px' }}>
        <h1 style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 26, letterSpacing: '-0.02em', margin: '4px 0 18px' }}>Amis</h1>

        <div style={{ display: 'flex', gap: 6, background: t.surface2, borderRadius: 999, padding: 4, marginBottom: 18 }}>
          {['Amis', 'Demandes', 'Recherche'].map((tab, i) => (
            <div key={tab} style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 999, background: i === 0 ? t.primary : 'transparent', color: i === 0 ? t.primaryInk : t.inkSoft, fontSize: 13, fontWeight: 700 }}>{tab}</div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: t.surface, border: `1px solid ${t.line}`, borderRadius: cardRadius, boxShadow: cardShadow, padding: 14 }}>
          <Avatar name="Mouhadev" hue={30} size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 15 }}>Mouhadev</div>
            <div style={{ fontSize: 12, color: t.inkSoft }}>Vu il y a 2 j · <span style={{ color: t.primary, fontWeight: 700 }}>#10</span></div>
          </div>
          <div style={{ fontSize: 16, color: t.inkSoft }}>›</div>
        </div>
      </div>
      <BottomTabBar t={t} active="amis" />
    </div>
  );
}

function XalaatProfileMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated' ? '0 12px 28px -10px rgba(26,20,16,0.16)' : 'none';
  const cardRadius = cardStyle === 'sharp' ? 8 : 16;
  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><PatternLozenge color={t.primary} opacity={0.05} size={26} /></div>
      <AppTopBar t={t} type={type} />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'auto', padding: '4px 20px 24px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 12px' }}>
          <Avatar name="Momo Diallo" hue={30} size={88} />
          <div style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: 'grid', placeItems: 'center', fontSize: 12 }}>✎</div>
        </div>
        <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 22, letterSpacing: '-0.015em', marginBottom: 6 }}>Momo</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: t.surface2, fontSize: 12, fontWeight: 600, color: t.inkSoft, marginBottom: 18 }}>👤 Joueur</div>

        <div style={{ background: `${t.primary}12`, border: `1px solid ${t.primary}44`, borderRadius: cardRadius, padding: '14px 16px', textAlign: 'left', marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: t.primary, marginBottom: 4 }}>⚠ Confirme ton email</div>
          <div style={{ fontSize: 12, color: t.inkSoft, marginBottom: 6 }}>Un email de confirmation a été envoyé à momo@duck.com.</div>
          <div style={{ fontSize: 12.5, color: t.primary, fontWeight: 700 }}>↻ Renvoyer l'email</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          {[
            { ic: '🏆', v: '#154', l: 'Rang global', c: t.accent },
            { ic: '📊', v: '1759', l: 'Rating Glicko-2', c: t.secondary },
          ].map((s, i) => (
            <div key={i} style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: cardRadius, boxShadow: cardShadow, padding: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}>{s.ic}</div>
              <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 19, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 11, color: t.inkSoft, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
          {[{ ic: '🎮', v: '1', l: 'Parties' }, { ic: '🏅', v: '1', l: 'Victoires · 100%' }].map((s, i) => (
            <div key={i} style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: cardRadius, boxShadow: cardShadow, padding: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}>{s.ic}</div>
              <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 19 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: t.inkSoft, marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: cardRadius, boxShadow: cardShadow, marginBottom: 22, textAlign: 'left' }}>
          {[{ ic: '✉️', l: 'Email', v: 'momo@duck.com' }, { ic: '📅', l: 'Membre depuis', v: '13 juin 2026' }].map((row, i, arr) => (
            <div key={row.l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${t.line}` : 'none' }}>
              <span style={{ fontSize: 16 }}>{row.ic}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: t.inkSoft }}>{row.l}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{row.v}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button style={{ padding: '14px 18px', borderRadius: 999, background: t.surface2, color: t.ink, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}><span>✎ Modifier le profil</span><span>›</span></button>
          <button style={{ padding: '14px 18px', borderRadius: 999, background: t.surface2, color: t.ink, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}><span>🔒 Changer le mot de passe</span><span>›</span></button>
          <button style={{ padding: '14px 18px', borderRadius: 999, background: 'transparent', color: t.ink, border: `1.5px solid ${t.line}`, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'default' }}>Actualiser</button>
          <button style={{ padding: '14px 18px', borderRadius: 999, background: 'transparent', color: '#B8462A', border: '1.5px solid rgba(184,70,42,0.4)', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'default' }}>↪ Se déconnecter</button>
        </div>
        <div style={{ fontSize: 11, color: t.inkSoft, marginTop: 16 }}>Xalaat · v1.0.0</div>
      </div>
      <BottomTabBar t={t} active="profil" />
    </div>
  );
}

Object.assign(window, { XalaatLeaderboardMobile, XalaatFriendsMobile, XalaatProfileMobile });
