import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { configuracao } from '../../comum/configuracao.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SessoesService } from './sessoes.service.js';
import { JwtEstrategia } from './estrategias/jwt.estrategia.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: configuracao.jwt.segredo,
      signOptions: { expiresIn: configuracao.jwt.validadeDoAcesso },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessoesService, JwtEstrategia],
  exports: [AuthService, SessoesService],
})
export class AuthModule {}
