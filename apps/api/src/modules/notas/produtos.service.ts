import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ItemLido } from './adaptadores/adaptador.js';

/**
 * Casamento de produto: transformar a descrição da loja num produto do catálogo.
 *
 * Este é o ponto de que todo o resto do produto depende. "ARROZ TIPO 1 5KG",
 * "ARR TIPO1 5 KG" e "ARROZ T1 5KG" são o mesmo arroz; se virarem três
 * produtos, a média da região é calculada sobre nada e a tela de preços mente.
 *
 * A ordem é GTIN, depois alias já aprendido, depois descrição normalizada
 * (docs/02-ARQUITETURA.md):
 *
 * 1. **GTIN** quando a nota traz. É a única identificação sem ambiguidade.
 * 2. **Alias (loja + código interno)** já visto antes. A loja é consistente
 *    consigo mesma, então o código interno dela vale como identidade — depois
 *    que alguém confirmou uma vez.
 * 3. **Descrição normalizada.** Chute informado, e o vínculo fica guardado
 *    para não precisar refazer.
 *
 * O que este serviço **não** faz é adivinhar com confiança baixa. Quando a
 * normalização não basta, ele cria um produto novo em vez de juntar dois
 * diferentes: separar depois é fácil, desfazer uma fusão errada não é.
 */
@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normaliza a descrição para comparação.
   *
   * Tira acento, baixa a caixa, padroniza unidade ("500G" → "500 g") e colapsa
   * espaço. As unidades são o que mais varia entre lojas para o mesmo produto.
   */
  normalizar(descricao: string): string {
    return (descricao ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      // "5KG" → "5 kg", "500ML" → "500 ml", "1L" → "1 l"
      .replace(/(\d+)\s*(kg|g|ml|l|un|cx|pct)\b/gi, '$1 $2')
      .replace(/[^a-z0-9\s.,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /** Categoria por dicionário de palavras (docs/02-ARQUITETURA.md). */
  private readonly DICIONARIO: Array<[RegExp, string]> = [
    [/leite|queijo|iogurte|manteiga|requeij|creme de leite|nata|mussarela|presunto/, 'laticinios'],
    [/carne|frango|file|bife|linguic|peixe|salmao|costel|suin|bovin|picanha|alcatra|patinho/, 'carnes'],
    [/banana|maca|tomate|alface|cebola|batata|cenoura|fruta|verdura|legume|limao|mamao|uva|abacaxi|melancia|manga|brocolis|couve|pimentao|abobrinha|salsinha|laranja/, 'hortifruti'],
    [/pao|padaria|bolo|croissant|torrada|baguete|biscoito caseiro/, 'padaria'],
    [/detergente|sabao|amaciante|desinfetante|limpeza|papel higi|esponja|alvejante|cloro|agua sanitaria|saco de lixo|lustra/, 'limpeza'],
    [/sabonete|shampoo|condicionador|creme dental|escova de dente|fio dental|desodorante|absorvente|fralda|higiene/, 'higiene'],
    [/refrigerante|suco|cerveja|vinho|agua|bebida|energetico|whisky|vodka|gin|cha gelado|agua de coco/, 'bebidas'],
    [/arroz|feijao|macarrao|farinha|acucar|oleo|cafe|molho|sal |tempero|enlatado|atum|milho|ervilha|maionese|vinagre|azeite|leite condensado|achocolatado|margarina|biscoito/, 'mercearia'],
  ];

  categoriaProvavel(descricaoNormalizada: string): string {
    for (const [padrao, slug] of this.DICIONARIO) {
      if (padrao.test(descricaoNormalizada)) return slug;
    }
    return 'outros';
  }

  /** Acha ou cria o produto do item, e guarda o vínculo para a próxima vez. */
  async casar(item: ItemLido, cnpjDaLoja: string): Promise<string> {
    const normalizada = this.normalizar(item.rawDescription);

    // 1. GTIN — identificação sem ambiguidade.
    if (item.gtin) {
      const porGtin = await this.prisma.product.findUnique({
        where: { gtin: item.gtin },
        select: { id: true },
      });
      if (porGtin) {
        await this.guardarAlias(porGtin.id, cnpjDaLoja, item.storeCode, normalizada);
        return porGtin.id;
      }
    }

    // 2. Alias já aprendido para esta loja.
    if (item.storeCode) {
      const porAlias = await this.prisma.productAlias.findUnique({
        where: {
          storeCnpj_storeCode_rawDescriptionNormalized: {
            storeCnpj: cnpjDaLoja,
            storeCode: item.storeCode,
            rawDescriptionNormalized: normalizada,
          },
        },
        select: { productId: true },
      });
      if (porAlias) return porAlias.productId;
    }

    // 3. Descrição normalizada igual, entre produtos sem GTIN conflitante.
    const porDescricao = await this.prisma.product.findFirst({
      where: { normalizedName: normalizada },
      select: { id: true, gtin: true },
    });
    if (porDescricao && (!item.gtin || !porDescricao.gtin)) {
      // Nota com GTIN sobre produto que ainda não tinha: aproveita e completa.
      if (item.gtin && !porDescricao.gtin) {
        await this.prisma.product
          .update({ where: { id: porDescricao.id }, data: { gtin: item.gtin } })
          .catch(() => undefined);
      }
      await this.guardarAlias(porDescricao.id, cnpjDaLoja, item.storeCode, normalizada);
      return porDescricao.id;
    }

    // Nada casou: produto novo. Juntar errado é pior do que duplicar.
    const categoria = await this.prisma.category.findUnique({
      where: { slug: this.categoriaProvavel(normalizada) },
      select: { id: true },
    });

    const novo = await this.prisma.product.create({
      data: {
        gtin: item.gtin ?? null,
        normalizedName: normalizada,
        displayName: this.nomeApresentavel(item.rawDescription),
        categoryId: categoria?.id ?? null,
      },
      select: { id: true },
    });

    await this.guardarAlias(novo.id, cnpjDaLoja, item.storeCode, normalizada);
    return novo.id;
  }

  private async guardarAlias(
    productId: string,
    storeCnpj: string,
    storeCode: string | undefined,
    rawDescriptionNormalized: string,
  ): Promise<void> {
    await this.prisma.productAlias
      .create({
        data: { productId, storeCnpj, storeCode: storeCode ?? null, rawDescriptionNormalized },
      })
      // Já existia: é exatamente o que queríamos.
      .catch(() => undefined);
  }

  /** "ARROZ TIPO 1 5KG" → "Arroz tipo 1 5kg" — a nota vem toda em maiúsculas. */
  private nomeApresentavel(bruto: string): string {
    const limpo = (bruto ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    return limpo.charAt(0).toUpperCase() + limpo.slice(1);
  }
}
