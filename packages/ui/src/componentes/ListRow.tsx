import type { ReactNode } from 'react';
import { cx } from '../cx.js';
import { useLink } from '../ligacao.js';
import { Icon, type IconName } from './Icon.js';

export interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: IconName;
  iconTone?: 'neutral' | 'brand' | 'points' | 'offer';
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
  chevron?: boolean;
  className?: string;
}

/**
 * Linha de lista: nota fiscal, item de configuração, loja.
 *
 * Vira `a` quando navega, `button` quando age e `div` quando só mostra. Isso
 * não é detalhe: `div` clicável não recebe foco pelo teclado e não é anunciado
 * como acionável (docs/08-ACESSIBILIDADE.md, "Elementos reais").
 */
export function ListRow({
  title,
  subtitle,
  icon,
  iconTone = 'neutral',
  trailing,
  href,
  onClick,
  chevron,
  className,
}: ListRowProps): React.ReactElement {
  const Link = useLink();
  const classes = cx('gm-row', (href || onClick) && 'gm-row--action', className);

  const miolo = (
    <>
      {icon ? (
        <span className={cx('gm-row__icon', `gm-row__icon--${iconTone}`)}>
          <Icon name={icon} size={20} />
        </span>
      ) : null}
      <span className="gm-row__text">
        <span className="gm-row__title">{title}</span>
        {subtitle ? <span className="gm-row__sub">{subtitle}</span> : null}
      </span>
      {trailing ? <span className="gm-row__trail">{trailing}</span> : null}
      {chevron ? <Icon name="next" size={18} className="gm-row__chev" /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {miolo}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {miolo}
      </button>
    );
  }

  return <div className={classes}>{miolo}</div>;
}
