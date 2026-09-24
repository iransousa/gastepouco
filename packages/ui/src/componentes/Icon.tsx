/**
 * Ícones de traço 24×24 que herdam a cor do texto.
 *
 * Os desenhos vêm de design-system/bundle-referencia/bundle.js, sem alteração.
 * Sem `label` o ícone é decorativo e sai do alcance do leitor de tela
 * (`aria-hidden`); com `label` ele vira `role="img"` e é anunciado.
 * Ícone decorativo anunciado é ruído; ícone informativo silencioso é perda de
 * informação — por isso a distinção é explícita (docs/08-ACESSIBILIDADE.md).
 */
import { cx } from '../cx.js';

export const DESENHOS = {
  home:
    'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  chart:
    'M21 12a9 9 0 1 1-9-9v9zM15 3.5A9 9 0 0 1 20.5 9H15z',
  scan:
    'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10',
  tag:
    'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3',
  trophy:
    'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  list:
    'M9 6h11M9 12h11M9 18h11M3.5 6l1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2',
  bell:
    'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0',
  pin:
    'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5',
  check:
    'M20 6 9 17l-5-5',
  close:
    'M18 6 6 18M6 6l12 12',
  back:
    'm15 18-6-6 6-6',
  next:
    'm9 18 6-6-6-6',
  share:
    'M18 2a3 3 0 1 0 0 6 3 3 0 1 0 0-6M6 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6M18 16a3 3 0 1 0 0 6 3 3 0 1 0 0-6M8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  star:
    'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z',
  flame:
    'M12 22c4 0 7-3 7-7 0-4-3-6-4-9-1 2-2 3-4 3 0-2 0-4-2-6-1 4-4 6-4 11 0 5 3 8 7 8z',
  plus:
    'M12 5v14M5 12h14',
  cart:
    'M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 8H6M9 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3M18 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3',
  help:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01',
  volume:
    'M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  lock:
    'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V7a4 4 0 0 1 8 0v4',
  user:
    'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8',
  shield:
    'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z',
  trendDown:
    'm3 7 6 6 4-4 8 8M21 11v6h-6',
  trendLine:
    'M3 3v18h18M7 14l4-4 3 3 5-6',
  search:
    'M11 4a7 7 0 1 0 0 14 7 7 0 1 0 0-14M20 20l-3.5-3.5',
  flash:
    'M13 2 4 14h7l-1 8 9-12h-7z',
  image:
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 7a2 2 0 1 0 0 4 2 2 0 1 0 0-4M21 15l-5-5L5 21',
  keyboard:
    'M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  pause:
    'M9 5v14M15 5v14',
  trash:
    'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  logout:
    'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11',
  download:
    'M12 3v12M7 10l5 5 5-5M4 21h16',
  receipt:
    'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  // Mostrar/esconder senha na tela Entrar. Nao vinha no bundle de referencia,
  // mas o prototipo da tela ja usava este desenho.
  eye:
    'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6',
  eyeOff:
    'M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.2A9.6 9.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.2 6.2A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 3.5-.6',
} as const;

export type IconName = keyof typeof DESENHOS;

/** Todos os nomes, para a página /dev/ui listar sem repetir a lista à mão. */
export const NOMES_DE_ICONE = Object.keys(DESENHOS) as IconName[];

export interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function Icon({ name, size = 24, strokeWidth = 2, label, className }: IconProps): React.ReactElement {
  const anunciado = Boolean(label);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx('gm-icon', className)}
      role={anunciado ? 'img' : undefined}
      aria-label={anunciado ? label : undefined}
      aria-hidden={anunciado ? undefined : 'true'}
      focusable="false"
    >
      <path d={DESENHOS[name]} />
    </svg>
  );
}
