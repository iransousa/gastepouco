import { cx } from '../cx.js';
import { Icon } from './Icon.js';

export interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Linha de preferência com interruptor.
 *
 * O estado ligado leva um visto dentro da chave, não só a cor mudando:
 * "significado nunca só pela cor" (docs/08-ACESSIBILIDADE.md).
 */
export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled,
  className,
}: SwitchProps): React.ReactElement {
  return (
    <div className={cx('gm-switchrow', className)}>
      <span className="gm-switchrow__text">
        <span className="gm-switchrow__label">{label}</span>
        {description ? <span className="gm-switchrow__desc">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked ? 'true' : 'false'}
        aria-label={label}
        disabled={disabled}
        className={cx('gm-switch', checked && 'gm-switch--on')}
        onClick={() => onChange?.(!checked)}
      >
        <span className="gm-switch__track">
          <span className="gm-switch__knob">
            {checked ? <Icon name="check" size={14} strokeWidth={3.4} /> : null}
          </span>
        </span>
      </button>
    </div>
  );
}
