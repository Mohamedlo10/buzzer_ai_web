/* shared.jsx — building blocks (faithful to the real app) */

const AV_COLORS = ['#00D397','#4A90D9','#9B59B6','#F59E0B','#D5442F','#EC4899','#8B5CF6','#06B6D4'];
function avColor(name){ let s=0; for(const c of (name||'?')) s+=c.charCodeAt(0); return AV_COLORS[s%AV_COLORS.length]; }

function Avatar({ name, size = 40, ring, you, crown }) {
  const c = avColor(name);
  const initials = (name||'?').trim().slice(0,2).toUpperCase();
  return (
    <div style={{ position:'relative', flexShrink:0, width:size, height:size }}>
      <div style={{
        width:size, height:size, borderRadius:'50%', display:'grid', placeItems:'center',
        fontFamily:'var(--font-display)', fontWeight:600, fontSize:size*0.4, color:'#11112a',
        background:`linear-gradient(150deg, ${c}, color-mix(in oklab, ${c} 55%, #fff))`,
        boxShadow: you ? '0 0 0 2.5px var(--accent)' : (ring ? `0 0 0 2px ${ring===true?'rgba(255,255,255,0.14)':ring}` : 'none'),
      }}>{initials}</div>
      {crown && (
        <div style={{ position:'absolute', top:-5, right:-4, width:18, height:18, borderRadius:'50%',
          background:'var(--energy)', display:'grid', placeItems:'center', fontSize:9 }}>👑</div>
      )}
    </div>
  );
}

/* logo lockup — buzzer-mark */
function Wordmark({ compact }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:compact?32:40, height:compact?32:40, borderRadius:12, position:'relative',
        background:'linear-gradient(135deg, var(--buzz), var(--buzz-h))', display:'grid', placeItems:'center',
        boxShadow:'0 6px 18px -6px var(--buzz)' }}>
        <svg width={compact?15:18} height={compact?15:18} viewBox="0 0 24 24" fill="#fff"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8z"/></svg>
      </div>
      {!compact && (
        <div style={{ lineHeight:1 }}>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:17 }}>Quiz</div>
          <div style={{ fontSize:9.5, color:'var(--txt-40)', fontWeight:700, letterSpacing:'0.18em', marginTop:3 }}>BY MOUHA_DEV</div>
        </div>
      )}
    </div>
  );
}

/* circular timer ring */
function Ring({ seconds, total, size = 48, stroke = 5 }) {
  const r=(size-stroke)/2, circ=2*Math.PI*r, frac=Math.max(0,seconds)/total;
  const col = seconds<=3 ? 'var(--buzz)' : seconds<=total*0.5 ? 'var(--warn)' : 'var(--accent)';
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ*(1-frac)} style={{ transition:'stroke-dashoffset 1s linear, stroke .3s' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center',
        fontFamily:'var(--font-display)', fontWeight:600, fontSize:size*0.36, color:col }}>{Math.max(0,Math.ceil(seconds))}</div>
    </div>
  );
}

/* horizontal timer bar (answer panel + countdown) */
function TimerBar({ seconds, total }) {
  const pct = Math.max(0, seconds/total)*100;
  const col = seconds<=total*0.3 ? 'var(--buzz)' : seconds<=total*0.6 ? 'var(--warn)' : 'var(--accent)';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ flex:1, height:8, borderRadius:99, background:'var(--surface-2)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, borderRadius:99, background:col, transition:'width 1s linear, background .3s' }}/>
      </div>
      <span style={{ fontFamily:'var(--font-display)', fontWeight:600, fontSize:14, color:col, width:28, textAlign:'right' }}>{Math.max(0,seconds)}s</span>
    </div>
  );
}

/* reaction time formatter (ms) */
function fmtMs(ms){ return ms < 1000 ? `${ms}ms` : `${(ms/1000).toFixed(1)}s`; }

/* lucide-ish inline icons (stroke) */
const Ico = {
  back:  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  qr:    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v7M17 21h-3"/></svg>,
  door:  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h20M13 2v20l-8-2V4z"/><circle cx="10" cy="12" r="0.6" fill="currentColor"/></svg>,
  zap:   <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8z"/></svg>,
  check: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  x:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  plus:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  users: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  crown: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M2 18h20l-2-10-5 4-3-7-3 7-5-4z"/></svg>,
  arrow: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  chart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18M8 17V9M13 17V5M18 17v-6"/></svg>,
};

Object.assign(window, { Avatar, Wordmark, Ring, TimerBar, fmtMs, avColor, Ico });
