import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LIMITES, PONTOS, erro } from '@gastemenos/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PontosService } from './pontos.service.js';

/**
 * Amigos por código de convite.
 *
 * O ponto do convite só é creditado **quando o convidado lê a primeira nota**
 * (docs/07-GAMIFICACAO.md). Creditar no cadastro transformaria o convite numa
 * fábrica de contas vazias; exigir a primeira nota amarra o prêmio ao que o
 * produto quer de fato, que é gente lendo nota.
 */
@Injectable()
export class AmigosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pontos: PontosService,
  ) {}

  async entrarComCodigo(userId: string, codigo: string) {
    const anfitriao = await this.prisma.user.findUnique({
      where: { inviteCode: codigo.trim().toUpperCase() },
      select: { id: true, rankingName: true },
    });

    if (!anfitriao) {
      throw new HttpException(
        { code: 'INVITE_NOT_FOUND', message: 'Não achamos esse código. Confira as letras.' },
        HttpStatus.NOT_FOUND,
      );
    }

    if (anfitriao.id === userId) {
      throw new HttpException(
        { code: 'INVITE_SELF', message: 'Esse é o seu próprio código.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const [a, b] = [userId, anfitriao.id].sort();

    const jaSaoAmigos = await this.prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId: a!, userBId: b! } },
      select: { userAId: true },
    });

    if (!jaSaoAmigos) {
      await this.prisma.friendship.create({ data: { userAId: a!, userBId: b! } });
      // Guarda quem convidou: é o que permite creditar o ponto quando a
      // primeira nota chegar.
      await this.prisma.user.update({
        where: { id: userId },
        data: { invitedById: anfitriao.id },
      });
    }

    return { friendName: anfitriao.rankingName, alreadyFriends: Boolean(jaSaoAmigos) };
  }

  /**
   * Chamado quando alguém conclui a primeira nota. Credita quem convidou.
   *
   * O teto de 20 por mês existe porque convite é a forma mais barata de somar
   * pontos sem usar o app.
   */
  async premiarQuemConvidou(userId: string): Promise<void> {
    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { invitedById: true },
    });
    if (!usuario?.invitedById) return;

    const notasLidas = await this.prisma.receipt.count({
      where: { userId, status: 'DONE' },
    });
    if (notasLidas !== 1) return;

    const inicioDoMes = new Date();
    inicioDoMes.setUTCDate(1);
    inicioDoMes.setUTCHours(0, 0, 0, 0);

    const conviteseste = await this.prisma.pointsLedger.count({
      where: { userId: usuario.invitedById, reason: 'INVITE', createdAt: { gte: inicioDoMes } },
    });
    if (conviteseste >= LIMITES.PONTOS_DE_CONVITE_POR_MES) return;

    await this.pontos.creditar(usuario.invitedById, PONTOS.AMIGO_CONVIDADO, 'INVITE', userId);
  }

  async listar(userId: string) {
    const amizades = await this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      select: {
        userA: { select: { id: true, rankingName: true, avatarUrl: true } },
        userB: { select: { id: true, rankingName: true, avatarUrl: true } },
      },
    });

    return amizades.map((amizade) =>
      amizade.userA.id === userId ? amizade.userB : amizade.userA,
    );
  }

  async meuCodigo(userId: string) {
    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { inviteCode: true },
    });
    if (!usuario) throw new HttpException(erro('NOT_FOUND'), HttpStatus.NOT_FOUND);
    return { inviteCode: usuario.inviteCode };
  }
}
