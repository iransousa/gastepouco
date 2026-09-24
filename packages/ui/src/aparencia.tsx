import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Tema, tamanho de texto e movimento — as preferências que mudam o app inteiro.
 *
 * Tudo é aplicado como atributo no `<html>`, não como classe em componente:
 * `tokens.css` já define os valores por `[data-theme]` e `html[data-text-size]`,
 * então trocar o atributo troca o app inteiro sem recarregar e sem recompilar
 * nada (docs/02-ARQUITETURA.md).
 *
 * Por que ler do localStorage antes do primeiro desenho: as preferências de
 * verdade vêm da API, mas esperar a resposta faria a tela piscar em claro antes
 * de virar escura — desconfortável para quem escolheu alto contraste
 * justamente por sensibilidade. O cache local aplica na hora; a API confirma
 * depois.
 */

export type Tema = 'sistema' | 'claro' | 'escuro' | 'contraste';
export type TamanhoDeTexto = 'normal' | 'grande' | 'muito-grande';

export interface Aparencia {
  tema: Tema;
  tamanhoDeTexto: TamanhoDeTexto;
  reduzirMovimento: boolean;
  modoFacil: boolean;
}

export const APARENCIA_PADRAO: Aparencia = {
  tema: 'sistema',
  tamanhoDeTexto: 'normal',
  reduzirMovimento: false,
  modoFacil: false,
};

interface ValorDoContexto extends Aparencia {
  definir: (mudanca: Partial<Aparencia>) => void;
}

const Contexto = createContext<ValorDoContexto | null>(null);

const CHAVE = 'gastemenos:aparencia';

/** `sistema` não vira atributo: sem `data-theme`, tokens.css segue o sistema. */
const TEMA_NO_HTML: Record<Tema, string | null> = {
  sistema: null,
  claro: 'light',
  escuro: 'dark',
  contraste: 'contraste',
};

export function lerAparenciaSalva(): Aparencia {
  if (typeof window === 'undefined') return APARENCIA_PADRAO;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return APARENCIA_PADRAO;
    return { ...APARENCIA_PADRAO, ...(JSON.parse(bruto) as Partial<Aparencia>) };
  } catch {
    // Navegador anônimo ou armazenamento bloqueado: o padrão serve.
    return APARENCIA_PADRAO;
  }
}

/** Aplica no `<html>`. Exportada para o index.html poder chamar antes do React. */
export function aplicarAparencia(aparencia: Aparencia): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;

  const tema = TEMA_NO_HTML[aparencia.tema];
  if (tema) html.setAttribute('data-theme', tema);
  else html.removeAttribute('data-theme');

  if (aparencia.tamanhoDeTexto === 'normal') html.removeAttribute('data-text-size');
  else html.setAttribute('data-text-size', aparencia.tamanhoDeTexto);

  if (aparencia.reduzirMovimento) html.setAttribute('data-reduce-motion', 'true');
  else html.removeAttribute('data-reduce-motion');

  if (aparencia.modoFacil) html.setAttribute('data-easy-mode', 'true');
  else html.removeAttribute('data-easy-mode');
}

export function AppearanceProvider({
  children,
  inicial,
}: {
  children: ReactNode;
  inicial?: Partial<Aparencia>;
}): React.ReactElement {
  const [aparencia, setAparencia] = useState<Aparencia>(() => ({
    ...lerAparenciaSalva(),
    ...inicial,
  }));

  useEffect(() => {
    aplicarAparencia(aparencia);
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(aparencia));
    } catch {
      // Sem armazenamento a preferência vale só nesta sessão. Não é motivo
      // para quebrar a tela.
    }
  }, [aparencia]);

  const valor = useMemo<ValorDoContexto>(
    () => ({
      ...aparencia,
      definir: (mudanca) => setAparencia((atual) => ({ ...atual, ...mudanca })),
    }),
    [aparencia],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAparencia(): ValorDoContexto {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useAparencia precisa estar dentro do AppearanceProvider');
  return contexto;
}
