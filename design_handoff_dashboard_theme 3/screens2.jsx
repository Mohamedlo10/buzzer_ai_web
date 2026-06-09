/* screens2.jsx — Generating · Game (player, mode-aware) · YourTurn · Reveal */
const { useState: uS, useEffect: uE, useRef: uR } = React;

/* ───────────────── GENERATING (AI) ───────────────── */
function GeneratingScreen({ onDone }) {
  const [p, setP] = uS(0);
  uE(() => {
    const id = setInterval(()=> setP(v => { if(v>=100){clearInterval(id);return 100;} return Math.min(100, v + Math.max(0.6,(96-v)*0.06)); }), 110);
    const done = setTimeout(onDone, 4200);
    return ()=>{ clearInterval(id); clearTimeout(done); };
  }, []);
  const done = p>=99;
  return (
    <div className="screen">
      <div className="s-body" style={{ justifyContent:'center', alignItems:'center', gap:0, textAlign:'center', padding:'24px 26px' }}>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:64, color:'var(--accent)', lineHeight:1 }}>{Math.round(p)}%</div>
        <p className="muted" style={{ fontSize:15, marginTop:8 }}>{done?'Questions prêtes !':'Génération en cours…'}</p>
        <div style={{ width:'100%', marginTop:26 }}>
          <div style={{ position:'relative', height:44, borderRadius:99, background:'var(--surface-2)', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, width:`${Math.max(p,3)}%`, background:'linear-gradient(90deg,var(--accent-d),var(--accent))', borderRadius:99, transition:'width .4s' }}/>
            <div style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', left:`calc(${Math.max(p,3)}% - 18px)`, width:32, height:32, borderRadius:'50%', background:'#fff', display:'grid', placeItems:'center', fontSize:15, transition:'left .4s' }}>🏃</div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, fontSize:12 }}>
            <span className="muted">{done?'Terminé':'Préparation…'}</span>
            <span style={{ color:'var(--accent)', display:'flex', alignItems:'center', gap:6 }}><span className="dotpulse"/> Connecté</span>
          </div>
        </div>
        <div className="card" style={{ marginTop:28, padding:14, textAlign:'left', width:'100%' }}>
          <p style={{ fontWeight:700, fontSize:13.5, marginBottom:4 }}>Règle du buzz anticipé</p>
          <p className="muted" style={{ fontSize:12.5, lineHeight:1.5 }}>Buzzer avant la fin de la lecture <b style={{ color:'var(--txt)' }}>et</b> se tromper applique une pénalité de points.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:11 }}>
            <div style={{ padding:'8px 10px', borderRadius:10, background:'color-mix(in oklab,var(--buzz) 10%,transparent)', border:'1px solid color-mix(in oklab,var(--buzz) 25%,transparent)' }}>
              <p style={{ color:'var(--buzz-h)', fontSize:11.5, fontWeight:700 }}>Faux avec pénalité</p>
              <p className="muted" style={{ fontSize:11.5 }}>Buzz trop tôt + mauvaise réponse → retrait de points.</p>
            </div>
            <div style={{ padding:'8px 10px', borderRadius:10, background:'color-mix(in oklab,var(--accent) 9%,transparent)', border:'1px solid color-mix(in oklab,var(--accent) 25%,transparent)' }}>
              <p style={{ color:'var(--accent)', fontSize:11.5, fontWeight:700 }}>Faux sans pénalité</p>
              <p className="muted" style={{ fontSize:11.5 }}>Mauvaise réponse après lecture complète → aucun retrait.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── BUZZER (shared) ───────────────── */
function Buzzer({ disabled, label, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label="Buzzer" style={{
      position:'relative', width:184, height:184, borderRadius:'50%', border:0, cursor:disabled?'default':'pointer',
      background: disabled ? 'linear-gradient(135deg,#5A5A5A,var(--surface-2))' : 'linear-gradient(135deg, #FF4444, var(--buzz))',
      boxShadow: disabled ? '0 6px 16px rgba(0,0,0,.2)' : '0 8px 22px -4px color-mix(in oklab,var(--buzz) 70%,transparent)',
      outline:`3px solid ${disabled?'#5A5A5A':'var(--buzz-h)'}`, outlineOffset:-3, transition:'transform .12s', display:'grid', placeItems:'center' }}>
      {!disabled && <span style={{ position:'absolute', inset:-4, borderRadius:'50%', border:'2px solid var(--buzz)', animation:'ping 1.6s ease-out infinite' }}/>}
      <span style={{ position:'absolute', top:0, left:0, right:0, height:78, borderRadius:'50% 50% 0 0', background:'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)' }}/>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', color: disabled?'rgba(255,255,255,0.4)':'#fff' }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8z"/></svg>
        <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:20, marginTop:2, letterSpacing:'0.05em' }}>{label||'BUZZ'}</span>
      </div>
    </button>
  );
}

/* ───────────────── GAME (player, mode-aware) ─────────────────
   mode 'host'  = sans modérateur : lecture progressive + choix A/B/C/D
   mode 'mod'   = avec modérateur  : écoute (pas de texte/choix), validation par le modérateur */
function GameScreen({ mode, q, index, total, rows, you, format, myTeamId, onBuzz, onTimeout, onAdvance }) {
  const TOTAL = mode==='host' ? 18 : 22;
  const teams = format==='teams';
  const myTeam = teams ? window.teamById(myTeamId) : null;
  const mate = teams ? (rows.find(r=>r.teamId===myTeamId && r.name!==you)||{}).name || 'Karim' : null;
  const words = q.q.split(' ');
  const [wi, setWi] = uS(0);
  const [sec, setSec] = uS(TOTAL);
  const [buzzed, setBuzzed] = uS(false);
  const [queue, setQueue] = uS([]);
  const [mState, setMState] = uS('idle'); // mod: idle|answering|correct|wrong|rival
  const [teamLock, setTeamLock] = uS(false); // teams: a teammate buzzed first
  const fired = uR(false);

  // progressive reveal (host only)
  uE(() => { if (mode!=='host' || buzzed || wi>=words.length-1) return; const t=setTimeout(()=>setWi(v=>v+1),230); return ()=>clearTimeout(t); }, [wi, buzzed, mode]);

  // global countdown (host: timeout if nobody answers)
  uE(() => {
    if (mode!=='host' || buzzed) return;
    const id = setInterval(()=> setSec(s=>{ if(s<=1){ clearInterval(id); if(!fired.current){fired.current=true; setTimeout(onTimeout,0);} return 0; } return s-1; }), 1000);
    return ()=>clearInterval(id);
  }, [buzzed, mode]);

  // a rival buzzes if you wait too long
  uE(() => {
    if (buzzed || mState!=='idle' || teamLock) return;
    const t = setTimeout(()=>{
      // teams mode: a TEAMMATE buzzes first → your whole team is locked out
      if (teams && Math.random()<0.6) {
        setQueue([{ name:mate, ms:680+Math.floor(Math.random()*300), teamId:myTeamId }]);
        setTeamLock(true);
        return;
      }
      const rival = { name:'Sofia', ms:820+Math.floor(Math.random()*400), teamId: teams?(myTeamId==='red'?'blue':'red'):undefined };
      setQueue([rival]);
      if (mode==='mod') { setMState('rival'); if(!fired.current){ fired.current=true; setTimeout(()=>onAdvance(false), 2600);} }
      else { if(!fired.current){ fired.current=true; setTimeout(onTimeout, 1600);} }
    }, mode==='host'?6500:7000);
    return ()=>clearTimeout(t);
  }, [buzzed, mState, mode, teamLock]);

  const buzz = () => {
    if (buzzed || mState!=='idle' || teamLock) return;
    setBuzzed(true);
    setQueue([{ name:'Toi', ms:300+Math.floor(Math.random()*240), you:true, teamId: teams?myTeamId:undefined }]);
    if (mode==='host') { setTimeout(onBuzz, 850); }
    else {
      setMState('answering');
      setTimeout(()=>{
        const correct = Math.random() < 0.55;
        setMState(correct?'correct':'wrong');
        if(!fired.current){ fired.current=true; setTimeout(()=>onAdvance(correct), correct?1700:3200); }
      }, 2000);
    }
  };

  const fullyRevealed = wi >= words.length-1;
  const buzzerDisabled = buzzed || mState==='wrong' || mState==='rival' || teamLock;

  return (
    <div className="screen">
      <div className="s-head">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button className="iconbtn" style={{ width:34, height:34 }}>{Ico.back}</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:17 }}>Question {index+1}<span style={{ color:'var(--txt-40)', fontWeight:400 }}> / {total}</span></div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}><span className="dotpulse"/><span className="muted" style={{ fontSize:11 }}>Connecté</span></div>
          </div>
          {mode==='host' ? <Ring seconds={sec} total={TOTAL} size={46}/>
            : <span className="chip gold">{Ico.crown} Avec modérateur</span>}
        </div>
        <div style={{ display:'flex', gap:7, marginTop:12 }}>
          <span className="chip acc">{q.cat}</span>
          <span className="chip neutral">{q.diff}</span>
          {teams && <span className="chip team" style={{ marginLeft:'auto' }}>{Ico.users} {myTeam.name}</span>}
        </div>
      </div>

      <div className="s-body" style={{ gap:14 }}>
        {/* question area */}
        {mode==='host' ? (
          <div className="card" style={{ padding:18 }}>
            <div className="eyebrow" style={{ marginBottom:10 }}>Question</div>
            <p style={{ fontSize:19, lineHeight:1.5, fontWeight:500, minHeight:84, textWrap:'pretty' }}>
              {words.slice(0,wi+1).join(' ')}
              {!fullyRevealed && !buzzed && <span style={{ display:'inline-block', width:2, height:'1.05em', background:'rgba(255,255,255,0.5)', marginLeft:3, verticalAlign:'text-bottom', animation:'blink 1s steps(1) infinite' }}/>}
            </p>
            {!fullyRevealed && !buzzed && <div className="chip gold" style={{ marginTop:4, fontSize:11 }}>⚡ Lecture en cours — buzz risqué</div>}
          </div>
        ) : (
          <div className="card" style={{ padding:'22px 18px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
            <div style={{ width:60, height:60, borderRadius:'50%', display:'grid', placeItems:'center', marginBottom:10,
              background:'color-mix(in oklab,var(--accent) 13%,transparent)', color:'var(--accent)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/></svg>
            </div>
            <p style={{ fontWeight:600, fontSize:16 }}>Écoute la question…</p>
            <p className="muted" style={{ fontSize:13, marginTop:4 }}>Le modérateur lit la question à voix haute</p>
          </div>
        )}

        {/* buzzer or status (mod) */}
        {mState==='idle' || mState==='rival' ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'6px 0' }}>
            <Buzzer disabled={buzzerDisabled} label={teamLock?'🔒':undefined} onClick={buzz}/>
            {teamLock ? (
              <div className="card" style={{ padding:'11px 15px', display:'flex', alignItems:'center', gap:10, width:'100%', border:`1.5px solid ${myTeam.color}`, background:`color-mix(in oklab,${myTeam.color} 12%,var(--surface))` }}>
                <span style={{ width:30, height:30, borderRadius:9, background:myTeam.color, color:'#fff', display:'grid', placeItems:'center', flexShrink:0 }}>{Ico.users}</span>
                <div><p style={{ fontWeight:700, fontSize:13.5 }}>Votre équipe a déjà buzzé</p><p className="muted" style={{ fontSize:12 }}><b style={{ color:'var(--txt)' }}>{mate}</b> répond pour {myTeam.name}</p></div>
              </div>
            ) : (
              <p className="muted" style={{ fontSize:13, textAlign:'center' }}>
                {mState==='rival' ? `${queue[0]?.name} a buzzé — réponse en cours…` : (mode==='host'?'Clique ou appuie sur Espace':'Sois le premier à buzzer')}</p>
            )}
          </div>
        ) : (
          /* mod: post-buzz status */
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'10px 0' }}>
            <Buzzer disabled label={mState==='correct'?'✓':mState==='wrong'?'✕':'…'} onClick={()=>{}}/>
            {mState==='answering' && (
              <div className="card" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:11, width:'100%' }}>
                <div className="spinner" style={{ borderColor:'color-mix(in oklab,var(--accent) 40%,transparent)', borderTopColor:'var(--accent)' }}/>
                <div><p style={{ fontWeight:700, fontSize:14 }}>Tu as buzzé ! Réponds à voix haute</p><p className="muted" style={{ fontSize:12 }}>En attente de la validation du modérateur…</p></div>
              </div>
            )}
            {mState==='correct' && (
              <div className="card" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:11, width:'100%', border:'1.5px solid var(--accent)', background:'color-mix(in oklab,var(--accent) 12%,var(--surface))' }}>
                <span style={{ color:'var(--accent)' }}>{Ico.check}</span>
                <div><p style={{ fontWeight:700, fontSize:14, color:'var(--accent)' }}>Validé — bonne réponse !</p><p className="muted" style={{ fontSize:12 }}>+800 points</p></div>
              </div>
            )}
            {mState==='wrong' && (
              <div className="card" style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:11, width:'100%', border:'1.5px solid var(--buzz)', background:'color-mix(in oklab,var(--buzz) 12%,var(--surface))' }}>
                <span style={{ color:'var(--buzz)' }}>{Ico.x}</span>
                <div><p style={{ fontWeight:700, fontSize:14, color:'var(--buzz)' }}>Réponse incorrecte</p><p className="muted" style={{ fontSize:12 }}>Buzzer désactivé — les autres peuvent répondre</p></div>
              </div>
            )}
          </div>
        )}

        {/* buzz queue */}
        <BuzzQueue queue={queue} teams={teams}/>

        {/* live leaderboard (team or individual) */}
        {teams ? <TeamLeaderboard rows={rows} you={you}/> : <LiveLeaderboard rows={rows} you={you}/>}
      </div>

      {buzzed && mode==='host' && <div style={{ position:'absolute', inset:0, background:'var(--accent)', mixBlendMode:'overlay', animation:'flash .85s ease-out forwards', pointerEvents:'none' }}/>}
    </div>
  );
}

/* buzz queue panel (shared) */
function BuzzQueue({ queue, teams }) {
  return (
    <div style={{ borderRadius:18, overflow:'hidden', border:`1px solid ${queue.length?'var(--accent)':'var(--line)'}`, background: queue.length?'color-mix(in oklab,var(--accent) 6%,transparent)':'var(--surface)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 13px', borderBottom:`1px solid ${queue.length?'color-mix(in oklab,var(--accent) 25%,transparent)':'var(--line)'}` }}>
        <div style={{ width:28, height:28, borderRadius:'50%', display:'grid', placeItems:'center', background:queue.length?'var(--accent)':'var(--surface-2)', color:queue.length?'var(--btn-fg)':'var(--txt-40)' }}>{Ico.zap}</div>
        <span style={{ fontWeight:700, fontSize:14 }}>File d'attente</span>
        <span className="chip" style={{ padding:'2px 8px', background:queue.length?'var(--accent)':'var(--surface-2)', color:queue.length?'var(--btn-fg)':'var(--txt)' }}>{queue.length}</span>
        {queue.length>0 && <span className="chip acc" style={{ marginLeft:'auto', padding:'3px 9px' }}><span className="dotpulse"/> En cours</span>}
      </div>
      {queue.length>0 ? queue.map((b,i)=>{
        const team = (teams && b.teamId) ? window.teamById(b.teamId) : null;
        return (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:11, padding:'11px 13px', background:'color-mix(in oklab,var(--accent) 8%,transparent)' }}>
          <div style={{ width:40, height:40, borderRadius:'50%', display:'grid', placeItems:'center', background:'var(--accent)', color:'var(--btn-fg)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:17 }}>1</div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ fontWeight:700, fontSize:15, color:b.you?'var(--energy)':'var(--txt)' }}>{b.name}{b.you?' (Vous)':''}</span>
              {team && <span className="chip" style={{ padding:'1px 8px', fontSize:10, background:`color-mix(in oklab,${team.color} 22%,transparent)`, color:team.color }}>{team.name}</span>}
            </div>
            <div style={{ fontSize:12.5, color:'var(--accent)', marginTop:1 }}>En train de répondre</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:15 }}>{fmtMs(b.ms)}</div>
            <div className="muted" style={{ fontSize:10.5 }}>réaction</div>
          </div>
        </div>
      );}) : <div style={{ padding:'16px 13px', textAlign:'center' }}><p className="muted" style={{ fontSize:12.5 }}>Personne n'a encore buzzé — sois le premier</p></div>}
    </div>
  );
}

/* live leaderboard panel shown under the buzzer during the game */
function LiveLeaderboard({ rows, you }) {
  const sorted = [...rows].sort((a,b)=>b.score-a.score);
  const top3 = sorted.slice(0,3), rest = sorted.slice(3);
  const MED = ['var(--energy)','var(--silver)','var(--bronze)'];
  return (
    <div className="card" style={{ overflow:'hidden', padding:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderBottom:'1px solid var(--line)', background:'color-mix(in oklab,var(--energy) 5%,transparent)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}><span style={{ color:'var(--energy)' }}>🏆</span><span style={{ fontWeight:700, fontSize:14 }}>Classement</span></div>
        <span className="muted" style={{ fontSize:11 }}>{rows.length} joueurs</span>
      </div>
      <div style={{ display:'flex', gap:8, padding:'12px 12px', borderBottom: rest.length?'1px solid var(--line)':'none' }}>
        {top3.map((p,i)=>{
          const isYou=p.name===you;
          return (
            <div key={p.name} onClick={()=>window.__openProfile&&window.__openProfile(p.name)} style={{ flex:1, cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:5, padding:'8px 4px', borderRadius:12, background:isYou?'color-mix(in oklab,var(--accent) 12%,transparent)':'var(--bg)', border:`1px solid ${isYou?'var(--accent)':'var(--line)'}` }}>
              <Avatar name={p.name} size={34} you={isYou} crown={i===0} ring={i>0?MED[i]:false}/>
              <span style={{ fontSize:11, fontWeight:600, width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{isYou?'Toi':p.name}</span>
              <span style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:13, color:MED[i] }}>{p.score}</span>
            </div>
          );
        })}
      </div>
      {rest.map((p,i)=>{
        const isYou=p.name===you;
        return (
          <div key={p.name} onClick={()=>window.__openProfile&&window.__openProfile(p.name)} style={{ display:'flex', cursor:'pointer', alignItems:'center', gap:10, padding:'8px 14px', borderBottom:i<rest.length-1?'1px solid var(--line)':'none', background:isYou?'color-mix(in oklab,var(--accent) 9%,transparent)':'transparent' }}>
            <span style={{ width:18, textAlign:'center', fontFamily:'var(--font-display)', fontWeight:600, fontSize:13, color:'var(--txt-40)' }}>{i+4}</span>
            <Avatar name={p.name} size={28} you={isYou}/>
            <span style={{ flex:1, fontSize:13, fontWeight:600, color:isYou?'var(--accent)':'var(--txt)' }}>{isYou?'Toi':p.name}{isYou&&' (Vous)'}</span>
            <span style={{ fontSize:13, fontWeight:600 }}>{p.score} <span className="muted" style={{ fontSize:10 }}>pts</span></span>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────── FOCUS MODE — answer choices (host / sans modérateur, 1er en file) ─────────────────
   When you win the buzz, the screen enters a focused takeover: everything else
   dims, only the question + A/B/C/D remain, with a prominent timer. */
function YourTurnScreen({ q, onAnswer }) {
  const TOTAL = 10;
  const [sec, setSec] = uS(TOTAL);
  const [picked, setPicked] = uS(null);
  uE(()=>{ const id=setInterval(()=>setSec(s=>{ if(s<=1){clearInterval(id); if(picked==null)setTimeout(()=>onAnswer(-1,0),0); return 0;} return s-1; }),1000); return ()=>clearInterval(id); }, [picked]);
  const pick = (i)=>{ if(picked!=null)return; setPicked(i); setTimeout(()=>onAnswer(i,sec),420); };
  const LBL=['A','B','C','D'];
  const danger = sec<=3;
  return (
    <div className="screen" style={{ position:'relative' }}>
      {/* focus backdrop: accent glow + vignette */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(120% 70% at 50% 0%, color-mix(in oklab,var(--accent) 22%, transparent) 0%, transparent 55%)' }}/>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', boxShadow:'inset 0 0 120px 30px rgba(0,0,0,0.35)' }}/>

      <div className="s-body" style={{ gap:0, justifyContent:'space-between', position:'relative', zIndex:1 }}>
        {/* focus header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', animation:'rise .4s both' }}>
          <span className="chip" style={{ background:'var(--accent)', color:'var(--btn-fg)', fontWeight:700 }}>🎯 Mode focus · à toi&nbsp;!</span>
          <Ring seconds={sec} total={TOTAL} size={52}/>
        </div>

        {/* question */}
        <div style={{ textAlign:'center', margin:'8px 0', animation:'pop .45s both' }}>
          <div className="eyebrow" style={{ marginBottom:8 }}>{q.cat}</div>
          <h2 style={{ fontSize:24, lineHeight:1.2, textWrap:'pretty' }}>{q.q}</h2>
        </div>

        {/* timer bar */}
        <div style={{ marginBottom:4 }}><TimerBar seconds={sec} total={TOTAL}/></div>

        {/* choices — large, focus */}
        <div className="stagger" style={{ display:'flex', flexDirection:'column', gap:11 }}>
          {q.opts.map((o,i)=>{
            const on=picked===i, dim=picked!=null&&!on;
            return (
              <button key={i} onClick={()=>pick(i)} disabled={picked!=null} style={{
                appearance:'none', cursor:picked!=null?'default':'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:13, padding:'16px 15px', borderRadius:16, minHeight:62,
                background: on?'color-mix(in oklab,var(--accent) 22%,var(--surface))':'var(--surface)', border:`1.5px solid ${on?'var(--accent)':'var(--line)'}`,
                opacity:dim?.4:1, transition:'opacity .2s, background .18s, box-shadow .2s',
                color:'var(--txt)', fontFamily:'var(--font-ui)', boxShadow: on?'0 0 0 3px color-mix(in oklab,var(--accent) 30%,transparent)':'none' }}>
                <span style={{ width:36, height:36, borderRadius:11, flexShrink:0, display:'grid', placeItems:'center', background: on?'var(--accent)':'var(--surface-2)', color: on?'var(--btn-fg)':'var(--txt)', fontWeight:700, fontSize:15, fontFamily:'var(--font-display)' }}>{LBL[i]}</span>
                <span style={{ fontSize:16, fontWeight:600, lineHeight:1.25 }}>{o}</span>
              </button>
            );
          })}
        </div>

        <p style={{ textAlign:'center', fontSize:12.5, marginTop:4, color:danger?'var(--buzz)':'var(--txt-60)', fontWeight:danger?700:400 }}>
          {danger ? '⏱ Vite, le temps file !' : 'Plus tu réponds vite, plus tu marques de points'}</p>
      </div>
    </div>
  );
}

/* ───────────────── REVEAL (host only — auto-advance, no player control) ───────────────── */
function RevealScreen({ q, picked, gained, penalty, tooSlow, early, last, onContinue }) {
  uE(()=>{ const t=setTimeout(onContinue, 2600); return ()=>clearTimeout(t); }, []);
  const correct = !tooSlow && picked===q.ans;
  const head = tooSlow ? 'Trop lent…' : correct ? 'Bonne réponse !' : 'Raté…';
  const tone = correct ? 'var(--accent)' : 'var(--buzz)';
  const LBL=['A','B','C','D'];
  return (
    <div className="screen">
      <div className="s-body" style={{ gap:0, justifyContent:'space-between' }}>
        <div style={{ textAlign:'center', marginTop:14, animation:'pop .5s both' }}>
          <div style={{ fontSize:54, lineHeight:1 }}>{tooSlow?'😴':correct?'🎉':'😬'}</div>
          <h1 style={{ fontSize:30, marginTop:12, color:tone }}>{head}</h1>
          <p className="muted" style={{ fontSize:14, marginTop:6 }}>
            {tooSlow ? 'Un autre joueur a buzzé avant toi' : correct ? 'Réflexes en éclair' : early ? 'Buzz anticipé : pénalité appliquée' : 'La bonne réponse était surlignée'}</p>
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:10, margin:'18px 0' }}>
          <div className="card" style={{ padding:'14px 20px', textAlign:'center', minWidth:120 }}>
            <div className="eyebrow" style={{ color:'var(--txt-40)' }}>Points</div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:32, marginTop:4, color: gained>0?'var(--accent)':penalty?'var(--buzz)':'var(--txt-40)' }}>{gained>0?'+':''}{gained||(penalty?`-${penalty}`:0)}</div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {q.opts.map((o,i)=>{
            const isAns=i===q.ans, isWrong=i===picked&&!correct;
            let bg='var(--surface)', bd='var(--line)', op=1, c='var(--txt)';
            if(isAns){ bg='var(--accent)'; bd='var(--accent)'; c='#11112a'; } else if(isWrong){ bg='color-mix(in oklab,var(--buzz) 22%,var(--surface))'; bd='var(--buzz)'; } else op=.4;
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 13px', borderRadius:14, background:bg, border:`1.5px solid ${bd}`, opacity:op, color:c }}>
                <span style={{ width:28, height:28, borderRadius:8, flexShrink:0, display:'grid', placeItems:'center', background:isAns?'rgba(0,0,0,0.16)':'var(--surface-2)', fontWeight:700, fontSize:12, color:isAns?'#11112a':'var(--txt)' }}>{LBL[i]}</span>
                <span style={{ fontSize:14.5, fontWeight:600, flex:1 }}>{o}</span>
                {isAns && <span>{Ico.check}</span>}
                {isWrong && <span style={{ color:'var(--buzz)' }}>{Ico.x}</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="s-foot" style={{ textAlign:'center' }}>
        <p className="muted" style={{ fontSize:12.5, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><span className="dotpulse"/> {last?'Résultats…':'Question suivante…'}</p>
      </div>
    </div>
  );
}

Object.assign(window, { GeneratingScreen, GameScreen, BuzzQueue, LiveLeaderboard, YourTurnScreen, RevealScreen, Buzzer });
