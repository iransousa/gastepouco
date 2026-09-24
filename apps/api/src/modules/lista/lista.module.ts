import { Module } from '@nestjs/common';
import { ListaController } from './lista.controller.js';
import { ListaService } from './lista.service.js';

@Module({ controllers: [ListaController], providers: [ListaService], exports: [ListaService] })
export class ListaModule {}
