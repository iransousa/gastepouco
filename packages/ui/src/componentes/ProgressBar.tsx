import { cx } from '../cx.js';

export interface ProgressBarProps {
  /** De 0 a 1. */
  value: number;
  label: string;
  tone?: 'points' | 'brand' | 'lime';
  onDark?: boolean;
  className?: string;
}

/** Barra de progresso (orçamento do mês, pontos até o próximo nível). */
export function ProgressBar({
  value,
  label,
  tone = 'points',
  onDark,
  className,
}: ProgressBarProps): React.ReactElement {
  const fracao = Math.max(0, Math.min(1, value || 0));
  const porcento = Math.round(fracao * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={porcento}
      className={cx('gm-progress', `gm-progress--${tone}`, onDark && 'gm-progress--ondark', className)}
    >
      <span className="gm-progress__fill" style={{ width: `${porcento}%` }} />
    </div>
  );
}
