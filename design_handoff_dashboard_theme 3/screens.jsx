/* screens.jsx — Join · Categories · Lobby */
const { useState, useEffect, useRef } = React;

/* ───────────────────────── JOIN ───────────────────────── */
function JoinScreen({ onJoin }) {
  const [code, setCode] = useState('');
  const ready = code.trim().length >= 4;
  return (
    <div className="screen">
      <div className="s-head" style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button className="iconbtn">{Ico.back}</button>
        <div>
          <h1 style={{ fontSize:20 }}>Rejoindre une salle</h1>
          <p className="muted" style={{ fontSize:12, marginTop:2 }}>Entre le code ou scanne un QR code</p>
        </div>
      </div>

      <div className="s-body" style={{ gap:14, justifyContent:'center' }}>
        <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card" style={{ padding:'26px 18px 22px' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
              <div style={{ width:64, height:64, borderRadius:'50%', display:'grid', placeItems:'center',
                background:'color-mix(in oklab, var(--accent) 13%, transparent)', color:'var(--accent)',
                animation:'float 4s ease-in-out infinite' }}>{Ico.door}</div>
            </div>
            <p style={{ fontWeight:600, fontSize:14, marginBottom:9 }}>Code de la salle</p>
            <input className="field" value={code} maxLength={12} autoFocus
              onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,''))}
              placeholder="EX: ROOM-ABC"
              style={{ textAlign:'center', fontSize:24, letterSpacing:'0.18em', fontFamily:'var(--font-display)', textTransform:'uppercase' }}/>
          </div>

          <button className="btn" disabled={!ready} onClick={()=>onJoin(code.trim())}>Rejoindre</button>
          <button className="btn sec">{Ico.qr}<span style={{ color:'var(--accent)' }}>Scanner un QR code</span></button>
        </div>

        <div style={{ display:'flex', justifyContent:'center', marginTop:8 }}><Wordmark/></div>
      </div>
    </div>
  );
}

/* ───────────────────── CATEGORIES (signature) ───────────────────── */
const PREDEFINED = [
  { name:'Histoire',  emoji:'📜', color:'#FFD700' },
  { name:'Science',   emoji:'🔬', color:'#00D397' },
  { name:'Sports',    emoji:'🏆', color:'#D5442F' },
  { name:'Géographie',emoji:'🌍', color:'#4A90D9' },
  { name:'Culture G', emoji:'🌐', color:'#9B59B6' },
  { name:'Cinéma',    emoji:'🎬', color:'#EC4899' },
];
const DIFFS = [
  { v:'FACILE', label:'Facile', color:'#00D397' },
  { v:'INTER',  label:'Intermédiaire', color:'#FFD700' },
  { v:'EXPERT', label:'Expert', color:'#D5442F' },
];
const SUGGEST = ['Marvel','Années 90','Histoire de France','Jeux vidéo','Animé','Mythologie','Astronomie','Rap FR'];

function CategoriesScreen({ initial, onJoin }) {
  const MAX = 3;
  const [sel, setSel] = useState(initial && initial.length ? initial : [{ name:'Science', diff:'INTER' }]);
  const [custom, setCustom] = useState('');
  const [diff, setDiff] = useState(null);
  const canAdd = sel.length < MAX;
  const results = custom.trim().length>=2 ? SUGGEST.filter(s=>s.toLowerCase().includes(custom.trim().toLowerCase())) : [];

  const toggle = (name) => {
    if (sel.find(c=>c.name===name)) setSel(sel.filter(c=>c.name!==name));
    else if (canAdd) setSel([...sel, { name, diff:'INTER' }]);
  };
  const addCustom = (name=custom.trim()) => {
    if (!name || !canAdd || sel.find(c=>c.name.toLowerCase()===name.toLowerCase())) return;
    setSel([...sel, { name, diff: diff||'INTER' }]); setCustom(''); setDiff(null);
  };
  const setSelDiff = (name,v) => setSel(sel.map(c=>c.name===name?{...c,diff:v}:c));

  return (
    <div className="screen">
      <div className="s-head" style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button className="iconbtn">{Ico.back}</button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:19 }}>Choisis tes catégories</h1>
          <p style={{ fontSize:12, marginTop:2, color:'var(--accent)', fontWeight:600 }}>{sel.length} / {MAX} sélectionnées · l'IA génère tes questions</p>
        </div>
      </div>

      <div className="s-body" style={{ gap:18 }}>
        {/* progress */}
        <div className="card" style={{ padding:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:9, fontSize:13 }}>
            <span className="muted">Progression</span>
            <span style={{ color:'var(--accent)', fontWeight:700 }}>{sel.length}/{MAX}</span>
          </div>
          <div style={{ height:8, borderRadius:99, background:'var(--surface-2)', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${sel.length/MAX*100}%`, background:'var(--accent)', borderRadius:99, transition:'width .3s' }}/>
          </div>
        </div>

        {/* selected */}
        {sel.length>0 && (
          <div>
            <div className="eyebrow" style={{ marginBottom:9, display:'flex', alignItems:'center', gap:6 }}><span style={{ color:'var(--accent)' }}>{Ico.check}</span> Sélectionnées</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {sel.map(c => {
                const info = PREDEFINED.find(p=>p.name===c.name);
                return (
                  <div key={c.name} className="card" style={{ padding:'10px 12px', display:'flex', alignItems:'center', gap:10, animation:'pop .3s both' }}>
                    <div style={{ width:34, height:34, borderRadius:10, display:'grid', placeItems:'center', fontSize:17,
                      background:`color-mix(in oklab, ${info?.color||'#9B59B6'} 18%, transparent)` }}>{info?.emoji||'✨'}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{c.name}</div>
                      <div style={{ display:'flex', gap:5, marginTop:5 }}>
                        {DIFFS.map(d=>(
                          <button key={d.v} onClick={()=>setSelDiff(c.name,d.v)} style={{
                            appearance:'none', cursor:'pointer', border:0, borderRadius:7, padding:'3px 8px', fontSize:10.5, fontWeight:700,
                            background: c.diff===d.v ? d.color : 'var(--surface-2)', color: c.diff===d.v ? '#11112a' : 'var(--txt-60)' }}>{d.label}</button>
                        ))}
                      </div>
                    </div>
                    <button onClick={()=>toggle(c.name)} className="iconbtn" style={{ width:30, height:30, background:'color-mix(in oklab,var(--buzz) 18%,transparent)', color:'var(--buzz)' }}>{Ico.x}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* predefined grid */}
        <div>
          <div className="eyebrow" style={{ marginBottom:10, color:'var(--host)' }}>Catégories populaires</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
            {PREDEFINED.map(p => {
              const on = sel.find(c=>c.name===p.name);
              return (
                <button key={p.name} onClick={()=>toggle(p.name)} disabled={!on && !canAdd} style={{
                  appearance:'none', cursor: (!on&&!canAdd)?'not-allowed':'pointer', textAlign:'left',
                  display:'flex', alignItems:'center', gap:9, padding:'12px 12px', borderRadius:14,
                  background: on ? `color-mix(in oklab, ${p.color} 16%, var(--surface))` : 'var(--surface)',
                  border:`1.5px solid ${on?p.color:'var(--line)'}`, opacity:(!on&&!canAdd)?.4:1, transition:'all .15s',
                  color:'var(--txt)', fontFamily:'var(--font-ui)' }}>
                  <span style={{ fontSize:20 }}>{p.emoji}</span>
                  <span style={{ fontWeight:600, fontSize:13.5 }}>{p.name}</span>
                  {on && <span style={{ marginLeft:'auto', color:p.color }}>{Ico.check}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* custom */}
        <div>
          <div className="eyebrow" style={{ marginBottom:10, color:'var(--host)' }}>Catégorie sur mesure</div>
          <div className="card" style={{ padding:14 }}>
            <textarea value={custom} onChange={e=>setCustom(e.target.value)} rows={2}
              placeholder="Ex: Marvel, années 90, histoire de France…"
              className="field" style={{ resize:'none', fontSize:14, fontWeight:500 }}/>
            {results.length>0 && (
              <div style={{ marginTop:8, display:'flex', flexWrap:'wrap', gap:6 }}>
                {results.map(r=>(
                  <button key={r} onClick={()=>{ setCustom(r); }} className="chip neutral" style={{ cursor:'pointer' }}>{r}</button>
                ))}
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:10 }}>
              {DIFFS.map(d=>(
                <button key={d.v} onClick={()=>setDiff(d.v)} style={{
                  appearance:'none', cursor:'pointer', border:`1px solid ${diff===d.v?d.color:'var(--line)'}`, borderRadius:9, padding:'7px 10px', fontSize:11.5, fontWeight:700,
                  background: diff===d.v ? d.color : 'var(--bg)', color: diff===d.v ? '#11112a' : 'var(--txt-60)' }}>{d.label}</button>
              ))}
              <button onClick={()=>addCustom()} disabled={!custom.trim()||!diff||!canAdd} className="iconbtn"
                style={{ marginLeft:'auto', width:38, height:38, borderRadius:11,
                  background:(custom.trim()&&diff&&canAdd)?'var(--accent)':'var(--surface-2)', color:(custom.trim()&&diff&&canAdd)?'#11112a':'var(--txt-40)' }}>{Ico.plus}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="s-foot">
        <button className="btn" disabled={sel.length===0} onClick={()=>onJoin(sel)}>Rejoindre la session {Ico.arrow}</button>
      </div>
    </div>
  );
}

/* ───────────────────────── LOBBY ───────────────────────── */
function LobbyScreen({ you, code, mode, myCats, onEditCats, onStart }) {
  const roster = ['Karim','Sofia','Yanis','Inès','Hugo','Noa','Lina'];
  const [players, setPlayers] = useState([{ name:you, host:true, you:true }]);
  const [reqOpen, setReqOpen] = useState(false);
  const [reqText, setReqText] = useState('');
  const [reqSent, setReqSent] = useState(false);
  useEffect(() => {
    let i=0; const id=setInterval(()=>{ i++; setPlayers(p=>[...p,{name:roster[i-1]}]); if(i>=roster.length) clearInterval(id); }, 520);
    return ()=>clearInterval(id);
  }, []);
  const CATINFO = (window.PREDEFINED||[]);
  return (
    <div className="screen">
      <div className="s-head" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Wordmark compact/>
        <div style={{ display:'flex', gap:6 }}>
          <span className="chip gold">{Ico.crown} Hôte</span>
          <span className="chip neutral" style={{ fontFamily:'var(--font-display)', letterSpacing:'0.1em' }}>{code}</span>
        </div>
      </div>

      <div className="s-body" style={{ gap:0 }}>
        <div style={{ textAlign:'center', marginTop:6, marginBottom:18, animation:'pop .5s both' }}>
          <div style={{ display:'inline-flex' }}><Avatar name={you} size={74} you/></div>
          <h1 style={{ fontSize:23, marginTop:13 }}>Tu es dans la partie&nbsp;!</h1>
          <p className="muted" style={{ fontSize:14, marginTop:4 }}>Salut <b style={{ color:'var(--txt)' }}>{you}</b> — garde ton pouce prêt</p>
        </div>

        {/* mode badges */}
        <div style={{ display:'flex', gap:7, justifyContent:'center', flexWrap:'wrap', marginBottom:16 }}>
          <span className={'chip '+(mode==='host'?'host':'gold')}>{Ico.crown} {mode==='host'?'Sans modérateur':'Avec modérateur'}</span>
          <span className="chip acc">{Ico.zap} 15 questions</span>
        </div>

        {/* my categories — editable + request */}
        <div className="card" style={{ padding:'13px 14px', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <span className="eyebrow" style={{ color:'var(--host)' }}>Mes catégories</span>
            <button onClick={onEditCats} className="chip" style={{ cursor:'pointer', padding:'5px 11px', background:'color-mix(in oklab,var(--host) 16%,transparent)', color:'var(--host)', border:'1px solid color-mix(in oklab,var(--host) 30%,transparent)' }}>✎ Modifier</button>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {(myCats||[]).map(c=>{
              const info=CATINFO.find(p=>p.name===c.name);
              return <span key={c.name} className="chip" style={{ background:'var(--bg)', border:'1px solid var(--line)', color:'var(--txt)' }}>{info?info.emoji+' ':''}{c.name}</span>;
            })}
            <button onClick={()=>setReqOpen(v=>!v)} className="chip" style={{ cursor:'pointer', background:'transparent', border:'1px dashed var(--line)', color:'var(--txt-60)' }}>+ Demander</button>
          </div>
          {reqOpen && (
            <div style={{ marginTop:11, display:'flex', flexDirection:'column', gap:8, animation:'rise .25s both' }}>
              {reqSent ? (
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--accent)' }}>{Ico.check} Demande envoyée à l'hôte</div>
              ) : (
                <>
                  <input className="field" value={reqText} onChange={e=>setReqText(e.target.value)} placeholder="Suggère une catégorie à l'hôte…" style={{ fontSize:14, padding:'11px 14px' }}/>
                  <button className="btn" disabled={reqText.trim().length<3} onClick={()=>{ setReqSent(true); setTimeout(()=>{setReqOpen(false);setReqSent(false);setReqText('');},1600); }} style={{ padding:'11px', fontSize:14 }}>Envoyer la demande</button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="card" style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', padding:'14px 14px 16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span className="eyebrow">Joueurs connectés</span>
            <span className="chip neutral" style={{ padding:'3px 9px' }}>{players.length}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:13, overflowY:'auto' }}>
            {players.map((p,i)=>(
              <button key={p.name+i} onClick={()=>window.__openProfile && window.__openProfile(p.name)} style={{ appearance:'none', border:0, background:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6, animation:'pop .35s both', padding:0 }}>
                <Avatar name={p.name} size={46} you={p.you} crown={p.host} ring={!p.you}/>
                <span style={{ fontSize:11.5, fontWeight:600, width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  color:p.you?'var(--txt)':'var(--txt-60)' }}>{p.you?'Toi':p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="s-foot">
        <button className="btn" onClick={onStart}><span className="dotpulse" style={{ background:'#11112a' }}/> Lancer la partie</button>
        <p className="muted" style={{ textAlign:'center', fontSize:11.5, marginTop:9 }}>L'hôte démarre quand tout le monde est prêt</p>
      </div>
    </div>
  );
}

Object.assign(window, { JoinScreen, CategoriesScreen, LobbyScreen, PREDEFINED });
