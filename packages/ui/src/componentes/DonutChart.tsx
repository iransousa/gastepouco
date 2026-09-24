import { useId } from 'react';
import { cx } from '../cx.js';

export interface FatiaDoDonut {
  /** Identidade da fatia. A cor segue este id, nunca a posição no ranking. */
  id: string;
  label: string;
  /** Em centavos. */
  valor: number;
}

export interface DonutChartProps {
  fatias: FatiaDoDonut[];
  /** Como escrever o valor na legenda. */
  formatarValor: (centavos: number) => string;
  tamanho?: number;
  className?: string;
}

/**
 * Rosca de composição do gasto do mês.
 *
 * Uso legítimo de rosca: parte-do-todo num relance, com 5 categorias. Acima de
 * ~6 fatias, ou para comparar valores próximos, barra é melhor.
 *
 * Três coisas que não são enfeite:
 *
 * 1. **A cor segue a categoria, não a posição.** Quem aprendeu "Mercearia é
 *    verde" não pode ver isso mudar porque um mês trocou a ordem.
 * 2. **Vão de 2px entre as fatias**, não borda. Borda escurece o desenho; o vão
 *    separa sem sujar, e é o que distingue fatias vizinhas para quem não separa
 *    as cores.
 * 3. **A legenda traz nome e valor escritos.** A cor nunca é o único canal
 *    (docs/08-ACESSIBILIDADE.md), e o `role="img"` com resumo em texto dá ao
 *    leitor de tela a mesma informação de quem vê o desenho.
 */
export function DonutChart({
  fatias,
  formatarValor,
  tamanho = 132,
  className,
}: DonutChartProps): React.ReactElement {
  const idDoResumo = useId();

  const total = fatias.reduce((soma, fatia) => soma + fatia.valor, 0);
  const comValor = fatias.filter((fatia) => fatia.valor > 0);

  if (total === 0 || comValor.length === 0) {
    return (
      <p className={cx('text-body-m text-ink-muted', className)}>
        Ainda não há gastos neste período.
      </p>
    );
  }

  const espessura = Math.round(tamanho / 6.6);
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;

  /** Vão entre fatias, em px de arco. Separa sem escurecer, ao contrário de borda. */
  const VAO_ENTRE_FATIAS = 2;

  const maior = [...comValor].sort((a, b) => b.valor - a.valor)[0]!;
  const percentualDoMaior = Math.round((maior.valor / total) * 100);

  let anguloAcumulado = 0;
  const arcos = comValor.map((fatia, indice) => {
    const fracao = fatia.valor / total;
    const inicio = anguloAcumulado;
    anguloAcumulado += fracao * 360;

    return {
      ...fatia,
      // `chart-1..5` na ordem em que as categorias chegam. Sem ciclar: acima de
      // 5, quem monta a lista precisa agrupar o resto em "Outros".
      cor: `var(--chart-${Math.min(indice + 1, 5)})`,
      comprimento: Math.max(fracao * circunferencia - VAO_ENTRE_FATIAS, 0),
      deslocamento: (inicio / 360) * circunferencia,
      percentual: Math.round(fracao * 100),
    };
  });

  const resumo = `Gasto por categoria. ${arcos
    .map((arco) => `${arco.label}, ${formatarValor(arco.valor)}, ${arco.percentual}%`)
    .join('. ')}.`;

  return (
    <div className={cx('flex flex-col items-center gap-4', className)}>
      <div
        role="img"
        aria-labelledby={idDoResumo}
        className="relative"
        style={{ width: tamanho, height: tamanho }}
      >
        <svg
          width={tamanho}
          height={tamanho}
          viewBox={`0 0 ${tamanho} ${tamanho}`}
          aria-hidden="true"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {arcos.map((arco) => (
            <circle
              key={arco.id}
              cx={tamanho / 2}
              cy={tamanho / 2}
              r={raio}
              fill="none"
              stroke={arco.cor}
              strokeWidth={espessura}
              strokeDasharray={`${arco.comprimento} ${circunferencia}`}
              strokeDashoffset={-arco.deslocamento}
            />
          ))}
        </svg>

        {/* O miolo mostra só a maior fatia: um número por gráfico, não um por
            fatia. Os outros estão na legenda, escritos. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="text-title-m text-ink">{percentualDoMaior}%</span>
          <span className="text-caption text-ink-muted">{maior.label}</span>
        </div>
      </div>

      <p id={idDoResumo} className="gm-sr">
        {resumo}
      </p>

      {/* A legenda é a versão em tabela do gráfico: identidade e valor sem
          depender de enxergar cor. */}
      <ul className="flex w-full flex-col gap-2">
        {arcos.map((arco) => (
          <li key={arco.id} className="flex items-center gap-2 text-body-m text-ink">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-s"
              style={{ background: arco.cor }}
            />
            <span className="flex-1">{arco.label}</span>
            <strong className="tabular-nums">{formatarValor(arco.valor)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
