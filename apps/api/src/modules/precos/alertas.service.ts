import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Alertas de preço.
 *
 * Um alerta por pessoa e produto: dois alertas do mesmo café só gerariam duas
 * notificações iguais. Criar de novo atualiza o alvo em vez de duplicar.
 */
@Injectable()
export class AlertasDePrecoService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(userId: string, productId: string, targetCents?: number) {
    const existente = await this.prisma.priceAlert.findFirst({
      where: { userId, productId },
      select: { id: true },
    });

    if (existente) {
      return this.prisma.priceAlert.update({
        where: { id: existente.id },
        data: { targetCents: targetCents ?? null },
      });
    }

    return this.prisma.priceAlert.create({
      data: { userId, productId, targetCents: targetCents ?? null },
    });
  }

  async remover(userId: string, productId: string): Promise<void> {
    await this.prisma.priceAlert.deleteMany({ where: { userId, productId } });
  }

  async listar(userId: string) {
    return this.prisma.priceAlert.findMany({
      where: { userId },
      select: {
        id: true,
        targetCents: true,
        product: { select: { id: true, displayName: true } },
      },
    });
  }
}
