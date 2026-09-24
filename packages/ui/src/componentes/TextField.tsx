import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../cx.js';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  trailing?: ReactNode;
}

/**
 * Campo de texto com rótulo sempre visível.
 *
 * Nada de rótulo só no placeholder: ele some quando a pessoa começa a digitar,
 * e quem usa letra grande ou leitor de tela fica sem saber o que preencher.
 *
 * O erro vem antes da dica no DOM e leva `role="alert"`, para o leitor de tela
 * anunciar o problema assim que ele aparece, ligado ao campo por
 * `aria-describedby`.
 */
export function TextField({
  label,
  hint,
  error,
  optional,
  trailing,
  className,
  id,
  ...resto
}: TextFieldProps): React.ReactElement {
  const gerado = useId();
  const idDoCampo = id ?? `campo-${gerado}`;
  const idDaDica = `${idDoCampo}-dica`;
  const idDoErro = `${idDoCampo}-erro`;

  const descrito = [hint ? idDaDica : null, error ? idDoErro : null].filter(Boolean).join(' ');

  return (
    <div className={cx('gm-field', className)}>
      <label htmlFor={idDoCampo} className="gm-field__label">
        {label}
        {optional ? <span className="gm-field__opt"> (opcional)</span> : null}
      </label>
      <div className="gm-field__wrap">
        <input
          {...resto}
          id={idDoCampo}
          className={cx('gm-field__input', error && 'gm-field__input--error')}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={descrito || undefined}
        />
        {trailing}
      </div>
      {error ? (
        <span id={idDoErro} role="alert" className="gm-field__error">
          {error}
        </span>
      ) : null}
      {hint ? (
        <span id={idDaDica} className="gm-field__hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
