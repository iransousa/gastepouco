import type { IconName } from '@gastemenos/ui';

/**
 * As 5 perguntas do perfil de consumo.
 *
 * Copiadas de `referencia/telas/PerfilConsumo.dc.html`, com os mesmos `id` —
 * eles são o que a API grava (`ConsumptionProfile`), então mudar um aqui
 * quebraria os perfis já respondidos.
 *
 * Os textos ficam neste arquivo, separados da tela, porque também aparecem na
 * tela PerfilPronto ("Editar respostas") e no Perfil.
 */

export interface Opcao {
  id: string;
  label: string;
  sub?: string;
  icone: IconName;
}

export interface Pergunta {
  /** Nome do campo no `ConsumptionProfile`. */
  campo: 'householdSize' | 'storeTypes' | 'frequency' | 'monthlySpendBand' | 'priorities';
  multipla: boolean;
  /** Só em pergunta múltipla: teto de escolhas. */
  maximo?: number;
  titulo: string;
  ajuda: string;
  opcoes: Opcao[];
}

export const PERGUNTAS: Pergunta[] = [
  {
    campo: 'householdSize',
    multipla: false,
    titulo: 'Para quantas pessoas você faz as compras?',
    ajuda: 'Assim comparamos seus gastos com casas parecidas com a sua.',
    opcoes: [
      { id: '1', label: 'Só eu', sub: '1 pessoa', icone: 'user' },
      { id: '2', label: 'Casal', sub: '2 pessoas', icone: 'user' },
      { id: '3', label: 'Família', sub: '3 a 4 pessoas', icone: 'home' },
      { id: '5', label: 'Casa cheia', sub: '5 pessoas ou mais', icone: 'home' },
    ],
  },
  {
    campo: 'storeTypes',
    multipla: true,
    titulo: 'Onde você costuma comprar?',
    ajuda: 'Escolha quantos quiser. Vamos priorizar ofertas desses lugares.',
    opcoes: [
      { id: 'super', label: 'Supermercado', icone: 'cart' },
      { id: 'atac', label: 'Atacarejo', icone: 'receipt' },
      { id: 'bairro', label: 'Mercadinho do bairro', icone: 'home' },
      { id: 'feira', label: 'Feira ou hortifrúti', icone: 'tag' },
      { id: 'app', label: 'Aplicativo de entrega', icone: 'scan' },
    ],
  },
  {
    campo: 'frequency',
    multipla: false,
    titulo: 'Com que frequência você vai ao mercado?',
    ajuda: 'Usamos isso para lembrar você da lista na hora certa.',
    opcoes: [
      { id: 'sem', label: 'Toda semana', icone: 'list' },
      { id: 'quin', label: 'A cada 15 dias', icone: 'list' },
      { id: 'mes', label: 'Uma compra grande por mês', icone: 'list' },
      { id: 'falta', label: 'Só quando falta algo', icone: 'list' },
    ],
  },
  {
    campo: 'monthlySpendBand',
    multipla: false,
    titulo: 'Quanto você gasta por mês com mercado?',
    ajuda: 'Serve para sugerir um orçamento. Só você vê essa resposta.',
    opcoes: [
      { id: 'a', label: 'Até R$ 500', icone: 'chart' },
      { id: 'b', label: 'De R$ 500 a R$ 1.000', icone: 'chart' },
      { id: 'c', label: 'De R$ 1.000 a R$ 2.000', icone: 'chart' },
      { id: 'd', label: 'Mais de R$ 2.000', icone: 'chart' },
    ],
  },
  {
    campo: 'priorities',
    multipla: true,
    maximo: 3,
    titulo: 'O que mais pesa na sua escolha?',
    ajuda: 'Escolha até 3. Isso define quais ofertas aparecem primeiro.',
    opcoes: [
      { id: 'preco', label: 'Preço mais baixo', icone: 'tag' },
      { id: 'promo', label: 'Promoções', icone: 'star' },
      { id: 'marca', label: 'Marcas que eu gosto', icone: 'shield' },
      { id: 'saude', label: 'Comida saudável', icone: 'flame' },
      { id: 'perto', label: 'Mercado perto de casa', icone: 'pin' },
    ],
  },
];

/** Rótulo de uma resposta guardada, para as telas de resumo. */
export function rotuloDaOpcao(campo: Pergunta['campo'], id: string): string {
  const pergunta = PERGUNTAS.find((p) => p.campo === campo);
  return pergunta?.opcoes.find((o) => o.id === id)?.label ?? id;
}
