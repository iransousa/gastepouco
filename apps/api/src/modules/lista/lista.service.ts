import { Injectable } from '@nestjs/common';
import { regiaoDoGeohash } from '@gastemenos/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import { mediaAparada } from '../notas/notas.service.js';

/**
 * Lista de compras.
 *
 * A lista nasce do que a pessoa compra, não de um cadastro em branco: pedir
 * para digitar 20 itens antes de usar o app seria pedir o trabalho que o app
 * promete evitar.
 *
 * "Onde sai mais barato" compara a lista **inteira** por loja, não item a
 * item: a loja mais barata em cada produto costuma ser uma diferente, e
 * mandar a pessoa a quatro mercados para economizar R$ 6 é um mau conselho.
 */
@Injectable()
export class ListaService {
  constructor(private readonly prisma: PrismaService) {}

  private async listaAtual(userId: string) {
    const existente = await this.prisma.shoppingList.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (existente) return existente;

    return this.prisma.shoppingList.create({
      data: { userId, name: 'Lista da semana' },
      select: { id: true },
    });
  }

  async atual(userId: string) {
    const lista = await this.listaAtual(userId);

    const itens = await this.prisma.shoppingListItem.findMany({
      where: { listId: lista.id },
      orderBy: [{ checked: 'asc' }, { position: 'asc' }],
      select: {
        id: true,
        productId: true,
        label: true,
        quantity: true,
        unit: true,
        estimatedCents: true,
        repurchaseDays: true,
        checked: true,
        suggested: true,
      },
    });

    const estimativa = itens.reduce((soma, item) => soma + (item.estimatedCents ?? 0), 0);
    const marcados = itens.filter((item) => item.checked).length;

    return {
      id: lista.id,
      items: itens.map((item) => ({ ...item, quantity: Number(item.quantity) })),
      estimatedCents: estimativa,
      checkedCount: marcados,
      cheapestStore: await this.lojaMaisBarataParaALista(userId, itens),
    };
  }

  /**
   * Qual loja sai mais barato para a lista inteira.
   *
   * Só considera loja que tem preço recente para **a maioria** dos itens: uma
   * loja com preço de 2 dos 12 itens pareceria a mais barata só por ter menos
   * a somar. A cobertura vai na resposta para a tela poder dizer isso.
   */
  private async lojaMaisBarataParaALista(
    userId: string,
    itens: Array<{ productId: string | null; quantity: unknown }>,
  ) {
    const produtos = itens.map((item) => item.productId).filter((id): id is string => Boolean(id));
    if (produtos.length === 0) return null;

    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { regionGeohash: true },
    });
    if (!usuario?.regionGeohash) return null;

    const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const observacoes = await this.prisma.priceObservation.findMany({
      where: {
        productId: { in: produtos },
        geohash: { in: regiaoDoGeohash(usuario.regionGeohash) },
        observedAt: { gte: trintaDiasAtras },
      },
      select: {
        productId: true,
        unitPriceCents: true,
        store: { select: { id: true, name: true } },
      },
    });

    const porLoja = new Map<
      string,
      { storeId: string; name: string; precos: Map<string, number[]> }
    >();

    for (const observacao of observacoes) {
      const loja = porLoja.get(observacao.store.id) ?? {
        storeId: observacao.store.id,
        name: observacao.store.name,
        precos: new Map<string, number[]>(),
      };
      loja.precos.set(observacao.productId, [
        ...(loja.precos.get(observacao.productId) ?? []),
        observacao.unitPriceCents,
      ]);
      porLoja.set(observacao.store.id, loja);
    }

    const quantidadePorProduto = new Map(
      itens
        .filter((item) => item.productId)
        .map((item) => [item.productId!, Number(item.quantity) || 1] as const),
    );

    const candidatas = [...porLoja.values()]
      .map((loja) => {
        let total = 0;
        let cobertos = 0;

        for (const [productId, precos] of loja.precos) {
          total += mediaAparada(precos) * (quantidadePorProduto.get(productId) ?? 1);
          cobertos += 1;
        }

        return {
          storeId: loja.storeId,
          name: loja.name,
          totalCents: Math.round(total),
          coveredItems: cobertos,
          totalItems: produtos.length,
        };
      })
      .filter((loja) => loja.coveredItems >= Math.ceil(produtos.length / 2));

    if (candidatas.length === 0) return null;

    return candidatas.sort((a, b) => a.totalCents - b.totalCents)[0] ?? null;
  }

  async acrescentar(
    userId: string,
    dados: { productId?: string; label: string; quantity?: number },
  ) {
    const lista = await this.listaAtual(userId);

    const ultimo = await this.prisma.shoppingListItem.findFirst({
      where: { listId: lista.id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const estimado = dados.productId
      ? await this.precoEstimado(userId, dados.productId)
      : null;

    return this.prisma.shoppingListItem.create({
      data: {
        listId: lista.id,
        productId: dados.productId ?? null,
        label: dados.label,
        quantity: dados.quantity ?? 1,
        estimatedCents: estimado === null ? null : Math.round(estimado * (dados.quantity ?? 1)),
        position: (ultimo?.position ?? 0) + 1,
      },
    });
  }

  async alterar(
    userId: string,
    itemId: string,
    mudanca: { checked?: boolean; quantity?: number },
  ) {
    // Confere o dono pelo caminho item → lista → usuário: sem isso, qualquer
    // pessoa alteraria a lista de outra sabendo um id.
    const item = await this.prisma.shoppingListItem.findFirst({
      where: { id: itemId, list: { userId } },
      select: { id: true, productId: true, estimatedCents: true, quantity: true },
    });
    if (!item) return null;

    const dados: { checked?: boolean; quantity?: number; estimatedCents?: number | null } = {};
    if (mudanca.checked !== undefined) dados.checked = mudanca.checked;

    if (mudanca.quantity !== undefined) {
      dados.quantity = mudanca.quantity;
      // A estimativa acompanha a quantidade: deixá-la parada faria o total da
      // tela divergir do que a pessoa acabou de mudar.
      const unitario =
        Number(item.quantity) > 0 && item.estimatedCents
          ? item.estimatedCents / Number(item.quantity)
          : null;
      if (unitario) dados.estimatedCents = Math.round(unitario * mudanca.quantity);
    }

    return this.prisma.shoppingListItem.update({ where: { id: item.id }, data: dados });
  }

  async remover(userId: string, itemId: string): Promise<void> {
    await this.prisma.shoppingListItem.deleteMany({
      where: { id: itemId, list: { userId } },
    });
  }

  /** "Repetir itens na lista", a partir de uma nota. */
  async apartirDaNota(userId: string, receiptId: string) {
    const nota = await this.prisma.receipt.findFirst({
      where: { id: receiptId, userId, status: 'DONE' },
      select: {
        items: {
          select: {
            productId: true,
            rawDescription: true,
            quantity: true,
            unitPriceCents: true,
            product: { select: { displayName: true } },
          },
        },
      },
    });
    if (!nota) return null;

    const lista = await this.listaAtual(userId);

    const jaNaLista = new Set(
      (
        await this.prisma.shoppingListItem.findMany({
          where: { listId: lista.id },
          select: { productId: true },
        })
      )
        .map((item) => item.productId)
        .filter(Boolean),
    );

    // Não duplica o que já está lá: repetir a nota duas vezes não pode gerar
    // dois cafés na lista.
    const novos = nota.items.filter((item) => !item.productId || !jaNaLista.has(item.productId));

    await this.prisma.shoppingListItem.createMany({
      data: novos.map((item, indice) => ({
        listId: lista.id,
        productId: item.productId,
        label: item.product?.displayName ?? item.rawDescription,
        quantity: item.quantity,
        estimatedCents: Math.round(item.unitPriceCents * Number(item.quantity)),
        position: 1000 + indice,
      })),
    });

    return { added: novos.length, skipped: nota.items.length - novos.length };
  }

  /**
   * Sugestão de recompra.
   *
   * O intervalo é a mediana entre compras do mesmo produto, não a média: uma
   * compra esquecida de três meses atrás puxaria a média e o app avisaria
   * tarde demais. Precisa de pelo menos 3 compras para ter intervalo.
   */
  async sugestoes(userId: string) {
    const compras = await this.prisma.receiptItem.findMany({
      where: { receipt: { userId, status: 'DONE' }, productId: { not: null } },
      select: {
        productId: true,
        unitPriceCents: true,
        quantity: true,
        receipt: { select: { issuedAt: true } },
        product: { select: { displayName: true } },
      },
      orderBy: { receipt: { issuedAt: 'asc' } },
    });

    const porProduto = new Map<
      string,
      { nome: string; datas: Date[]; ultimoPreco: number; quantidade: number }
    >();

    for (const compra of compras) {
      if (!compra.productId || !compra.receipt.issuedAt) continue;
      const atual = porProduto.get(compra.productId) ?? {
        nome: compra.product?.displayName ?? 'Produto',
        datas: [],
        ultimoPreco: compra.unitPriceCents,
        quantidade: Number(compra.quantity),
      };
      atual.datas.push(compra.receipt.issuedAt);
      atual.ultimoPreco = compra.unitPriceCents;
      atual.quantidade = Number(compra.quantity);
      porProduto.set(compra.productId, atual);
    }

    const lista = await this.listaAtual(userId);
    const jaNaLista = new Set(
      (
        await this.prisma.shoppingListItem.findMany({
          where: { listId: lista.id },
          select: { productId: true },
        })
      ).map((item) => item.productId),
    );

    const sugestoes = [];

    for (const [productId, dados] of porProduto) {
      if (jaNaLista.has(productId)) continue;
      if (dados.datas.length < 3) continue;

      const intervalos: number[] = [];
      for (let i = 1; i < dados.datas.length; i++) {
        const dias = Math.round(
          (dados.datas[i]!.getTime() - dados.datas[i - 1]!.getTime()) / (24 * 60 * 60 * 1000),
        );
        if (dias > 0) intervalos.push(dias);
      }
      if (intervalos.length === 0) continue;

      const ordenados = [...intervalos].sort((a, b) => a - b);
      const mediana = ordenados[Math.floor(ordenados.length / 2)]!;

      const diasDesdeAUltima = Math.round(
        (Date.now() - dados.datas.at(-1)!.getTime()) / (24 * 60 * 60 * 1000),
      );

      // Sugere quando já passou 80% do intervalo: avisar no dia exato chega
      // tarde para quem faz compra semanal.
      if (diasDesdeAUltima < mediana * 0.8) continue;

      sugestoes.push({
        productId,
        label: dados.nome,
        repurchaseDays: mediana,
        daysSinceLast: diasDesdeAUltima,
        estimatedCents: Math.round(dados.ultimoPreco * dados.quantidade),
        reason: `Você costuma comprar a cada ${mediana} dias.`,
      });
    }

    return sugestoes.sort((a, b) => b.daysSinceLast - a.daysSinceLast).slice(0, 6);
  }

  private async precoEstimado(userId: string, productId: string): Promise<number | null> {
    const ultima = await this.prisma.receiptItem.findFirst({
      where: { productId, receipt: { userId, status: 'DONE' } },
      orderBy: { receipt: { issuedAt: 'desc' } },
      select: { unitPriceCents: true },
    });
    return ultima?.unitPriceCents ?? null;
  }
}
