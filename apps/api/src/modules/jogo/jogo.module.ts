import { Global, Module } from '@nestjs/common';
import { PontosService } from './pontos.service.js';

/**
 * Global porque quase todo módulo credita pontos: leitura de nota, perfil,
 * confirmação de oferta, convite. Injetar por import em cada um seria ruído.
 */
@Global()
@Module({ providers: [PontosService], exports: [PontosService] })
export class JogoModule {}
