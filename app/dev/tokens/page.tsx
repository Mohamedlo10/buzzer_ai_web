'use client';

import { useState } from 'react';

import { palette, alpha, radius, withAlpha } from '~/lib/theme/tokens';
import { confirmAsync, type ConfirmTone } from '~/lib/ui/confirm';
import { notify } from '~/lib/ui/notify';

/**
 * ÉCRAN DE NON-RÉGRESSION DES DESIGN TOKENS
 *
 * Il existe pour une raison précise : une couleur fausse ne fait jamais planter
 * un build. Elle décale une teinte, et personne ne le voit sur une capture.
 *
 * Chaque pastille est rendue DEUX FOIS côte à côte, sans séparateur :
 *   · à gauche  — la classe Tailwind (`bg-primary`), donc la valeur compilée ;
 *   · à droite  — un style inline lisant la variable CSS (`var(--primary)`),
 *                 donc la valeur runtime.
 *
 * Les deux chemins partent maintenant du même `lib/theme/palette.js`. S'ils
 * divergent, une COUTURE VERTICALE apparaît au milieu de la pastille — c'est
 * tout ce qu'il y a à chercher. Aucune couture = les deux mécanismes concordent.
 *
 * La troisième colonne fait la même chose avec les alias historiques
 * `--color-*` (l'ancien nommage de theme.css, encore lu par ~365 styles
 * inline). Elle disparaîtra quand ces sites auront été portés.
 *
 * ── En phase 2 ──
 * Cet écran est dupliqué tel quel dans `apps/game` et lu depuis le même
 * `@xalaat/core`. La comparaison iOS / Android / Expo web / Next legacy côte à
 * côte est le seul niveau de vérification qui attrape les erreurs de
 * compositing (ombres, flous) que la table de vérité ne peut pas voir.
 *
 * Le pendant automatisé — 132 assertions, sans navigateur — est dans
 * `lib/theme/palette.test.js` (`node lib/theme/palette.test.js`).
 */

/** Les classes Tailwind sont écrites en littéral : le scanner ne résout pas les templates. */
const COLORS: { name: string; hex: string; cls: string; legacy?: string }[] = [
  { name: 'bg', hex: palette.bg, cls: 'bg-bg', legacy: '--color-bg' },
  { name: 'bg-deep', hex: palette.bgDeep, cls: 'bg-bg-deep' },
  { name: 'surface', hex: palette.surface, cls: 'bg-surface', legacy: '--color-surface' },
  { name: 'surface-2', hex: palette.surface2, cls: 'bg-surface-2', legacy: '--color-surface-2' },
  { name: 'line', hex: palette.line, cls: 'bg-line' },
  { name: 'txt', hex: palette.txt, cls: 'bg-txt', legacy: '--color-ink' },
  { name: 'ink-soft', hex: palette.inkSoft, cls: 'bg-ink-soft', legacy: '--color-ink-soft' },
  { name: 'primary', hex: palette.primary, cls: 'bg-primary', legacy: '--color-primary' },
  { name: 'primary-d', hex: palette.primaryD, cls: 'bg-primary-d' },
  { name: 'primary-ink', hex: palette.primaryInk, cls: 'bg-primary-ink', legacy: '--color-primary-ink' },
  { name: 'gold', hex: palette.gold, cls: 'bg-gold' },
  { name: 'gold-bright', hex: palette.goldBright, cls: 'bg-gold-bright' },
  { name: 'indigo', hex: palette.indigo, cls: 'bg-indigo', legacy: '--color-secondary' },
  { name: 'good', hex: palette.good, cls: 'bg-good' },
  { name: 'bad', hex: palette.bad, cls: 'bg-bad' },
  { name: 'bad-h', hex: palette.badH, cls: 'bg-buzz-h' },
  { name: 'violet', hex: palette.violet, cls: 'bg-host' },
  { name: 'warn', hex: palette.warn, cls: 'bg-warn' },
  { name: 'silver', hex: palette.silver, cls: 'bg-silver' },
  { name: 'bronze', hex: palette.bronze, cls: 'bg-bronze' },
];

/** Rampes d'opacité — classes littérales, celles réellement compilées. */
const RAMPS: { label: string; hex: string; steps: { cls: string; a: number }[] }[] = [
  {
    label: 'primary',
    hex: palette.primary,
    steps: [
      { cls: 'bg-primary', a: 1 },
      { cls: 'bg-primary/60', a: 0.6 },
      { cls: 'bg-primary/40', a: 0.4 },
      { cls: 'bg-primary/25', a: 0.25 },
      { cls: 'bg-primary/10', a: 0.1 },
    ],
  },
  {
    label: 'txt',
    hex: palette.txt,
    steps: [
      { cls: 'bg-txt', a: 1 },
      { cls: 'bg-txt/60', a: 0.6 },
      { cls: 'bg-txt/40', a: 0.4 },
      { cls: 'bg-txt/25', a: 0.25 },
      { cls: 'bg-txt/10', a: 0.1 },
    ],
  },
  {
    label: 'gold-bright',
    hex: palette.goldBright,
    steps: [
      { cls: 'bg-gold-bright', a: 1 },
      { cls: 'bg-gold-bright/60', a: 0.6 },
      { cls: 'bg-gold-bright/40', a: 0.4 },
      { cls: 'bg-gold-bright/25', a: 0.25 },
      { cls: 'bg-gold-bright/10', a: 0.1 },
    ],
  },
  {
    label: 'indigo',
    hex: palette.indigo,
    steps: [
      { cls: 'bg-indigo', a: 1 },
      { cls: 'bg-indigo/60', a: 0.6 },
      { cls: 'bg-indigo/40', a: 0.4 },
      { cls: 'bg-indigo/25', a: 0.25 },
      { cls: 'bg-indigo/10', a: 0.1 },
    ],
  },
];

function Seam({ cls, inline, legacy }: { cls: string; inline: string; legacy?: string }) {
  return (
    <div style={{ display: 'flex', height: 48, borderRadius: 6, overflow: 'hidden' }}>
      <div className={cls} style={{ flex: 1 }} />
      <div style={{ flex: 1, background: inline }} />
      {legacy ? <div style={{ flex: 1, background: `var(${legacy})` }} /> : null}
    </div>
  );
}

/**
 * Banc d'essai des dialogues — la seule façon de vérifier À L'ŒIL le correctif
 * de `ConfirmModal`, qui n'apparaît sur aucune page rendue statiquement.
 *
 * Il exerce la chaîne complète : `confirmAsync` → store → `ConfirmHost` →
 * `ConfirmModal`, puis le retour de la promesse affiché en toast. Si le bouton
 * de confirmation s'affiche sans fond ni bordure, c'est que la composition
 * alpha est repartie sur une chaîne CSS au lieu d'un hexadécimal.
 */
function DialogBench() {
  const [last, setLast] = useState<string>('—');

  const tones: { tone: ConfirmTone; label: string }[] = [
    { tone: 'default', label: 'Confirmation neutre' },
    { tone: 'danger', label: 'Action destructrice' },
    { tone: 'warning', label: 'Avertissement' },
  ];

  return (
    <div
      style={{
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: radius.card,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10 }}>
        Dialogues — chaîne complète
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        {tones.map((t) => (
          <button
            key={t.tone}
            className="px-3 py-2 rounded-xl bg-surface-2 border border-line text-sm font-semibold cursor-pointer"
            onClick={async () => {
              const r = await confirmAsync({
                title: t.label,
                message: 'La promesse se résout avec votre choix.',
                tone: t.tone,
              });
              setLast(`${t.tone} → ${r ? 'confirmé' : 'annulé'}`);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <button
          className="px-3 py-2 rounded-xl bg-surface-2 border border-line text-sm font-semibold cursor-pointer"
          onClick={() => notify.error('Message d’erreur')}
        >
          notify.error
        </button>
        <button
          className="px-3 py-2 rounded-xl bg-surface-2 border border-line text-sm font-semibold cursor-pointer"
          onClick={() => notify.success('Message de succès')}
        >
          notify.success
        </button>
        <button
          className="px-3 py-2 rounded-xl bg-surface-2 border border-line text-sm font-semibold cursor-pointer"
          onClick={() => notify.info('Message neutre')}
        >
          notify.info
        </button>
      </div>
      <div style={{ fontSize: 11, color: palette.inkSoft, fontFamily: 'monospace' }}>
        dernier retour : {last}
      </div>
      <p style={{ fontSize: 11, color: palette.inkSoft, marginTop: 8, marginBottom: 0 }}>
        Pendant automatisé : <code>npm run test:confirm</code> — il couvre le cas qui ne se voit pas,
        une promesse laissée en suspens quand une demande en remplace une autre.
      </p>
    </div>
  );
}

export default function TokensDevPage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        overflowY: 'auto',
        background: palette.bg,
        color: palette.txt,
        padding: 24,
        fontFamily: 'var(--font-ui)',
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Design tokens — non-régression</h1>
      <p style={{ fontSize: 13, color: palette.inkSoft, marginBottom: 4, maxWidth: 680 }}>
        Chaque pastille superpose <strong>classe Tailwind</strong> · <strong>var CSS</strong>
        {' · '}
        <strong>alias historique</strong>. Une couture verticale visible = les mécanismes ont divergé.
      </p>
      <p style={{ fontSize: 12, color: palette.inkSoft, marginBottom: 24 }}>
        Pendant automatisé : <code>node lib/theme/palette.test.js</code>
      </p>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 10px' }}>Palette ({COLORS.length} couleurs)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
        {COLORS.map((c) => (
          <div key={c.name}>
            <Seam cls={c.cls} inline={c.hex} legacy={c.legacy} />
            <div style={{ fontSize: 11, marginTop: 5, fontWeight: 700 }}>{c.name}</div>
            <div style={{ fontSize: 10, color: palette.inkSoft, fontFamily: 'monospace' }}>
              {c.hex}
              {c.legacy ? ` · ${c.legacy}` : ''}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '32px 0 10px' }}>
        Rampes d&apos;opacité — le point de rupture NativeWind
      </h2>
      <p style={{ fontSize: 12, color: palette.inkSoft, marginBottom: 12, maxWidth: 680 }}>
        C&apos;est ici que le mécanisme précédent cassait en silence : une couleur déclarée{' '}
        <code>var(...)</code> nue empêche Tailwind d&apos;injecter l&apos;alpha, et l&apos;utilitaire
        n&apos;est pas généré du tout. Les pastilles ci-dessous sont posées sur la crème : la moitié
        gauche vient de la classe, la droite d&apos;un <code>rgb(r g b / a)</code> calculé en JS.
      </p>
      {RAMPS.map((r) => (
        <div key={r.label} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{r.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {r.steps.map((s) => (
              <div key={s.cls}>
                <Seam cls={s.cls} inline={withAlpha(r.hex, s.a)} />
                <div style={{ fontSize: 10, marginTop: 4, fontFamily: 'monospace', color: palette.inkSoft }}>
                  {Math.round(s.a * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '32px 0 10px' }}>Encres dérivées & scrim</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
        {[
          { name: 'txt-60', cls: 'bg-txt-60', a: alpha.txt60 },
          { name: 'txt-40', cls: 'bg-txt-40', a: alpha.txt40 },
          { name: 'txt-25', cls: 'bg-txt-25', a: alpha.txt25 },
          { name: 'scrim', cls: 'bg-scrim', a: alpha.scrim },
        ].map((t) => (
          <div key={t.name}>
            <Seam cls={t.cls} inline={withAlpha(palette.txt, t.a)} legacy={`--${t.name}`} />
            <div style={{ fontSize: 11, marginTop: 5, fontWeight: 700 }}>{t.name}</div>
            <div style={{ fontSize: 10, color: palette.inkSoft, fontFamily: 'monospace' }}>
              {withAlpha(palette.txt, t.a)}
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '32px 0 10px' }}>Deux pièges de nommage figés</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        <div
          style={{
            background: palette.surface,
            border: `1px solid ${palette.line}`,
            borderRadius: radius.card,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>« accent » = deux couleurs</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div className="bg-accent" style={{ height: 36, borderRadius: 5 }} />
              <div style={{ fontSize: 10, marginTop: 4, fontFamily: 'monospace' }}>classe · terracotta</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 36, borderRadius: 5, background: 'var(--color-accent)' }} />
              <div style={{ fontSize: 10, marginTop: 4, fontFamily: 'monospace' }}>inline · or vif</div>
            </div>
          </div>
          <p style={{ fontSize: 11, color: palette.inkSoft, margin: 0 }}>
            Héritage de theme.css, 19 sites en dépendent. Les deux sens sont préservés à dessein. Dans du
            code neuf : <code>palette.primary</code> ou <code>palette.goldBright</code>, jamais «&nbsp;accent&nbsp;».
          </p>
        </div>

        <div
          style={{
            background: palette.surface,
            border: `1px solid ${palette.line}`,
            borderRadius: radius.card,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>
            « line » opaque vs translucide
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: 36, borderRadius: 5, background: 'var(--line)' }} />
              <div style={{ fontSize: 10, marginTop: 4, fontFamily: 'monospace' }}>--line · opaque</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 36, borderRadius: 5, background: 'var(--color-line)' }} />
              <div style={{ fontSize: 10, marginTop: 4, fontFamily: 'monospace' }}>--color-line · 10%</div>
            </div>
          </div>
          <p style={{ fontSize: 11, color: palette.inkSoft, margin: 0 }}>
            Identiques sur la crème, divergents sur une surface plus claire. 65 sites attendent le
            translucide — ne pas «&nbsp;harmoniser&nbsp;».
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '32px 0 10px' }}>Dialogues</h2>
      <p style={{ fontSize: 12, color: palette.inkSoft, marginBottom: 12, maxWidth: 680 }}>
        Les 54 <code>alert()</code> et <code>window.confirm()</code> du projet ont été remplacés par
        une API non bloquante. <code>confirm()</code> était <strong>synchrone</strong> et gelait le
        thread — dans un jeu de buzzer, les trames WebSocket n&apos;étaient plus traitées pendant
        l&apos;attente.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        <DialogBench />
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '32px 0 10px' }}>Typographie</h2>
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-weight)' as never, fontSize: 26 }}>
          Xalaat — display (Boldonse)
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 16 }}>
          Corps de texte — ui (Manrope) · 0123456789
        </div>
        <div style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic', fontSize: 22 }}>
          Accent — serif italique (Instrument Serif)
        </div>
        <p style={{ fontSize: 11, color: palette.inkSoft, maxWidth: 680, margin: 0 }}>
          Les trois familles viennent de <code>next/font</code>, qui les auto-héberge. Boldonse était
          auparavant chargée par un <code>@import</code> Google externe et écrasait Bricolage Grotesque
          par simple ordre de déclaration — Bricolage était donc téléchargée pour ne servir que de
          fallback. Le rendu est inchangé, la résolution est devenue explicite.
        </p>
      </div>

      <div style={{ height: 48 }} />
    </div>
  );
}
