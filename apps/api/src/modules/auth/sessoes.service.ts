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
 * - Rotação permite **detectar reutilização**: um refresh já queimado que
 *   reaparece enquanto a sessão que o substituiu está em uso significa duas
 *   partes com token na mão. Aí a resposta é revogar a família inteira de
 *   sessões daquela pessoa e obrigar login novo (docs/09-SEGURANCA-LGPD.md).
 *
 * Com uma exceção, descrita em `rotacionar`: se a sessão sucessora nunca foi
 * usada, o token novo não chegou ao cliente e quem voltou é o dono.
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
      const orfa = await this.sucessoraNaoUsada(sessao.successorId);

      if (!orfa) {
        // Token já queimado reaparecendo, e a sessão que o substituiu já foi
        // usada: há duas partes com token na mão.
        this.logger.warn('Refresh reutilizado; revogando todas as sessões do usuário.');
        await this.revogarTodas(sessao.userId);
        return null;
      }

      // O cliente nunca chegou a receber o token novo — a navegação cancelou a
      // renovação no meio, ou duas abas renovaram juntas e só uma resposta
      // chegou. Quem volta com o token antigo aqui é o dono, não um atacante:
      // reemitimos a partir da sessão órfã em vez de derrubar tudo.
      //
      // Isso não afrouxa a detecção de reutilização. Ela existe para o caso do
      // token roubado usado **em paralelo** com o legítimo — e aí a sessão
      // sucessora está em uso, que é exatamente o ramo de cima.
      this.logger.log('Renovação perdida; reemitindo a partir da sessão órfã.');
      return this.emitirNoLugarDe(orfa.id, sessao.user.id, sessao.user.email);
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

    return this.emitirNoLugarDe(sessao.id, sessao.user.id, sessao.user.email);
  }

  /**
   * Sessão que substituiu outra e nunca foi usada — sinal de que a resposta da
   * renovação se perdeu no caminho. Uma sessão sucessora já revogada quer
   * dizer que ela **foi** usada, e aí não há renovação perdida nenhuma.
   */
  private async sucessoraNaoUsada(successorId: string | null) {
    if (!successorId) return null;

    return this.prisma.session.findFirst({
      where: { id: successorId, revokedAt: null },
      select: { id: true },
    });
  }

  /** Queima a sessão e cria a substituta, ligando uma à outra. */
  private async emitirNoLugarDe(
    sessionId: string,
    userId: string,
    email: string,
  ): Promise<ParDeTokens> {
    const anterior = await this.prisma.session.findUniqueOrThrow({
      where: { id: sessionId },
      select: { deviceLabel: true, city: true },
    });

    const novoRefresh = randomBytes(48).toString('base64url');

    // Tudo na mesma transação: sem janela em que os dois valem ou nenhum vale.
    await this.prisma.$transaction(async (tx) => {
      const nova = await tx.session.create({
        data: {
          userId,
          refreshHash: this.hash(novoRefresh),
          deviceLabel: anterior.deviceLabel,
          city: anterior.city,
        },
        select: { id: true },
      });

      await tx.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date(), successorId: nova.id },
      });
    });

    return { access: await this.assinarAcesso(userId, email), refresh: novoRefresh };
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
