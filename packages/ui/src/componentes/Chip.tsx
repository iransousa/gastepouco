import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../cx.js';
import { Icon, type IconName } from './Icon.js';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: IconName;
}

/** Filtro de toque, liga e desliga. O estado vai em `aria-pressed`. */
export function Chip({ selected, icon, className, children, ...resto }: ChipProps): React.ReactElement {
  return (
    <button
      type="button"
      {...resto}
      aria-pressed={selected ? 'true' : 'false'}
      className={cx('gm-chip', selected && 'gm-chip--on', className)}
    >
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </button>
  );
}
