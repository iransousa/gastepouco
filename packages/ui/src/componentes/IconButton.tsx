import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx.js';
import { useLink } from '../ligacao.js';
import { Icon, type IconName } from './Icon.js';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Obrigatório: vira o `aria-label`. Ex.: "Notificações, 3 novas". */
  label: string;
  variant?: 'outline' | 'solid' | 'ghost';
  badge?: boolean;
  href?: string;
}

/**
 * Botão só com ícone, 44×44 — o alvo mínimo de toque.
 *
 * `label` não é opcional de propósito: um botão só com ícone é invisível para
 * quem usa leitor de tela, e o TypeScript é o lugar certo para impedir isso.
 */
export function IconButton({
  icon,
  label,
  variant = 'outline',
  badge,
  href,
  className,
  ...resto
}: IconButtonProps): React.ReactElement {
  const Link = useLink();
  const classes = cx('gm-iconbtn', `gm-iconbtn--${variant}`, className);

  const miolo = (
    <>
      <Icon name={icon} size={22} />
      {badge ? <span className="gm-iconbtn__dot" aria-hidden="true" /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        {miolo}
      </Link>
    );
  }

  return (
    <button type="button" {...resto} aria-label={label} className={classes}>
      {miolo}
    </button>
  );
}
