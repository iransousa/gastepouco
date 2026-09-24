import { cx } from '../cx.js';
import { Icon } from './Icon.js';

export interface PointsBadgeProps {
  points: number;
  size?: 'm' | 'l';
  className?: string;
}

/** "+60 pontos". O app diz "pontos", nunca "XP" (CLAUDE.md). */
export function PointsBadge({ points, size = 'm', className }: PointsBadgeProps): React.ReactElement {
  const quantidade = points || 0;
  return (
    <span className={cx('gm-points', size === 'l' && 'gm-points--l', className)}>
      <Icon name="star" size={size === 'l' ? 16 : 13} strokeWidth={2.4} />
      {`${quantidade > 0 ? '+' : ''}${quantidade} pontos`}
    </span>
  );
}
