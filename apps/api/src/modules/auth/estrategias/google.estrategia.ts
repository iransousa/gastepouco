import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';
import { configuracao } from '../../../comum/configuracao.js';
import { EstadoEmCookie } from './estado-em-cookie.js';

export interface PerfilDoGoogle {
  providerAccountId: string;
  email: string;
  name: string;
}

/**
 * Google OAuth 2.0 com PKCE e `state`.
 *
 * `state` é o que impede CSRF no retorno: sem ele, um atacante consegue fazer o
 * navegador da vítima completar um fluxo que ele começou, ligando a conta dela
 * ao Google dele. PKCE cobre a interceptação do código de autorização
 * (docs/09-SEGURANCA-LGPD.md).
 *
 * Só pedimos `profile` e `email`. Escopo a mais é dado que a gente teria de
 * guardar, justificar e proteger sem precisar.
 */
@Injectable()
export class GoogleEstrategia extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleEstrategia.name);

  constructor() {
    super({
      clientID: configuracao.google.clientId || 'nao-configurado',
      clientSecret: configuracao.google.clientSecret || 'nao-configurado',
      callbackURL: configuracao.google.callbackUrl,
      scope: ['profile', 'email'],
      pkce: true,
      // `state: true` usaria `req.session`, que esta API não tem. O estado vai
      // num cookie assinado — ver estado-em-cookie.ts.
      store: new EstadoEmCookie(),
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    perfil: Profile,
    concluir: VerifyCallback,
  ): void {
    const email = perfil.emails?.[0]?.value;

    if (!email) {
      // Sem e-mail não dá para ligar a conta nem avisar a pessoa de nada.
      this.logger.warn('Perfil do Google veio sem e-mail.');
      concluir(new Error('EMAIL_AUSENTE'), false);
      return;
    }

    const dados: PerfilDoGoogle = {
      providerAccountId: perfil.id,
      email,
      name: perfil.displayName || email.split('@')[0] || 'Pessoa',
    };

    concluir(null, dados);
  }
}
