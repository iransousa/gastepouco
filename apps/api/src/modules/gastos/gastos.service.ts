import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Gastos: o que a tela Início e a tela Gastos mostram.
 *
 * Tudo é somado a partir das notas com status `DONE` — nota pendente ou que
 * falhou não entra no total, senão o número da tela mudaria sozinho enquanto a
 * fila processa.
 *
 * O mês é calculado em **UTC**, como tudo que vai para o banco. A tela formata
 * no fuso de Brasília; misturar os dois faria uma compra de 31/08 às 22h cair
 * em setembro no total e em agosto na lista.
 */

export type Periodo = 'month' | '3months' | 'year';

interface Intervalo {
  de: Date;
  ate: Date;
  /** O mesmo intervalo, deslocado para trás, para comparar. */
  anteriorDe: Date;
  anteriorAte: Date;
  rotulo: string;
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

@Injectable()
export class GastosService {
  constructor(private readonly prisma: PrismaService) {}

  private intervalo(periodo: Periodo, referencia?: string): Intervalo {
    const agora = referencia && /^\d{4}-\d{2}$/.test(referencia)
      ? new Date(Date.UTC(Number(referencia.slice(0, 4)), Number(referencia.slice(5, 7)) - 1, 1))
      : new Date();

    const ano = agora.getUTCFullYear();
    const mes = agora.getUTCMonth();

    if (periodo === 'year') {
      return {
        de: new Date(Date.UTC(ano, 0, 1)),
        ate: new Date(Date.UTC(ano + 1, 0, 1)),
        anteriorDe: new Date(Date.UTC(ano - 1, 0, 1)),
        anteriorAte: new Date(Date.UTC(ano, 0, 1)),
        rotulo: `Total em ${ano}`,
      };
    }

    if (periodo === '3months') {
      return {
        de: new Date(Date.UTC(ano, mes - 2, 1)),
        ate: new Date(Date.UTC(ano, mes + 1, 1)),
        anteriorDe: new Date(Date.UTC(ano, mes - 5, 1)),
        anteriorAte: new Date(Date.UTC(ano, mes - 2, 1)),
        rotulo: `Total de ${MESES[(mes + 10) % 12]} a ${MESES[mes]}`,
      };
    }

    return {
      de: new Date(Date.UTC(ano, mes, 1)),
      ate: new Date(Date.UTC(ano, mes + 1, 1)),
      anteriorDe: new Date(Date.UTC(ano, mes - 1, 1)),
      anteriorAte: new Date(Date.UTC(ano, mes, 1)),
      rotulo: `Total em ${MESES[mes]}`,
    };
  }

  private async somar(userId: string, de: Date, ate: Date): Promise<number> {
    const soma = await this.prisma.receipt.aggregate({
      where: { userId, status: 'DONE', issuedAt: { gte: de, lt: ate } },
      _sum: { totalCents: true },
    });
    return soma._sum.totalCents ?? 0;
  }

  async resumo(userId: string, periodo: Periodo = 'month', referencia?: string) {
    const janela = this.intervalo(periodo, referencia);

    const [total, anterior, perfil] = await Promise.all([
      this.somar(userId, janela.de, janela.ate),
      this.somar(userId, janela.anteriorDe, janela.anteriorAte),
      this.prisma.consumptionProfile.findUnique({
        where: { userId },
        select: { budgetCents: true },
      }),
    ]);

    // Sem período anterior não existe comparação — e inventar "0% de variação"
    // seria pior do que dizer que ainda não dá para comparar.
    const variacao = anterior > 0 ? Math.round(((total - anterior) / anterior) * 100) : null;

    const orcamento = periodo === 'month' ? (perfil?.budgetCents ?? null) : null;

    return {
      label: janela.rotulo,
      totalCents: total,
      previousTotalCents: anterior,
      changePercent: variacao,
      budgetCents: orcamento,
      remainingCents: orcamento === null ? null : orcamento - total,
      periodStart: janela.de,
      periodEnd: janela.ate,
    };
  }

  /**
   * Gasto por categoria.
   *
   * Soma `ReceiptItem.totalCents`, não o total da nota: é a única forma de
   * dividir por categoria. A soma dos itens pode ficar alguns centavos abaixo
   * do total da nota quando há desconto na compra inteira — por isso a tela
   * mostra o total da nota no destaque e as categorias como composição.
   */
  async porCategoria(userId: string, periodo: Periodo = 'month', referencia?: string) {
    const janela = this.intervalo(periodo, referencia);

    const itens = await this.prisma.receiptItem.findMany({
      where: {
        receipt: { userId, status: 'DONE', issuedAt: { gte: janela.de, lt: janela.ate } },
      },
      select: {
        totalCents: true,
        product: { select: { category: { select: { slug: true, name: true } } } },
      },
    });

    const porSlug = new Map<string, { slug: string; name: string; totalCents: number }>();

    for (const item of itens) {
      const categoria = item.product?.category;
      const slug = categoria?.slug ?? 'outros';
      const nome = categoria?.name ?? 'Outros';

      const atual = porSlug.get(slug) ?? { slug, name: nome, totalCents: 0 };
      atual.totalCents += item.totalCents;
      porSlug.set(slug, atual);
    }

    const total = [...porSlug.values()].reduce((soma, c) => soma + c.totalCents, 0);

    return [...porSlug.values()]
      .filter((categoria) => categoria.totalCents > 0)
      .sort((a, b) => b.totalCents - a.totalCents)
      .map((categoria) => ({
        ...categoria,
        percent: total > 0 ? Math.round((categoria.totalCents / total) * 100) : 0,
      }));
  }

  /**
   * Gasto por semana do mês.
   *
   * Semanas do calendário do mês (1–7, 8–14, 15–21, 22–28, 29–fim), não
   * semanas ISO: a pessoa pensa "primeira semana do mês", e uma semana ISO que
   * atravessa a virada do mês colocaria a compra na coluna errada.
   */
  async porSemana(userId: string, mes?: string) {
    const janela = this.intervalo('month', mes);

    const notas = await this.prisma.receipt.findMany({
      where: { userId, status: 'DONE', issuedAt: { gte: janela.de, lt: janela.ate } },
      select: { issuedAt: true, totalCents: true },
    });

    const diasNoMes = new Date(
      Date.UTC(janela.de.getUTCFullYear(), janela.de.getUTCMonth() + 1, 0),
    ).getUTCDate();

    const semanas = [
      { label: 'Sem 1', de: 1, ate: 7, totalCents: 0 },
      { label: 'Sem 2', de: 8, ate: 14, totalCents: 0 },
      { label: 'Sem 3', de: 15, ate: 21, totalCents: 0 },
      { label: 'Sem 4', de: 22, ate: 28, totalCents: 0 },
      { label: 'Sem 5', de: 29, ate: diasNoMes, totalCents: 0 },
    ];

    for (const nota of notas) {
      const dia = nota.issuedAt!.getUTCDate();
      const semana = semanas.find((s) => dia >= s.de && dia <= s.ate);
      if (semana) semana.totalCents += nota.totalCents ?? 0;
    }

    // A 5ª semana só existe em mês com 29 dias ou mais de sobra; sem gasto
    // nela, some, para o gráfico não mostrar uma coluna vazia permanente.
    return semanas
      .filter((semana, indice) => indice < 4 || semana.totalCents > 0)
      .map(({ label, totalCents }) => ({ label, totalCents }));
  }

  /**
   * O item que mais pesou no período e as maiores altas de preço.
   *
   * "Mais pesou" é quanto a pessoa gastou naquele produto no mês inteiro, não o
   * item mais caro de uma nota: gastar R$ 80 em café ao longo do mês importa
   * mais do que uma peça de carne de R$ 60 comprada uma vez.
   */
  async destaques(userId: string, mes?: string) {
    const janela = this.intervalo('month', mes);

    const itens = await this.prisma.receiptItem.findMany({
      where: {
        receipt: { userId, status: 'DONE', issuedAt: { gte: janela.de, lt: janela.ate } },
      },
      select: {
        totalCents: true,
        unitPriceCents: true,
        regionAvgCents: true,
        rawDescription: true,
        product: { select: { id: true, displayName: true } },
      },
    });

    const porProduto = new Map<
      string,
      { productId: string | null; name: string; totalCents: number; vezes: number }
    >();

    for (const item of itens) {
      const chave = item.product?.id ?? item.rawDescription;
      const atual = porProduto.get(chave) ?? {
        productId: item.product?.id ?? null,
        name: item.product?.displayName ?? item.rawDescription,
        totalCents: 0,
        vezes: 0,
      };
      atual.totalCents += item.totalCents;
      atual.vezes += 1;
      porProduto.set(chave, atual);
    }

    const maisPesou = [...porProduto.values()].sort((a, b) => b.totalCents - a.totalCents)[0] ?? null;

    // Acima da média da região: onde dá para economizar no mês que vem.
    const acimaDaMedia = itens
      .filter((item) => item.regionAvgCents && item.unitPriceCents > item.regionAvgCents)
      .map((item) => ({
        name: item.product?.displayName ?? item.rawDescription,
        paidCents: item.unitPriceCents,
        regionAvgCents: item.regionAvgCents!,
        percent: Math.round(
          ((item.unitPriceCents - item.regionAvgCents!) / item.regionAvgCents!) * 100,
        ),
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3);

    return { topProduct: maisPesou, aboveRegionAverage: acimaDaMedia };
  }
}
