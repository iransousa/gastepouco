import { Injectable, Logger } from '@nestjs/common';
import { PONTOS } from '@gastemenos/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PontosService } from './pontos.service.js';

/**
 * Sequência semanal: 40 pontos por semana com pelo menos uma nota
 * (docs/07-GAMIFICACAO.md).
 *
 * A semana é de segunda a domingo **no fuso de Brasília**, creditada no
 * domingo às 23:59. O fuso importa: uma compra no domingo às 22h em Brasília é
 * segunda-feira em UTC, e cairia na semana errada — a pessoa perderia a
 * sequência por causa de um detalhe que ela não tem como ver.
 */
@Injectable()
export class SequenciaService {
  private readonly logger = new Logger(SequenciaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pontos: PontosService,
  ) {}

  /** "2026-W39" — ano e semana ISO da data, no fuso de Brasília. */
  chaveDaSemana(quando: Date): string {
    // Brasília é UTC-3 o ano todo desde 2019.
    const brasilia = new Date(quando.getTime() - 3 * 60 * 60 * 1000);

    const alvo = new Date(
      Date.UTC(brasilia.getUTCFullYear(), brasilia.getUTCMonth(), brasilia.getUTCDate()),
    );
    // Quinta-feira da mesma semana define o ano ISO.
    const diaDaSemana = (alvo.getUTCDay() + 6) % 7;
    alvo.setUTCDate(alvo.getUTCDate() - diaDaSemana + 3);

    const primeiraQuinta = new Date(Date.UTC(alvo.getUTCFullYear(), 0, 4));
    const diasAteAQuinta = (primeiraQuinta.getUTCDay() + 6) % 7;
    primeiraQuinta.setUTCDate(primeiraQuinta.getUTCDate() - diasAteAQuinta + 3);

    const semana =
      1 + Math.round((alvo.getTime() - primeiraQuinta.getTime()) / (7 * 24 * 60 * 60 * 1000));

    return `${alvo.getUTCFullYear()}-W${String(semana).padStart(2, '0')}`;
  }

  /** Credita a semana de quem leu nota. Idempotente pelo refId. */
  async creditarSemana(userId: string, quando = new Date()): Promise<boolean> {
    const chave = this.chaveDaSemana(quando);
    const { creditado } = await this.pontos.creditar(
      userId,
      PONTOS.SEMANA_COM_NOTA,
      'WEEK_STREAK',
      chave,
    );
    return creditado;
  }
}
