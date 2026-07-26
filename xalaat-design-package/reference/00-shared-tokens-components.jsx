// xalaat-shared.jsx — design tokens, patterns, helpers shared between
// desktop and mobile artboards. Exposes everything on window.

// ─── Palettes ─────────────────────────────────────────────────────────
const XALAAT_PALETTES = {
  teranga: {
    name: 'Teranga',
    bg: '#F1E5C9',
    surface: '#FBF4DF',
    surface2: '#F6EBC9',
    ink: '#1A1410',
    inkSoft: '#5B4E3D',
    line: 'rgba(26,20,16,0.10)',
    primary: '#B8462A',
    primaryInk: '#FBF4DF',
    accent: '#E8A630',
    secondary: '#2A3656',
  },
  mbalax: {
    name: 'Mbalax',
    bg: '#FBF6E8',
    surface: '#FFFFFF',
    surface2: '#F2EAD3',
    ink: '#0F2A22',
    inkSoft: '#456057',
    line: 'rgba(15,42,34,0.12)',
    primary: '#2D5F4E',
    primaryInk: '#FBF6E8',
    accent: '#E8731A',
    secondary: '#B82E47',
  },
  saaru: {
    name: 'Saaru',
    bg: '#1A1410',
    surface: '#241B14',
    surface2: '#2E2218',
    ink: '#F1E5C9',
    inkSoft: '#B7A788',
    line: 'rgba(241,229,201,0.14)',
    primary: '#E8A630',
    primaryInk: '#1A1410',
    accent: '#C44536',
    secondary: '#7A4FB8',
  },
  ker: {
    name: 'Kër',
    bg: '#EDE6D4',
    surface: '#F7F1DD',
    surface2: '#E6DCC2',
    ink: '#15203D',
    inkSoft: '#4A5470',
    line: 'rgba(21,32,61,0.12)',
    primary: '#2A3656',
    primaryInk: '#F7F1DD',
    accent: '#C99B4F',
    secondary: '#C44536',
  },
};

// Apply dark inversion on top of palette: swap bg/ink-ish without losing
// accent identity. Saaru is already dark — return as-is.
function deriveTheme(paletteKey, dark) {
  const p = XALAAT_PALETTES[paletteKey] || XALAAT_PALETTES.teranga;
  if (!dark || paletteKey === 'saaru') return p;
  // Build a dark variant from the light palette.
  return {
    ...p,
    bg: '#1A1410',
    surface: '#241B14',
    surface2: '#2E2218',
    ink: p.bg, // cream text
    inkSoft: 'rgba(241,229,201,0.65)',
    line: 'rgba(241,229,201,0.14)',
    primaryInk: '#1A1410',
  };
}

// ─── Type pairings ────────────────────────────────────────────────────
const XALAAT_TYPE = {
  bricolage: {
    name: 'Bricolage',
    display: '"Bricolage Grotesque", "Manrope", system-ui, sans-serif',
    body: '"Manrope", system-ui, sans-serif',
    accent: '"Instrument Serif", Georgia, serif',
    displayWeight: 700,
  },
  fraunces: {
    name: 'Familjen',
    display: '"Familjen Grotesk", "Manrope", system-ui, sans-serif',
    body: '"Manrope", system-ui, sans-serif',
    accent: '"Instrument Serif", Georgia, serif',
    displayWeight: 700,
  },
  boldonse: {
    name: 'Boldonse',
    display: '"Boldonse", "Bricolage Grotesque", system-ui, sans-serif',
    body: '"Manrope", system-ui, sans-serif',
    accent: '"Instrument Serif", Georgia, serif',
    displayWeight: 400,
  },
};

// ─── Geometric SVG patterns (original, inspired by woven textiles) ────
function PatternLozenge({ color = '#B8462A', opacity = 0.08, size = 28 }) {
  const id = React.useId();
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <path d={`M${size / 2} 2 L${size - 2} ${size / 2} L${size / 2} ${size - 2} L2 ${size / 2} Z`}
            fill="none" stroke={color} strokeWidth="1" opacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function PatternZigzag({ color = '#2A3656', opacity = 0.12, size = 22 }) {
  const id = React.useId();
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <path d={`M0 ${size * 0.7} L${size / 2} ${size * 0.3} L${size} ${size * 0.7}`}
            fill="none" stroke={color} strokeWidth="1.4" opacity={opacity} strokeLinejoin="round" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

function PatternDots({ color = '#1A1410', opacity = 0.18, size = 16 }) {
  const id = React.useId();
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <circle cx={size / 2} cy={size / 2} r="1" fill={color} opacity={opacity} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

// ─── Animated counter (counts up on mount) ────────────────────────────
function AnimatedCounter({ to, duration = 1400, format = (n) => n.toLocaleString('fr-FR'), motion = 'subtle' }) {
  const [n, setN] = React.useState(motion === 'off' ? to : 0);
  React.useEffect(() => {
    if (motion === 'off') { setN(to); return; }
    const start = performance.now();
    const dur = motion === 'lively' ? duration * 1.2 : duration;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      // easeOutCubic
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, motion]);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{format(n)}</span>;
}

// ─── Avatar — colored disc with initials ──────────────────────────────
function Avatar({ name, hue, size = 36, ring }) {
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('');
  const bg = `oklch(0.72 0.14 ${hue})`;
  const ink = `oklch(0.22 0.06 ${hue})`;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg, color: ink,
      fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
      fontWeight: 700, fontSize: size * 0.4, letterSpacing: '0.02em',
      boxShadow: ring ? `0 0 0 2px ${ring}, 0 0 0 4px ${bg}` : 'none',
      flex: '0 0 auto',
    }}>{initials}</div>
  );
}

// ─── Brand mark — geometric lozenge X ─────────────────────────────────
function XalaatMark({ size = 36, color, accent }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" style={{ display: 'block' }}>
      <path d="M18 2 L34 18 L18 34 L2 18 Z" fill={color} />
      <path d="M18 8 L28 18 L18 28 L8 18 Z" fill={accent} opacity="0.85" />
      <circle cx="18" cy="18" r="3" fill={color} />
    </svg>
  );
}

// ─── Shared top bar for app-shell screens (rooms, classement, profil…) ─
function AppTopBar({ t, type, title = 'Xalaat', tag = 'QUIZ', avatarName = 'Momo', avatarHue = 30, back = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 14px', position: 'relative', zIndex: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {back && <div style={{ width: 34, height: 34, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: 'grid', placeItems: 'center', fontSize: 15, marginRight: 2 }}>←</div>}
        <div style={{ width: 36, height: 36, borderRadius: 11, background: t.primary, display: 'grid', placeItems: 'center' }}><XalaatMark size={20} color={t.primaryInk} accent={t.accent} /></div>
        <div style={{ lineHeight: 1.15 }}>
          <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 16, letterSpacing: '-0.01em' }}>{title}</div>
          <div style={{ fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.primary, fontWeight: 700 }}>{tag}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: 'grid', placeItems: 'center', fontSize: 13 }}>☀️</div>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: t.surface, border: `1px solid ${t.line}`, display: 'grid', placeItems: 'center', fontSize: 13 }}>🔔</div>
        <Avatar name={avatarName} hue={avatarHue} size={34} ring={t.accent} />
      </div>
    </div>
  );
}

function BottomTabBar({ t, active = 'accueil' }) {
  const tabs = [
    { k: 'accueil', ic: '◆', l: 'Accueil' },
    { k: 'salles', ic: '▦', l: 'Salles' },
    { k: 'classement', ic: '★', l: 'Classement' },
    { k: 'amis', ic: '◯', l: 'Amis' },
    { k: 'profil', ic: '●', l: 'Profil' },
  ];
  return (
    <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-around', padding: '10px 12px 22px', background: t.surface, borderTop: `1px solid ${t.line}` }}>
      {tabs.map((tab) => (
        <div key={tab.k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: tab.k === active ? t.primary : t.inkSoft, fontSize: 9.5, fontWeight: 600 }}>
          <div style={{ fontSize: 17 }}>{tab.ic}</div>{tab.l}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  XALAAT_PALETTES, XALAAT_TYPE, deriveTheme,
  PatternLozenge, PatternZigzag, PatternDots,
  AnimatedCounter, Avatar, XalaatMark, AppTopBar, BottomTabBar,
});
