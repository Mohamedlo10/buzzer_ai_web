/* moderator.jsx — Moderator / Host game view (WITH_MODERATOR)
   The moderator reads the question aloud, sees the answer, watches the buzz
   queue (reaction times), and validates Juste/Faux. Controls flow. */
const { useState: mS, useEffect: mE, useRef: mR } = React;

/* small +/- correction button */
function corrBtn(tone){
  const c = tone==='buzz' ? 'var(--buzz)' : 'var(--accent)';
  return { appearance:'none', cursor:'pointer', border:`1px solid color-mix(in oklab,${c} 35%,transparent)`,
    background:`color-mix(in oklab,${c} 14%,transparent)`, color:c, fontFamily:'var(--font-display)', fontWeight:600,
    fontSize:12, borderRadius:9, padding:'7px 8px', minWidth:38 };
}

function ModeratorGameScreen({ q, index, total, rows, setRows, you, format, onNext, last }) {
  const teams = format==='teams';
  const [showAnswer, setShowAnswer] = mS(true);
  const [queue, setQueue] = mS([]);          // [{id,name,ms}]
  const [cd, setCd] = mS(10);                // first-buzzer countdown
  const [locked, setLocked] = mS([]);        // names locked out this question
  const [pendingFaux, setPendingFaux] = mS(false);
  const [paused, setPaused] = mS(false);
  const [correctMode, setCorrectMode] = mS(false);
  const [toast, setToast] = mS(null);

  const ROSTER = [{id:'sofia',name:'Sofia',ms:740},{id:'yanis',name:'Yanis',ms:1320},{id:'ines',name:'Inès',ms:2010}];

  // simulate players buzzing in over time
  mE(() => {
    if (paused) return;
    const timers = [];
    timers.push(setTimeout(()=> setQueue(qz=> qz.length?qz:[ROSTER[0]]), 2400));
    timers.push(setTimeout(()=> setQueue(qz=> qz.find(x=>x.id==='yanis')?qz:[...qz,ROSTER[1]]), 4400));
    timers.push(setTimeout(()=> setQueue(qz=> qz.find(x=>x.id==='ines')?qz:[...qz,ROSTER[2]]), 6200));
    return ()=> timers.forEach(clearTimeout);
  }, [paused]);

  // first-buzzer countdown
  mE(() => {
    if (!queue.length || paused) return;
    setCd(10);
    const id = setInterval(()=> setCd(c=> c<=1 ? (clearInterval(id),0) : c-1), 1000);
    return ()=> clearInterval(id);
  }, [queue.length>0 ? queue[0]?.id : null, paused]);

  const flashToast = (msg, tone) => { setToast({msg,tone}); setTimeout(()=>setToast(null), 1400); };

  const award = (name, pts) => setRows(rs => rs.map(r=> r.name===name ? {...r, score:Math.max(0,r.score+pts), lastGain:pts} : r));

  const handleJuste = () => {
    const first = queue[0]; if(!first) return;
    const pts = 500 + Math.round((cd/10)*400);
    award(first.name, pts);
    flashToast(`✓ ${first.name} +${pts}`, 'ok');
    setTimeout(onNext, 700);
  };
  const handleFaux = (penalty) => {
    const first = queue[0]; if(!first) return;
    if (penalty) award(first.name, -150);
    setLocked(l=>[...l, first.name]);
    setQueue(qz => qz.slice(1));
    setPendingFaux(false);
    flashToast(penalty?`✕ ${first.name} −150`:`✕ ${first.name}`, 'bad');
  };
  const handleReset = () => { setQueue([]); setPendingFaux(false); flashToast('Buzzer réinitialisé', 'neutral'); };
  const handleSkip = () => { flashToast('Question passée', 'neutral'); setTimeout(onNext, 500); };

  const sorted = [...rows].sort((a,b)=>b.score-a.score);
  const MED = ['var(--energy)','var(--silver)','var(--bronze)'];
  const first = queue[0];

  return (
    <div className="screen">
      <div className="s-head">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button className="iconbtn" style={{ width:34, height:34 }}>{Ico.back}</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:17 }}>Question {index+1}<span style={{ color:'var(--txt-40)', fontWeight:400 }}> / {total}</span></div>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}><span className="dotpulse"/><span className="muted" style={{ fontSize:11 }}>Connecté</span></div>
          </div>
          <span className="chip gold">{Ico.crown} Modérateur</span>
        </div>
        <div style={{ display:'flex', gap:7, marginTop:12 }}>
          <span className="chip acc">{q.cat}</span>
          <span className="chip neutral">{q.diff}</span>
        </div>
      </div>

      <div className="s-body" style={{ gap:12 }}>
        {/* question + answer (moderator reads aloud) */}
        <div className="card" style={{ padding:16 }}>
          <div className="eyebrow" style={{ marginBottom:8 }}>Question — lis à voix haute</div>
          <p style={{ fontSize:17, lineHeight:1.45, fontWeight:500, textWrap:'pretty' }}>{q.q}</p>
        </div>
        <div className="card" style={{ padding:0, overflow:'hidden', border:'1px solid color-mix(in oklab,var(--accent) 35%,transparent)', background:'color-mix(in oklab,var(--accent) 7%,var(--surface))' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px' }}>
            <span className="eyebrow" style={{ display:'flex', alignItems:'center', gap:6 }}>🎯 Réponse</span>
            <button onClick={()=>setShowAnswer(v=>!v)} className="chip neutral" style={{ cursor:'pointer', padding:'4px 10px' }}>{showAnswer?'Masquer':'Afficher'}</button>
          </div>
          {showAnswer ? (
            <div style={{ padding:'0 14px 14px' }}>
              <p style={{ fontSize:16, fontWeight:700, color:'var(--accent)' }}>{q.opts[q.ans]}</p>
              {q.explanation && <p className="muted" style={{ fontSize:12.5, marginTop:5, lineHeight:1.45 }}>{q.explanation}</p>}
            </div>
          ) : (
            <div style={{ padding:'0 14px 16px' }}><div style={{ height:40, borderRadius:10, border:'1px dashed var(--line)', display:'grid', placeItems:'center', color:'var(--txt-40)', fontSize:12 }}>Réponse masquée</div></div>
          )}
        </div>

        {/* buzz queue + validation */}
        <div style={{ borderRadius:18, overflow:'hidden', border:`1px solid ${queue.length?'var(--accent)':'var(--line)'}`, background:queue.length?'color-mix(in oklab,var(--accent) 6%,transparent)':'var(--surface)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 13px', borderBottom:`1px solid ${queue.length?'color-mix(in oklab,var(--accent) 25%,transparent)':'var(--line)'}` }}>
            <div style={{ width:28, height:28, borderRadius:'50%', display:'grid', placeItems:'center', background:queue.length?'var(--accent)':'var(--surface-2)', color:queue.length?'#11112a':'var(--txt-40)' }}>{Ico.zap}</div>
            <span style={{ fontWeight:700, fontSize:14 }}>File de buzz</span>
            <span className="chip" style={{ padding:'2px 8px', background:queue.length?'var(--accent)':'var(--surface-2)', color:queue.length?'#11112a':'var(--txt)' }}>{queue.length}</span>
            {!queue.length && <span className="muted" style={{ marginLeft:'auto', fontSize:11.5 }}>En attente de buzz…</span>}
          </div>

          {queue.map((b,i)=>(
            <div key={b.id} style={{ padding:'11px 13px', borderBottom:i<queue.length-1?'1px solid var(--line)':'none', background:i===0?'color-mix(in oklab,var(--accent) 9%,transparent)':'transparent' }}>
              <div style={{ display:'flex', alignItems:'center', gap:11 }}>
                <div style={{ width:i===0?40:32, height:i===0?40:32, borderRadius:'50%', display:'grid', placeItems:'center', background:i===0?'var(--accent)':'var(--surface-2)', color:i===0?'#11112a':'var(--txt)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:i===0?17:14 }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:i===0?15:14 }}>{b.name}</div>
                  {i===0 && <div style={{ fontSize:12, color:'var(--accent)' }}>Répond maintenant</div>}
                </div>
                <div style={{ textAlign:'right' }}><div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:14 }}>{fmtMs(b.ms)}</div><div className="muted" style={{ fontSize:10 }}>réaction</div></div>
              </div>
              {i===0 && (
                <div style={{ marginTop:10 }}>
                  {/* countdown */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ flex:1, height:6, borderRadius:99, background:'var(--surface-2)', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${cd/10*100}%`, background: cd<=3?'var(--buzz)':cd<=6?'var(--warn)':'var(--accent)', transition:'width 1s linear' }}/>
                    </div>
                    <span style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:13, width:18, textAlign:'right', color:cd<=3?'var(--buzz)':'var(--txt)' }}>{cd}</span>
                  </div>
                  {!pendingFaux ? (
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={handleJuste} className="btn" style={{ flex:1, padding:'12px', fontSize:14 }}>{Ico.check} Juste</button>
                      <button onClick={()=>setPendingFaux(true)} className="btn" style={{ flex:1, padding:'12px', fontSize:14, background:'linear-gradient(135deg,#FF4444,var(--buzz))', color:'#fff', boxShadow:'none' }}>{Ico.x} Faux</button>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      <p className="muted" style={{ fontSize:11.5, textAlign:'center' }}>Mauvaise réponse — appliquer une pénalité ?</p>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={()=>handleFaux(true)} className="btn" style={{ flex:1, padding:'11px', fontSize:13, background:'var(--buzz)', color:'#fff', boxShadow:'none' }}>Avec pénalité (−150)</button>
                        <button onClick={()=>handleFaux(false)} className="btn sec" style={{ flex:1, padding:'11px', fontSize:13 }}>Sans pénalité</button>
                      </div>
                      <button onClick={()=>setPendingFaux(false)} style={{ appearance:'none', background:'none', border:0, color:'var(--txt-40)', fontSize:12, cursor:'pointer', fontFamily:'var(--font-ui)' }}>Annuler</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {!queue.length && (
            <div style={{ padding:'16px 13px', textAlign:'center' }}><p className="muted" style={{ fontSize:12.5 }}>{locked.length?`${locked.length} joueur(s) verrouillé(s) ce tour`:'Personne n\'a buzzé pour l\'instant'}</p></div>
          )}
        </div>

        {/* moderator controls */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handleReset} className="btn sec" style={{ flex:1, padding:'11px', fontSize:13 }}>↺ Reset</button>
          <button onClick={()=>setPaused(p=>!p)} className="btn sec" style={{ flex:1, padding:'11px', fontSize:13 }}>{paused?'▶ Reprendre':'⏸ Pause'}</button>
          <button onClick={handleSkip} className="btn sec" style={{ flex:1, padding:'11px', fontSize:13 }}>{last?'Terminer':'Passer ›'}</button>
        </div>

        {/* live leaderboard + score correction */}
        <div className="card" style={{ overflow:'hidden', padding:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderBottom:'1px solid var(--line)', background:'color-mix(in oklab,var(--energy) 5%,transparent)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}><span style={{ color:'var(--energy)' }}>🏆</span><span style={{ fontWeight:700, fontSize:14 }}>Classement</span></div>
            <button onClick={()=>setCorrectMode(true)} className="chip" style={{ cursor:'pointer', padding:'4px 10px', background:'var(--surface-2)', color:'var(--txt-60)' }}>✎ Corriger</button>
          </div>
          {sorted.map((r,i)=>{
            const isYou=r.name===you;
            return (
              <div key={r.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', borderBottom:i<sorted.length-1?'1px solid var(--line)':'none', background:isYou?'color-mix(in oklab,var(--accent) 9%,transparent)':'transparent' }}>
                <span style={{ width:18, textAlign:'center', fontFamily:'var(--font-display)', fontWeight:600, fontSize:13, color:i<3?MED[i]:'var(--txt-40)' }}>{i+1}</span>
                <Avatar name={r.name} size={30} you={isYou} crown={i===0}/>
                <span style={{ flex:1, fontSize:13, fontWeight:600, color:isYou?'var(--accent)':'var(--txt)' }}>{isYou?'Toi':r.name}</span>
                <span style={{ fontSize:13, fontWeight:600 }}>{r.score} <span className="muted" style={{ fontSize:10 }}>pts</span></span>
              </div>
            );
          })}
        </div>
      </div>

      {/* score correction sheet — avatars visibles + ajustement par joueur */}
      {correctMode && (
        <div onClick={()=>setCorrectMode(false)} style={{ position:'absolute', inset:0, zIndex:30, background:'var(--scrim)', backdropFilter:'blur(3px)', display:'flex', alignItems:'flex-end', animation:'fadein .2s both' }}>
          <div onClick={e=>e.stopPropagation()} className="card" style={{ width:'100%', maxHeight:'88%', display:'flex', flexDirection:'column', borderRadius:'24px 24px 0 0', borderBottom:0, animation:'sheetup .3s cubic-bezier(.2,.8,.2,1) both' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 0 2px', position:'relative' }}>
              <div style={{ width:38, height:4, borderRadius:99, background:'var(--surface-2)' }}/>
              <button onClick={()=>setCorrectMode(false)} className="iconbtn" style={{ position:'absolute', right:14, top:6, width:32, height:32 }}>{Ico.x}</button>
            </div>
            <div style={{ padding:'4px 18px 10px' }}>
              <h2 style={{ fontSize:19 }}>Corriger les scores</h2>
              <p className="muted" style={{ fontSize:12.5, marginTop:3 }}>Ajuste manuellement les points d'un joueur (erreur d'arbitrage, bonus…).</p>
            </div>
            <div className="s-body" style={{ padding:'0 14px 22px', gap:9 }}>
              {sorted.map((r,i)=>{
                const isYou=r.name===you;
                return (
                  <div key={r.name} className="card" style={{ padding:'11px 12px', display:'flex', alignItems:'center', gap:11, background:'var(--bg)' }}>
                    <Avatar name={r.name} size={44} you={isYou} crown={i===0} ring={i>0&&i<3?MED[i]:false}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:700, fontSize:14 }}>{isYou?'Toi':r.name}</p>
                      <p style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:16, color:i<3?MED[i]:'var(--txt)' }}>{r.score} <span className="muted" style={{ fontSize:10, fontFamily:'var(--font-ui)' }}>pts</span></p>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <button onClick={()=>{award(r.name,-100);flashToast(`${r.name} −100`,'bad');}} style={corrBtn('buzz')}>−100</button>
                      <button onClick={()=>{award(r.name,-50);flashToast(`${r.name} −50`,'bad');}} style={corrBtn('buzz')}>−50</button>
                      <button onClick={()=>{award(r.name,50);flashToast(`${r.name} +50`,'ok');}} style={corrBtn('accent')}>+50</button>
                      <button onClick={()=>{award(r.name,100);flashToast(`${r.name} +100`,'ok');}} style={corrBtn('accent')}>+100</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="s-foot" style={{ borderTop:'1px solid var(--line)' }}><button onClick={()=>setCorrectMode(false)} className="btn">Terminer la correction</button></div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div style={{ position:'absolute', left:0, right:0, bottom:24, display:'flex', justifyContent:'center', pointerEvents:'none', animation:'pop .3s both' }}>
          <div style={{ padding:'10px 18px', borderRadius:14, fontWeight:700, fontSize:14, color:'#11112a',
            background: toast.tone==='ok'?'var(--accent)':toast.tone==='bad'?'var(--buzz)':'var(--surface-2)',
            ...(toast.tone==='bad'?{color:'#fff'}:{}), ...(toast.tone==='neutral'?{color:'var(--txt)'}:{}),
            boxShadow:'0 10px 30px -8px rgba(0,0,0,0.5)' }}>{toast.msg}</div>
        </div>
      )}

      {/* pause overlay */}
      {paused && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', display:'grid', placeItems:'center', zIndex:20 }}>
          <div className="card" style={{ padding:'28px 36px', textAlign:'center', border:'2px solid var(--energy)' }}>
            <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:28, color:'var(--energy)' }}>PAUSE</p>
            <p className="muted" style={{ fontSize:13, marginTop:6 }}>Le jeu est en pause</p>
            <button onClick={()=>setPaused(false)} className="btn" style={{ marginTop:16, width:'auto', padding:'12px 28px' }}>Reprendre</button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ModeratorGameScreen });
