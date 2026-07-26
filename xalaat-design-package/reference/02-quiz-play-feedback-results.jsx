// xalaat-quiz.jsx — quiz play screens (question, feedback, results)

// ─── Typewriter — types text out like an AI streaming response ────────
function TypewriterText({ text, speed = 35, motion = 'subtle', cursor = true, onDone }) {
  const [n, setN] = React.useState(motion === 'off' ? text.length : 0);
  React.useEffect(() => {
    if (motion === 'off') { setN(text.length); onDone && onDone(); return; }
    let i = 0;
    setN(0);
    const tick = () => {
      i++;
      setN(i);
      if (i < text.length) {
        // slight jitter for natural feel
        const jitter = (Math.random() - 0.5) * speed * 0.6;
        // pause longer at punctuation
        const ch = text[i - 1];
        const pause = /[.,?!]/.test(ch) ? speed * 6 : /\s/.test(ch) ? speed * 1.4 : speed;
        setTimeout(tick, Math.max(8, pause + jitter));
      } else {
        onDone && onDone();
      }
    };
    const id = setTimeout(tick, 200);
    return () => clearTimeout(id);
  }, [text, speed, motion]);

  return (
    <>
      {text.slice(0, n)}
      {cursor && n < text.length && (
        <span style={{
          display: 'inline-block', width: '0.5em', height: '0.9em',
          background: 'currentColor', verticalAlign: '-0.05em',
          marginLeft: 2, animation: 'xal-caret 0.9s steps(1) infinite',
          opacity: 0.7,
        }} />
      )}
    </>
  );
}

// ─── Buzzer — big tappable disc with halo pulse ──────────────────────
function Buzzer({ t, type, motion, label = 'BUZZER', size = 220, color, ink, hotkey = 'ESPACE' }) {
  const c = color || t.primary;
  const inkC = ink || t.primaryInk;
  const float = motion !== 'off' ? 'xal-buzz 1.4s ease-in-out infinite' : 'none';
  return (
    <div style={{ position: 'relative', width: size + 60, height: size + 60, display: 'grid', placeItems: 'center' }}>
      {/* concentric halos */}
      {motion !== 'off' && (
        <>
          <span style={{
            position: 'absolute', width: size + 60, height: size + 60, borderRadius: '50%',
            background: c, opacity: 0.18,
            animation: 'xal-halo 1.8s ease-out infinite',
          }} />
          <span style={{
            position: 'absolute', width: size + 60, height: size + 60, borderRadius: '50%',
            background: c, opacity: 0.12,
            animation: 'xal-halo 1.8s ease-out infinite', animationDelay: '0.6s',
          }} />
        </>
      )}
      {/* outer ring */}
      <span style={{
        position: 'absolute', width: size + 28, height: size + 28, borderRadius: '50%',
        background: c, opacity: 0.22,
      }} />
      <button style={{
        position: 'relative', width: size, height: size, borderRadius: '50%',
        background: c, color: inkC, border: 'none', cursor: 'default',
        boxShadow: `0 18px 40px -8px ${c}90, 0 4px 0 ${c}80, inset 0 -8px 0 rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,0.25)`,
        fontFamily: type.display, fontWeight: 700, letterSpacing: '0.04em',
        animation: float, transformOrigin: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        {/* concentric lozenge mark inside */}
        <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 80 80" style={{ opacity: 0.85 }}>
          <path d="M40 6 L74 40 L40 74 L6 40 Z" fill="none" stroke={inkC} strokeOpacity="0.45" strokeWidth="2" />
          <path d="M40 22 L58 40 L40 58 L22 40 Z" fill={inkC} fillOpacity="0.95" />
        </svg>
        <div style={{ fontSize: size * 0.13, lineHeight: 1, marginTop: 6 }}>{label}</div>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
          padding: '3px 8px', borderRadius: 4,
          background: 'rgba(0,0,0,0.15)', color: inkC, opacity: 0.85,
          fontFamily: type.body,
        }}>{hotkey}</div>
      </button>
    </div>
  );
}

// ─── Shared chrome: progress + timer ──────────────────────────────────
function QuizChrome({ t, type, current = 4, total = 10, time = '00:14', theme = 'Lutte sénégalaise', children }) {
  return (
    <div style={{ width: 1280, minHeight: 900, background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
        <PatternLozenge color={t.primary} opacity={0.08} size={32} />
      </div>

      {/* Top bar */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', borderBottom: `1px solid ${t.line}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button style={{
            width: 38, height: 38, borderRadius: 999,
            background: t.surface, border: `1px solid ${t.line}`,
            display: 'grid', placeItems: 'center', fontSize: 16, cursor: 'default',
            color: t.ink, fontFamily: 'inherit',
          }}>←</button>
          <XalaatMark size={28} color={t.primary} accent={t.accent} />
          <div>
            <div style={{ fontSize: 12, color: t.inkSoft, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quiz IA · en cours</div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 18, letterSpacing: '-0.015em' }}>{theme}</div>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              width: i < current ? 28 : 12, height: 8, borderRadius: 4,
              background: i < current - 1 ? t.primary : i === current - 1 ? t.accent : t.line,
              transition: 'width 0.3s',
            }} />
          ))}
        </div>

        {/* Timer + score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 12, color: t.inkSoft }}>Score</div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 22, color: t.primary, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              <AnimatedCounter to={840} motion="off" />
            </div>
          </div>
          <CircleTimer t={t} type={type} time={time} />
        </div>
      </div>

      {children}
    </div>
  );
}

function CircleTimer({ t, type, time = '00:14', progress = 0.72 }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke={t.line} strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={t.primary} strokeWidth="4"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
        fontFamily: type.display, fontWeight: type.displayWeight,
        fontSize: 14, color: t.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
      }}>{time}</div>
    </div>
  );
}

// ─── Screen 1: Question in play ───────────────────────────────────────
function XalaatQuizPlaying({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated'
    ? '0 24px 48px -16px rgba(26,20,16,0.16), 0 4px 12px rgba(26,20,16,0.06)'
    : 'none';
  const cardBorder = cardStyle === 'outlined' ? `1px solid ${t.line}` : 'none';
  const cardRadius = cardStyle === 'sharp' ? 6 : 20;

  return (
    <QuizChrome t={t} type={type} current={4} total={10} time="00:14">
      {/* big bg lozenge */}
      <svg width="600" height="600" viewBox="0 0 600 600" style={{ position: 'absolute', top: -150, right: -150, opacity: 0.08, pointerEvents: 'none' }}>
        <path d="M300 30 L570 300 L300 570 L30 300 Z" fill="none" stroke={t.primary} strokeWidth="2" />
        <path d="M300 100 L500 300 L300 500 L100 300 Z" fill="none" stroke={t.accent} strokeWidth="2" />
        <path d="M300 180 L420 300 L300 420 L180 300 Z" fill={t.secondary} fillOpacity="0.15" />
      </svg>

      <div style={{ position: 'relative', zIndex: 2, padding: '40px 80px 56px', display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 56, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px 6px 8px', borderRadius: 999,
              background: t.primary, color: t.primaryInk,
              fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center',
                background: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 800,
              }}>04</span>
              QUESTION 4 / 10
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 999,
              background: t.surface, border: `1px solid ${t.line}`,
              fontSize: 12, color: t.inkSoft,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: t.accent,
                animation: motion !== 'off' ? 'xal-pulse 1.4s ease-in-out infinite' : 'none',
              }} />
              <strong style={{ color: t.ink, fontWeight: 700, marginRight: 2 }}>IA</strong> écrit la question…
            </div>
          </div>

          {/* Animated question */}
          <h1 style={{
            fontFamily: type.display, fontWeight: type.displayWeight,
            fontSize: 52, lineHeight: 1.08, letterSpacing: '-0.025em',
            margin: 0, marginBottom: 22, textWrap: 'balance', maxWidth: 640,
            minHeight: '2.4em', color: t.ink,
          }}>
            <TypewriterText text="Qui a remporté le combat du siècle au Sénégal en 2002 ?" speed={32} motion={motion} />
          </h1>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: t.inkSoft, marginBottom: 22,
            padding: '10px 16px', background: `${t.accent}18`, borderRadius: 999,
            border: `1px dashed ${t.accent}66`, width: 'fit-content',
          }}>
            <span style={{ fontSize: 16 }}>⚡</span>
            <span><strong style={{ color: t.ink, fontWeight: 700 }}>Buzze avant les autres</strong> pour répondre en premier et doubler les points.</span>
          </div>

          {/* Answers — locked state until buzz */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 640, position: 'relative' }}>
            {[
              { txt: 'Tyson' },
              { txt: 'Bombardier' },
              { txt: 'Yékini' },
              { txt: 'Balla Gaye 2' },
            ].map((a, i) => (
              <button key={i} style={{
                padding: '18px 22px', borderRadius: cardRadius === 6 ? 6 : 14,
                background: t.surface, color: t.inkSoft,
                border: `1.5px dashed ${t.line}`,
                fontFamily: 'inherit',
                fontSize: 16, fontWeight: 600, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'default', opacity: 0.55,
                transition: 'all 0.18s ease',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: t.surface2, color: t.inkSoft,
                  display: 'grid', placeItems: 'center',
                  fontFamily: type.display, fontWeight: 700, fontSize: 13,
                  flex: '0 0 auto',
                }}>{['A', 'B', 'C', 'D'][i]}</div>
                {a.txt}
              </button>
            ))}
            {/* lock overlay */}
            <div style={{
              position: 'absolute', inset: '-6px', display: 'grid', placeItems: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                background: t.ink, color: t.bg,
                padding: '8px 16px', borderRadius: 999,
                fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 8px 20px rgba(26,20,16,0.25)',
              }}>
                <span style={{ fontSize: 14 }}>🔒</span> BUZZE POUR DÉVERROUILLER
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button style={{ ...quizBtnGhost(t), padding: '10px 16px' }}>
              <span style={{ marginRight: 6 }}>💡</span> Indice (-50 pts)
            </button>
            <button style={{ ...quizBtnGhost(t), padding: '10px 16px' }}>
              Passer →
            </button>
          </div>
        </div>

        {/* Right panel: buzzer + opponents */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <Buzzer t={t} type={type} motion={motion} label="BUZZER" hotkey="ESPACE" size={220} />

          {/* Opponents racing */}
          <div style={{
            width: '100%', maxWidth: 360,
            background: t.surface, borderRadius: cardRadius,
            border: cardBorder || `1px solid ${t.line}`,
            padding: 18, boxShadow: cardShadow,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: t.inkSoft, fontWeight: 700, marginBottom: 14,
            }}>
              <span>En course · live</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                color: t.primary,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: t.primary,
                  animation: motion !== 'off' ? 'xal-pulse 1.2s ease-in-out infinite' : 'none',
                }} />
                4 joueurs
              </span>
            </div>
            {[
              { name: 'Toi', avatar: 'TO', hue: 30, you: true, pct: 0, status: 'prêt' },
              { name: 'Modou Fall', avatar: 'MF', hue: 60, pct: 72, status: 'buzze dans 2s' },
              { name: 'Awa Diop', avatar: 'AD', hue: 350, pct: 45, status: 'réfléchit' },
              { name: 'Cheikh Sarr', avatar: 'CS', hue: 200, pct: 18, status: 'lit la question' },
            ].map((p, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 0',
                borderBottom: i < arr.length - 1 ? `1px solid ${t.line}` : 'none',
              }}>
                <Avatar name={p.name} hue={p.hue} size={32}
                  ring={p.you ? t.accent : null} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: t.ink }}>{p.name}</span>
                    {p.you && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: t.accent, color: t.ink, fontWeight: 700, letterSpacing: '0.06em' }}>TOI</span>}
                  </div>
                  <div style={{ height: 4, background: t.surface2, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      width: `${p.pct}%`, height: '100%',
                      background: p.you ? t.accent : t.primary,
                      transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
                <div style={{
                  fontSize: 11, color: t.inkSoft,
                  fontFamily: type.accent, fontStyle: 'italic',
                  whiteSpace: 'nowrap',
                }}>{p.status}</div>
              </div>
            ))}
          </div>

          {/* streak compact */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderRadius: 999,
            background: t.ink, color: t.bg,
          }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>3 d'affilée</span>
            <span style={{ fontSize: 11, color: 'rgba(241,229,201,0.6)', fontFamily: type.accent, fontStyle: 'italic' }}>borom xalaat</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes xal-caret { 50% { opacity: 0; } }
        @keyframes xal-pulse {
          0%, 100% { box-shadow: 0 0 0 0 currentColor; }
          50% { box-shadow: 0 0 0 4px transparent; }
        }
        @keyframes xal-buzz {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes xal-halo {
          0% { transform: scale(0.85); opacity: 0.3; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>
    </QuizChrome>
  );
}

// ─── Screen 2: Answer feedback ────────────────────────────────────────
function XalaatQuizFeedback({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated' ? '0 24px 48px -16px rgba(26,20,16,0.16)' : 'none';
  const cardRadius = cardStyle === 'sharp' ? 6 : 22;
  const good = '#2D8559';

  return (
    <QuizChrome t={t} type={type} current={4} total={10} time="00:08">
      {/* celebratory lozenge bloom */}
      <svg width="700" height="700" viewBox="0 0 700 700" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.2, pointerEvents: 'none' }}>
        <path d="M350 50 L650 350 L350 650 L50 350 Z" fill="none" stroke={good} strokeWidth="1.5" />
        <path d="M350 130 L570 350 L350 570 L130 350 Z" fill="none" stroke={good} strokeWidth="1.5" />
        <path d="M350 210 L490 350 L350 490 L210 350 Z" fill="none" stroke={good} strokeWidth="1.5" />
      </svg>

      <div style={{ position: 'relative', zIndex: 2, padding: '56px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div>
          {/* Status badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '10px 18px 10px 14px', borderRadius: 999,
            background: good, color: '#fff',
            fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
            marginBottom: 24,
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)', display: 'grid', placeItems: 'center',
              fontSize: 12, fontWeight: 800,
            }}>✓</span>
            BONNE RÉPONSE !
          </div>

          <h1 style={{
            fontFamily: type.display, fontWeight: type.displayWeight,
            fontSize: 80, lineHeight: 0.95, letterSpacing: '-0.035em',
            margin: 0, marginBottom: 20,
          }}>
            <span style={{ color: good }}>+280</span><br />
            <span style={{ fontSize: 36, color: t.inkSoft, fontFamily: type.accent, fontStyle: 'italic', fontWeight: 400 }}>
              points en poche
            </span>
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <span style={{
              padding: '6px 12px', borderRadius: 999,
              background: t.accent, color: t.ink,
              fontSize: 12, fontWeight: 700,
            }}>⚡ +120 BONUS VITESSE</span>
            <span style={{
              padding: '6px 12px', borderRadius: 999,
              background: t.surface, color: t.ink, border: `1px solid ${t.line}`,
              fontSize: 12, fontWeight: 700,
            }}>🔥 SÉRIE x4</span>
          </div>

          {/* Did you know card */}
          <div style={{
            background: t.surface, borderRadius: cardRadius,
            border: `1px solid ${t.line}`, padding: 24,
            boxShadow: cardShadow, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.15 }}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <path d="M60 10 L110 60 L60 110 L10 60 Z" fill={t.primary} />
              </svg>
            </div>
            <div style={{
              fontFamily: type.accent, fontStyle: 'italic',
              fontSize: 14, color: t.primary, marginBottom: 8,
              letterSpacing: '0.02em',
            }}>Saviez-vous que…</div>
            <p style={{
              fontSize: 17, lineHeight: 1.5, color: t.ink, margin: 0, maxWidth: 480,
            }}>
              <strong>Bombardier</strong> a battu Tyson le 27 juillet 2002 à Dakar, un combat suivi par plus de 50 000 spectateurs au stade Demba Diop. Le combat est entré dans l'histoire de la lutte avec frappe.
            </p>
          </div>
        </div>

        {/* Right: question recap + next */}
        <div>
          <div style={{
            background: t.surface, borderRadius: cardRadius,
            border: `1px solid ${t.line}`, padding: 28,
            boxShadow: cardShadow,
          }}>
            <div style={{ fontSize: 12, color: t.inkSoft, marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Question 4</div>
            <div style={{
              fontFamily: type.display, fontWeight: type.displayWeight,
              fontSize: 22, lineHeight: 1.2, marginBottom: 20, color: t.ink,
            }}>Qui a remporté le combat du siècle au Sénégal en 2002 ?</div>
            {[
              { txt: 'Tyson', state: 'idle' },
              { txt: 'Bombardier', state: 'correct' },
              { txt: 'Yékini', state: 'idle' },
              { txt: 'Balla Gaye 2', state: 'idle' },
            ].map((a, i) => (
              <div key={i} style={{
                padding: '12px 16px', borderRadius: 12,
                background: a.state === 'correct' ? good : 'transparent',
                color: a.state === 'correct' ? '#fff' : t.inkSoft,
                border: a.state === 'correct' ? 'none' : `1px solid ${t.line}`,
                fontSize: 15, fontWeight: a.state === 'correct' ? 700 : 500,
                marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: a.state === 'correct' ? 'rgba(255,255,255,0.22)' : t.surface2,
                  color: a.state === 'correct' ? '#fff' : t.inkSoft,
                  display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700,
                }}>{['A', 'B', 'C', 'D'][i]}</div>
                {a.txt}
                {a.state === 'correct' && <span style={{ marginLeft: 'auto', fontSize: 16 }}>✓</span>}
              </div>
            ))}
          </div>

          <button style={{
            marginTop: 16, width: '100%',
            background: t.primary, color: t.primaryInk,
            border: 'none', borderRadius: 999,
            padding: '18px 24px', fontSize: 16, fontWeight: 700,
            fontFamily: 'inherit', cursor: 'default',
            boxShadow: '0 12px 28px -8px rgba(184,70,42,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            Question suivante <span style={{ fontSize: 18 }}>→</span>
          </button>
        </div>
      </div>
    </QuizChrome>
  );
}

// ─── Screen 3: Final results ──────────────────────────────────────────
function XalaatQuizResults({ theme, type, motion, cardStyle }) {
  const t = theme;
  const cardShadow = cardStyle === 'elevated' ? '0 24px 48px -16px rgba(26,20,16,0.16), 0 4px 12px rgba(26,20,16,0.06)' : 'none';
  const cardBorder = cardStyle === 'outlined' ? `1px solid ${t.line}` : 'none';
  const cardRadius = cardStyle === 'sharp' ? 6 : 22;

  return (
    <div style={{ width: 1280, minHeight: 980, background: t.bg, color: t.ink, fontFamily: type.body, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
        <PatternLozenge color={t.primary} opacity={0.08} size={28} />
      </div>
      {/* Trophy lozenge bloom */}
      <svg width="800" height="800" viewBox="0 0 800 800" style={{ position: 'absolute', top: -180, left: '50%', transform: 'translateX(-50%)', opacity: 0.14, pointerEvents: 'none' }}>
        <path d="M400 40 L760 400 L400 760 L40 400 Z" fill="none" stroke={t.accent} strokeWidth="2" />
        <path d="M400 130 L670 400 L400 670 L130 400 Z" fill="none" stroke={t.primary} strokeWidth="2" />
        <path d="M400 220 L580 400 L400 580 L220 400 Z" fill="none" stroke={t.secondary} strokeWidth="2" />
        <path d="M400 310 L490 400 L400 490 L310 400 Z" fill={t.accent} fillOpacity="0.25" />
      </svg>

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <XalaatMark size={30} color={t.primary} accent={t.accent} />
          <span style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 22, letterSpacing: '-0.02em' }}>Xalaat</span>
        </div>
        <button style={{
          background: 'transparent', border: `1px solid ${t.line}`,
          color: t.ink, padding: '8px 16px', borderRadius: 999,
          fontSize: 13, fontFamily: 'inherit', cursor: 'default',
        }}>Fermer ✕</button>
      </div>

      <div style={{ position: 'relative', zIndex: 2, padding: '24px 80px 56px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: t.primary, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
          Quiz terminé · Lutte sénégalaise
        </div>
        <h1 style={{
          fontFamily: type.display, fontWeight: type.displayWeight,
          fontSize: 88, lineHeight: 0.95, letterSpacing: '-0.035em',
          margin: '0 0 12px',
        }}>
          <span style={{ fontFamily: type.accent, fontStyle: 'italic', color: t.inkSoft, fontWeight: 400, fontSize: 56 }}>Mashallah, </span>
          tu es <span style={{ color: t.primary }}>borom xalaat</span>.
        </h1>
        <p style={{ fontSize: 17, color: t.inkSoft, margin: 0, maxWidth: 540, marginInline: 'auto' }}>
          Tu termines dans le <strong style={{ color: t.ink }}>top 8%</strong> des joueurs sur ce thème cette semaine.
        </p>

        {/* Big score + medal */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 32, marginTop: 40, marginBottom: 32 }}>
          {/* Gold medal lozenge */}
          <div style={{ position: 'relative', width: 160, height: 160 }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <path d="M80 8 L152 80 L80 152 L8 80 Z" fill={t.accent} />
              <path d="M80 22 L138 80 L80 138 L22 80 Z" fill="none" stroke={t.ink} strokeOpacity="0.2" strokeWidth="2" />
              <path d="M80 40 L120 80 L80 120 L40 80 Z" fill="none" stroke={t.ink} strokeOpacity="0.3" strokeWidth="1.5" />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
              fontFamily: type.display, fontWeight: 700,
              fontSize: 22, color: t.ink, letterSpacing: '0.04em',
            }}>OR</div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 14, color: t.inkSoft, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Score final</div>
            <div style={{
              fontFamily: type.display, fontWeight: type.displayWeight,
              fontSize: 128, lineHeight: 1, letterSpacing: '-0.04em', color: t.ink,
            }}>
              <AnimatedCounter to={2840} motion={motion} duration={1600} />
            </div>
            <div style={{ fontSize: 14, color: t.inkSoft, marginTop: 4 }}>
              <span style={{ fontFamily: type.accent, fontStyle: 'italic' }}>xalaat-points</span> · +680 vs ta moyenne
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36, maxWidth: 980, marginInline: 'auto' }}>
          {[
            { n: 8, total: 10, label: 'Bonnes réponses', color: t.primary },
            { n: 6, label: 'Série max', suffix: '🔥', color: t.accent },
            { n: 4, label: 'Bonus vitesse', suffix: '⚡', color: t.secondary },
            { n: '3m 42s', label: 'Temps total', color: t.ink, raw: true },
          ].map((s, i) => (
            <div key={i} style={{
              background: t.surface, borderRadius: cardRadius, padding: 22,
              border: cardBorder, boxShadow: cardShadow, textAlign: 'left',
              position: 'relative', overflow: 'hidden',
            }}>
              <svg width="60" height="60" viewBox="0 0 60 60" style={{ position: 'absolute', bottom: -10, right: -10, opacity: 0.12 }}>
                <path d="M30 0 L60 30 L30 60 L0 30 Z" fill={s.color} />
              </svg>
              <div style={{
                fontFamily: type.display, fontWeight: type.displayWeight,
                fontSize: 40, color: s.color, letterSpacing: '-0.025em', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums', position: 'relative',
              }}>
                {s.raw ? s.n : <AnimatedCounter to={s.n} motion={motion} />}
                {s.total && <span style={{ fontSize: 22, color: t.inkSoft, marginLeft: 4 }}>/{s.total}</span>}
                {s.suffix && <span style={{ fontSize: 22, marginLeft: 6 }}>{s.suffix}</span>}
              </div>
              <div style={{ fontSize: 13, color: t.inkSoft, marginTop: 8, position: 'relative' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Badge unlocked */}
        <div style={{
          maxWidth: 980, marginInline: 'auto',
          background: t.ink, color: t.bg,
          borderRadius: cardRadius, padding: 24,
          display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center',
          marginBottom: 28, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
            <PatternLozenge color={t.accent} opacity={0.2} size={20} />
          </div>
          <div style={{ position: 'relative', width: 64, height: 64 }}>
            <svg width="64" height="64" viewBox="0 0 64 64">
              <path d="M32 4 L60 32 L32 60 L4 32 Z" fill={t.accent} />
              <path d="M32 16 L48 32 L32 48 L16 32 Z" fill={t.ink} fillOpacity="0.2" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 24 }}>🤼</div>
          </div>
          <div style={{ position: 'relative', textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: t.accent, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
              ★ Nouveau badge débloqué
            </div>
            <div style={{ fontFamily: type.display, fontWeight: type.displayWeight, fontSize: 24, letterSpacing: '-0.015em' }}>
              Lamb dëkk-dëkk
            </div>
            <div style={{ fontSize: 13, color: 'rgba(241,229,201,0.65)', marginTop: 4 }}>
              Réponds à 8+ questions sur la lutte sénégalaise · 1 247 joueurs l'ont
            </div>
          </div>
          <button style={{
            background: t.accent, color: t.ink, border: 'none',
            padding: '12px 18px', borderRadius: 999,
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'default',
            position: 'relative',
          }}>Voir ma collection →</button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <button style={{
            background: t.primary, color: t.primaryInk, border: 'none',
            padding: '16px 28px', borderRadius: 999,
            fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'default',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 12px 28px -8px rgba(184,70,42,0.35)',
          }}>
            <span style={{ fontSize: 18 }}>↻</span> Rejouer ce thème
          </button>
          <button style={{
            background: t.ink, color: t.bg, border: 'none',
            padding: '16px 28px', borderRadius: 999,
            fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'default',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            ✨ Nouveau thème IA
          </button>
          <button style={{
            background: 'transparent', color: t.ink, border: `1.5px solid ${t.line}`,
            padding: '16px 22px', borderRadius: 999,
            fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'default',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            🎯 Défier un ami
          </button>
        </div>

        {/* Share */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '12px 8px 12px 20px', borderRadius: 999,
          background: t.surface, border: `1px solid ${t.line}`,
          fontSize: 13, color: t.inkSoft,
        }}>
          <span>Partager ton score</span>
          {['WhatsApp', 'Instagram', 'X', 'Copier'].map((s) => (
            <button key={s} style={{
              padding: '8px 14px', borderRadius: 999,
              background: t.bg, border: 'none', color: t.ink,
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'default',
            }}>{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function quizBtnGhost(t) {
  return {
    background: 'transparent', color: t.ink,
    border: `1px solid ${t.line}`, borderRadius: 999,
    padding: '10px 18px', fontSize: 13, fontWeight: 500,
    fontFamily: 'inherit', cursor: 'default',
  };
}

Object.assign(window, { XalaatQuizPlaying, XalaatQuizFeedback, XalaatQuizResults });
