import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrivacidadeModule } from '../privacidade/privacidade.module.js';
import { ContaController } from './conta.controller.js';
import { ContaService } from './conta.service.js';
import { DadosPessoaisService } from './dados-pessoais.service.js';
import { PreferenciasService } from './preferencias.service.js';

@Module({
  imports: [AuthModule, PrivacidadeModule],
  controllers: [ContaController],
  providers: [ContaService, DadosPessoaisService, PreferenciasService],
  exports: [ContaService, PreferenciasService],
})
export class ContaModule {}
