import { Injectable, Logger } from '@nestjs/common';
import { LIMITES, PONTOS, situacaoDoNivel, type SituacaoDeNivel } from '@gastemenos/shared';
import { PrismaService } from '../../prisma/prisma.service.js';

export type MotivoDePontos =
  | 'WELCOME'
  | 'PROFILE'
  | 'RECEIPT'
  | 'NEW_STORE'
  | 'WEEK_STREAK'
  | 'OFFER_CONFIRM'
  | 'INVITE'
  | 'REVERSAL';

export interface SubidaDeNivel {
  from: number;
  to: number;
  name: string;
}

/**
 * Livro-razão de pontos.
 *
 * Só inserção: nada é editado nem apagado. Estorno é um lançamento negativo,
 * para o total continuar sendo a soma da história (docs/07-GAMIFICACAO.md).
 *
 * O `@@unique([userId, reason, refId])` do schema é o que impede crédito
 * duplo — duas leituras simultâneas da mesma nota batem na restrição do banco
 * em vez de creditarem 60 pontos duas vezes. Por isso `creditar` trata a
 * violação como "já creditado" e segue, em vez de estourar erro.
 */
@Injectable()
export class PontosService {
  private readonly logger = new Logger(PontosService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Credita e diz se subiu de nível.
   *
   * `refId` é a chave da ideia "este evento já foi pago": o id da nota, o
   * CNPJ da loja nova, a semana. Sem ele não dá para garantir unicidade.
   */
  async creditar(
    userId: string,
    amount: number,
    reason: MotivoDePontos,
    refId: string,
  ): Promise<{ creditado: boolean; levelUp: SubidaDeNivel | null }> {
    const antes = await this.total(userId);

    try {
      await this.prisma.pointsLedger.create({ data: { userId, amount, reason, refId } });
    } catch (erro) {
      // P2002 = violação de unicidade: o evento já foi creditado.
      if ((erro as { code?: string }).code === 'P2002') {
        return { creditado: false, levelUp: null };
      }
      throw erro;
    }

    const nivelAntes = situacaoDoNivel(antes);
    const nivelDepois = situacaoDoNivel(antes + amount);

    const levelUp =
      nivelDepois.nivel > nivelAntes.nivel
        ? { from: nivelAntes.nivel, to: nivelDepois.nivel, name: nivelDepois.nome }
        : null;

    if (levelUp) {
      this.logger.log(`Subiu para o nível ${levelUp.to} (${levelUp.name})`);
    }

    return { creditado: true, levelUp };
  }

  /** Estorno: lançamento negativo amarrado ao evento original. */
  async estornar(userId: string, amount: number, refId: string): Promise<void> {
    if (amount <= 0) return;
    await this.prisma.pointsLedger.create({
      data: { userId, amount: -amount, reason: 'REVERSAL', refId },
    });
  }

  async total(userId: string): Promise<number> {
    const soma = await this.prisma.pointsLedger.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    return soma._sum.amount ?? 0;
  }

  async situacao(userId: string): Promise<SituacaoDeNivel> {
    return situacaoDoNivel(await this.total(userId));
  }

  /**
   * Quantas notas com pontos a pessoa já leu hoje.
   *
   * O limite existe para impedir que alguém leia notas de terceiros em massa
   * só para subir no ranking. Passar do limite não recusa a nota: ela entra no
   * histórico sem pontos (docs/07-GAMIFICACAO.md).
   */
  async notasComPontosHoje(userId: string): Promise<number> {
    const inicioDoDia = new Date();
    inicioDoDia.setUTCHours(0, 0, 0, 0);

    return this.prisma.pointsLedger.count({
      where: { userId, reason: 'RECEIPT', createdAt: { gte: inicioDoDia } },
    });
  }

  async podeCreditarNota(userId: string): Promise<boolean> {
    return (await this.notasComPontosHoje(userId)) < LIMITES.NOTAS_COM_PONTOS_POR_DIA;
  }

  /** Pontos de boas-vindas, uma vez só, quando o e-mail é confirmado. */
  async darBoasVindas(userId: string): Promise<void> {
    await this.creditar(userId, PONTOS.BOAS_VINDAS, 'WELCOME', userId);
  }

  /** Pontos do perfil de consumo, uma vez só. Responder depois de pular vale. */
  async darPerfilCompleto(userId: string): Promise<boolean> {
    const { creditado } = await this.creditar(userId, PONTOS.PERFIL_COMPLETO, 'PROFILE', userId);
    return creditado;
  }
}
