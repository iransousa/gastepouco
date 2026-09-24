import { cx } from '../cx.js';
import { useLink } from '../ligacao.js';
import { Icon, type IconName } from './Icon.js';

export interface BottomNavItem {
  key: string;
  label: string;
  icon: IconName;
  href: string;
}

export interface BottomNavProps {
  active?: string;
  items?: BottomNavItem[];
  scanHref?: string;
  scanLabel?: string;
  className?: string;
}

export const ITENS_PADRAO: BottomNavItem[] = [
  { key: 'inicio', label: 'Início', icon: 'home', href: '/inicio' },
  { key: 'gastos', label: 'Gastos', icon: 'chart', href: '/gastos' },
  { key: 'ofertas', label: 'Ofertas', icon: 'tag', href: '/ofertas' },
  { key: 'ranking', label: 'Ranking', icon: 'trophy', href: '/ranking' },
];

/**
 * Barra inferior: 4 destinos e o botão central de ler nota.
 *
 * Todo ícone tem rótulo escrito embaixo, inclusive o central — ícone sozinho
 * não se explica para quem usa pouco o app (docs/08-ACESSIBILIDADE.md).
 * No modo fácil a barra tem 3 itens e 96px; quem monta a tela passa `items`.
 */
export function BottomNav({
  active,
  items = ITENS_PADRAO,
  scanHref = '/ler-nota',
  scanLabel = 'Ler nota',
  className,
}: BottomNavProps): React.ReactElement {
  const Link = useLink();
  const metade = Math.ceil(items.length / 2);

  const renderizar = (item: BottomNavItem): React.ReactElement => {
    const ativo = item.key === active;
    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={ativo ? 'page' : undefined}
        className={cx('gm-nav__item', ativo && 'gm-nav__item--on')}
      >
        <Icon name={item.icon} size={24} strokeWidth={ativo ? 2.4 : 2} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <nav aria-label="Navegação principal" className={cx('gm-nav', className)}>
      {items.slice(0, metade).map(renderizar)}
      <Link href={scanHref} className="gm-nav__scan">
        <span className="gm-nav__fab">
          <Icon name="scan" size={30} strokeWidth={2.2} />
        </span>
        <span>{scanLabel}</span>
      </Link>
      {items.slice(metade).map(renderizar)}
    </nav>
  );
}
