import { cx } from '../cx.js';

export interface SegmentedControlProps {
  /** Vira o `aria-label` do grupo: "Período", "Escopo do ranking". */
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange?: (value: string) => void;
  className?: string;
}

/** Escolha exclusiva entre 2 e 4 opções curtas (Mês / 3 meses / Ano). */
export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps): React.ReactElement {
  return (
    <div role="group" aria-label={label} className={cx('gm-seg', className)}>
      {options.map((opcao) => {
        const ativo = opcao.value === value;
        return (
          <button
            key={opcao.value}
            type="button"
            aria-pressed={ativo ? 'true' : 'false'}
            className={cx('gm-seg__item', ativo && 'gm-seg__item--on')}
            onClick={() => onChange?.(opcao.value)}
          >
            {opcao.label}
          </button>
        );
      })}
    </div>
  );
}
