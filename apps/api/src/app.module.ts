import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module.js';
import { SaudeModule } from './modules/saude/saude.module.js';
import { EmailModule } from './modules/email/email.module.js';
import { JogoModule } from './modules/jogo/jogo.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ContaModule } from './modules/conta/conta.module.js';

/**
 * Módulo raiz. Os módulos de nota, preços, lista e ranking entram nas fases
 * seguintes — ver docs/11-ROADMAP-E-PROMPTS.md.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    // Teto global. Login, cadastro e leitura de nota apertam mais nos próprios
    // controllers (docs/09-SEGURANCA-LGPD.md).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    EmailModule,
    JogoModule,
    SaudeModule,
    AuthModule,
    ContaModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
