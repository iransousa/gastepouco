/**
 * Gera tokens.css e tailwind-preset.ts a partir de design-system/tokens.json.
 *
 * A saída esperada é byte a byte igual a design-system/tokens.css e
 * design-system/tailwind-preset.ts — `pnpm --filter @gastemenos/tokens check`
 * compara as duas e falha se divergirem. É isso que impede o design system do
 * código de sair de sincronia com o design system aprovado.
 *
 * Tamanhos de fonte vão em rem para que html[data-text-size] escale o app
 * inteiro (Normal 100%, Grande 118,75%, Muito grande 137,5%).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raizDoRepo = resolve(aqui, '../../..');
const origem = resolve(raizDoRepo, 'design-system/tokens.json');
const destino = resolve(aqui, '..');

type ValorPorTema = { light: string; dark: string; contraste: string };
type TokenDeCor = { name: string; value: ValorPorTema; usage?: string };
type TokenSimples = { name: string; value: string; usage?: string };
type Familia = 'display' | 'body';
type EstiloDeTexto = {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  letterSpacing?: string;
  /** Sobrepõe a família do grupo. `easy-title` é título e usa a display,
   *  mesmo o grupo "Modo fácil" sendo de corpo. */
  family?: Familia;
};
type GrupoDeTexto = { name: string; family: Familia; styles: EstiloDeTexto[] };

interface Tokens {
  color: { tokens: TokenDeCor[] };
  type: { families: Record<'display' | 'body', string>; groups: GrupoDeTexto[] };
  spacing: { tokens: TokenSimples[] };
  radius: { tokens: TokenSimples[] };
  shadow: { tokens: { name: string; value: ValorPorTema }[] };
  size: { tokens: TokenSimples[] };
}

const tokens: Tokens = JSON.parse(readFileSync(origem, 'utf8'));

/** 19px → "1.188rem", 15px → "0.9375rem". toPrecision(4) reproduz o arredondamento do design. */
function pxParaRem(px: string): string {
  const n = Number.parseFloat(px);
  if (!Number.isFinite(n)) return px;
  return `${Number((n / 16).toPrecision(4))}rem`;
}

type Tema = 'light' | 'dark' | 'contraste';

const todosOsEstilos = tokens.type.groups.flatMap((g) =>
  g.styles.map((s) => ({ ...s, family: s.family ?? g.family })),
);

// ---------------------------------------------------------------- tokens.css

function declaracoesDeCor(tema: Tema, indent: string): string[] {
  return tokens.color.tokens.map((t) => `${indent}--${t.name}: ${t.value[tema]};`);
}

function gerarCss(): string {
  const l: string[] = [];

  l.push(':root, [data-theme="light"] {');
  l.push(...declaracoesDeCor('light', '  '));
  for (const t of tokens.spacing.tokens) l.push(`  --${t.name}: ${t.value};`);
  for (const t of tokens.radius.tokens) l.push(`  --${t.name}: ${t.value};`);
  for (const t of tokens.size.tokens) l.push(`  --${t.name}: ${t.value};`);
  for (const t of tokens.shadow.tokens) l.push(`  --${t.name}: ${t.value.light};`);
  l.push(`  --font-display: ${tokens.type.families.display};`);
  l.push(`  --font-body: ${tokens.type.families.body};`);
  l.push('}');

  l.push('[data-theme="dark"] {');
  l.push('  color-scheme: dark;');
  l.push(...declaracoesDeCor('dark', '  '));
  for (const t of tokens.shadow.tokens) l.push(`  --${t.name}: ${t.value.dark};`);
  l.push('}');

  l.push('[data-theme="contraste"] {');
  l.push(...declaracoesDeCor('contraste', '  '));
  for (const t of tokens.shadow.tokens) l.push(`  --${t.name}: ${t.value.contraste};`);
  l.push('}');

  // Sem data-theme o app segue o sistema.
  l.push('@media (prefers-color-scheme: dark) {');
  l.push('  :root:not([data-theme]) {');
  l.push('    color-scheme: dark;');
  l.push(...declaracoesDeCor('dark', '    '));
  l.push('  }');
  l.push('}');

  l.push('/* Tamanho de texto do usuário: escala todo o app a partir do html */');
  l.push('html[data-text-size="grande"] { font-size: 118.75%; }');
  l.push('html[data-text-size="muito-grande"] { font-size: 137.5%; }');
  l.push(':focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }');
  l.push('@media (prefers-reduced-motion: reduce) {');
  l.push('  *, *::before, *::after { animation: none !important; transition: none !important; }');
  l.push('}');
  l.push(
    'html[data-reduce-motion="true"] *, html[data-reduce-motion="true"] *::before, html[data-reduce-motion="true"] *::after { animation: none !important; transition: none !important; }',
  );

  for (const s of todosOsEstilos) {
    const partes = [
      `font-family: var(--font-${s.family})`,
      `font-size: ${pxParaRem(s.fontSize)}`,
      `line-height: ${pxParaRem(s.lineHeight)}`,
      `font-weight: ${s.fontWeight}`,
    ];
    if (s.letterSpacing) partes.push(`letter-spacing: ${s.letterSpacing}`);
    l.push(`.text-${s.name} { ${partes.join('; ')}; }`);
  }

  return `${l.join('\n')}\n`;
}

// -------------------------------------------------------- tailwind-preset.ts

function mapaDeVars(lista: { name: string }[], prefixo: string): string {
  const pares = lista.map((t) => `"${t.name.replace(prefixo, '')}": 'var(--${t.name})'`);
  return `{${pares.join(', ')}}`;
}

function gerarPreset(): string {
  const cores = tokens.color.tokens
    .map((t) => `      "${t.name}": 'var(--${t.name})',`)
    .join('\n');

  const fontSize = todosOsEstilos
    .map((s) => {
      const extra: Record<string, string> = {
        lineHeight: pxParaRem(s.lineHeight),
        fontWeight: String(s.fontWeight),
      };
      if (s.letterSpacing) extra.letterSpacing = s.letterSpacing;
      const corpo = JSON.stringify([pxParaRem(s.fontSize), extra], null, 6)
        .split('\n')
        .map((linha, i) => (i === 0 ? linha : `      ${linha}`))
        .join('\n');
      return `      "${s.name}": ${corpo},`;
    })
    .join('\n');

  return `// Gerado de design-system/tokens.json. Não edite à mão: rode o script de tokens.
// Uso: presets: [require('@gastemenos/tokens/tailwind-preset')] e importe tokens.css no app.
import type { Config } from 'tailwindcss';

const preset: Partial<Config> = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    colors: {
${cores}
      transparent: 'transparent',
      current: 'currentColor',
    },
    spacing: { 0: '0px', px: '1px', ...${mapaDeVars(tokens.spacing.tokens, 'space-')} },
    borderRadius: { none: '0px', ...${mapaDeVars(tokens.radius.tokens, 'radius-')} },
    boxShadow: { none: 'none', ...${mapaDeVars(tokens.shadow.tokens, 'shadow-')} },
    fontFamily: { display: ['var(--font-display)'], body: ['var(--font-body)'] },
    fontSize: {
${fontSize.replace(/,$/, '')}
},
    extend: {
      minHeight: { touch: 'var(--touch-min)', button: 'var(--button-h)', easy: 'var(--easy-button-h)', field: 'var(--field-h)' },
      minWidth: { touch: 'var(--touch-min)' },
      height: { nav: 'var(--nav-h)', fab: 'var(--fab)' },
      width: { fab: 'var(--fab)' },
    },
  },
};

export default preset;
`;
}

mkdirSync(destino, { recursive: true });
writeFileSync(resolve(destino, 'tokens.css'), gerarCss(), 'utf8');
writeFileSync(resolve(destino, 'tailwind-preset.ts'), gerarPreset(), 'utf8');

// eslint-disable-next-line no-console
console.log('tokens: tokens.css e tailwind-preset.ts gerados de design-system/tokens.json');
