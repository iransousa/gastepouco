import { Global, Module } from '@nestjs/common';
import { PontosService } from './pontos.service.js';
import { SelosService } from './selos.service.js';
import { RankingService } from './ranking.service.js';
import { AmigosService } from './amigos.service.js';
import { SequenciaService } from './sequencia.service.js';
import { JogoController } from './jogo.controller.js';
import { FechamentoDoMesJob } from './fechamento.job.js';

/**
 * Global porque quase todo modulo credita pontos: leitura de nota, perfil,
 * confirmacao de oferta, convite. Injetar por import em cada um seria ruido.
 */
@Global()
@Module({
  controllers: [JogoController],
  providers: [
    PontosService,
    SelosService,
    RankingService,
    AmigosService,
    SequenciaService,
    FechamentoDoMesJob,
  ],
  exports: [PontosService, SelosService, RankingService, AmigosService, SequenciaService],
})
export class JogoModule {}
