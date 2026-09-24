import { Injectable, Logger } from '@nestjs/common';
import { SELOS } from '@gastemenos/shared';
import { chaveDoMes } from '../../comum/tempo.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Os 9 selos (docs/07-GAMIFICACAO.md).
 *
 * O progresso é **recalculado**, não incrementado. Um contador que só sobe
 * mentiria quando a pessoa exclui uma nota: ela veria 15/15 no "Carrinho
 * Esperto" com 14 notas no histórico, e não teria como corrigir isso sem
 * mexer no banco à mão.
 *
 * Selo conquistado não se perde. `unlockedAt` fica gravado: quem leu 15 notas
 * em setembro merece o selo mesmo que depois apague uma — o que se perde é o
 * progresso corrente, não a conquista.
 */

const ID_NO_BANCO: Record<string, string> = Object.fromEntries(
  SELOS.map((selo) => [selo.slug, selo.slug.replace(/-/g, '_')]),
);

export interface SeloComProgresso {
  id: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  unlocked: boolean;
  unlockedAt: Date | null;
}

@Injectable()
export class SelosService {
  private readonly logger = new Logger(SelosService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Progresso atual de cada selo, calculado dos dados de verdade. */
  async progressoDe(userId: string): Promise<Map<string, number>> {
    const mes = chaveDoMes();
    const [ano, m] = mes.split('-').map(Number);
    const inicioDoMes = new Date(Date.UTC(ano!, m! - 1, 1));
    const fimDoMes = new Date(Date.UTC(ano!, m!, 1));

    const [
      totalDeNotas,
      notasDoMes,
      lojasDistintas,
      economiaDoMes,
      confirmacoes,
      semanas,
      convidados,
      primeirosLugares,
    ] = await Promise.all([
      this.prisma.receipt.count({ where: { userId, status: 'DONE' } }),
      this.prisma.receipt.count({
        where: { userId, status: 'DONE', issuedAt: { gte: inicioDoMes, lt: fimDoMes } },
      }),
      this.prisma.receipt.findMany({
        where: { userId, status: 'DONE', storeId: { not: null } },
        select: { storeId: true },
        distinct: ['storeId'],
      }),
      this.prisma.receipt.aggregate({
        where: { userId, status: 'DONE', issuedAt: { gte: inicioDoMes, lt: fimDoMes } },
        _sum: { savingsCents: true },
      }),
      this.prisma.pointsLedger.count({ where: { userId, reason: 'OFFER_CONFIRM' } }),
      this.prisma.pointsLedger.count({ where: { userId, reason: 'WEEK_STREAK' } }),
      this.prisma.pointsLedger.count({ where: { userId, reason: 'INVITE' } }),
      this.prisma.rankingSnapshot.count({
        where: { closed: true, entries: { array_contains: [{ userId, rank: 1 }] } },
      }),
    ]);

    return new Map<string, number>([
      ['primeira-nota', Math.min(totalDeNotas, 1)],
      ['carrinho-esperto', notasDoMes],
      ['em-chamas', semanas],
      ['explorador', lojasDistintas.length],
      ['cem-reais-salvos', Math.max(economiaDoMes._sum.savingsCents ?? 0, 0)],
      // Produtos comprados em oferta: entra na fase de ofertas confirmadas.
      ['cacador-de-promocoes', 0],
      ['detetive-de-precos', confirmacoes],
      ['embaixador', convidados],
      ['lenda-do-mes', primeirosLugares],
    ]);
  }

  async listar(userId: string): Promise<SeloComProgresso[]> {
    const progresso = await this.progressoDe(userId);

    const conquistados = await this.prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true, unlockedAt: true },
    });
    const porId = new Map(conquistados.map((c) => [c.badgeId, c.unlockedAt]));

    return SELOS.map((selo) => {
      const idNoBanco = ID_NO_BANCO[selo.slug]!;
      const atual = progresso.get(selo.slug) ?? 0;
      const conquistadoEm = porId.get(idNoBanco) ?? null;

      return {
        id: idNoBanco,
        name: selo.nome,
        description: selo.comoGanhar,
        target: selo.meta,
        // O progresso não passa da meta: "18/15" confunde mais do que informa.
        progress: Math.min(atual, selo.meta),
        unlocked: conquistadoEm !== null,
        unlockedAt: conquistadoEm,
      };
    });
  }

  /**
   * Confere e concede o que foi alcançado. Devolve só o que é novidade, para
   * a tela poder comemorar sem repetir a comemoração a cada visita.
   */
  async conferirEConceder(userId: string): Promise<SeloComProgresso[]> {
    const progresso = await this.progressoDe(userId);

    const jaTem = new Set(
      (
        await this.prisma.userBadge.findMany({
          where: { userId, unlockedAt: { not: null } },
          select: { badgeId: true },
        })
      ).map((linha) => linha.badgeId),
    );

    const novos: SeloComProgresso[] = [];

    for (const selo of SELOS) {
      const idNoBanco = ID_NO_BANCO[selo.slug]!;
      const atual = progresso.get(selo.slug) ?? 0;

      // Grava o progresso mesmo sem conquista: é o "6/10" da tela.
      await this.prisma.userBadge.upsert({
        where: { userId_badgeId: { userId, badgeId: idNoBanco } },
        create: { userId, badgeId: idNoBanco, progress: Math.min(atual, selo.meta) },
        update: { progress: Math.min(atual, selo.meta) },
      });

      if (atual < selo.meta || jaTem.has(idNoBanco)) continue;

      const conquistadoEm = new Date();
      await this.prisma.userBadge.update({
        where: { userId_badgeId: { userId, badgeId: idNoBanco } },
        data: { unlockedAt: conquistadoEm },
      });

      novos.push({
        id: idNoBanco,
        name: selo.nome,
        description: selo.comoGanhar,
        target: selo.meta,
        progress: selo.meta,
        unlocked: true,
        unlockedAt: conquistadoEm,
      });
    }

    if (novos.length) {
      this.logger.log(`${novos.length} selo(s) concedido(s).`);
    }

    return novos;
  }
}
