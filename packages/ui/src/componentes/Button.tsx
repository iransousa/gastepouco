import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx.js';
import { useLink } from '../ligacao.js';
import { Icon, type IconName } from './Icon.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'lime' | 'danger';
  size?: 'm' | 'l' | 'easy';
  icon?: IconName;
  iconEnd?: IconName;
  fullWidth?: boolean;
  /** Com `href` vira link, com a mesma aparência. */
  href?: string;
}

const TAMANHO_DO_ICONE: Record<NonNullable<ButtonProps['size']>, number> = {
  easy: 30,
  m: 18,
  l: 20,
};

/**
 * Botão com texto. O rótulo diz o que acontece ("Salvar alterações"), nunca
 * só "OK" (CLAUDE.md, "Texto da interface").
 *
 * `size="easy"` é o botão do modo fácil: 76px de altura e ícone em caixa, para
 * quem tem pouca firmeza no toque ou enxerga mal.
 */
export function Button({
  variant = 'primary',
  size = 'l',
  icon,
  iconEnd,
  fullWidth,
  href,
  className,
  children,
  ...resto
}: ButtonProps): React.ReactElement {
  const Link = useLink();
  const classes = cx(
    'gm-btn',
    `gm-btn--${variant}`,
    `gm-btn--${size}`,
    fullWidth && 'gm-btn--full',
    className,
  );
  const tamanhoDoIcone = TAMANHO_DO_ICONE[size];

  const miolo = (
    <>
      {icon ? (
        <span className={size === 'easy' ? 'gm-btn__easyicon' : 'gm-btn__icon'}>
          <Icon name={icon} size={tamanhoDoIcone} />
        </span>
      ) : null}
      <span className="gm-btn__label">{children}</span>
      {iconEnd ? <Icon name={iconEnd} size={tamanhoDoIcone} /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {miolo}
      </Link>
    );
  }

  return (
    <button type="button" {...resto} className={classes}>
      {miolo}
    </button>
  );
}
