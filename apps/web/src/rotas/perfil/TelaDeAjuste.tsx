import { useEffect, useRef, type ReactNode } from 'react';
import { IconButton } from '@gastemenos/ui';

/**
 * Casca das telas de Ajustes.
 *
 * Ao abrir, o foco vai para o `h1` — quem usa leitor de tela precisa ouvir
 * onde chegou, senão o foco fica no começo do documento
 * (docs/08-ACESSIBILIDADE.md).
 */
export function TelaDeAjuste({
  titulo,
  descricao,
  voltarPara = '/perfil',
  children,
}: {
  titulo: string;
  descricao?: ReactNode;
  voltarPara?: string;
  children: ReactNode;
}): React.ReactElement {
  const tituloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto w-full max-w-[480px] pb-10">
      <header className="flex items-center gap-3 px-5 pt-6">
        <IconButton icon="back" label="Voltar" href={voltarPara} />
        <h1 ref={tituloRef} tabIndex={-1} className="text-title-m text-ink outline-none">
          {titulo}
        </h1>
      </header>

      <main className="flex flex-col gap-5 px-5 pt-6">
        {descricao ? <p className="text-body-m text-ink-muted">{descricao}</p> : null}
        {children}
      </main>
    </div>
  );
}
