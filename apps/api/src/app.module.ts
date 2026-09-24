import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module.js';
import { SaudeModule } from './modules/saude/saude.module.js';

/**
 * Módulo raiz. Os módulos de negócio (auth, receipts, prices, game...) entram
 * aqui nas fases seguintes — ver docs/11-ROADMAP-E-PROMPTS.md.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    // Teto global. Login, cadastro e leitura de nota apertam mais nos próprios
    // módulos (docs/09-SEGURANCA-LGPD.md).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    SaudeModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
