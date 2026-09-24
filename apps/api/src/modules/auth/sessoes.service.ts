import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { configuracao } from '../../comum/configuracao.js';
import { emDias } from '../../comum/tempo.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface ParDeTokens {
  access: string;
  refresh: string;
}

/**
 * Sessões: um par de tokens por aparelho.
 *
 * O access token é curto (15 min) e viaja no header. O refresh é longo, vai em
 * cookie httpOnly e é **rotativo**: cada uso queima o anterior e emite outro.
 *
 * Por que rotativo, e por que guardamos só o hash:
 *
 * - Guardar o refresh em claro significaria que um vazamento do banco entrega
 *   as sessões de todo mundo. O hash não serve para entrar.
 * - Rotação permite **detectar reutilização**: se um refresh já queimado
 *   aparecer de novo, ou é um atacante com uma cópia antiga, ou o dono
 *   perdendo corrida com ele. Nos dois casos a resposta certa é a mesma —
 *   revogar a família inteira de sessões daquela pessoa e obrigar login novo
 *   (docs/09-SEGURANCA-LGPD.md).
 */
@Injectable()
export class SessoesService {
  private readonly logger = new Logger(SessoesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async criar(
    userId: string,
    email: string,
    aparelho: string,
    cidade?: string,
  ): Promise<ParDeTokens> {
    const refresh = randomBytes(48).toString('base64url');

    await this.prisma.session.create({
      data: {
        userId,
        refreshHash: this.hash(refresh),
        deviceLabel: aparelho,
        city: cidade ?? null,
      },
    });

    return { access: await this.assinarAcesso(userId, email), refresh };
  }

  /** Troca o refresh por um par novo. Reutilização derruba todas as sessões. */
  async rotacionar(refresh: string): Promise<ParDeTokens | null> {
    const hash = this.hash(refresh);
    const sessao = await this.prisma.session.findUnique({
      where: { refreshHash: hash },
      include: { user: { select: { id: true, email: true, status: true } } },
    });

    if (!sessao) return null;

    if (sessao.revokedAt) {
      // Token já queimado reaparecendo: alguém está com uma cópia.
      this.logger.warn('Refresh reutilizado; revogando todas as sessões do usuário.');
      await this.revogarTodas(sessao.userId);
      return null;
    }

    const venceuEm = emDias(-configuracao.jwt.validadeDoRefreshEmDias);
    if (sessao.createdAt < venceuEm) {
      await this.prisma.session.update({
        where: { id: sessao.id },
        data: { revokedAt: new Date() },
      });
      return null;
    }

    if (sessao.user.status === 'PENDING_DELETION') {
      // Entrar de novo cancela a exclusão — quem cuida disso é o módulo de
      // conta; aqui só não impedimos a sessão.
      this.logger.log('Sessão renovada para conta com exclusão agendada.');
    }

    const novoRefresh = randomBytes(48).toString('base64url');

    // Queima o antigo e cria o novo na mesma transação: sem janela em que os
    // dois valem ou nenhum vale.
    await this.prisma.$transaction([
      this.prisma.session.update({
        where: { id: sessao.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.session.create({
        data: {
          userId: sessao.userId,
          refreshHash: this.hash(novoRefresh),
          deviceLabel: sessao.deviceLabel,
          city: sessao.city,
        },
      }),
    ]);

    return {
      access: await this.assinarAcesso(sessao.user.id, sessao.user.email),
      refresh: novoRefresh,
    };
  }

  async revogar(refresh: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { refreshHash: this.hash(refresh), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revogarTodas(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revogarUma(userId: string, sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async listarAparelhos(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      select: { id: true, deviceLabel: true, city: true, lastSeenAt: true, createdAt: true },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  private async assinarAcesso(sub: string, email: string): Promise<string> {
    return this.jwt.signAsync(
      { sub, email },
      { secret: configuracao.jwt.segredo, expiresIn: configuracao.jwt.validadeDoAcesso },
    );
  }
}
