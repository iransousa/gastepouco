import { useEffect, useMemo, useState } from 'react';
import { cx } from '../cx.js';

export interface ConfettiBurstProps {
  /** Quantos papeizinhos. Mais que ~40 vira ruído visual. */
  quantidade?: number;
  /** Quanto tempo dura, em ms. */
  duracao?: number;
  className?: string;
}

/**
 * Comemoração da nota lida.
 *
 * **Não anima para quem pediu para não animar.** Respeita
 * `prefers-reduced-motion` e a opção "Reduzir movimento" do app
 * (`html[data-reduce-motion="true"]`): para quem tem enxaqueca vestibular ou
 * sensibilidade a movimento, confete na tela inteira não é comemoração, é
 * desconforto (docs/08-ACESSIBILIDADE.md).
 *
 * Quando o movimento está desligado o componente não renderiza nada — a
 * comemoração continua existindo no texto da tela, que é onde ela precisa
 * estar de qualquer jeito.
 *
 * `aria-hidden` sempre: é decoração. Quem usa leitor de tela recebe a notícia
 * pelo `role="status"` da tela, não por isto.
 */
export function ConfettiBurst({
  quantidade = 28,
  duracao = 1800,
  className,
}: ConfettiBurstProps): React.ReactElement | null {
  const [animar, setAnimar] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // `matchMedia` não existe em toda webview. Sem conseguir perguntar, a
    // resposta segura é não animar: confete indesejado incomoda quem tem
    // sensibilidade a movimento; a falta dele não machuca ninguém.
    const prefereMenosMovimento =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : true;

    const desligadoNoApp =
      document.documentElement.getAttribute('data-reduce-motion') === 'true';

    if (prefereMenosMovimento || desligadoNoApp) return;

    setAnimar(true);
    const parar = setTimeout(() => setAnimar(false), duracao);
    return () => clearTimeout(parar);
  }, [duracao]);

  // Posições sorteadas uma vez: recalcular a cada render faria os papéis
  // pularem de lugar no meio da animação.
  const papeis = useMemo(
    () =>
      Array.from({ length: quantidade }, (_, i) => ({
        esquerda: (i * 97) % 100,
        atraso: (i % 7) * 90,
        cor: ['var(--lime)', 'var(--brand)', 'var(--offer)', 'var(--points)'][i % 4],
        giro: (i % 2 === 0 ? 1 : -1) * (120 + (i % 5) * 40),
      })),
    [quantidade],
  );

  if (!animar) return null;

  return (
    <div
      aria-hidden="true"
      className={cx('gm-confetti', className)}
      style={{ ['--gm-confetti-duracao' as string]: `${duracao}ms` }}
    >
      {papeis.map((papel, i) => (
        <span
          key={i}
          className="gm-confetti__papel"
          style={{
            left: `${papel.esquerda}%`,
            background: papel.cor,
            animationDelay: `${papel.atraso}ms`,
            ['--gm-confetti-giro' as string]: `${papel.giro}deg`,
          }}
        />
      ))}
    </div>
  );
}
