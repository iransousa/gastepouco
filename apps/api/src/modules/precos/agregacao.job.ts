import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrecosService } from './precos.service.js';

/**
 * Recalcula os agregados de preço a cada 15 minutos
 * (docs/02-ARQUITETURA.md, "Jobs agendados").
 *
 * Recalcula só os últimos 2 dias. O passado distante não muda sozinho, e varrer
 * o histórico inteiro a cada quarto de hora seria carga constante no banco em
 * troca de nada.
 *
 * O job nunca deixa a exceção subir: um erro aqui derrubaria o agendador e o
 * app ficaria com preços velhos em silêncio, que é pior do que uma linha de
 * log vermelha.
 */
@Injectable()
export class AgregacaoDePrecosJob {
  private readonly logger = new Logger(AgregacaoDePrecosJob.name);
  private rodando = false;

  constructor(private readonly precos: PrecosService) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'prices:aggregate' })
  async agregar(): Promise<void> {
    // Uma execução por vez: com o banco lento, duas passadas simultâneas
    // disputariam os mesmos upserts.
    if (this.rodando) {
      this.logger.warn('Agregação anterior ainda rodando; pulando esta.');
      return;
    }

    this.rodando = true;
    const comecou = Date.now();

    try {
      const { dias, meses } = await this.precos.recalcular(2);
      this.logger.log(
        `Agregação em ${Date.now() - comecou}ms: ${dias} diários, ${meses} mensais.`,
      );
    } catch (falha) {
      this.logger.error(
        'Falha na agregação de preços.',
        falha instanceof Error ? falha.stack : String(falha),
      );
    } finally {
      this.rodando = false;
    }
  }
}
