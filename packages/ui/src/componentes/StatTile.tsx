import type { ReactNode } from 'react';
import { cx } from '../cx.js';

export interface StatTileProps {
  label: string;
  value: ReactNode;
  tone?: 'default' | 'soft' | 'points' | 'offer';
  className?: string;
}

/** Número pequeno com rótulo ("Média hoje", "Você pagou"). */
export function StatTile({ label, value, tone = 'default', className }: StatTileProps): React.ReactElement {
  return (
    <div className={cx('gm-stat', `gm-stat--${tone}`, className)}>
      <span className="gm-stat__label">{label}</span>
      <span className="gm-stat__value">{value}</span>
    </div>
  );
}
