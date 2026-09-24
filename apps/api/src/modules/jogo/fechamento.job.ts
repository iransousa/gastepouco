import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { chaveDoMes } from '../../comum/tempo.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RankingService, type CategoriaDoRanking } from './ranking.service.js';
import { SelosService } from './selos.service.js';

const CATEGORIAS: CategoriaDoRanking[] = ['savings', 'purchases', 'points'];

/**
 * Fechamento do mês (docs/02-ARQUITETURA.md, "Jobs agendados").
 *
 * O ranking ao vivo é calculado a cada pedido — um ranking que só atualiza de
 * hora em hora frustra quem acabou de ler uma nota. Este job existe para outra
 * coisa: **congelar o mês**. No dia 1 às 00:05 grava o snapshot do mês anterior
 * como definitivo e concede o selo "Lenda do Mês" a quem ficou em primeiro.
 *
 * Sem o congelamento, o ranking de setembro mudaria em outubro se alguém
 * apagasse uma nota antiga — e um pódio que muda depois de anunciado não é
 * pódio.
 */
@Injectable()
export class FechamentoDoMesJob {
  private readonly logger = new Logger(FechamentoDoMesJob.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ranking: RankingService,
    private readonly selos: SelosService,
  ) {}

  @Cron('5 0 1 * *', { name: 'game:close-month' })
  async fecharMes(): Promise<void> {
    const agora = new Date();
    const anterior = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - 1, 1));
    const mes = chaveDoMes(anterior);

    try {
      const pessoas = await this.prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });

      for (const pessoa of pessoas) {
        for (const categoria of CATEGORIAS) {
          const { podium, rows } = await this.ranking.calcular(
            pessoa.id,
            'friends',
            categoria,
            mes,
          );
          await this.ranking.gravarSnapshot(
            `friends:${pessoa.id}`,
            categoria,
            mes,
            [...podium, ...rows],
            true,
          );
        }

        // "Lenda do Mês" lê o snapshot fechado, por isso vem depois dele.
        await this.selos.conferirEConceder(pessoa.id);
      }

      this.logger.log(`Mês ${mes} fechado para ${pessoas.length} pessoas.`);
    } catch (falha) {
      // Nunca deixar a exceção subir: ela derrubaria o agendador e os meses
      // seguintes parariam de fechar em silêncio.
      this.logger.error(
        `Falha ao fechar o mês ${mes}.`,
        falha instanceof Error ? falha.stack : String(falha),
      );
    }
  }

  /** Domingo às 18h: quem está prestes a perder a sequência. */
  @Cron('0 18 * * 0', { name: 'game:streak-risk' })
  async avisarSequenciaEmRisco(): Promise<void> {
    // O envio da notificação entra junto com o módulo de push, na fase 7.
    this.logger.log('Verificação de sequência em risco (envio na fase 7).');
    await Promise.resolve();
  }
}
