/**
 * Níveis e pontos (docs/07-GAMIFICACAO.md).
 *
 * Na interface a palavra é sempre "pontos", nunca "XP".
 *
 * O cálculo mora aqui porque a API credita os pontos e o web desenha o anel de
 * progresso: os dois precisam concordar sobre quanto falta para o próximo
 * nível, senão o anel fecha antes ou depois da comemoração.
 */

/** Pontos por evento. A API é quem credita; o web só mostra. */
export const PONTOS = {
  BOAS_VINDAS: 50,
  PERFIL_COMPLETO: 100,
  NOTA_LIDA: 60,
  MERCADO_NOVO: 20,
  SEMANA_COM_NOTA: 40,
  CONFIRMAR_PRECO: 10,
  AMIGO_CONVIDADO: 100,
} as const;

/** Limites contra abuso. */
export const LIMITES = {
  NOTAS_COM_PONTOS_POR_DIA: 10,
  CONFIRMACOES_DE_PRECO_POR_DIA: 5,
  PONTOS_DE_CONVITE_POR_MES: 20,
  /** Nota abaixo de R$ 2,00 não vale pontos. */
  VALOR_MINIMO_DA_NOTA_CENTAVOS: 200,
} as const;

const PONTOS_POR_NIVEL_ATE_12 = 500;
const NIVEL_ONDE_O_CUSTO_CRESCE = 12;
const ACRESCIMO_POR_NIVEL = 100;

/** Quanto custa sair do nível informado para o seguinte. */
export function custoDoNivel(nivel: number): number {
  if (nivel <= NIVEL_ONDE_O_CUSTO_CRESCE) return PONTOS_POR_NIVEL_ATE_12;
  return PONTOS_POR_NIVEL_ATE_12 + (nivel - NIVEL_ONDE_O_CUSTO_CRESCE) * ACRESCIMO_POR_NIVEL;
}

/** Total acumulado necessário para chegar ao nível informado. */
export function pontosParaChegarAoNivel(nivel: number): number {
  let total = 0;
  for (let n = 1; n < nivel; n++) total += custoDoNivel(n);
  return total;
}

export interface SituacaoDeNivel {
  nivel: number;
  nome: string;
  /** Pontos já conquistados dentro do nível atual. */
  pontosNoNivel: number;
  /** Quanto o nível atual pede no total. */
  metaDoNivel: number;
  pontosAteOProximo: number;
  /** 0 a 100, para a barra e o anel. */
  progresso: number;
}

const NOMES: Array<{ ate: number; nome: string }> = [
  { ate: 3, nome: 'Iniciante' },
  { ate: 6, nome: 'Pesquisador de Preços' },
  { ate: 11, nome: 'Econômico' },
  { ate: 12, nome: 'Caçador de Ofertas' },
  { ate: 13, nome: 'Mestre da Feira' },
  { ate: 14, nome: 'Rei do Atacado' },
];

export function nomeDoNivel(nivel: number): string {
  for (const faixa of NOMES) if (nivel <= faixa.ate) return faixa.nome;
  return 'Lenda da Economia';
}

/** Converte o total de pontos do livro-razão na situação que a tela mostra. */
export function situacaoDoNivel(pontosTotais: number): SituacaoDeNivel {
  const total = Math.max(0, Math.trunc(pontosTotais ?? 0));

  let nivel = 1;
  let acumulado = 0;

  while (acumulado + custoDoNivel(nivel) <= total) {
    acumulado += custoDoNivel(nivel);
    nivel++;
  }

  const metaDoNivel = custoDoNivel(nivel);
  const pontosNoNivel = total - acumulado;

  return {
    nivel,
    nome: nomeDoNivel(nivel),
    pontosNoNivel,
    metaDoNivel,
    pontosAteOProximo: metaDoNivel - pontosNoNivel,
    progresso: Math.round((pontosNoNivel / metaDoNivel) * 100),
  };
}

/** Os 9 selos de docs/07-GAMIFICACAO.md. O seed cria estas linhas. */
export const SELOS = [
  { slug: 'primeira-nota', nome: 'Primeira nota', comoGanhar: 'Ler a primeira nota', meta: 1 },
  { slug: 'carrinho-esperto', nome: 'Carrinho Esperto', comoGanhar: '15 notas no mesmo mês', meta: 15 },
  { slug: 'em-chamas', nome: 'Em chamas', comoGanhar: '5 semanas seguidas com nota', meta: 5 },
  { slug: 'explorador', nome: 'Explorador', comoGanhar: 'Notas de 5 mercados diferentes', meta: 5 },
  { slug: 'cem-reais-salvos', nome: 'R$ 100 salvos', comoGanhar: 'Economia de R$ 100 no mês', meta: 10000 },
  { slug: 'cacador-de-promocoes', nome: 'Caçador de Promoções', comoGanhar: 'Comprar 10 produtos que estavam em oferta', meta: 10 },
  { slug: 'detetive-de-precos', nome: 'Detetive de Preços', comoGanhar: 'Confirmar 20 preços', meta: 20 },
  { slug: 'embaixador', nome: 'Embaixador', comoGanhar: '3 amigos convidados que leram a primeira nota', meta: 3 },
  { slug: 'lenda-do-mes', nome: 'Lenda do Mês', comoGanhar: '1º lugar em qualquer ranking do mês', meta: 1 },
] as const;

export type SlugDeSelo = (typeof SELOS)[number]['slug'];
