/* teams.jsx — team mode: selection, team leaderboard, helpers + buzz lock copy */
const { useState: tmS } = React;

const TEAMS = [
  { id:'red',  name:'Les Rouges', color:'#D5442F', emoji:'🔴' },
  { id:'blue', name:'Les Bleus',  color:'#4A90D9', emoji:'🔵' },
];
const teamById = (id)=> TEAMS.find(t=>t.id===id) || TEAMS[0];

/* assign players to teams; "you" follows myTeamId, others alternate to balance */
function assignTeams(rows, you, myTeamId='red') {
  const others = rows.filter(r=>r.name!==you);
  return rows.map(r=>{
    if (r.name===you) return { ...r, teamId:myTeamId };
    const idx = others.indexOf(r);
    return { ...r, teamId: idx%2===0 ? (myTeamId==='red'?'blue':'red') : myTeamId };
  });
}

/* team standings = sum of member scores, sorted desc */
function teamStandings(rows) {
  return TEAMS.map(t=>{
    const members = rows.filter(r=>r.teamId===t.id).sort((a,b)=>b.score-a.score);
    return { ...t, members, total: members.reduce((s,m)=>s+m.score,0) };
  }).sort((a,b)=>b.total-a.total);
}

/* ───────────── TEAM SELECT (before lobby in team mode) ───────────── */
function TeamSelectScreen({ you, rows, myTeamId, onPick, onContinue }) {
  const standings = teamStandings(assignTeams(rows, you, myTeamId));
  return (
    <div className="screen">
      <div className="s-head" style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button className="iconbtn">{Ico.back}</button>
        <div>
          <h1 style={{ fontSize:20 }}>Choisis ton équipe</h1>
          <p className="muted" style={{ fontSize:12, marginTop:2 }}>Mode équipes · le buzz est partagé entre coéquipiers</p>
        </div>
      </div>
      <div className="s-body" style={{ gap:13 }}>
        {standings.map(t=>{
          const mine = t.id===myTeamId;
          return (
            <button key={t.id} onClick={()=>onPick(t.id)} className="card" style={{ width:'100%', textAlign:'left', cursor:'pointer', padding:0, overflow:'hidden',
              border:`1.5px solid ${mine?t.color:'var(--line)'}`, background: mine?`color-mix(in oklab,${t.color} 12%,var(--surface))`:'var(--surface)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 14px 12px' }}>
                <div style={{ width:46, height:46, borderRadius:14, background:`color-mix(in oklab,${t.color} 22%,transparent)`, display:'grid', placeItems:'center', flexShrink:0, border:`1px solid ${t.color}` }}>
                  <span style={{ width:20, height:20, borderRadius:'50%', background:t.color }}/>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:700, fontSize:16 }}>{t.name}</p>
                  <p className="muted" style={{ fontSize:12, marginTop:2 }}>{t.members.length} joueurs</p>
                </div>
                {mine ? <span className="chip" style={{ background:t.color, color:'#fff' }}>{Ico.check} Mon équipe</span>
                      : <span className="chip neutral">Rejoindre</span>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:-8, padding:'0 14px 14px' }}>
                {t.members.map((m,i)=>(
                  <div key={m.name} style={{ marginLeft:i===0?0:-8 }}><Avatar name={m.name} size={30} you={m.name===you} ring={t.color}/></div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
      <div className="s-foot"><button className="btn" onClick={onContinue}>Continuer vers le salon {Ico.arrow}</button></div>
    </div>
  );
}

/* ───────────── TEAM LEADERBOARD (live + results) ───────────── */
function TeamLeaderboard({ rows, you, compact }) {
  const standings = teamStandings(rows);
  const max = standings[0]?.total || 1;
  return (
    <div className="card" style={{ overflow:'hidden', padding:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', borderBottom:'1px solid var(--line)', background:'color-mix(in oklab,var(--team) 7%,transparent)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}><span style={{ color:'var(--team)' }}>{Ico.users}</span><span style={{ fontWeight:700, fontSize:14 }}>Classement équipes</span></div>
        <span className="muted" style={{ fontSize:11 }}>{standings.length} équipes</span>
      </div>
      {standings.map((t,i)=>{
        const mine = t.members.some(m=>m.name===you);
        return (
          <div key={t.id} style={{ position:'relative', padding:'12px 14px', borderBottom:i<standings.length-1?'1px solid var(--line)':'none', background:mine?`color-mix(in oklab,${t.color} 8%,transparent)`:'transparent' }}>
            <div style={{ position:'absolute', left:0, bottom:0, height:3, width:`${t.total/max*100}%`, background:t.color, opacity:.85 }}/>
            <div style={{ display:'flex', alignItems:'center', gap:11 }}>
              <div style={{ width:26, height:26, borderRadius:8, background:t.color, color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ width:9, height:9, borderRadius:'50%', background:t.color, flexShrink:0 }}/>
                  <p style={{ fontWeight:700, fontSize:14.5 }}>{t.name}</p>
                  {mine && <span className="chip" style={{ padding:'1px 7px', fontSize:9.5, background:`color-mix(in oklab,${t.color} 20%,transparent)`, color:t.color }}>Mon équipe</span>}
                </div>
                {!compact && (
                  <div style={{ display:'flex', alignItems:'center', marginTop:6 }}>
                    {t.members.map((m,j)=>(
                      <div key={m.name} title={m.name} style={{ marginLeft:j===0?0:-7 }}><Avatar name={m.name} size={24} you={m.name===you} ring="var(--surface)"/></div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:19, color:t.color }}>{t.total.toLocaleString('fr-FR')}</div>
                <div className="muted" style={{ fontSize:10 }}>pts</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { TEAMS, teamById, assignTeams, teamStandings, TeamSelectScreen, TeamLeaderboard });
