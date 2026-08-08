/**
 * Table de vérité des design tokens.
 *
 * Ce fichier existe parce que la régression qu'il attrape est à la fois
 * PROBABLE et INVISIBLE À L'ŒIL. Le mécanisme de couleur vient de changer :
 * on est passé de `rgb(var(--x-rgb) / <alpha-value>)`, résolu à l'exécution par
 * le navigateur, à des hex littéraux que Tailwind compose lui-même à la
 * compilation. Une erreur de conversion hex → canaux ne fait pas planter le
 * build : elle décale une teinte de quelques points, ce que personne ne voit
 * sur une capture d'écran.
 *
 * C'est aussi le filet du portage NativeWind : le même fichier `palette.js`
 * alimentera le preset RN en phase 2, où les modificateurs d'opacité sont
 * exactement ce qui casse silencieusement.
 *
 * Aucun simulateur, aucun navigateur, aucune dépendance : `node palette.test.js`.
 *
 * ⚠ Ne jamais écrire de nom de classe Tailwind littéral dans ce fichier :
 * `content` scanne `./lib/**` en texte brut et générerait l'utilitaire
 * correspondant, même depuis un commentaire.
 */

const assert = require('node:assert/strict');
const { palette, darkPalette, alpha, radius, toChannels, withAlpha, cssVars } = require('./palette');

let checks = 0;
const ok = (fn) => {
  fn();
  checks++;
};

// ─── 1. Conversion hex → canaux ──────────────────────────────────────────────
ok(() => assert.equal(toChannels('#B8462A'), '184 70 42'));
ok(() => assert.equal(toChannels('#F1E5C9'), '241 229 201'));
ok(() => assert.equal(toChannels('#1A1410'), '26 20 16'));
ok(() => assert.equal(toChannels('#000000'), '0 0 0'));
ok(() => assert.equal(toChannels('#FFFFFF'), '255 255 255'));
// Forme courte
ok(() => assert.equal(toChannels('#FFF'), '255 255 255'));
ok(() => assert.equal(toChannels('#0A0'), '0 170 0'));

// ─── 2. Composition d'opacité ────────────────────────────────────────────────
// La forme `rgb(r g b / a)` est celle que React Native accepte aussi : les
// appels survivent au portage. `rgba()` ne passerait pas partout.
ok(() => assert.equal(withAlpha('#1A1410', 0.66), 'rgb(26 20 16 / 0.66)'));
ok(() => assert.equal(withAlpha('#FBF4DF', 0.4), 'rgb(251 244 223 / 0.4)'));
ok(() => assert.equal(withAlpha('#B8462A', 0.28), 'rgb(184 70 42 / 0.28)'));

// ─── 3. Valeurs de la palette, figées ────────────────────────────────────────
// Ce sont les valeurs qui étaient en production avant l'unification des deux
// systèmes de tokens. Toute modification ici doit être un choix de design
// assumé, pas un effet de bord de refactor.
const EXPECTED = {
  bg: '#F1E5C9',
  bgDeep: '#EADCB8',
  surface: '#FBF4DF',
  surface2: '#F6EBC9',
  line: '#DACFB7',
  txt: '#1A1410',
  inkSoft: '#5B4E3D',
  primary: '#B8462A',
  primaryD: '#9C3A22',
  primaryInk: '#FBF4DF',
  gold: '#8F6414',
  goldBright: '#E8A630',
  indigo: '#2A3656',
  good: '#2D8559',
  bad: '#D14A2E',
  badH: '#E8663F',
  violet: '#7A4FB8',
  warn: '#C9871F',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};
for (const [name, hex] of Object.entries(EXPECTED)) {
  ok(() => assert.equal(palette[name], hex, `palette.${name}`));
}
ok(() => assert.deepEqual(Object.keys(palette).sort(), Object.keys(EXPECTED).sort()));

// La variante nuit doit couvrir exactement les mêmes noms, sinon une bascule de
// thème laisserait des couleurs non définies.
ok(() => assert.deepEqual(Object.keys(darkPalette).sort(), Object.keys(palette).sort()));

// ─── 4. Le contrat des deux ors ──────────────────────────────────────────────
// `gold` est l'or ENCRE (lisible en texte), `goldBright` l'or DÉCOR. Les
// confondre produit du texte à 1,9:1 sur la crème — illisible mais joli, donc
// personne ne le signale. On vérifie le contraste plutôt que la valeur.
const luminance = (hex) => {
  const [r, g, b] = toChannels(hex)
    .split(' ')
    .map((n) => {
      const c = Number(n) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

ok(() => assert.ok(contrast(palette.gold, palette.bg) >= 4.0, "l'or encre doit rester lisible sur la crème"));
ok(() => assert.ok(contrast(palette.goldBright, palette.bg) < 3.0, "l'or décor n'est PAS fait pour du texte"));
ok(() => assert.ok(contrast(palette.txt, palette.bg) >= 7.0, 'encre sur crème'));
ok(() => assert.ok(contrast(palette.primaryInk, palette.primary) >= 4.5, 'texte sur terracotta'));
ok(() => assert.ok(contrast(palette.inkSoft, palette.bg) >= 4.5, 'encre adoucie sur crème'));

// ─── 5. Le bloc :root généré ─────────────────────────────────────────────────
const vars = cssVars();

// Les trois familles doivent être présentes.
ok(() => assert.equal(vars['--primary-rgb'], '184 70 42'));
ok(() => assert.equal(vars['--primary'], '#B8462A'));
ok(() => assert.equal(vars['--color-primary'], '#B8462A'));

// Le kebab-case doit gérer les chiffres et les majuscules internes.
ok(() => assert.equal(vars['--gold-bright'], '#E8A630'));
ok(() => assert.equal(vars['--surface-2'], '#F6EBC9'));
ok(() => assert.equal(vars['--bg-deep'], '#EADCB8'));
ok(() => assert.equal(vars['--ink-soft'], '#5B4E3D'));

// Opacités dérivées de l'encre.
ok(() => assert.equal(vars['--txt-60'], 'rgb(26 20 16 / 0.66)'));
ok(() => assert.equal(vars['--txt-40'], 'rgb(26 20 16 / 0.45)'));
ok(() => assert.equal(vars['--txt-25'], 'rgb(26 20 16 / 0.28)'));
ok(() => assert.equal(vars['--scrim'], 'rgb(26 20 16 / 0.42)'));

/**
 * PIÈGE FIGÉ — `--color-line` n'est PAS `--line`.
 * L'ancien token de theme.css était translucide (10 % d'encre), là où `--line`
 * est opaque. Sur le fond crème les deux se composent quasiment au même pixel,
 * mais posés sur une surface plus claire ils divergent. 65 sites lisent
 * `--color-line` et attendent le translucide.
 */
ok(() => assert.equal(vars['--color-line'], 'rgb(26 20 16 / 0.1)'));
ok(() => assert.equal(vars['--line'], '#DACFB7'));
ok(() => assert.notEqual(vars['--color-line'], vars['--line']));

/**
 * PIÈGE FIGÉ — `accent` désigne deux couleurs.
 * En classe Tailwind, `accent` = terracotta. En style inline,
 * `var(--color-accent)` = or vif (valeur héritée de theme.css, 19 sites).
 * Ce test existe pour que personne ne « corrige » l'un des deux par mégarde.
 */
ok(() => assert.equal(vars['--color-accent'], palette.goldBright));
ok(() => assert.equal(vars['--accent'], palette.primary));
ok(() => assert.notEqual(vars['--color-accent'], vars['--accent']));

/**
 * `--color-gold` ne doit PAS exister. Un site le lisait sans qu'il soit défini
 * nulle part ; il a été corrigé vers `--gold`. Le redéfinir ici masquerait la
 * classe de bug plutôt que de la supprimer.
 */
ok(() => assert.equal(vars['--color-gold'], undefined));

// Les familles de polices appartiennent à next/font : les redéclarer ici
// recréerait le conflit de cascade qui faisait gagner Boldonse par accident.
ok(() => assert.equal(vars['--font-display'], undefined));
ok(() => assert.equal(vars['--font-accent'], undefined));
ok(() => assert.equal(vars['--font-display-weight'], '400'));

// Formes.
ok(() => assert.equal(vars['--radius-pill'], radius.pill));
ok(() => assert.equal(vars['--card-radius'], radius.card));

// ─── 6. Aucune valeur vide ───────────────────────────────────────────────────
for (const [name, value] of Object.entries(vars)) {
  ok(() =>
    assert.ok(
      typeof value === 'string' && value.length > 0 && !value.includes('undefined') && !value.includes('NaN'),
      `${name} = ${value}`,
    ),
  );
}

// ─── 7. Le contrat qui casse NativeWind ──────────────────────────────────────
// Aucune couleur exposée à Tailwind ne doit contenir `var(...)`. C'est
// précisément la forme dont ni Tailwind ni NativeWind ne savent extraire
// l'alpha. Sur ce projet, `scrim` était dans ce cas : les 7 scrims de modale
// demandaient une opacité que Tailwind ne pouvait pas produire, donc
// l'utilitaire n'était PAS généré et les overlays n'avaient aucun fond.
const tw = require('../../../../../apps/web-legacy/tailwind.config.js');
const flat = JSON.stringify(tw.theme.extend.colors);
ok(() => assert.ok(!flat.includes('var('), 'aucune couleur Tailwind ne doit dépendre de var()'));
ok(() => assert.ok(!flat.includes('<alpha-value>'), 'plus de placeholder <alpha-value>'));
ok(() => assert.equal(tw.theme.extend.colors.surface, '#FBF4DF'));
ok(() => assert.equal(tw.theme.extend.colors['txt-40'], 'rgb(26 20 16 / 0.45)'));

console.log(`✓ ${checks} assertions — table de vérité des tokens OK`);
