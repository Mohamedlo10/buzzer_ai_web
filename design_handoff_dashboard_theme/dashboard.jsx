/* dashboard.jsx — Home dashboard + bottom tab bar + Join modal
   Faithful to app/(tabs)/dashboard. Applies Bastien & Scapin:
   guidage (labels+feedback), contrôle explicite (explicit actions/cancel),
   gestion des erreurs (validated join), cohérence (shared components),
   signifiance (clear icons+FR labels), compatibilité (mobile patterns). */
const { useState: dS, useEffect: dE, useRef: dR } = React;

const DIco = {
  bell: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>,
  plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  login: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>,
  folder: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z"/></svg>,
  home: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>,
  rooms: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  friends: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  user: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  sun: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>,
  moon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>,
  qr: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7M17 21h-3"/></svg>,
};

/* greeting from local time */
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'; }

function QuickAction({ icon, label, sublabel, bg, fg, onClick }) {
  return (
    <button onClick={onClick} style={{ appearance:'none', border:0, cursor:'pointer', flex:1, borderRadius:16, overflow:'hidden', padding:0, textAlign:'left', transition:'transform .12s, opacity .2s' }}
      onMouseDown={e=>e.currentTarget.style.transform='scale(.97)'} onMouseUp={e=>e.currentTarget.style.transform=''} onMouseLeave={e=>e.currentTarget.style.transform=''}>
      <div style={{ padding:'12px 12px 13px', background:bg, height:'100%' }}>
        <div style={{ width:38, height:38, borderRadius:11, background:'rgba(255,255,255,0.2)', display:'grid', placeItems:'center', color:fg, marginBottom:12 }}>{icon}</div>
        <p style={{ color:fg, fontWeight:700, fontSize:14 }}>{label}</p>
        <p style={{ color:fg, opacity:.72, fontSize:11, marginTop:2 }}>{sublabel}</p>
      </div>
    </button>
  );
}

function StatItem({ icon, label, value, suffix, color }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1, gap:6 }}>
      <div style={{ width:40, height:40, borderRadius:12, background:'var(--surface-2)', display:'grid', placeItems:'center', color }}>{icon}</div>
      <p style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:17 }}>{value}{suffix}</p>
      <p className="muted" style={{ fontSize:11, textAlign:'center', lineHeight:1.2 }}>{label}</p>
    </div>
  );
}

function SectionHeader({ emoji, title, action, onAction }) {
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:12 }}>
      {emoji && <span style={{ fontSize:17, marginRight:8 }}>{emoji}</span>}
      <p style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:17 }}>{title}</p>
      {action && <button onClick={onAction} style={{ marginLeft:'auto', appearance:'none', border:0, background:'none', cursor:'pointer', color:'var(--accent)', fontWeight:700, fontSize:13, fontFamily:'var(--font-ui)', display:'flex', alignItems:'center', gap:2 }}>{action} {DIco.chevron}</button>}
    </div>
  );
}

const T_ICON = { trophy:'🏆', flame:'🔥', award:'🎖️', target:'🎯', percent:'％', chart:'📊' };

function DashboardScreen({ you, theme, onToggleTheme, onCreate, onJoinCode, onOpenRooms, onOpenFriends, onOpenProfile }) {
  const stats = { rank:7, totalScore:48250, totalGames:64, totalWins:23, bestScore:9180, winRate:36, avgScore:754 };
  const cats = [
    { category:'Science', totalScore:9120, winRate:62, gamesPlayed:18 },
    { category:'Histoire', totalScore:7400, winRate:48, gamesPlayed:14 },
    { category:'Cinéma', totalScore:5300, winRate:41, gamesPlayed:11 },
  ];
  const MED = [{e:'🥇',c:'var(--energy)'},{e:'🥈',c:'var(--silver)'},{e:'🥉',c:'var(--bronze)'}];
  const lastSession = { status:'RESULTS', code:'ROOM-7X2', manager:'Karim', myRank:2, myScore:2100, total:8, date:'07/06' };
  const notifs = { invits:1, friends:2 };
  const notifTotal = notifs.invits + notifs.friends;

  return (
    <div className="screen">
      {/* header */}
      <div className="s-head" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom:12 }}>
        <Wordmark/>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* theme toggle — adaptabilité (B&S) */}
          <button onClick={onToggleTheme} className="iconbtn" aria-label={theme==='dark'?'Passer en clair':'Passer en sombre'} title={theme==='dark'?'Mode clair':'Mode sombre'}>
            {theme==='dark' ? DIco.sun : DIco.moon}
          </button>
          <button className="iconbtn" aria-label="Notifications" style={{ position:'relative' }}>
            {DIco.bell}
            {notifTotal>0 && <span style={{ position:'absolute', top:4, right:4, minWidth:16, height:16, padding:'0 4px', borderRadius:99, background:'var(--buzz)', color:'#fff', fontSize:9.5, fontWeight:700, display:'grid', placeItems:'center' }}>{notifTotal}</span>}
          </button>
          <button onClick={()=>onOpenProfile(you)} className="iconbtn" aria-label="Mon profil" style={{ padding:0, overflow:'hidden' }}>
            <Avatar name={you} size={40} you/>
          </button>
        </div>
      </div>

      <div className="s-body" style={{ gap:20, paddingTop:18 }}>
        {/* welcome — guidage */}
        <div>
          <p className="muted" style={{ fontSize:13, fontWeight:600 }}>{greeting()},</p>
          <h1 style={{ fontSize:26, marginTop:3 }}>{you} 👋</h1>
        </div>

        {/* quick actions — contrôle explicite, signifiance */}
        <div style={{ display:'flex', gap:11 }}>
          <QuickAction icon={DIco.plus} label="Créer" sublabel="Une salle" bg="linear-gradient(140deg,var(--accent),var(--accent-d))" fg="#fff" onClick={onCreate}/>
          <QuickAction icon={DIco.login} label="Rejoindre" sublabel="Un code" bg="linear-gradient(140deg,#FF5C44,var(--buzz))" fg="#fff" onClick={onJoinCode}/>
          <QuickAction icon={DIco.folder} label="Salles" sublabel="Mes salles" bg="var(--surface)" fg="var(--txt)" onClick={onOpenRooms}/>
        </div>

        {/* notifications banner */}
        {notifTotal>0 && (
          <button onClick={onOpenFriends} className="card" style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', cursor:'pointer', textAlign:'left', border:'1px solid color-mix(in oklab,var(--energy) 30%,var(--line))' }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'color-mix(in oklab,var(--energy) 15%,transparent)', color:'var(--energy)', display:'grid', placeItems:'center', flexShrink:0 }}>{DIco.bell}</div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:14 }}>Notifications</p>
              <div style={{ display:'flex', gap:12, marginTop:2 }}>
                <span className="muted" style={{ fontSize:12 }}>🎮 {notifs.invits} invitation</span>
                <span className="muted" style={{ fontSize:12 }}>👥 {notifs.friends} demandes</span>
              </div>
            </div>
            <div style={{ width:24, height:24, borderRadius:99, background:'var(--buzz)', color:'#fff', fontSize:11, fontWeight:700, display:'grid', placeItems:'center' }}>{notifTotal}</div>
            <span style={{ color:'var(--txt-40)' }}>{DIco.chevron}</span>
          </button>
        )}

        {/* last session */}
        <div>
          <SectionHeader emoji="🎮" title="Sessions récentes"/>
          <button onClick={()=>onJoinCode(lastSession.code)} className="card" style={{ width:'100%', textAlign:'left', cursor:'pointer', position:'relative', overflow:'hidden', padding:'14px 14px 14px 17px' }}>
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:'linear-gradient(to bottom,var(--surface-2),var(--surface))' }}/>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                <div style={{ width:32, height:32, borderRadius:9, background:'var(--surface-2)', color:'var(--energy)', display:'grid', placeItems:'center' }}>🏆</div>
                <p style={{ fontWeight:700, fontSize:15 }}>Dernière session</p>
              </div>
              <span className="chip neutral">🏁 Terminée</span>
            </div>
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span className="muted" style={{ fontSize:11 }}>Code</span>
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:16, letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{lastSession.code}</span>
                </div>
                <div style={{ display:'flex', gap:14 }}>
                  <span className="muted" style={{ fontSize:12 }}>🏆 #{lastSession.myRank}/{lastSession.total}</span>
                  <span style={{ fontSize:12, color:'var(--accent)', fontWeight:700 }}>⚡ {lastSession.myScore} pts</span>
                  <span className="muted" style={{ fontSize:12 }}>🕑 {lastSession.date}</span>
                </div>
              </div>
              <div className="chip neutral" style={{ padding:'9px 16px', fontWeight:700, color:'var(--txt)' }}>Voir</div>
            </div>
          </button>
        </div>

        {/* category podium */}
        <div>
          <SectionHeader emoji="🏆" title="Mes meilleures catégories"/>
          <div style={{ display:'flex', gap:9 }}>
            {cats.map((c,i)=>(
              <div key={c.category} style={{ flex:1, borderRadius:16, padding:'13px 6px', display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                background:`color-mix(in oklab,${MED[i].c} 12%,var(--surface))`, border:`1px solid color-mix(in oklab,${MED[i].c} 28%,transparent)` }}>
                <span style={{ fontSize:22, marginBottom:3 }}>{MED[i].e}</span>
                <p style={{ fontWeight:700, fontSize:12.5, textAlign:'center', width:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.category}</p>
                <p style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:17, color:MED[i].c }}>{c.totalScore.toLocaleString('fr-FR')}</p>
                <p style={{ color:'var(--txt-40)', fontSize:10 }}>pts</p>
                <div className="chip" style={{ padding:'3px 9px', marginTop:3, background:'var(--bg)', color:'var(--accent)', fontSize:11 }}>🎯 {c.winRate}%</div>
                <p style={{ color:'var(--txt-40)', fontSize:10, marginTop:3 }}>{c.gamesPlayed} parties</p>
              </div>
            ))}
          </div>
        </div>

        {/* global stats */}
        <div>
          <SectionHeader emoji="📊" title="Mes statistiques"/>
          <div className="card" style={{ padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', marginBottom:16 }}>
              <span style={{ marginRight:8, color:'var(--txt-60)' }}>{Ico.chart}</span>
              <p style={{ fontWeight:700, fontSize:14 }}>Classement global</p>
              <span className="chip gold" style={{ marginLeft:'auto', padding:'4px 11px' }}>#{stats.rank}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <StatItem icon="🏆" label="Score total" value={stats.totalScore.toLocaleString('fr-FR')} color="var(--energy)"/>
              <StatItem icon="🔥" label="Parties" value={stats.totalGames} color="var(--buzz)"/>
              <StatItem icon="🎖️" label="Victoires" value={stats.totalWins} color="var(--accent)"/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <StatItem icon="🎯" label="Meilleur" value={stats.bestScore.toLocaleString('fr-FR')} color="var(--accent)"/>
              <StatItem icon="％" label="Win rate" value={stats.winRate} suffix="%" color="var(--accent)"/>
              <StatItem icon="📊" label="Moy. score" value={stats.avgScore} color="var(--txt)"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* bottom tab bar (shared) */
function TabBar({ active, onChange }) {
  const tabs = [
    { id:'home', icon:DIco.home, label:'Accueil' },
    { id:'rooms', icon:DIco.rooms, label:'Salles' },
    { id:'friends', icon:DIco.friends, label:'Amis' },
    { id:'profile', icon:DIco.user, label:'Profil' },
  ];
  return (
    <div className="tabbar">
      {tabs.map(t=>(
        <button key={t.id} className={active===t.id?'on':''} onClick={()=>onChange(t.id)}>
          {t.icon}<span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

/* Join modal — gestion des erreurs + contrôle explicite (B&S) */
function JoinModal({ initialCode='', onClose, onJoin }) {
  const [code, setCode] = dS(initialCode);
  const [error, setError] = dS(null);
  const [loading, setLoading] = dS(false);
  const [closing, setClosing] = dS(false);
  const close = () => { setClosing(true); setTimeout(onClose, 200); };

  const submit = () => {
    const c = code.trim().toUpperCase();
    if (!c) { setError('Le code est requis pour rejoindre.'); return; }
    if (c.replace(/[^A-Z0-9]/g,'').length < 4) { setError('Code trop court — vérifie les caractères saisis.'); return; }
    setError(null); setLoading(true);
    setTimeout(() => {
      // demo: codes containing "X" succeed, others show a recoverable error
      if (/\d/.test(c) || c.includes('ROOM')) { onJoin(c); }
      else { setLoading(false); setError(`Aucune salle ou partie trouvée pour « ${c} ». Vérifie le code auprès de l'hôte.`); }
    }, 850);
  };

  return (
    <div onClick={close} style={{ position:'absolute', inset:0, zIndex:60, background:'var(--scrim)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, opacity:closing?0:1, transition:'opacity .2s', animation:closing?'none':'fadein .2s both' }}>
      <div onClick={e=>e.stopPropagation()} className="card" style={{ width:'100%', maxWidth:340, overflow:'hidden', animation:closing?'none':'pop .3s both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 18px 10px' }}>
          <h2 style={{ fontSize:20 }}>Rejoindre</h2>
          <button onClick={close} className="iconbtn" style={{ width:34, height:34 }}>{Ico.x}</button>
        </div>
        {/* info — guidage */}
        <div style={{ padding:'0 18px 14px' }}>
          <div style={{ background:'var(--bg)', borderRadius:12, padding:'10px 12px' }}>
            <p className="muted" style={{ fontSize:11.5, textAlign:'center', lineHeight:1.5 }}>Entre le code de la partie (6 chiffres) ou de la salle permanente pour la rejoindre.</p>
          </div>
        </div>
        <div style={{ padding:'0 18px 6px' }}>
          <p style={{ fontWeight:600, fontSize:13, marginBottom:8 }}>Code secret</p>
          <input className="field" value={code} autoFocus maxLength={20}
            onChange={e=>{ setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,'')); setError(null); }}
            onKeyDown={e=>e.key==='Enter'&&submit()}
            placeholder="Ex: ROOM-ABC"
            style={{ textAlign:'center', fontSize:22, letterSpacing:'0.16em', fontFamily:'var(--font-display)', borderColor: error?'var(--buzz)':undefined }}/>
        </div>
        {/* error — qualité du message + correction (B&S) */}
        {error && (
          <div style={{ padding:'10px 18px 0' }}>
            <div style={{ display:'flex', gap:8, alignItems:'flex-start', padding:'10px 12px', borderRadius:12, background:'color-mix(in oklab,var(--buzz) 12%,transparent)', border:'1px solid color-mix(in oklab,var(--buzz) 35%,transparent)' }}>
              <span style={{ color:'var(--buzz)', flexShrink:0, marginTop:1 }}>{Ico.x}</span>
              <p style={{ color:'var(--buzz-h)', fontSize:12.5, fontWeight:600, lineHeight:1.4 }}>{error}</p>
            </div>
          </div>
        )}
        <div style={{ padding:'14px 18px 8px' }}>
          <button onClick={submit} disabled={loading || !code.trim()} className="btn" style={{ background: (loading||!code.trim())?undefined:'linear-gradient(135deg,#FF5C44,var(--buzz))', color:(loading||!code.trim())?undefined:'#fff' }}>
            {loading ? <><span className="spinner" style={{ borderTopColor:'#fff', borderColor:'rgba(255,255,255,0.4)' }}/> Connexion…</> : 'Rejoindre'}
          </button>
        </div>
        <div style={{ padding:'0 18px 18px' }}>
          <button onClick={()=>{ setCode('ROOM-7X2'); setError(null); }} className="btn sec" style={{ padding:'13px' }}>{DIco.qr}<span style={{ color:'var(--accent)' }}>Scanner un QR code</span></button>
        </div>
      </div>
    </div>
  );
}

/* simple placeholder tab pages — coherence + guidance */
function SimpleTab({ emoji, title, subtitle, cta, onCta }) {
  return (
    <div className="screen">
      <div className="s-head"><h1 style={{ fontSize:22 }}>{title}</h1></div>
      <div className="s-body" style={{ alignItems:'center', justifyContent:'center', textAlign:'center', gap:14 }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--surface)', border:'1px solid var(--line)', display:'grid', placeItems:'center', fontSize:32 }}>{emoji}</div>
        <div>
          <h2 style={{ fontSize:19 }}>{title}</h2>
          <p className="muted" style={{ fontSize:14, marginTop:6, maxWidth:240 }}>{subtitle}</p>
        </div>
        {cta && <button onClick={onCta} className="btn" style={{ width:'auto', padding:'13px 22px' }}>{cta}</button>}
      </div>
    </div>
  );
}

/* Friends tab — list + requests, tappable to open profile (real feature) */
function FriendsTab({ onOpenProfile }) {
  const friends = [
    { name:'Karim', online:true }, { name:'Sofia', online:true }, { name:'Yanis', online:false },
    { name:'Inès', online:false }, { name:'Hugo', online:true },
  ];
  const requests = ['Lina','Noa'];
  return (
    <div className="screen">
      <div className="s-head"><h1 style={{ fontSize:22 }}>Amis</h1><p className="muted" style={{ fontSize:12, marginTop:2 }}>{friends.length} amis · {requests.length} demandes</p></div>
      <div className="s-body" style={{ gap:18 }}>
        {requests.length>0 && (
          <div>
            <div className="eyebrow" style={{ marginBottom:9, color:'var(--energy)' }}>Demandes reçues</div>
            <div className="card" style={{ overflow:'hidden', padding:0 }}>
              {requests.map((n,i)=>(
                <div key={n} style={{ display:'flex', alignItems:'center', gap:11, padding:'11px 14px', borderBottom:i<requests.length-1?'1px solid var(--line)':'none' }}>
                  <button onClick={()=>onOpenProfile(n,'PENDING')} style={{ appearance:'none', border:0, background:'none', cursor:'pointer', padding:0 }}><Avatar name={n} size={40} ring/></button>
                  <div style={{ flex:1 }}><p style={{ fontWeight:700, fontSize:14 }}>{n}</p><p className="muted" style={{ fontSize:11.5 }}>souhaite t'ajouter</p></div>
                  <button className="iconbtn" style={{ width:34, height:34, background:'var(--accent)', color:'var(--btn-fg)' }} aria-label="Accepter">{Ico.check}</button>
                  <button className="iconbtn" style={{ width:34, height:34 }} aria-label="Refuser">{Ico.x}</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="eyebrow" style={{ marginBottom:9, color:'var(--txt-60)' }}>Mes amis</div>
          <div className="card" style={{ overflow:'hidden', padding:0 }}>
            {friends.map((f,i)=>(
              <button key={f.name} onClick={()=>onOpenProfile(f.name,'ACCEPTED')} style={{ width:'100%', appearance:'none', border:0, background:'none', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:11, padding:'11px 14px', borderBottom:i<friends.length-1?'1px solid var(--line)':'none' }}>
                <div style={{ position:'relative' }}>
                  <Avatar name={f.name} size={40}/>
                  <span style={{ position:'absolute', bottom:0, right:0, width:11, height:11, borderRadius:'50%', background:f.online?'var(--accent)':'var(--txt-40)', border:'2px solid var(--surface)' }}/>
                </div>
                <div style={{ flex:1 }}><p style={{ fontWeight:700, fontSize:14 }}>{f.name}</p><p className="muted" style={{ fontSize:11.5 }}>{f.online?'En ligne':'Hors ligne'}</p></div>
                <span style={{ color:'var(--txt-40)' }}>{DIco.chevron}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Rooms tab — list of permanent rooms (real feature) */
function RoomsTab({ onCreate, onEnter }) {
  const rooms = [
    { name:'Soirée quiz du vendredi', code:'ROOM-7X2', members:8, owner:true },
    { name:'Bureau · pause déj', code:'ROOM-4KP', members:5, owner:false },
  ];
  return (
    <div className="screen">
      <div className="s-head" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div><h1 style={{ fontSize:22 }}>Mes salles</h1><p className="muted" style={{ fontSize:12, marginTop:2 }}>{rooms.length} salles permanentes</p></div>
        <button onClick={onCreate} className="iconbtn" style={{ background:'var(--accent)', color:'var(--btn-fg)' }} aria-label="Créer une salle">{DIco.plus}</button>
      </div>
      <div className="s-body" style={{ gap:11 }}>
        {rooms.map(r=>(
          <button key={r.code} onClick={()=>onEnter(r.code)} className="card" style={{ width:'100%', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', gap:12, padding:'14px' }}>
            <div style={{ width:48, height:48, borderRadius:13, background:'color-mix(in oklab,var(--host) 18%,transparent)', color:'var(--host)', display:'grid', placeItems:'center', flexShrink:0 }}>{DIco.folder}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}><p style={{ fontWeight:700, fontSize:15, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</p>{r.owner && <span className="chip gold" style={{ padding:'2px 7px', fontSize:9.5 }}>{Ico.crown} Hôte</span>}</div>
              <div style={{ display:'flex', gap:12, marginTop:4 }}>
                <span style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:12.5, letterSpacing:'0.04em', color:'var(--accent)', whiteSpace:'nowrap' }}>{r.code}</span>
                <span className="muted" style={{ fontSize:12 }}>👥 {r.members} membres</span>
              </div>
            </div>
            <span style={{ color:'var(--txt-40)' }}>{DIco.chevron}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { DashboardScreen, TabBar, JoinModal, SimpleTab, FriendsTab, RoomsTab, DIco });
