import { Module } from '@nestjs/common';
import { PrecosController } from './precos.controller.js';
import { PrecosService } from './precos.service.js';
import { AlertasDePrecoService } from './alertas.service.js';
import { AgregacaoDePrecosJob } from './agregacao.job.js';

@Module({
  controllers: [PrecosController],
  providers: [PrecosService, AlertasDePrecoService, AgregacaoDePrecosJob],
  exports: [PrecosService, AlertasDePrecoService],
})
export class PrecosModule {}
