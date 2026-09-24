/**
 * Dinheiro em centavos (inteiro), do banco à tela.
 *
 * Nunca use float para dinheiro: 0.1 + 0.2 !== 0.3, e um centavo perdido por
 * item numa nota de 60 itens vira erro visível no total do mês. A conversão
 * para reais acontece só na formatação.
 */

const FORMATADOR_BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const FORMATADOR_SEM_SIMBOLO = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 128460 → "R$ 1.284,60" */
export function formatarCentavos(centavos: number): string {
  return FORMATADOR_BRL.format((centavos ?? 0) / 100);
}

/** 128460 → "1.284,60" — para quando o "R$" já está na tela em outro tamanho. */
export function formatarCentavosSemSimbolo(centavos: number): string {
  return FORMATADOR_SEM_SIMBOLO.format((centavos ?? 0) / 100);
}

/**
 * Separa reais e centavos para o cartão de gastos, onde os centavos aparecem
 * menores ("R$ 1.284" grande + ",60" pequeno).
 */
export function partirCentavos(centavos: number): { reais: string; centavos: string } {
  const total = Math.abs(Math.trunc(centavos ?? 0));
  const sinal = (centavos ?? 0) < 0 ? '-' : '';
  return {
    reais: `${sinal}${new Intl.NumberFormat('pt-BR').format(Math.floor(total / 100))}`,
    centavos: String(total % 100).padStart(2, '0'),
  };
}

/** "R$ 12,90", "12,90" e "12.90" viram 1290. Devolve null quando não dá para ler. */
export function lerCentavos(entrada: string): number | null {
  const limpo = (entrada ?? '').replace(/[^\d,.-]/g, '').trim();
  if (!limpo) return null;

  // pt-BR usa vírgula como decimal; o ponto separa milhar.
  const normalizado = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo;

  const n = Number(normalizado);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

/** Percentual de diferença contra a média da região, arredondado ao inteiro. */
export function variacaoPercentual(pagoCentavos: number, mediaCentavos: number): number {
  if (!mediaCentavos) return 0;
  return Math.round(((pagoCentavos - mediaCentavos) / mediaCentavos) * 100);
}
