import { useId } from 'react';
import { cx } from '../cx.js';

export interface PontoDePreco {
  /** "month:2026-09" ou "day:2026-09-24". */
  period: string;
  avgCents: number;
}

export interface PriceHistoryChartProps {
  pontos: PontoDePreco[];
  /** O que a própria pessoa pagou. Vira a linha de comparação. */
  pagoCentavos?: number | null;
  formatarValor: (centavos: number) => string;
  nomeDoProduto: string;
  altura?: number;
  className?: string;
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function rotuloDoPeriodo(period: string): string {
  const valor = period.split(':')[1] ?? period;
  const partes = valor.split('-');
  if (partes.length === 2) return MESES[Number(partes[1]) - 1] ?? valor;
  return `${partes[2]}/${partes[1]}`;
}

/**
 * Preço médio na região ao longo do tempo.
 *
 * Uma série só — a média da região. O que a pessoa pagou entra como **linha de
 * referência**, não como segunda série: duas séries com escalas próprias no
 * mesmo gráfico é o erro clássico de eixo duplo, e aqui nem faria sentido,
 * porque as duas são preço do mesmo produto.
 *
 * Nenhum valor mora só no desenho: o `role="img"` resume a série em texto e a
 * tabela abaixo traz período a período.
 */
export function PriceHistoryChart({
  pontos,
  pagoCentavos,
  formatarValor,
  nomeDoProduto,
  altura = 140,
  className,
}: PriceHistoryChartProps): React.ReactElement {
  const idDoResumo = useId();

  if (pontos.length < 2) {
    return (
      <p className={cx('text-body-m text-ink-muted', className)}>
        Ainda juntando preços desta região. Cada nota lida ajuda.
      </p>
    );
  }

  const valores = pontos.map((ponto) => ponto.avgCents);
  const comparados = pagoCentavos ? [...valores, pagoCentavos] : valores;

  // Escala com folga de 10%, para a linha não encostar na borda.
  const minimo = Math.min(...comparados) * 0.9;
  const maximo = Math.max(...comparados) * 1.1;
  const amplitude = maximo - minimo || 1;

  const largura = 320;
  const alturaUtil = altura - 8;

  const paraX = (indice: number): number =>
    pontos.length === 1 ? largura / 2 : (indice / (pontos.length - 1)) * largura;
  const paraY = (centavos: number): number =>
    alturaUtil - ((centavos - minimo) / amplitude) * alturaUtil + 4;

  const linha = pontos.map((ponto, i) => `${paraX(i)},${paraY(ponto.avgCents)}`).join(' ');

  const primeiro = pontos[0]!;
  const ultimo = pontos.at(-1)!;
  const variacao = Math.round(
    ((ultimo.avgCents - primeiro.avgCents) / primeiro.avgCents) * 100,
  );

  const resumo =
    `Preço médio de ${nomeDoProduto} na região. ` +
    `${pontos.map((p) => `${rotuloDoPeriodo(p.period)}, ${formatarValor(p.avgCents)}`).join('. ')}. ` +
    `${variacao < 0 ? 'Caiu' : variacao > 0 ? 'Subiu' : 'Ficou estável em'} ${Math.abs(variacao)}% no período.` +
    (pagoCentavos ? ` Você pagou ${formatarValor(pagoCentavos)}.` : '');

  return (
    <div className={cx('flex flex-col gap-3', className)}>
      <div role="img" aria-labelledby={idDoResumo}>
        <svg
          viewBox={`0 0 ${largura} ${altura}`}
          width="100%"
          height={altura}
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          {/* Linha do que a pessoa pagou: referência, não série. Tracejada é a
              convenção para "limite", que é justamente o papel dela aqui. */}
          {pagoCentavos ? (
            <line
              x1={0}
              x2={largura}
              y1={paraY(pagoCentavos)}
              y2={paraY(pagoCentavos)}
              stroke="var(--chart-3)"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          ) : null}

          <polyline
            points={linha}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Só as pontas ganham marcador: um ponto em cada período vira ruído. */}
          {[0, pontos.length - 1].map((indice) => (
            <circle
              key={indice}
              cx={paraX(indice)}
              cy={paraY(pontos[indice]!.avgCents)}
              r={4}
              fill="var(--chart-1)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          ))}
        </svg>

        <div aria-hidden="true" className="flex justify-between">
          <span className="text-caption text-ink-muted">{rotuloDoPeriodo(primeiro.period)}</span>
          <span className="text-caption text-ink-muted">{rotuloDoPeriodo(ultimo.period)}</span>
        </div>
      </div>

      <p id={idDoResumo} className="gm-sr">
        {resumo}
      </p>

      {pagoCentavos ? (
        <p className="flex items-center gap-2 text-caption text-ink-muted">
          <span aria-hidden="true" className="h-0.5 w-6 bg-chart-3" />
          {`O que você pagou: ${formatarValor(pagoCentavos)}`}
        </p>
      ) : null}

      <ul className="flex flex-col gap-1">
        {pontos.map((ponto) => (
          <li
            key={ponto.period}
            className="flex items-center justify-between text-body-s text-ink-muted"
          >
            <span>{rotuloDoPeriodo(ponto.period)}</span>
            <span className="tabular-nums text-ink">{formatarValor(ponto.avgCents)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
