import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createHmac } from 'node:crypto';
import { codificarGeohash } from '@gastemenos/shared';
import { configuracao } from '../../comum/configuracao.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RecompensasService } from '../recompensas/recompensas.service.js';
import { GeocodificacaoService } from './geocodificacao.service.js';

/** Quantas lojas por noite. O limite do Nominatim é 1 req/s — 200 leva ~7 min. */
const LOJAS_POR_NOITE = 200;

/**
 * Segunda chance para a loja que entrou sem região (docs/06-NFCE-LEITURA.md).
 *
 * A leitura da nota não pode esperar o Nominatim responder, e o Nominatim às
 * vezes não responde. Quando isso acontece, a loja fica sem `geohash` e a nota
 * **não vira observação de preço** — porque preço sem lugar certo é pior que
 * preço nenhum.
 *
 * Este job faz as duas metades do conserto:
 *
 * 1. tenta geocodificar de novo as lojas pendentes;
 * 2. **preenche as observações que faltaram** nas notas já lidas daquela loja.
 *
 * Sem a segunda metade a primeira não serviria para nada: a observação só é
 * criada no momento em que a nota é concluída, e esse momento já passou. Quem
 * leu a nota recupera o preço no agregado e o marco da recompensa — por isso o
 * job avalia os marcos das pessoas afetadas no fim, em vez de deixá-las
 * esperando a próxima noite.
 */
@Injectable()
export class GeocodificacaoJob {
  private readonly logger = new Logger(GeocodificacaoJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geocodificacao: GeocodificacaoService,
    private readonly recompensas: RecompensasService,
  ) {}

  @Cron('40 2 * * *', { name: 'stores:geocode-pending' })
  async geocodificarPendentes(): Promise<void> {
    try {
      const pendentes = await this.prisma.store.findMany({
        where: { geohash: null },
        select: { id: true, cnpj: true, address: true, city: true, uf: true },
        take: LOJAS_POR_NOITE,
        orderBy: { createdAt: 'asc' },
      });

      if (pendentes.length === 0) return;

      let resolvidas = 0;
      let observacoes = 0;
      const pessoas = new Set<string>();

      for (const loja of pendentes) {
        const ponto = await this.geocodificacao.coordenadasDe(loja);
        if (!ponto) continue;

        const geohash = codificarGeohash(ponto.lat, ponto.lng);
        await this.prisma.store.update({
          where: { id: loja.id },
          data: { lat: ponto.lat, lng: ponto.lng, geohash },
        });
        resolvidas += 1;

        const criadas = await this.preencherObservacoes(loja.id, geohash, pessoas);
        observacoes += criadas;
      }

      // O marco da recompensa conta nota que virou dado: as notas destas
      // pessoas acabaram de virar dado.
      for (const userId of pessoas) {
        await this.recompensas.avaliarMarcos(userId);
      }

      this.logger.log(
        `Geocodificação: ${resolvidas} de ${pendentes.length} loja(s) resolvida(s), ` +
          `${observacoes} observação(ões) preenchida(s), ${pessoas.size} pessoa(s) reavaliada(s).`,
      );
    } catch (falha) {
      // Exceção aqui derrubaria o agendador, e as noites seguintes passariam
      // em silêncio — igual ao fechamento do mês.
      this.logger.error(
        'Falha na varredura de geocodificação.',
        falha instanceof Error ? falha.stack : String(falha),
      );
    }
  }

  /**
   * Cria as observações de preço das notas já lidas nesta loja.
   *
   * O `userHash` é calculado do mesmo jeito que na leitura — HMAC do id, nunca
   * o id: a observação entra na base sem ligação com a pessoa, e é isso que
   * permite contar gente distinta sem identificar ninguém.
   *
   * O `@unique` de `receiptItemId` é a rede de segurança: rodar duas vezes não
   * duplica observação.
   */
  private async preencherObservacoes(
    storeId: string,
    geohash: string,
    pessoas: Set<string>,
  ): Promise<number> {
    const itens = await this.prisma.receiptItem.findMany({
      where: {
        productId: { not: null },
        observation: null,
        receipt: { storeId, status: 'DONE' },
      },
      select: {
        id: true,
        productId: true,
        unitPriceCents: true,
        receipt: { select: { userId: true, issuedAt: true } },
      },
    });

    let criadas = 0;

    for (const item of itens) {
      const observadoEm = item.receipt.issuedAt;
      if (!observadoEm) continue;

      const userHash = createHmac('sha256', configuracao.segredoDoHashDeUsuario)
        .update(item.receipt.userId)
        .digest('hex')
        .slice(0, 32);

      try {
        await this.prisma.priceObservation.create({
          data: {
            productId: item.productId!,
            storeId,
            receiptItemId: item.id,
            userHash,
            unitPriceCents: item.unitPriceCents,
            observedAt: observadoEm,
            geohash,
          },
        });
        criadas += 1;
        pessoas.add(item.receipt.userId);
      } catch (falha) {
        // P2002: já existe observação para este item. Nada a fazer.
        if ((falha as { code?: string }).code !== 'P2002') throw falha;
      }
    }

    return criadas;
  }
}
