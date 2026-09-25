import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { configuracao } from '../../comum/configuracao.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SessoesService } from './sessoes.service.js';
import { JwtEstrategia } from './estrategias/jwt.estrategia.js';
import { GoogleEstrategia } from './estrategias/google.estrategia.js';
import { GoogleConfiguradoGuarda } from './guardas/google-configurado.guarda.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: configuracao.jwt.segredo,
      signOptions: { expiresIn: configuracao.jwt.validadeDoAcesso },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessoesService,
    JwtEstrategia,
    GoogleConfiguradoGuarda,
    // Sem credenciais do Google a estratégia derruba o boot ao registrar.
    // Em desenvolvimento isso impediria de subir a API sem uma conta no
    // Google Cloud, então ela só entra quando está configurada. Até lá, quem
    // chama /auth/google recebe 503 com texto claro, pelo GoogleConfiguradoGuarda.
    ...(configuracao.google.configurado ? [GoogleEstrategia] : []),
  ],
  exports: [AuthService, SessoesService],
})
export class AuthModule {}
