import { Module } from '@nestjs/common';
import { ContaController } from './conta.controller.js';
import { ContaService } from './conta.service.js';

@Module({ controllers: [ContaController], providers: [ContaService], exports: [ContaService] })
export class ContaModule {}
