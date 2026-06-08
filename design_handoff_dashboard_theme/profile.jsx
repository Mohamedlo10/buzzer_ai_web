/* profile.jsx — Player profile modal (bottom sheet) + friendship
   Faithful to app/profile/[userId] : rank, perf index, games, wins, best
   score, buzz accuracy, favorite categories, recent games, room stats. */
const { useState: pS, useEffect: pE } = React;

/* deterministic mock profile from a name */
function genProfile(name) {
  let h = 0; for (const c of name) h = (h*31 + c.charCodeAt(0)) >>> 0;
  const rnd = (min,max)=> min + (h = (h*1103515245+12345)>>>0, h % 1000)/1000 * (max-min);
  const games = Math.round(rnd(12, 240));
  const winRate = Math.round(rnd(18, 72));
  const wins = Math.round(games*winRate/100);
  const acc = Math.round(rnd(38, 88));
  const qPlayed = Math.round(rnd(180, 2400));
  const correct = Math.round(qPlayed*acc/100);
  const cats = ['Science','Histoire','Cinéma','Géographie','Sports','Culture G','Musique'];
  const top = [0,1,2].map(i=>({ name:cats[(h+i*3)%cats.length], games:Math.round(rnd(6,60)), win:Math.round(rnd(25,80)), score:Math.round(rnd(1200,9000)) }));
  const recent = [0,1,2].map(i=>({ code:String(1000+((h>>i)%9000)), room:['Soirée quiz','Public','Entre amis','Bureau'][(h+i)%4], days:i*2+1, score:Math.round(rnd(400,2600)), rank:1+((h+i)%6), of:Math.round(rnd(5,9)) }));
  return {
    name, rank: Math.round(rnd(1, 480)), perf: rnd(20, 96),
    games, wins, winRate, best: Math.round(rnd(1800, 9600)),
    acc, correct, qPlayed, totalScore: Math.round(rnd(8000, 95000)),
    rooms: Math.round(rnd(2, 28)), roomWins: Math.round(rnd(0, 12)),
    top, recent,
  };
}

const FRIEND_CFG = {
  NONE:    { label:'Ajouter', color:'var(--accent)', icon:'+' },
  PENDING: { label:'En attente', color:'var(--warn)', icon:'⏳' },
  ACCEPTED:{ label:'Ami', color:'var(--accent)', icon:'✓' },
};

function StatCard({ icon, color, value, label, sub, bar }) {
  return (
    <div className="card" style={{ flex:'1 1 45%', padding:13 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
        <div style={{ width:34, height:34, borderRadius:10, display:'grid', placeItems:'center', background:`color-mix(in oklab, ${color} 18%, transparent)`, color }}>{icon}</div>
        <span style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:19, color }}>{value}</span>
      </div>
      <p className="muted" style={{ fontSize:12 }}>{label}</p>
      {sub && <p style={{ color:'var(--txt-40)', fontSize:10.5, marginTop:2 }}>{sub}</p>}
      {bar!=null && <div style={{ marginTop:8, height:5, borderRadius:99, background:'var(--bg)', overflow:'hidden' }}><div style={{ height:'100%', width:`${bar}%`, background:color, borderRadius:99 }}/></div>}
    </div>
  );
}

function PlayerProfileModal({ name, you, initialStatus='NONE', onClose }) {
  const [status, setStatus] = pS(name===you ? 'SELF' : initialStatus);
  const [closing, setClosing] = pS(false);
  const p = React.useMemo(()=>genProfile(name), [name]);
  const close = () => { setClosing(true); setTimeout(onClose, 220); };
  const isYou = name===you;

  const onFriend = () => {
    if (status==='NONE') setStatus('PENDING');
    else if (status==='ACCEPTED') setStatus('NONE');
  };
  const cfg = FRIEND_CFG[status] || FRIEND_CFG.NONE;

  return (
    <div onClick={close} style={{ position:'absolute', inset:0, zIndex:60, background:'var(--scrim)', backdropFilter:'blur(3px)',
      display:'flex', alignItems:'flex-end', animation: closing?'none':'fadein .2s both', opacity:closing?0:1, transition:'opacity .2s' }}>
      <div onClick={e=>e.stopPropagation()} className="card" style={{
        width:'100%', maxHeight:'90%', borderRadius:'24px 24px 0 0', display:'flex', flexDirection:'column',
        border:'1px solid var(--line)', borderBottom:0,
        transform: closing?'translateY(100%)':'translateY(0)', animation: closing?'none':'sheetup .32s cubic-bezier(.2,.8,.2,1) both', transition:'transform .22s' }}>
        {/* handle + close */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 0 4px', position:'relative' }}>
          <div style={{ width:38, height:4, borderRadius:99, background:'var(--surface-2)' }}/>
          <button onClick={close} className="iconbtn" style={{ position:'absolute', right:14, top:8, width:32, height:32 }}>{Ico.x}</button>
        </div>

        <div className="s-body" style={{ padding:'8px 18px 26px', gap:16 }}>
          {/* identity */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, marginTop:4 }}>
            <Avatar name={name} size={84} you={isYou} ring={!isYou}/>
            <h2 style={{ fontSize:23 }}>{isYou?`${name} (Toi)`:name}</h2>
            <span className="chip gold">🏆 Rang #{p.rank}</span>
            {!isYou && (
              <button onClick={onFriend} disabled={status==='PENDING'} style={{
                appearance:'none', cursor:status==='PENDING'?'default':'pointer', marginTop:6,
                display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:99,
                border:`1px solid ${cfg.color}`, background:`color-mix(in oklab, ${cfg.color} 16%, transparent)`,
                color:cfg.color, fontWeight:700, fontSize:14, fontFamily:'var(--font-ui)' }}>
                <span>{cfg.icon}</span>{status==='ACCEPTED'?'Retirer des amis':cfg.label}
              </button>
            )}
          </div>

          {/* stat grid */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            <StatCard icon={Ico.chart} color="#9B59B6" value={p.perf.toFixed(1)} label="Indice de perf." bar={Math.min(100,p.perf)}/>
            <StatCard icon="🎮" color="var(--accent)" value={p.games} label="Parties jouées"/>
            <StatCard icon="🏆" color="var(--energy)" value={p.wins} label="Victoires" sub={`${p.winRate}% taux`}/>
            <StatCard icon="🏅" color="var(--host)" value={p.best.toLocaleString('fr-FR')} label="Meilleur score"/>
          </div>

          {/* buzz accuracy */}
          <div className="card" style={{ padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                <div style={{ width:42, height:42, borderRadius:12, display:'grid', placeItems:'center', background:'color-mix(in oklab,var(--team) 18%,transparent)', color:'var(--team)' }}>🎯</div>
                <div><p style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:18 }}>{p.acc}%</p><p className="muted" style={{ fontSize:12 }}>Précision de buzz</p></div>
              </div>
              <span className="muted" style={{ fontSize:12 }}>⭐ {p.correct}/{p.qPlayed}</span>
            </div>
            <div style={{ height:8, borderRadius:99, background:'var(--bg)', overflow:'hidden' }}><div style={{ height:'100%', width:`${p.acc}%`, background:'var(--team)', borderRadius:99 }}/></div>
            <p style={{ color:'var(--txt-40)', fontSize:11, marginTop:10 }}>Score brut (informatif) : {p.totalScore.toLocaleString('fr-FR')} pts</p>
          </div>

          {/* favorite categories */}
          <div>
            <div className="eyebrow" style={{ marginBottom:9, color:'var(--txt-60)' }}>Catégories favorites</div>
            <div className="card" style={{ overflow:'hidden', padding:0 }}>
              {p.top.map((c,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:11, padding:'11px 14px', borderBottom:i<p.top.length-1?'1px solid var(--line)':'none' }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--bg)', display:'grid', placeItems:'center', fontSize:12, fontWeight:700, color:'var(--txt-60)' }}>#{i+1}</div>
                  <div style={{ flex:1 }}><p style={{ fontWeight:600, fontSize:14 }}>{c.name}</p><p className="muted" style={{ fontSize:11.5 }}>{c.games} parties • {c.win}% victoires</p></div>
                  <div style={{ textAlign:'right' }}><p style={{ color:'var(--team)', fontWeight:700, fontSize:14 }}>{c.score.toLocaleString('fr-FR')}</p><p style={{ color:'var(--txt-40)', fontSize:10 }}>points</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* recent games */}
          <div>
            <div className="eyebrow" style={{ marginBottom:9, color:'var(--txt-60)' }}>Parties récentes</div>
            <div className="card" style={{ overflow:'hidden', padding:0 }}>
              {p.recent.map((g,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:11, padding:'11px 14px', borderBottom:i<p.recent.length-1?'1px solid var(--line)':'none' }}>
                  <div style={{ width:38, height:38, borderRadius:11, background:'color-mix(in oklab,var(--host) 18%,transparent)', color:'var(--host)', display:'grid', placeItems:'center' }}>🏆</div>
                  <div style={{ flex:1 }}><p style={{ fontWeight:600, fontSize:13.5 }}>Session #{g.code}</p><p className="muted" style={{ fontSize:11.5 }}>{g.room} • il y a {g.days}j</p></div>
                  <div style={{ textAlign:'right' }}><p style={{ fontWeight:700, fontSize:13, color:g.rank===1?'var(--energy)':'var(--txt)' }}>{g.rank===1?'🏆 ':''}{g.score} pts</p><p style={{ color:'var(--txt-40)', fontSize:10.5 }}>#{g.rank}/{g.of}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* room stats */}
          <div className="card" style={{ padding:16, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:11 }}>
              <div style={{ width:42, height:42, borderRadius:12, display:'grid', placeItems:'center', background:'color-mix(in oklab,#F97316 18%,transparent)', color:'#F97316' }}>👥</div>
              <div><p style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:18 }}>{p.rooms}</p><p className="muted" style={{ fontSize:12 }}>Salons rejoints</p></div>
            </div>
            <div style={{ textAlign:'right' }}><p style={{ color:'#F97316', fontWeight:700, fontSize:16 }}>{p.roomWins}</p><p style={{ color:'var(--txt-40)', fontSize:10.5 }}>victoires en salon</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function relStatus(name){ let h=0; for(const c of (name||'')) h+=c.charCodeAt(0); return h%3===0 ? 'ACCEPTED' : 'NONE'; }

Object.assign(window, { PlayerProfileModal, genProfile, relStatus });
