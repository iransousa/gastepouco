import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Casca das telas de primeiro uso e acesso.
 *
 * Ao abrir a tela o foco vai para o `h1`, como manda docs/08-ACESSIBILIDADE.md:
 * quem usa leitor de tela precisa ouvir onde chegou, senão o foco fica no
 * começo do documento e a pessoa navega às cegas.
 */
export function TelaDeAcesso({
  titulo,
  descricao,
  acimaDoTitulo,
  children,
  rodape,
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  acimaDoTitulo?: ReactNode;
  children?: ReactNode;
  rodape?: ReactNode;
}): React.ReactElement {
  const tituloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col px-5 pb-8 pt-6">
      {acimaDoTitulo}
      <main className="flex flex-1 flex-col">
        <h1 ref={tituloRef} tabIndex={-1} className="text-title-xl text-ink outline-none">
          {titulo}
        </h1>
        {descricao ? <p className="mt-3 text-body-l text-ink-muted">{descricao}</p> : null}
        {children}
      </main>
      {rodape ? <div className="mt-6 flex flex-col gap-3">{rodape}</div> : null}
    </div>
  );
}
