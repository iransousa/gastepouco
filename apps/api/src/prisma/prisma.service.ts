import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Cliente do banco como serviço do Nest, para os módulos injetarem.
 *
 * `log` não inclui `query` em produção: as consultas carregam e-mail, CEP e
 * chave de nota, e log é o lugar mais fácil de vazar dado pessoal sem
 * perceber (docs/09-SEGURANCA-LGPD.md).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
