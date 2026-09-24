import { Module } from '@nestjs/common';
import { ContaModule } from '../conta/conta.module.js';
import { NotificacoesController } from './notificacoes.controller.js';
import { NotificacoesService } from './notificacoes.service.js';

@Module({
  imports: [ContaModule],
  controllers: [NotificacoesController],
  providers: [NotificacoesService],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
