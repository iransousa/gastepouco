import { InjectQueue } from '@nestjs/bullmq';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Queue } from 'bullmq';
import { Observable, interval, map, startWith, switchMap, takeWhile } from 'rxjs';
import { erro, extrairChaveDaUrl, lerChaveDeAcesso } from '@gastemenos/shared';
import { UsuarioAtual, type UsuarioAutenticado } from '../../comum/usuario-atual.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { JwtGuarda } from '../auth/guardas/jwt.guarda.js';
import { PontosService } from '../jogo/pontos.service.js';
import { NotasService } from './notas.service.js';
import { FILA_DE_NOTAS, type TarefaDeLeitura } from './notas.processador.js';
import { RegistrarNotaDto } from './dto/notas.dto.js';

@ApiTags('notas')
@ApiBearerAuth()
@Controller('receipts')
@UseGuards(JwtGuarda)
export class NotasController {
  constructor(
    private readonly notas: NotasService,
    private readonly prisma: PrismaService,
    private readonly pontos: PontosService,
    @InjectQueue(FILA_DE_NOTAS) private readonly fila: Queue<TarefaDeLeitura>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  // Ler nota é a ação mais cara do sistema: cada uma vira uma visita ao portal
  // da SEFAZ. 30/hora cobre com folga quem chegou do mercado com a semana toda.
  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
  @ApiOperation({
    summary: 'Enfileira a leitura de uma nota',
    description: 'Responde 202 com o id; acompanhe por GET /receipts/:id ou pelo SSE.',
  })
  async registrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dados: RegistrarNotaDto) {
    const nota = await this.notas.registrar(usuario.id, {
      qrUrl: dados.qrUrl,
      accessKey: dados.accessKey,
      source: dados.source ?? 'qr',
    });

    const leitura = dados.qrUrl
      ? extrairChaveDaUrl(dados.qrUrl)
      : lerChaveDeAcesso(dados.accessKey ?? '');
    if (!leitura.ok) throw new HttpException(erro(leitura.code), HttpStatus.BAD_REQUEST);

    await this.fila.add(
      'ler',
      { notaId: nota.id, chave: leitura.chave.valor, qrUrl: dados.qrUrl },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        // Falha fica na fila para a equipe olhar; é daí que sai a correção do
        // parser quando um portal muda.
        removeOnFail: false,
      },
    );

    return nota;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Estado da leitura e, quando pronta, o resultado' })
  async porId(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.detalhe(usuario.id, id);
  }

  /**
   * Acompanhamento em tempo real.
   *
   * Consulta o banco a cada 1,5 s e fecha assim que a nota sai de PENDING ou
   * ao chegar aos 30 s — o mesmo teto do polling em docs/02-ARQUITETURA.md.
   * Sem esse limite, uma aba esquecida aberta seguraria uma conexão para
   * sempre.
   */
  @Sse(':id/events')
  @ApiOperation({ summary: 'Mudanças de estado da leitura (SSE)' })
  eventos(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
  ): Observable<{ data: string }> {
    const MAXIMO_DE_CICLOS = 20; // 20 × 1,5 s = 30 s

    let ciclos = 0;

    return interval(1500).pipe(
      startWith(0),
      switchMap(() => this.detalhe(usuario.id, id)),
      takeWhile((nota) => {
        ciclos += 1;
        return nota.status === 'PENDING' && ciclos <= MAXIMO_DE_CICLOS;
      }, true),
      map((nota) => ({ data: JSON.stringify(nota) })),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Notas do mês, da mais recente para a mais antiga' })
  async listar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('month') mes?: string,
    @Query('limit') limite?: number,
  ) {
    const filtro: Record<string, unknown> = { userId: usuario.id, status: 'DONE' };

    if (mes && /^\d{4}-\d{2}$/.test(mes)) {
      const [ano, m] = mes.split('-').map(Number);
      filtro.issuedAt = {
        gte: new Date(Date.UTC(ano!, m! - 1, 1)),
        lt: new Date(Date.UTC(ano!, m!, 1)),
      };
    }

    const notas = await this.prisma.receipt.findMany({
      where: filtro,
      orderBy: { issuedAt: 'desc' },
      take: Math.min(Number(limite) || 30, 100),
      select: {
        id: true,
        issuedAt: true,
        totalCents: true,
        savingsCents: true,
        pointsAwarded: true,
        store: { select: { name: true, city: true } },
        _count: { select: { items: true } },
      },
    });

    return notas.map((nota) => ({
      id: nota.id,
      issuedAt: nota.issuedAt,
      totalCents: nota.totalCents,
      savingsCents: nota.savingsCents,
      pointsAwarded: nota.pointsAwarded,
      storeName: nota.store?.name ?? 'Loja não identificada',
      itemCount: nota._count.items,
    }));
  }

  /**
   * Excluir a nota estorna os pontos.
   *
   * Sem o estorno, dava para ler uma nota, ganhar 60 pontos, apagar e repetir.
   * O estorno é um lançamento negativo no livro-razão, não um `delete` — a
   * história continua auditável (docs/07-GAMIFICACAO.md).
   *
   * As observações de preço saem junto com os itens, por cascade: o preço
   * daquela compra deixa de contar na média da região.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui a nota e estorna os pontos' })
  async excluir(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
  ): Promise<void> {
    const nota = await this.prisma.receipt.findFirst({
      where: { id, userId: usuario.id },
      select: { id: true, pointsAwarded: true },
    });
    if (!nota) throw new HttpException(erro('NOT_FOUND'), HttpStatus.NOT_FOUND);

    if (nota.pointsAwarded > 0) {
      await this.pontos.estornar(usuario.id, nota.pointsAwarded, nota.id);
    }

    await this.prisma.receipt.delete({ where: { id: nota.id } });
  }

  private async detalhe(userId: string, id: string) {
    const nota = await this.prisma.receipt.findFirst({
      where: { id, userId },
      select: {
        id: true,
        status: true,
        failureReason: true,
        issuedAt: true,
        totalCents: true,
        savingsCents: true,
        pointsAwarded: true,
        store: { select: { name: true, city: true, uf: true } },
        items: {
          select: {
            id: true,
            rawDescription: true,
            quantity: true,
            unit: true,
            unitPriceCents: true,
            totalCents: true,
            regionAvgCents: true,
            product: { select: { id: true, displayName: true } },
          },
        },
      },
    });

    if (!nota) throw new HttpException(erro('NOT_FOUND'), HttpStatus.NOT_FOUND);

    return {
      id: nota.id,
      status: nota.status,
      failureReason: nota.failureReason,
      issuedAt: nota.issuedAt,
      totalCents: nota.totalCents,
      savingsCents: nota.savingsCents,
      pointsAwarded: nota.pointsAwarded,
      storeName: nota.store?.name ?? null,
      items: nota.items.map((item) => ({
        id: item.id,
        productId: item.product?.id ?? null,
        name: item.product?.displayName ?? item.rawDescription,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPriceCents: item.unitPriceCents,
        totalCents: item.totalCents,
        regionAvgCents: item.regionAvgCents,
      })),
    };
  }
}
