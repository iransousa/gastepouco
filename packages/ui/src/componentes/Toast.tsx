import type { ReactNode } from 'react';
import { cx } from '../cx.js';
import { Icon } from './Icon.js';

export interface ToastProps {
  children: ReactNode;
  className?: string;
}

/**
 * Confirmação curta depois de salvar.
 *
 * `role="status"` anuncia sem roubar o foco. Quem mostra o toast precisa
 * deixá-lo no mínimo 4 segundos e nunca colocar ação obrigatória nele
 * (docs/08-ACESSIBILIDADE.md).
 */
export function Toast({ children, className }: ToastProps): React.ReactElement {
  return (
    <div role="status" className={cx('gm-toast', className)}>
      <Icon name="check" size={18} strokeWidth={3} />
      <span>{children}</span>
    </div>
  );
}
