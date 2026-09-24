import { Global, Module } from '@nestjs/common';
import { ArmazenamentoService } from './armazenamento.service.js';

/** Global porque qualquer módulo que gere arquivo vai precisar do mesmo destino. */
@Global()
@Module({
  providers: [ArmazenamentoService],
  exports: [ArmazenamentoService],
})
export class ArmazenamentoModule {}
