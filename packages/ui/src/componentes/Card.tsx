import type { ElementType, HTMLAttributes } from 'react';
import { cx } from '../cx.js';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** `brand` só no cartão de gastos do mês — é o destaque da tela Início. */
  tone?: 'default' | 'brand' | 'soft' | 'points' | 'offer' | 'sunken';
  as?: ElementType;
}

/** Superfície que agrupa conteúdo. */
export function Card({ tone = 'default', as, className, children, ...resto }: CardProps): React.ReactElement {
  const Tag = (as ?? 'section') as ElementType;
  return (
    <Tag {...resto} className={cx('gm-card', `gm-card--${tone}`, className)}>
      {children}
    </Tag>
  );
}
