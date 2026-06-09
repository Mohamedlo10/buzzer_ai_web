/* create.jsx — Session creation wizard (4-step)
   Faithful to SessionConfigForm.tsx. Steps:
   1. Mode (moderation + question source + teams toggle)
   2. Paramètres (stepper fields, conditional on mode)
   3. Équipes (if team mode, else skip to 4)
   4. Récapitulatif + Créer
*/
const { useState: cS, useEffect: cE } = React;

const TEAM_COLORS = ['#D5442F','#4A90D9','#2ECC71','#F39C12','#9B59B6','#1ABC9C','#E91E63','#00D397'];
const DEFAULT_TEAMS = [{ name:'Rouge', color:'#D5442F' },{ name:'Bleu', color:'#4A90D9' }];

/* ── helpers ───────────────────────────────────── */
function Cico({ d, size=20, stroke='currentColor', sw=2 }){
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
}
const CIco = {
  mod: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  bot: 'M12 2a2 2 0 0 1 2 2M10 4a2 2 0 0 0-2 2v2h8V6a2 2 0 0 0-2-2M4 8h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8zM9 13v4M15 13v4M9 13h6',
  ai: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  pen: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  zap: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  timer: 'M12 2v6l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  target: 'M22 12A10 10 0 1 1 12 2M22 12h-4M12 2v4M16.24 7.76l-2.83 2.83',
  award: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.21 13.89L7 23l5-3 5 3-1.21-9.12',
  palette: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
  info: 'M12 16v-4M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z',
  chevL: 'M15 18l-6-6 6-6',
  chevR: 'M9 18l6-6-6-6',
  check: 'M20 6L9 17l-5-5',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6L6 18M6 6l12 12',
};

/* big mode card */
function ModeCard({ icon, label, sublabel, active, accent, onClick }) {
  return (
    <button onClick={onClick} style={{ flex:1, appearance:'none', cursor:'pointer', textAlign:'center',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:9,
      padding:'18px 10px', borderRadius:18, border:`2px solid ${active ? accent : 'var(--line)'}`,
      background: active ? `color-mix(in oklab,${accent} 14%,var(--surface))` : 'var(--surface)',
      transition:'all .18s', color:'var(--txt)' }}>
      <div style={{ width:52, height:52, borderRadius:15, display:'grid', placeItems:'center',
        background: active ? `color-mix(in oklab,${accent} 22%,transparent)` : 'var(--surface-2)', color:active?accent:'var(--txt-40)' }}>
        <Cico d={icon} size={26} stroke="currentColor" sw={1.6}/>
      </div>
      <div>
        <p style={{ fontWeight:700, fontSize:14.5, color:active?accent:'var(--txt)' }}>{label}</p>
        <p style={{ fontSize:11, color:'var(--txt-40)', marginTop:2, lineHeight:1.3 }}>{sublabel}</p>
      </div>
    </button>
  );
}

/* stepper field */
function StepperField({ label, value, suffix='', min, max, step=1, onChange, accent='var(--accent)' }) {
  return (
    <div className="card" style={{ padding:'14px 12px', display:'flex', flexDirection:'column', gap:8 }}>
      <p style={{ fontSize:9.5, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--txt-40)' }}>{label}</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
        <button onClick={()=>onChange(Math.max(min,value-step))} disabled={value<=min} style={{ width:36, height:36, borderRadius:'50%', display:'grid', placeItems:'center', background:'var(--surface-2)', border:'1px solid var(--line)', cursor:value<=min?'default':'pointer', opacity:value<=min?.38:1, color:'var(--txt)', fontSize:20, fontWeight:300, appearance:'none', flexShrink:0 }}>−</button>
        <span style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:22, flex:1, textAlign:'center', color:accent }}>{value}{suffix}</span>
        <button onClick={()=>onChange(Math.min(max,value+step))} disabled={value>=max} style={{ width:36, height:36, borderRadius:'50%', display:'grid', placeItems:'center', background:'var(--surface-2)', border:'1px solid var(--line)', cursor:value>=max?'default':'pointer', opacity:value>=max?.38:1, color:'var(--txt)', fontSize:20, fontWeight:300, appearance:'none', flexShrink:0 }}>+</button>
      </div>
    </div>
  );
}

/* toggle row */
function ToggleRow({ icon, label, sub, checked, onChange, accent='var(--accent)' }) {
  return (
    <div className="card" style={{ padding:'13px 15px', display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ width:36, height:36, borderRadius:11, display:'grid', placeItems:'center', background:`color-mix(in oklab,${accent} 14%,transparent)`, color:accent, flexShrink:0 }}>
        <Cico d={icon} size={18} stroke="currentColor" sw={1.8}/>
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontWeight:700, fontSize:14 }}>{label}</p>
        {sub && <p className="muted" style={{ fontSize:11.5, marginTop:1 }}>{sub}</p>}
      </div>
      <button role="switch" aria-checked={checked} onClick={()=>onChange(!checked)} style={{ appearance:'none', cursor:'pointer', border:0, width:48, height:28, borderRadius:14, position:'relative', background:checked?accent:'var(--surface-2)', transition:'background .2s', flexShrink:0 }}>
        <span style={{ position:'absolute', top:4, left:checked?24:4, width:20, height:20, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.22)', transition:'left .2s' }}/>
      </button>
    </div>
  );
}

/* choice strip (answer choices count) */
function ChoiceStrip({ value, onChange }) {
  const opts = [null,2,3,4,5,6];
  return (
    <div className="card" style={{ padding:'13px 13px' }}>
      <p style={{ fontSize:9.5, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--txt-40)', marginBottom:10 }}>Nombre de choix</p>
      <div style={{ display:'flex', gap:7 }}>
        {opts.map(n=>(
          <button key={n??'auto'} onClick={()=>onChange(n)} style={{ flex:1, appearance:'none', cursor:'pointer', border:`1.5px solid ${value===n?'var(--accent)':'var(--line)'}`, borderRadius:10, padding:'9px 2px', fontWeight:700, fontSize:13, fontFamily:'var(--font-display)', background:value===n?'color-mix(in oklab,var(--accent) 16%,var(--surface))':'var(--surface)', color:value===n?'var(--accent)':'var(--txt-60)', transition:'all .15s' }}>{n===null?'Auto':n}</button>
        ))}
      </div>
    </div>
  );
}

/* ── step progress bar ───────────────────────────────────────── */
function StepBar({ step, total }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      {Array.from({length:total}).map((_,i)=>(
        <div key={i} style={{ flex:1, height:4, borderRadius:99, background: i<step?'var(--accent)':i===step?'var(--accent)':'var(--surface-2)', opacity:i<step?1:i===step?1:0.5,
          transition:'background .3s, opacity .3s' }}/>
      ))}
    </div>
  );
}

/* ── CREATE SESSION WIZARD ─────────────────────────────────────── */
function CreateSessionScreen({ onClose, onCreate }) {
  const STEP_LABELS = ['Mode','Réglages','Équipes','Récap'];

  const [sessionMode, setSessionMode] = cS('WITH_MODERATOR');
  const [questionMode, setQuestionMode] = cS('AI');
  const [isTeamMode, setIsTeamMode] = cS(false);
  const [teams, setTeams] = cS(DEFAULT_TEAMS);
  const [answerTime, setAnswerTime] = cS(15);
  const [globalTime, setGlobalTime] = cS(30);
  const [answerChoices, setAnswerChoices] = cS(null);
  const [questionsPerCat, setQuestionsPerCat] = cS(5);
  const [maxCats, setMaxCats] = cS(3);
  const [buzzCountdown, setBuzzCountdown] = cS(10);
  const [debtAmount, setDebtAmount] = cS(5);
  const [pointsCorrect, setPointsCorrect] = cS(5);
  const [maxPlayers, setMaxPlayers] = cS(20);
  const [creating, setCreating] = cS(false);
  const [step, setStep] = cS(0);

  const totalSteps = isTeamMode ? 4 : 3;

  // steps: 0=mode 1=params 2=teams(opt) 3=recap (2 if !teams)
  const stepIndex = (raw) => {
    if (!isTeamMode && raw >= 2) return raw+1; // skip teams step display
    return raw;
  };
  const STEPS = isTeamMode ? ['Mode','Réglages','Équipes','Récap'] : ['Mode','Réglages','Récap'];

  const goNext = () => { if(step < STEPS.length-1) setStep(s=>s+1); };
  const goPrev = () => { if(step > 0) setStep(s=>s-1); else onClose(); };
  const isLast = step === STEPS.length-1;

  /* team editor helpers */
  const addTeam = () => { if(teams.length>=8) return; const c=TEAM_COLORS[teams.length%TEAM_COLORS.length]; setTeams(t=>[...t,{name:`Équipe ${t.length+1}`,color:c}]); };
  const removeTeam = (i) => { if(teams.length<=2) return; setTeams(t=>t.filter((_,j)=>j!==i)); };
  const updateTeamName = (i,n) => setTeams(t=>t.map((x,j)=>j===i?{...x,name:n}:x));
  const cycleColor = (i) => { const ci=TEAM_COLORS.indexOf(teams[i].color); setTeams(t=>t.map((x,j)=>j===i?{...x,color:TEAM_COLORS[(ci+1)%TEAM_COLORS.length]}:x)); };

  /* recap summary rows */
  const summaryRows = [
    { icon:CIco.mod, label:'Modération', value: sessionMode==='WITH_MODERATOR'?'Avec modérateur':'Sans modérateur', color: sessionMode==='WITH_MODERATOR'?'var(--accent)':'var(--host)' },
    { icon:CIco.ai, label:'Questions', value: questionMode==='AI'?'Générées par IA':'Manuelles', color: questionMode==='AI'?'var(--accent)':'var(--energy)' },
    ...(questionMode==='AI'?[
      { icon:CIco.target, label:'Questions/cat.', value:`${questionsPerCat} × ${maxCats} max`, color:'var(--txt)' },
    ]:[]),
    ...(sessionMode==='WITHOUT_MODERATOR'?[
      { icon:CIco.timer, label:'Timers', value:`${answerTime}s réponse · ${globalTime}s global`, color:'var(--txt)' },
      { icon:CIco.zap, label:'Choix de réponse', value: answerChoices===null?'Auto':String(answerChoices), color:'var(--txt)' },
    ]:[
      { icon:CIco.timer, label:'Buzz countdown', value:`${buzzCountdown}s`, color:'var(--txt)' },
    ]),
    { icon:CIco.users, label:'Joueurs max', value:String(maxPlayers), color:'var(--txt)' },
    { icon:CIco.award, label:'Points / réponse', value:String(pointsCorrect), color:'var(--txt)' },
    { icon:CIco.zap, label:'Dettes', value:`${debtAmount} pts`, color: debtAmount>0?'var(--warn)':'var(--txt-40)' },
    { icon:CIco.users, label:'Format', value: isTeamMode?`Équipes (${teams.length})`:'Solo', color: isTeamMode?'var(--team)':'var(--txt)' },
  ];

  const handleCreate = () => {
    setCreating(true);
    setTimeout(()=>{ setCreating(false); onCreate?.({ sessionMode, questionMode, isTeamMode, teams, maxPlayers }); }, 1200);
  };

  return (
    <div className="screen">
      {/* header */}
      <div className="s-head" style={{ paddingBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <button onClick={goPrev} className="iconbtn" aria-label={step===0?'Fermer':'Retour'}>{step===0 ? <Cico d={CIco.x} size={18}/> : <Cico d={CIco.chevL} size={18}/>}</button>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:20 }}>Créer une session</h1>
            <p className="muted" style={{ fontSize:12, marginTop:2 }}>{STEPS[step]} · étape {step+1}/{STEPS.length}</p>
          </div>
          {!isLast && (
            <button className="chip acc" onClick={goNext} style={{ cursor:'pointer', padding:'6px 14px', fontWeight:700 }}>Suivant <Cico d={CIco.chevR} size={13}/></button>
          )}
        </div>
        <StepBar step={step+1} total={STEPS.length}/>
      </div>

      <div className="s-body" style={{ gap:14 }}>
        {/* ── STEP 0: MODE ─────────────────── */}
        {step===0 && (
          <>
            <div>
              <div className="eyebrow" style={{ marginBottom:10, color:'var(--txt-60)' }}>Modération</div>
              <div style={{ display:'flex', gap:10 }}>
                <ModeCard icon={CIco.mod} label="Avec modérateur" sublabel="L'hôte valide les réponses" accent="var(--accent)" active={sessionMode==='WITH_MODERATOR'} onClick={()=>setSessionMode('WITH_MODERATOR')}/>
                <ModeCard icon={CIco.bot} label="Sans modérateur" sublabel="Réponses automatiques" accent="var(--host)" active={sessionMode==='WITHOUT_MODERATOR'} onClick={()=>setSessionMode('WITHOUT_MODERATOR')}/>
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom:10, color:'var(--txt-60)' }}>Source des questions</div>
              <div style={{ display:'flex', gap:10 }}>
                <ModeCard icon={CIco.ai} label="IA" sublabel="Générées par l'IA" accent="var(--accent)" active={questionMode==='AI'} onClick={()=>setQuestionMode('AI')}/>
                <ModeCard icon={CIco.pen} label="Manuel" sublabel="Saisies dans le lobby" accent="var(--energy)" active={questionMode==='MANUAL'} onClick={()=>setQuestionMode('MANUAL')}/>
              </div>
              {questionMode==='MANUAL' && (
                <div style={{ marginTop:10, padding:'10px 12px', borderRadius:12, background:'color-mix(in oklab,var(--energy) 9%,transparent)', border:'1px solid color-mix(in oklab,var(--energy) 28%,transparent)', display:'flex', gap:9 }}>
                  <span style={{ color:'var(--energy)', flexShrink:0 }}><Cico d={CIco.info} size={14}/></span>
                  <p style={{ color:'var(--energy)', fontSize:12, lineHeight:1.45 }}>Vous pourrez saisir vos questions dans le lobby avant de démarrer.</p>
                </div>
              )}
            </div>
            <ToggleRow icon={CIco.users} label="Mode équipes" sub="Les points sont partagés entre coéquipiers" checked={isTeamMode} onChange={setIsTeamMode} accent="var(--team)"/>
            {sessionMode==='WITHOUT_MODERATOR' && (
              <div style={{ padding:'10px 12px', borderRadius:12, background:'color-mix(in oklab,var(--host) 9%,transparent)', border:'1px solid color-mix(in oklab,var(--host) 25%,transparent)', display:'flex', gap:9 }}>
                <span style={{ color:'var(--host)', flexShrink:0 }}><Cico d={CIco.info} size={14}/></span>
                <p style={{ color:'var(--host)', fontSize:12, lineHeight:1.45 }}>Questions affichées progressivement · réponses automatisées · buzz risqué avant lecture complète.</p>
              </div>
            )}
          </>
        )}

        {/* ── STEP 1: PARAMS ─────────────────── */}
        {step===1 && (
          <>
            {sessionMode==='WITHOUT_MODERATOR' && (
              <div>
                <div className="eyebrow" style={{ marginBottom:10, color:'var(--txt-60)' }}>Timers (sans modérateur)</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <StepperField label="Temps réponse" value={answerTime} suffix="s" min={5} max={60} step={5} onChange={setAnswerTime}/>
                  <StepperField label="Timer global" value={globalTime} suffix="s" min={15} max={120} step={5} onChange={setGlobalTime}/>
                </div>
                <div style={{ marginTop:10 }}>
                  <ChoiceStrip value={answerChoices} onChange={setAnswerChoices}/>
                </div>
              </div>
            )}
            {sessionMode==='WITH_MODERATOR' && (
              <div>
                <div className="eyebrow" style={{ marginBottom:10, color:'var(--txt-60)' }}>Buzz countdown</div>
                <StepperField label="Temps pour répondre" value={buzzCountdown} suffix="s" min={5} max={60} step={5} onChange={setBuzzCountdown}/>
              </div>
            )}
            {questionMode==='AI' && (
              <div>
                <div className="eyebrow" style={{ marginBottom:10, color:'var(--txt-60)' }}>Questions IA</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <StepperField label="Questions/cat." value={questionsPerCat} min={2} max={15} onChange={setQuestionsPerCat}/>
                  <StepperField label="Catégories max" value={maxCats} min={1} max={10} onChange={setMaxCats}/>
                </div>
              </div>
            )}
            <div>
              <div className="eyebrow" style={{ marginBottom:10, color:'var(--txt-60)' }}>Partie</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <StepperField label="Joueurs max" value={maxPlayers} min={2} max={50} onChange={setMaxPlayers}/>
                <StepperField label="Points/réponse" value={pointsCorrect} min={1} max={50} step={5} onChange={setPointsCorrect}/>
                <StepperField label="Dettes (pts)" value={debtAmount} min={0} max={50} step={5} onChange={setDebtAmount} accent={debtAmount>0?'var(--warn)':'var(--txt-40)'}/>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2: TEAMS (only if isTeamMode) ─────────────────── */}
        {step===2 && isTeamMode && (
          <>
            <div style={{ padding:'12px 14px', borderRadius:14, background:'color-mix(in oklab,var(--team) 10%,transparent)', border:'1px solid color-mix(in oklab,var(--team) 28%,transparent)', display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ color:'var(--team)', flexShrink:0, marginTop:1 }}><Cico d={CIco.info} size={15}/></span>
              <p style={{ color:'var(--team)', fontSize:12.5, lineHeight:1.45 }}>Minimum 2 équipes · maximum 8. Clique sur la pastille pour changer la couleur.</p>
            </div>
            {teams.map((t,i)=>(
              <div key={i} className="card" style={{ padding:'12px 13px', display:'flex', alignItems:'center', gap:11, animation:'rise .35s both' }}>
                <button onClick={()=>cycleColor(i)} style={{ width:42, height:42, borderRadius:12, background:t.color, border:0, cursor:'pointer', display:'grid', placeItems:'center', flexShrink:0 }}>
                  <Cico d={CIco.palette} size={17} stroke="#fff" sw={1.6}/>
                </button>
                <input value={t.name} onChange={e=>updateTeamName(i,e.target.value)} maxLength={20} placeholder={`Équipe ${i+1}`} className="field" style={{ flex:1, padding:'11px 13px', fontSize:15, borderColor: 'var(--line)' }}/>
                <button onClick={()=>removeTeam(i)} disabled={teams.length<=2} className="iconbtn" style={{ width:36, height:36, background:teams.length<=2?'var(--surface-2)':'color-mix(in oklab,var(--buzz) 15%,transparent)', color:teams.length<=2?'var(--txt-25)':'var(--buzz)', flexShrink:0 }}>
                  <Cico d={CIco.x} size={15}/>
                </button>
              </div>
            ))}
            {teams.length < 8 && (
              <button onClick={addTeam} style={{ appearance:'none', cursor:'pointer', width:'100%', padding:'13px', borderRadius:14, border:'1.5px dashed var(--line)', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'var(--txt-60)', fontFamily:'var(--font-ui)', fontWeight:600, fontSize:14 }}>
                <Cico d={CIco.plus} size={16} stroke="currentColor"/> Ajouter une équipe
              </button>
            )}
            {teams.length < 2 && (
              <div style={{ padding:'10px 12px', borderRadius:12, background:'color-mix(in oklab,var(--buzz) 10%,transparent)', border:'1px solid color-mix(in oklab,var(--buzz) 28%,transparent)', display:'flex', gap:9 }}>
                <span style={{ color:'var(--buzz)', flexShrink:0 }}><Cico d={CIco.info} size={14}/></span>
                <p style={{ color:'var(--buzz)', fontSize:12 }}>Minimum 2 équipes requises.</p>
              </div>
            )}
          </>
        )}

        {/* ── STEP 3/2: RÉCAP ─────────────────── */}
        {isLast && (
          <>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'6px 0 14px' }}>
              <div style={{ width:68, height:68, borderRadius:22, background:'linear-gradient(135deg,var(--accent),var(--accent-d))', display:'grid', placeItems:'center', animation:'pop .5s both', boxShadow:'0 10px 30px -8px var(--accent)' }}>
                <Cico d={CIco.zap} size={32} stroke="#fff" sw={1.4}/>
              </div>
              <h2 style={{ fontSize:22, marginTop:4 }}>Tout est prêt !</h2>
              <p className="muted" style={{ textAlign:'center', fontSize:13 }}>Vérifie la config avant de créer ta session.</p>
            </div>
            <div className="card" style={{ overflow:'hidden', padding:0 }}>
              {summaryRows.map((r,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 15px', borderBottom:i<summaryRows.length-1?'1px solid var(--line)':'none' }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:`color-mix(in oklab,${r.color} 16%,var(--surface-2))`, color:r.color, display:'grid', placeItems:'center', flexShrink:0 }}>
                    <Cico d={r.icon} size={15} stroke={r.color} sw={1.6}/>
                  </div>
                  <span className="muted" style={{ flex:1, fontSize:13 }}>{r.label}</span>
                  <span style={{ fontWeight:700, fontSize:13.5, color:r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="s-foot" style={{ display:'flex', gap:9 }}>
        {step>0 && !isLast && (
          <button onClick={goPrev} className="btn sec" style={{ width:'auto', padding:'15px 18px', fontSize:15 }}>←</button>
        )}
        {!isLast ? (
          <button onClick={goNext} className="btn" style={{ flex:1 }}>
            {step===0 ? 'Régler les paramètres' : isTeamMode&&step===1 ? 'Configurer les équipes' : 'Voir le récap'} <Cico d={CIco.chevR} size={16} stroke="currentColor"/>
          </button>
        ) : (
          <button onClick={handleCreate} disabled={creating||(isTeamMode&&teams.length<2)} className="btn" style={{ flex:1 }}>
            {creating ? <><span className="spinner" style={{ width:18, height:18, borderColor:'rgba(255,255,255,.35)', borderTopColor:'var(--btn-fg)' }}/> Création…</> : <><Cico d={CIco.zap} size={18} stroke="currentColor"/> Créer la session</>}
          </button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { CreateSessionScreen });
