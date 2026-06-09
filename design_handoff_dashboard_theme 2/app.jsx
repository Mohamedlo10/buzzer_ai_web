/* app.jsx — game state machine + theming + mount */
const { useState: aS } = React;

const QUESTIONS = [
  { cat:'Science', diff:'Intermédiaire', q:"Quelle planète du système solaire possède le plus grand nombre de lunes connues ?", opts:['Jupiter','Saturne','Uranus','Neptune'], ans:1, explanation:"Saturne compte plus de 140 lunes confirmées, dépassant Jupiter depuis 2023." },
  { cat:'Histoire', diff:'Expert', q:"En quelle année le mur de Berlin est-il tombé ?", opts:['1987','1989','1991','1993'], ans:1, explanation:"La chute du mur a eu lieu dans la nuit du 9 novembre 1989." },
  { cat:'Cinéma', diff:'Facile', q:"Qui a réalisé le film « Inception » sorti en 2010 ?", opts:['S. Spielberg','C. Nolan','J. Cameron','D. Villeneuve'], ans:1, explanation:"Christopher Nolan a écrit et réalisé Inception." },
];
const BOTS = ['Karim','Sofia','Yanis','Inès','Hugo','Noa','Lina'];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "#00D397",
  "energy": "#FFD700",
  "displayFont": "Space Grotesk",
  "role": "player",
  "mode": "mod",
  "format": "solo",
  "glow": 32,
  "animations": true
}/*EDITMODE-END*/;

const newRows = (you)=>[{name:you},...BOTS.map(n=>({name:n}))].map(r=>({...r,score:0,lastGain:0,delta:0}));
const ranksOf = (rows)=>{ const s=[...rows].sort((a,b)=>b.score-a.score); const m={}; s.forEach((r,i)=>m[r.name]=i); return m; };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [phase, setPhase] = aS('dashboard');
  const [tab, setTab] = aS('home');
  const [showJoin, setShowJoin] = aS(false);
  const [joinSeed, setJoinSeed] = aS('');
  const [you] = aS('Toi');
  const [code] = aS('ROOM-7X2');
  const theme = t.theme || 'dark';
  const toggleTheme = ()=> setTweak('theme', theme==='dark'?'light':'dark');
  const [qi, setQi] = aS(0);
  const [rows, setRows] = aS(()=>newRows('Toi'));
  const [result, setResult] = aS({ picked:null, gained:0, penalty:0, tooSlow:false, early:false });
  const [stats, setStats] = aS({ correct:0, total:0, base:0, corr:0, debt:0 });
  const [profile, setProfile] = aS(null);
  const [myCats, setMyCats] = aS([{name:'Science',diff:'INTER'},{name:'Cinéma',diff:'FACILE'}]);
  const [myTeamId, setMyTeamId] = aS('red');
  const makeRows = ()=> { const b=newRows(you); return t.format==='teams' ? window.assignTeams(b, you, myTeamId) : b; };
  React.useEffect(()=>{ window.__openProfile = (name, status)=> setProfile({ name, status: status || (window.relStatus?window.relStatus(name):'NONE') }); }, []);

  const q = QUESTIONS[qi];

  const finishRound = (picked, timeLeft, tooSlow) => {
    const correct = !tooSlow && picked===q.ans;
    const gain = correct ? 600 + Math.round((timeLeft/10)*400) : 0;
    const penalty = (!correct && !tooSlow) ? 150 : 0;
    const prev = ranksOf(rows);
    const next = rows.map(r=>{
      if(r.name===you) return {...r, score:Math.max(0,r.score+gain-penalty), lastGain:gain};
      const g = Math.random()<0.6 ? 450+Math.floor(Math.random()*520) : 0;
      return {...r, score:r.score+g, lastGain:g};
    });
    const nr = ranksOf(next); next.forEach(r=>r.delta=prev[r.name]-nr[r.name]);
    setRows(next);
    setResult({ picked:tooSlow?null:picked, gained:gain, penalty, tooSlow, early:penalty>0 });
    setStats(s=>({ ...s, correct:s.correct+(correct?1:0), total:s.total+1, base:s.base+gain, corr:s.corr-penalty }));
    setPhase('reveal');
  };

  const nextQuestion = ()=> qi>=QUESTIONS.length-1 ? setPhase('results') : (setQi(qi+1), setPhase('game'));

  // player WITH moderator: result decided by the moderator, then auto-advance (player has no control)
  const advanceMod = (correct)=>{
    const gain = correct ? 800 : 0;
    const prev = ranksOf(rows);
    const next = rows.map(r=>{
      if(r.name===you) return {...r, score:r.score+gain, lastGain:gain};
      const g = (!correct && Math.random()<0.5) ? 600+Math.floor(Math.random()*300) : 0;
      return {...r, score:r.score+g, lastGain:g};
    });
    const nr=ranksOf(next); next.forEach(r=>r.delta=prev[r.name]-nr[r.name]);
    setRows(next);
    setStats(s=>({...s, correct:s.correct+(correct?1:0), total:s.total+1, base:s.base+gain}));
    nextQuestion();
  };
  const replay = ()=>{ setQi(0); setRows(makeRows()); setStats({correct:0,total:0,base:0,corr:0,debt:-450}); setPhase(t.format==='teams'?'teams':'lobby'); };
  const goHome = ()=>{ setPhase('dashboard'); setTab('home'); };
  const afterCats = ()=>{ setRows(makeRows()); setPhase(t.format==='teams'?'teams':'lobby'); };
  const startCreate = ()=>{ setRows(makeRows()); setQi(0); setStats({correct:0,total:0,base:0,corr:0,debt:-450}); setPhase('categories'); };
  const doJoin = (c)=>{ setShowJoin(false); setRows(makeRows()); setQi(0); setPhase('categories'); };

  let screen;
  if (phase==='dashboard') {
    if (tab==='home') screen=<DashboardScreen you={you} theme={theme} onToggleTheme={toggleTheme} onCreate={startCreate} onJoinCode={(c)=>{ setJoinSeed(typeof c==='string'?c:''); setShowJoin(true); }} onOpenRooms={()=>setTab('rooms')} onOpenFriends={()=>setTab('friends')} onOpenProfile={(n)=>window.__openProfile(n)}/>;
    else if (tab==='rooms') screen=<RoomsTab onCreate={startCreate} onEnter={(c)=>{ setJoinSeed(c); setShowJoin(true); }}/>;
    else if (tab==='friends') screen=<FriendsTab onOpenProfile={(n,s)=>window.__openProfile(n,s)}/>;
    else if (tab==='profile') screen=<SimpleTab emoji="👤" title="Mon profil" subtitle="Consulte tes statistiques, ton rang et tes catégories favorites." cta="Voir mon profil" onCta={()=>window.__openProfile(you)}/>;
  }
  else if (phase==='join') screen=<JoinScreen onJoin={()=>setPhase('categories')}/>;
  else if (phase==='categories') screen=<CategoriesScreen initial={myCats} onJoin={(sel)=>{ if(sel&&sel.length)setMyCats(sel); afterCats(); }}/>;
  else if (phase==='teams') screen=<TeamSelectScreen you={you} rows={rows} myTeamId={myTeamId} onPick={(id)=>{ setMyTeamId(id); setRows(window.assignTeams(newRows(you), you, id)); }} onContinue={()=>setPhase('lobby')}/>;
  else if (phase==='lobby') screen=<LobbyScreen you={you} code={code} mode={t.role==='mod'?'mod':t.mode} myCats={myCats} onEditCats={()=>setPhase('categories')} onStart={()=>setPhase('generating')}/>;
  else if (phase==='generating') screen=<GeneratingScreen onDone={()=>setPhase('game')}/>;
  else if (phase==='game') {
    if (t.role==='mod') screen=<ModeratorGameScreen q={q} index={qi} total={QUESTIONS.length} rows={rows} setRows={setRows} you={you} format={t.format} last={qi>=QUESTIONS.length-1} onNext={nextQuestion}/>;
    else screen=<GameScreen mode={t.mode} q={q} index={qi} total={QUESTIONS.length} rows={rows} you={you} format={t.format} myTeamId={myTeamId} onBuzz={()=>setPhase('yourturn')} onTimeout={()=>finishRound(null,0,true)} onAdvance={advanceMod}/>;
  }
  else if (phase==='yourturn') screen=<YourTurnScreen q={q} onAnswer={(i,tl)=>finishRound(i,tl,false)}/>;
  else if (phase==='reveal') screen=<RevealScreen q={q} picked={result.picked} gained={result.gained} penalty={result.penalty} tooSlow={result.tooSlow} early={result.early} last={qi>=QUESTIONS.length-1} onContinue={nextQuestion}/>;
  else if (phase==='results') screen=<ResultsScreen rows={rows} you={you} stats={{...stats, debt:-450}} code={code} format={t.format} onReplay={replay}/>;

  const sceneStyle = {
    '--accent': t.accent, '--energy': t.energy,
    '--font-display': `'${t.displayFont}', system-ui, sans-serif`,
    '--glow': t.glow/100,
  };
  const showTabs = phase==='dashboard';

  const STEPS = ['dashboard','categories','teams','lobby','generating','game','yourturn','reveal','results'];
  const SEED = [2100,2750,1850,1500,1200,900,600,300]; // Toi=2100 → 2nd place
  const seedRows = ()=> { const b=newRows(you).map((x,i)=>({...x, score:SEED[i]||100, lastGain:[0,300,150,0,200,0,100,0][i]||0, delta:[1,0,-1,2,0,0,0,0][i]||0})); return t.format==='teams' ? window.assignTeams(b, you, myTeamId) : b; };
  const jump = (p)=>{
    if(p==='reveal') setQi(0);
    if(p==='teams' && !rows.some(r=>r.teamId)) setRows(window.assignTeams(newRows(you), you, myTeamId));
    if(p==='game' || p==='results'){
      setQi(p==='game'?0:qi);
      setRows(r => r.some(x=>x.score>0) ? r : seedRows());
      if(p==='results') setStats({ correct:6, total:9, base:2100, corr:0, debt:-450 });
    }
    if(p==='dashboard') setTab('home');
    setPhase(p);
  };

  const [devOpen, setDevOpen] = aS(false);
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24,
      background:'radial-gradient(140% 100% at 50% 0%, #2b2550 0%, #16122b 62%)' }}>
      <IOSDevice dark={theme==='dark'} width={390} height={844}>
        <div className={'scene'+(t.animations?'':' anim-off')} data-theme={theme} style={sceneStyle}>
          <div key={phase+qi+tab} style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column' }}>
            <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column' }}>{screen}</div>
            {showTabs && <TabBar active={tab} onChange={setTab}/>}
          </div>
          {showJoin && <JoinModal initialCode={joinSeed} onClose={()=>setShowJoin(false)} onJoin={doJoin}/>}
          {profile && <PlayerProfileModal key={profile.name} name={profile.name} you={you} initialStatus={profile.status} onClose={()=>setProfile(null)}/>}
        </div>
      </IOSDevice>

      {/* step jumper (collapsible dev nav) */}
      <div style={{ position:'fixed', left:14, top:14, zIndex:40, display:'flex', flexDirection:'column', gap:6, alignItems:'flex-start' }}>
        <button onClick={()=>setDevOpen(o=>!o)} style={{ appearance:'none', cursor:'pointer', borderRadius:9, padding:'6px 11px', fontSize:11, fontWeight:700, fontFamily:'Hanken Grotesk,sans-serif',
          border:'1px solid rgba(255,255,255,0.16)', background:'rgba(20,18,40,0.82)', color:'#cfcde6', backdropFilter:'blur(8px)' }}>{devOpen?'✕ Nav':'⚙ Nav'}</button>
        {devOpen && (
          <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:'78vh', overflow:'auto', padding:8, borderRadius:12, background:'rgba(20,18,40,0.9)', border:'1px solid rgba(255,255,255,0.12)', backdropFilter:'blur(8px)' }}>
            {STEPS.map(s=>(
              <button key={s} onClick={()=>jump(s)} style={{ appearance:'none', cursor:'pointer', borderRadius:7, padding:'5px 9px', fontSize:10.5, fontWeight:700, fontFamily:'Hanken Grotesk,sans-serif', textAlign:'left',
                border:'1px solid '+(phase===s?'#00D397':'rgba(255,255,255,0.12)'), background:phase===s?'#00D39722':'rgba(255,255,255,0.05)', color:phase===s?'#00D397':'#cfcde6' }}>{s}</button>
            ))}
          </div>
        )}
      </div>

      <TweaksPanel>
        <TweakSection label="Apparence"/>
        <TweakRadio label="Thème" value={t.theme} options={[{value:'dark',label:'Sombre'},{value:'light',label:'Clair'}]} onChange={v=>setTweak('theme',v)}/>
        <TweakSection label="Rôle & mode"/>
        <TweakRadio label="Rôle" value={t.role} options={[{value:'player',label:'Joueur'},{value:'mod',label:'Modérateur'}]} onChange={v=>setTweak('role',v)}/>
        <TweakRadio label="Modération" value={t.mode} options={[{value:'mod',label:'Avec modérateur'},{value:'host',label:'Sans modérateur'}]} onChange={v=>setTweak('mode',v)}/>
        <TweakRadio label="Format" value={t.format} options={[{value:'solo',label:'Solo'},{value:'teams',label:'Équipes'}]} onChange={v=>setTweak('format',v)}/>
        <TweakSection label="Couleurs"/>
        <TweakColor label="Couleur d'action" value={t.accent} options={['#00D397','#2DE2E6','#4A90D9','#8B5CF6','#FF6EC7']} onChange={v=>setTweak('accent',v)}/>
        <TweakColor label="Couleur podium" value={t.energy} options={['#FFD700','#F59E0B','#00D397','#EC4899']} onChange={v=>setTweak('energy',v)}/>
        <TweakSlider label="Intensité du halo" value={t.glow} min={0} max={70} unit="%" onChange={v=>setTweak('glow',v)}/>
        <TweakSection label="Typographie & mouvement"/>
        <TweakSelect label="Police des titres" value={t.displayFont} options={['Space Grotesk','Sora','Outfit','Hanken Grotesk']} onChange={v=>setTweak('displayFont',v)}/>
        <TweakToggle label="Animations" value={t.animations} onChange={v=>setTweak('animations',v)}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
