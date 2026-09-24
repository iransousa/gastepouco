import type { Config } from 'tailwindcss';
import preset from '@gastemenos/tokens/tailwind-preset';

/**
 * Sem `theme.extend` de cor, tamanho ou raio aqui: o preset é a única fonte,
 * e ele aponta para as variáveis CSS de tokens.css. É o que faz trocar de tema
 * não exigir recompilar nada (CLAUDE.md, "Design system").
 */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
} satisfies Config;
