// xalaat-rooms-mobile.jsx — salons: création, liste, détail, génération IA.

function XalaatNewRoomMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated' ? '0 12px 28px -10px rgba(26,20,16,0.18)' : 'none';
  const cardRadius = cardStyle === 'sharp' ? 8 : 22;
  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><PatternLozenge color={t.primary} opacity={0.05} size={26} /></div>
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 16px', borderBottom: `1px solid ${t.line}` }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: 'grid', placeItems: 'center', fontSize: 16 }}>←</div>
        <div>
          <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 19, letterSpacing: '-0.015em' }}>Nouveau salon</div>
          <div style={{ fontSize: 12, color: t.inkSoft }}>Crée un espace pour tes parties</div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'auto', padding: '20px 20px 0' }}>
        <div style={{ background: t.surface, borderRadius: cardRadius, border: `1px solid ${t.line}`, boxShadow: cardShadow, padding: 22, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: `${t.primary}18`, display: 'grid', placeItems: 'center', fontSize: 22, margin: '0 auto 22px' }}>📁</div>

          <label style={{ fontSize: 13, fontWeight: 700, color: t.ink, display: 'block', marginBottom: 8 }}>Nom du salon *</label>
          <input placeholder="Ex : Soirée quiz, Les champions…" style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: `1px solid ${t.line}`, background: t.bg, color: t.ink, fontSize: 14, fontFamily: 'inherit', marginBottom: 20, outline: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>Nombre maximum de joueurs</label>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: `${t.primary}18`, color: t.primary, fontSize: 12.5, fontWeight: 700 }}>👥 250</span>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: t.surface2, marginBottom: 6, position: 'relative' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 4, background: t.primary }} />
            <div style={{ position: 'absolute', right: -8, top: -6, width: 18, height: 18, borderRadius: '50%', background: '#fff', border: `3px solid ${t.primary}` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.inkSoft, marginBottom: 22 }}><span>2</span><span>250</span></div>

          <label style={{ fontSize: 13, fontWeight: 700, color: t.ink, display: 'block', marginBottom: 8 }}>Description (optionnel)</label>
          <textarea placeholder="Décris ton salon…" rows={3} style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: `1px solid ${t.line}`, background: t.bg, color: t.ink, fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none' }} />
        </div>

        <button style={{ width: '100%', padding: '17px 20px', borderRadius: 999, background: t.primary, color: t.primaryInk, border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'default', boxShadow: `0 14px 30px -12px ${t.primary}`, marginBottom: 20 }}>
          Créer le salon
        </button>
      </div>
      <BottomTabBar t={t} active="salles" />
    </div>
  );
}

function XalaatRoomsListMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated' ? '0 12px 28px -10px rgba(26,20,16,0.18)' : 'none';
  const cardRadius = cardStyle === 'sharp' ? 8 : 18;
  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><PatternLozenge color={t.primary} opacity={0.05} size={26} /></div>
      <AppTopBar t={t} type={type} />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'auto', padding: '4px 20px 0' }}>
        <h1 style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 26, letterSpacing: '-0.02em', margin: '4px 0 4px' }}>Mes salons</h1>
        <p style={{ fontSize: 13, color: t.inkSoft, margin: '0 0 18px' }}>Rejoins ou crée une salle de jeu</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: t.surface, border: `1px solid ${t.line}`, borderRadius: 999, padding: '11px 16px', marginBottom: 18 }}>
          <span style={{ fontSize: 14, opacity: 0.6 }}>🔍</span>
          <span style={{ fontSize: 13.5, color: t.inkSoft }}>Rechercher par nom ou code…</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 16 }}>Salons (1)</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, background: t.primary, color: t.primaryInk, fontSize: 12.5, fontWeight: 700 }}>+ Créer</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: t.surface, border: `1px solid ${t.line}`, borderRadius: cardRadius, boxShadow: cardShadow, padding: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${t.accent}22`, display: 'grid', placeItems: 'center', fontSize: 19, flex: '0 0 auto' }}>📁</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 15.5, letterSpacing: '-0.01em', marginBottom: 3 }}>Les buzzeurs de 36A</div>
            <div style={{ fontSize: 12, color: t.inkSoft }}>Code : JE6P8YQB</div>
            <div style={{ fontSize: 11.5, color: t.inkSoft, marginTop: 2 }}>par Reine Noire 👑</div>
          </div>
          <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: t.inkSoft, fontWeight: 600, marginBottom: 8 }}>👥 35</div>
            <div style={{ fontSize: 15, color: t.inkSoft }}>›</div>
          </div>
        </div>
      </div>
      <BottomTabBar t={t} active="salles" />
    </div>
  );
}

function XalaatRoomDetailMobile({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated' ? '0 12px 28px -10px rgba(26,20,16,0.16)' : 'none';
  const cardRadius = cardStyle === 'sharp' ? 8 : 18;
  const members = [
    { rank: 1, name: 'Malickk', avg: 61, hue: 320, crown: true },
    { rank: 2, name: 'Idle', avg: 60, hue: 200 },
    { rank: 3, name: 'Joyboy', avg: 60, hue: 90 },
    { rank: 4, name: 'Fatiima', avg: 45, hue: 30 },
    { rank: 5, name: 'Moriarty 1', avg: 33, hue: 45 },
    { rank: 6, name: 'Ghost 🐺', avg: 31, hue: 260 },
    { rank: 7, name: 'Bayeeli', avg: 25, hue: 150 },
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><PatternLozenge color={t.primary} opacity={0.05} size={26} /></div>
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12, padding: '52px 20px 12px' }}>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: 'grid', placeItems: 'center', fontSize: 15 }}>←</div>
        <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 15.5, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Salon · Les buzzeurs de 36A</div>
      </div>
      <div style={{ position: 'relative', zIndex: 2, flex: 1, overflow: 'auto', padding: '6px 20px 24px' }}>
        <div style={{ background: t.surface, border: `1px solid ${t.line}`, borderRadius: cardRadius, boxShadow: cardShadow, padding: 22, textAlign: 'center', marginBottom: 16 }}>
          <div style={{ width: 148, height: 148, background: '#fff', borderRadius: 14, margin: '0 auto 14px', display: 'grid', placeItems: 'center', border: `1px solid ${t.line}` }}>
            <div style={{ width: 120, height: 120, backgroundImage: 'repeating-linear-gradient(90deg,#1A1410 0 4px,transparent 4px 8px),repeating-linear-gradient(0deg,#1A1410 0 4px,transparent 4px 8px)', opacity: 0.75 }} />
          </div>
          <div style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.inkSoft, marginBottom: 6 }}>Code du salon</div>
          <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 24, letterSpacing: '0.14em', color: t.primary }}>JE6P8YQB</div>
        </div>

        <button style={{ width: '100%', padding: '15px 20px', borderRadius: 999, background: t.primary, color: t.primaryInk, border: 'none', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, cursor: 'default', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          👤+ Inviter des amis
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkSoft, fontWeight: 700 }}>Membres</span>
          <span style={{ padding: '4px 10px', borderRadius: 999, background: t.surface2, fontSize: 12, fontWeight: 700 }}>35 joueurs</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {members.map((m) => (
            <div key={m.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, background: t.surface, border: `1px solid ${t.line}`, borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ width: 20, textAlign: 'center', fontSize: 13, color: t.inkSoft, fontWeight: 700 }}>{m.crown ? '♛' : m.rank}</div>
              <Avatar name={m.name} hue={m.hue} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: t.inkSoft }}>Hors ligne</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.primary }}>{m.avg} <span style={{ fontSize: 10, color: t.inkSoft, fontWeight: 500 }}>moy</span></div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ flex: 1, padding: '15px 16px', borderRadius: 999, background: t.ink, color: t.bg, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'default' }}>▶ Démarrer</button>
          <button style={{ padding: '15px 18px', borderRadius: 999, background: 'transparent', color: t.ink, border: `1.5px solid ${t.line}`, fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'default' }}>Historique</button>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: t.primary, fontWeight: 600 }}>↩ Quitter le salon</div>
      </div>
    </div>
  );
}

function XalaatGeneratingMobile({ theme, type, motion }) {
  const t = theme;
  const spin = motion !== 'off' ? 'xrm-spin 6s linear infinite' : 'none';
  return (
    <div style={{ width: '100%', height: '100%', background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}><PatternLozenge color={t.primary} opacity={0.05} size={26} /></div>
      <AppTopBar t={t} type={type} />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 40px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 96, height: 96, display: 'grid', placeItems: 'center' }}>
          <svg width="96" height="96" viewBox="0 0 96 96" style={{ position: 'absolute', animation: spin }}>
            <circle cx="48" cy="48" r="44" fill="none" stroke={t.line} strokeWidth="2" />
            <circle cx="48" cy="48" r="44" fill="none" stroke={t.primary} strokeWidth="2" strokeDasharray="60 220" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 30 }}>✨</span>
        </div>
        <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 19, letterSpacing: '-0.01em', color: t.primary }}>Génération IA en cours</div>
        <div style={{ fontSize: 13.5, color: t.inkSoft }}>Création de la base de questions…</div>
        <div style={{ width: '100%', maxWidth: 260, height: 6, borderRadius: 4, background: t.surface2, overflow: 'hidden' }}>
          <div style={{ width: '62%', height: '100%', background: t.primary, borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 11.5, color: t.inkSoft, lineHeight: 1.5, maxWidth: 260 }}>Cette opération peut prendre 15 à 30 secondes. Ne ferme pas l'application.</div>
      </div>
      <BottomTabBar t={t} active="accueil" />
      <style>{`@keyframes xrm-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

Object.assign(window, { XalaatNewRoomMobile, XalaatRoomsListMobile, XalaatRoomDetailMobile, XalaatGeneratingMobile });
