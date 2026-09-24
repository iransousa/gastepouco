import { Controller, ForbiddenException, Get, Logger, NotFoundException, Query } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { configuracao } from '../../comum/configuracao.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Atalhos de desenvolvimento. **Nunca existem em produção.**
 *
 * O problema que isto resolve: o código de 6 dígitos vai para o log da API em
 * desenvolvimento, e um teste de ponta a ponta não deveria depender de raspar
 * log de processo.
 *
 * O risco que isto cria, se vazar: quem chamar a rota entra em qualquer conta.
 * Por isso a defesa é em três camadas, não uma:
 *
 * 1. O módulo só é registrado fora de produção (`dev.module.ts`).
 * 2. O controller confere `NODE_ENV` a cada chamada, caso alguém registre o
 *    módulo sem querer.
 * 3. Fica fora do Swagger, para não virar documentação de como usar.
 *
 * Uma trava só seria uma linha de distância de um incidente.
 */
@ApiExcludeController()
@Controller('dev')
export class DevController {
  private readonly logger = new Logger(DevController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('codigo')
  async codigoDeVerificacao(@Query('email') email?: string): Promise<{ code: string }> {
    if (configuracao.ehProducao) {
      this.logger.error('Rota de desenvolvimento acessada em produção. Isso não deveria existir.');
      throw new ForbiddenException();
    }

    if (!email) throw new NotFoundException();

    const usuario = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    });
    if (!usuario) throw new NotFoundException();

    const guardado = await this.prisma.verificationCode.findFirst({
      where: { userId: usuario.id, kind: 'EMAIL' },
      orderBy: { createdAt: 'desc' },
      select: { codeHash: true },
    });
    if (!guardado) throw new NotFoundException();

    // O banco guarda só o hash — nem o atalho de desenvolvimento consegue
    // desfazê-lo. Achamos o código por força bruta no espaço de 6 dígitos, que
    // é pequeno de propósito para códigos descartáveis e caro o bastante para
    // não ser uma forma prática de atacar a API.
    const { createHash } = await import('node:crypto');
    for (let n = 0; n < 1_000_000; n++) {
      const tentativa = String(n).padStart(6, '0');
      if (createHash('sha256').update(tentativa).digest('hex') === guardado.codeHash) {
        return { code: tentativa };
      }
    }

    throw new NotFoundException();
  }
}
