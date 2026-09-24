import { Injectable, Logger } from '@nestjs/common';
import { regiaoDoGeohash } from '@gastemenos/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import { mediaAparada } from '../notas/notas.service.js';

/**
 * Preços da região.
 *
 * O compromisso central do produto está aqui: **o preço é da comunidade, mas
 * ninguém aparece.** Três regras sustentam isso (docs/02 e docs/09):
 *
 * 1. A observação guarda `userHash`, nunca o `userId`.
 * 2. Um agregado só é publicado com **5 notas de pelo menos 3 pessoas
 *    diferentes**. Abaixo disso, dois vizinhos conseguiriam deduzir o que o
 *    terceiro comprou e por quanto.
 * 3. A região é o geohash de 5 caracteres (~5 km) mais as 8 células vizinhas —
 *    nunca o CEP, nunca a coordenada da loja onde a pessoa comprou.
 *
 * A média é **aparada**: descarta 10% em cada ponta. Um preço digitado errado
 * ou uma promoção relâmpago isolada deslocaria a média simples o bastante para
 * a tela mentir.
 */

export const ANONIMATO_MINIMO = { notas: 5, pessoas: 3 } as const;

export interface PontoDoHistorico {
  period: string;
  avgCents: number;
  minCents: number;
  maxCents: number;
  receiptCount: number;
  userCount: number;
}

@Injectable()
export class PrecosService {
  private readonly logger = new Logger(PrecosService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** A região de quem pergunta. Sem CEP, não há região — e a tela diz isso. */
  private async regiaoDoUsuario(userId: string): Promise<string[] | null> {
    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { regionGeohash: true },
    });
    if (!usuario?.regionGeohash) return null;
    return regiaoDoGeohash(usuario.regionGeohash);
  }

  /**
   * Histórico de preço de um produto na região.
   *
   * `range` de 30 dias vem dos agregados diários; 6 meses e 1 ano, dos mensais.
   * Misturar granularidade num gráfico só faria a linha mudar de sentido no
   * meio sem avisar.
   */
  async historico(
    userId: string,
    productId: string,
    range: '30d' | '6m' | '1y' = '6m',
  ): Promise<{
    points: PontoDoHistorico[];
    userPaidCents: number | null;
    todayAvgCents: number | null;
    peakCents: number | null;
    enoughData: boolean;
  }> {
    const regiao = await this.regiaoDoUsuario(userId);
    if (!regiao) {
      return { points: [], userPaidCents: null, todayAvgCents: null, peakCents: null, enoughData: false };
    }

    const prefixo = range === '30d' ? 'day:' : 'month:';
    const quantos = range === '30d' ? 30 : range === '6m' ? 6 : 12;

    const agregados = await this.prisma.priceStat.findMany({
      where: { productId, geohash: { in: regiao }, period: { startsWith: prefixo } },
      orderBy: { period: 'desc' },
      take: quantos * regiao.length,
    });

    // Vários geohashes da região podem ter agregado do mesmo período; a série
    // da tela é um ponto por período, ponderado pelo número de notas.
    const porPeriodo = new Map<string, PontoDoHistorico>();
    for (const linha of agregados) {
      const atual = porPeriodo.get(linha.period);
      if (!atual) {
        porPeriodo.set(linha.period, {
          period: linha.period,
          avgCents: linha.avgCents,
          minCents: linha.minCents,
          maxCents: linha.maxCents,
          receiptCount: linha.receiptCount,
          userCount: linha.userCount,
        });
        continue;
      }

      const notas = atual.receiptCount + linha.receiptCount;
      atual.avgCents = Math.round(
        (atual.avgCents * atual.receiptCount + linha.avgCents * linha.receiptCount) / notas,
      );
      atual.minCents = Math.min(atual.minCents, linha.minCents);
      atual.maxCents = Math.max(atual.maxCents, linha.maxCents);
      atual.receiptCount = notas;
      atual.userCount += linha.userCount;
    }

    const pontos = [...porPeriodo.values()]
      .filter(
        (ponto) =>
          ponto.receiptCount >= ANONIMATO_MINIMO.notas &&
          ponto.userCount >= ANONIMATO_MINIMO.pessoas,
      )
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-quantos);

    // O que a própria pessoa pagou, da compra mais recente. É a linha de
    // comparação da tela — sem ela o gráfico é sobre outras pessoas.
    const ultimaCompra = await this.prisma.receiptItem.findFirst({
      where: { productId, receipt: { userId, status: 'DONE' } },
      orderBy: { receipt: { issuedAt: 'desc' } },
      select: { unitPriceCents: true },
    });

    return {
      points: pontos,
      userPaidCents: ultimaCompra?.unitPriceCents ?? null,
      todayAvgCents: pontos.at(-1)?.avgCents ?? null,
      peakCents: pontos.length ? Math.max(...pontos.map((p) => p.maxCents)) : null,
      enoughData: pontos.length > 0,
    };
  }

  /**
   * Onde está mais barato hoje, na região.
   *
   * Últimos 7 dias: preço de duas semanas atrás manda a pessoa atravessar a
   * cidade atrás de uma promoção que já acabou.
   */
  async lojasMaisBaratas(userId: string, productId: string, limite = 5) {
    const regiao = await this.regiaoDoUsuario(userId);
    if (!regiao) return [];

    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const observacoes = await this.prisma.priceObservation.findMany({
      where: { productId, geohash: { in: regiao }, observedAt: { gte: seteDiasAtras } },
      select: {
        unitPriceCents: true,
        observedAt: true,
        userHash: true,
        store: { select: { id: true, name: true, address: true, city: true } },
      },
    });

    const porLoja = new Map<
      string,
      {
        storeId: string;
        name: string;
        address: string | null;
        precos: number[];
        pessoas: Set<string>;
        vistoEm: Date;
      }
    >();

    for (const observacao of observacoes) {
      const atual = porLoja.get(observacao.store.id) ?? {
        storeId: observacao.store.id,
        name: observacao.store.name,
        address: observacao.store.address,
        precos: [],
        pessoas: new Set<string>(),
        vistoEm: observacao.observedAt,
      };
      atual.precos.push(observacao.unitPriceCents);
      atual.pessoas.add(observacao.userHash);
      if (observacao.observedAt > atual.vistoEm) atual.vistoEm = observacao.observedAt;
      porLoja.set(observacao.store.id, atual);
    }

    return [...porLoja.values()]
      .map((loja) => ({
        storeId: loja.storeId,
        name: loja.name,
        address: loja.address,
        priceCents: mediaAparada(loja.precos),
        observations: loja.precos.length,
        updatedAt: loja.vistoEm,
      }))
      .sort((a, b) => a.priceCents - b.priceCents)
      .slice(0, limite);
  }

  /**
   * Recalcula os agregados. Roda a cada 15 minutos (docs/02-ARQUITETURA.md).
   *
   * Recalcula do zero a janela recente em vez de somar incrementalmente: uma
   * nota excluída tira observações do passado, e um agregado incremental
   * carregaria o erro para sempre.
   */
  async recalcular(diasParaTras = 2): Promise<{ dias: number; meses: number }> {
    const desde = new Date(Date.now() - diasParaTras * 24 * 60 * 60 * 1000);

    const observacoes = await this.prisma.priceObservation.findMany({
      where: { observedAt: { gte: desde } },
      select: {
        productId: true,
        geohash: true,
        unitPriceCents: true,
        observedAt: true,
        userHash: true,
        storeId: true,
      },
    });

    const baldes = new Map<
      string,
      {
        productId: string;
        geohash: string;
        period: string;
        precos: number[];
        pessoas: Set<string>;
        porLoja: Map<string, number[]>;
      }
    >();

    const guardar = (
      productId: string,
      geohash: string,
      period: string,
      preco: number,
      pessoa: string,
      storeId: string,
    ): void => {
      const chave = `${productId}|${geohash}|${period}`;
      const balde = baldes.get(chave) ?? {
        productId,
        geohash,
        period,
        precos: [],
        pessoas: new Set<string>(),
        porLoja: new Map<string, number[]>(),
      };
      balde.precos.push(preco);
      balde.pessoas.add(pessoa);
      balde.porLoja.set(storeId, [...(balde.porLoja.get(storeId) ?? []), preco]);
      baldes.set(chave, balde);
    };

    for (const observacao of observacoes) {
      const dia = observacao.observedAt.toISOString().slice(0, 10);
      const mes = dia.slice(0, 7);
      guardar(observacao.productId, observacao.geohash, `day:${dia}`, observacao.unitPriceCents, observacao.userHash, observacao.storeId);
      guardar(observacao.productId, observacao.geohash, `month:${mes}`, observacao.unitPriceCents, observacao.userHash, observacao.storeId);
    }

    let dias = 0;
    let meses = 0;

    for (const balde of baldes.values()) {
      // O anonimato mínimo é aplicado **na gravação**, não só na leitura: um
      // agregado que não pode ser mostrado não deveria nem existir no banco.
      if (
        balde.precos.length < ANONIMATO_MINIMO.notas ||
        balde.pessoas.size < ANONIMATO_MINIMO.pessoas
      ) {
        continue;
      }

      const maisBarata = [...balde.porLoja.entries()]
        .map(([storeId, precos]) => ({ storeId, preco: mediaAparada(precos) }))
        .sort((a, b) => a.preco - b.preco)[0];

      await this.prisma.priceStat.upsert({
        where: {
          productId_geohash_period: {
            productId: balde.productId,
            geohash: balde.geohash,
            period: balde.period,
          },
        },
        create: {
          productId: balde.productId,
          geohash: balde.geohash,
          period: balde.period,
          avgCents: mediaAparada(balde.precos),
          minCents: Math.min(...balde.precos),
          maxCents: Math.max(...balde.precos),
          minStoreId: maisBarata?.storeId ?? null,
          receiptCount: balde.precos.length,
          userCount: balde.pessoas.size,
        },
        update: {
          avgCents: mediaAparada(balde.precos),
          minCents: Math.min(...balde.precos),
          maxCents: Math.max(...balde.precos),
          minStoreId: maisBarata?.storeId ?? null,
          receiptCount: balde.precos.length,
          userCount: balde.pessoas.size,
        },
      });

      if (balde.period.startsWith('day:')) dias += 1;
      else meses += 1;
    }

    this.logger.log(`Agregados recalculados: ${dias} diários, ${meses} mensais.`);
    return { dias, meses };
  }

  async produto(productId: string) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        displayName: true,
        gtin: true,
        category: { select: { slug: true, name: true } },
      },
    });
  }

  async buscarProdutos(termo: string, limite = 20) {
    const busca = (termo ?? '').trim();
    if (busca.length < 2) return [];

    return this.prisma.product.findMany({
      where: { displayName: { contains: busca, mode: 'insensitive' } },
      select: {
        id: true,
        displayName: true,
        gtin: true,
        category: { select: { slug: true, name: true } },
      },
      take: limite,
      orderBy: { displayName: 'asc' },
    });
  }
}
