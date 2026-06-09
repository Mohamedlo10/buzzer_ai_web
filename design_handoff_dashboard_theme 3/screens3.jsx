/* screens3.jsx — Leaderboard (mid-game) · Results (final) */
const { useState: u3S, useEffect: u3E } = React;

function useCountUp(target, dur=850, run=true){
  const [v,setV]=u3S(0);
  u3E(()=>{ if(!run){setV(target);return;} let raf,start;
    const tick=(t)=>{ if(!start)start=t; const p=Math.min(1,(t-start)/dur); setV(Math.round(target*(1-Math.pow(1-p,3)))); if(p<1)raf=requestAnimationFrame(tick); };
    raf=requestAnimationFrame(tick); const fb=setTimeout(()=>setV(target),dur+120); return ()=>{cancelAnimationFrame(raf);clearTimeout(fb);};
  },[target,run]); return v;
}

const MEDAL = ['var(--energy)','var(--silver)','var(--bronze)'];

/* ───────────────── MID-GAME LEADERBOARD ───────────────── */
function LeaderboardScreen({ rows, you, index, total, onContinue }) {
  const sorted=[...rows].sort((a,b)=>b.score-a.score);
  const max=sorted[0].score||1; const last=index>=total-1;
  return (
    <div className="screen">
      <div className="s-head" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div className="eyebrow">Après la question {index+1}</div>
          <h1 style={{ fontSize:25, marginTop:4 }}>Classement</h1>
        </div>
        <span className="chip neutral">{index+1}/{total}</span>
      </div>
      <div className="s-body stagger" style={{ gap:9 }}>
        {sorted.slice(0,8).map((r,i)=>{
          const isYou=r.name===you, up=r.delta>0, down=r.delta<0;
          return (
            <div key={r.name} className="card" style={{ position:'relative', overflow:'hidden', display:'flex', alignItems:'center', gap:12, padding:'10px 13px',
              border:isYou?'1.5px solid var(--accent)':'1px solid var(--line)', background:isYou?'color-mix(in oklab,var(--accent) 12%,var(--surface))':'var(--surface)' }}>
              <div style={{ position:'absolute', left:0, bottom:0, height:3, width:`${r.score/max*100}%`, transformOrigin:'left', background:i<3?MEDAL[i]:'var(--accent)', opacity:.85, animation:'growx .8s ease both' }}/>
              <div style={{ width:22, textAlign:'center', fontFamily:'var(--font-display)', fontWeight:600, fontSize:17, color:i<3?MEDAL[i]:'var(--txt-40)' }}>{i+1}</div>
              <Avatar name={r.name} size={38} you={isYou} crown={i===0}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14.5 }}>{isYou?'Toi':r.name}</div>
                <div className="muted" style={{ fontSize:11.5 }}>{r.lastGain>0?`+${r.lastGain} cette manche`:'—'}</div>
              </div>
              {(up||down)&&<span style={{ fontSize:11.5, fontWeight:700, color:up?'var(--accent)':'var(--buzz)' }}>{up?'▲':'▼'}{Math.abs(r.delta)}</span>}
              <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:18, minWidth:52, textAlign:'right' }}>{r.score}</div>
            </div>
          );
        })}
      </div>
      <div className="s-foot"><button className="btn" onClick={onContinue}>{last?'Voir les résultats 🏆':<>Question suivante {Ico.arrow}</>}</button></div>
    </div>
  );
}

/* ───────────────── FINAL RESULTS ───────────────── */
function ResultsScreen({ rows, you, stats, code, format, onReplay }) {
  const teams = format==='teams';
  const sorted=[...rows].sort((a,b)=>b.score-a.score);
  const myRank=sorted.findIndex(r=>r.name===you)+1;
  const me=sorted[myRank-1];
  const top3=sorted.slice(0,3);
  const order=[top3[1],top3[0],top3[2]].filter(Boolean);
  const H={}; top3.forEach((r,i)=>H[r.name]=[120,150,96][[1,0,2].indexOf(i)]);
  // build dettes (debts): each loser owes the winner in their weakest category
  const cats=['Science','Histoire','Cinéma'];
  const dettes = sorted.slice(1,4).map((r,i)=>({ from:r.name, to:sorted[0].name, cat:cats[i%cats.length], amt:(3-i)*150 }));

  const STAT=[
    { l:'JOUEURS', v:rows.length, c:'var(--txt)' },
    { l:'MAX', v:sorted[0].score, c:'var(--energy)' },
    { l:'POS.', v:`${myRank}${myRank===1?'er':'e'}`, c:'var(--accent)' },
    { l:'BASE', v:stats.base, c:'var(--txt)' },
    { l:'CORR.', v:stats.corr>0?`+${stats.corr}`:stats.corr, c:'var(--txt)' },
    { l:'DETTES', v:stats.debt>0?`+${stats.debt}`:stats.debt, c:stats.debt<0?'var(--buzz)':stats.debt>0?'var(--accent)':'var(--txt)' },
    { l:'FINAL', v:me.score, c:'var(--accent)' },
  ];
  const rankLabel=(i)=>i===0?'VAINQUEUR':i===1?'CHALLENGER':`${i+1}ÈME`;

  return (
    <div className="screen">
      <div className="s-head" style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button className="iconbtn" style={{ width:36, height:36 }}>{Ico.back}</button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:22 }}>Résultats</h1>
          <p className="muted" style={{ fontSize:11 }}>Partie #{code}</p>
        </div>
        <Avatar name={you} size={38} you/>
      </div>

      <div className="s-body" style={{ gap:14 }}>
        {/* podium */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:10, marginTop:4 }}>
          {order.map(r=>{
            const rank=sorted.findIndex(x=>x.name===r.name)+1;
            return (
              <div key={r.name} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:7 }}>
                {rank===1 && <div style={{ fontSize:22, animation:'float 3s ease-in-out infinite' }}>👑</div>}
                <Avatar name={r.name} size={rank===1?54:44} you={r.name===you} ring={MEDAL[rank-1]}/>
                <div style={{ fontWeight:700, fontSize:12.5, width:'100%', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name===you?'Toi':r.name}</div>
                <div style={{ width:'100%', height:H[r.name], borderRadius:'12px 12px 0 0', paddingTop:9, display:'flex', flexDirection:'column', alignItems:'center', color:'#11112a',
                  background:`linear-gradient(180deg, ${MEDAL[rank-1]}, color-mix(in oklab,${MEDAL[rank-1]} 35%, var(--surface)))`, animation:'rise .55s both' }}>
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:24 }}>{rank}</span>
                  <span style={{ fontWeight:700, fontSize:13 }}>{r.score}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* perf stats row */}
        <div className="card" style={{ padding:'13px 12px' }}>
          <div className="eyebrow" style={{ color:'var(--warn)', display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>{Ico.zap} Performance globale</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6 }}>
            {STAT.map(s=>(
              <div key={s.l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:8.5, fontWeight:700, letterSpacing:'0.04em', color:'var(--txt-40)', marginBottom:4 }}>{s.l}</div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:14, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* team standings (team mode) */}
        {teams && <TeamLeaderboard rows={rows} you={you}/>}

        {/* individual ranking */}
        <div className="card" style={{ overflow:'hidden', padding:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderBottom:'1px solid var(--line)' }}>
            <span className="eyebrow" style={{ color:'var(--accent)', display:'flex', gap:6, alignItems:'center' }}>{Ico.chart} Classement</span>
            <span style={{ fontSize:9.5, fontWeight:700, letterSpacing:'0.1em', color:'var(--txt-40)' }}>TOTAL POINTS</span>
          </div>
          {sorted.map((r,i)=>{
            const isYou=r.name===you;
            return (
              <div key={r.name} onClick={()=>window.__openProfile&&window.__openProfile(r.name)} style={{ display:'flex', cursor:'pointer', alignItems:'center', gap:11, padding:'10px 14px',
                borderBottom:i<sorted.length-1?'1px solid var(--line)':'none', background:isYou?'color-mix(in oklab,var(--accent) 9%,transparent)':'transparent' }}>
                <Avatar name={r.name} size={38} you={isYou} crown={i===0} ring={i>0&&i<3?MEDAL[i]:false}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:isYou?'var(--accent)':'var(--txt)' }}>{r.name}{isYou&&<span style={{ fontWeight:400, opacity:.6, fontSize:12 }}> (Vous)</span>}</div>
                  <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:'0.08em', color:'var(--txt-40)' }}>{rankLabel(i)}</div>
                </div>
                <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:18, color:i<3?MEDAL[i]:'var(--txt)' }}>{r.score}</span>
                  <span className="muted" style={{ fontSize:10 }}>pts</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* dettes */}
        <div className="card" style={{ overflow:'hidden', padding:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 14px', borderBottom:'1px solid var(--line)' }}>
            <span style={{ color:'var(--warn)' }}>{Ico.zap}</span>
            <span style={{ fontWeight:700, fontSize:12.5, letterSpacing:'0.08em', flex:1 }}>DETTES</span>
            <span style={{ width:22, height:22, borderRadius:'50%', background:'var(--warn)', color:'#11112a', display:'grid', placeItems:'center', fontSize:11, fontWeight:700 }}>{dettes.length}</span>
          </div>
          {dettes.map((d,i)=>{
            const iOwe=d.from===you, owedToMe=d.to===you;
            const accent=iOwe?'var(--buzz)':owedToMe?'var(--accent)':'var(--team)';
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderLeft:`3px solid ${accent}`,
                borderBottom:i<dettes.length-1?'1px solid var(--line)':'none' }}>
                <Avatar name={d.from} size={34}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600 }}>
                    <span style={{ color:iOwe?'var(--buzz)':'var(--txt)' }}>{d.from===you?'Toi':d.from}</span>
                    <span className="muted"> doit à </span>
                    <span style={{ color:owedToMe?'var(--accent)':'var(--txt)' }}>{d.to===you?'toi':d.to}</span>
                  </p>
                  <p style={{ fontSize:10, letterSpacing:'0.06em', color:'var(--txt-40)', textTransform:'uppercase' }}>{d.cat}</p>
                </div>
                <span style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:14, color:iOwe?'var(--buzz)':owedToMe?'var(--accent)':'var(--txt-60)' }}>{iOwe?'-':owedToMe?'+':'-'}{d.amt} pts</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="s-foot" style={{ display:'flex', gap:10 }}>
        <button className="btn sec" onClick={onReplay} style={{ flex:1 }}>Quitter</button>
        <button className="btn" onClick={onReplay} style={{ flex:1.5 }}>Rejouer 🔁</button>
      </div>
    </div>
  );
}

Object.assign(window, { LeaderboardScreen, ResultsScreen, useCountUp });
