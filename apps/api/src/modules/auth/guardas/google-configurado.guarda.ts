import { CanActivate, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { erro } from '@gastemenos/shared';
import { configuracao } from '../../../comum/configuracao.js';

/**
 * Recusa as rotas do Google quando não há credencial no ambiente.
 *
 * Sem isto, o `AuthGuard('google')` do Passport estoura com "Unknown
 * authentication strategy" — a estratégia só é registrada quando configurada —
 * e a pessoa que tocou em "Continuar com o Google" lê "algo deu errado do nosso
 * lado", que é verdade e não ajuda em nada: ela fica tentando de novo.
 *
 * 503, não 500: não está quebrado, está indisponível neste ambiente.
 */
@Injectable()
export class GoogleConfiguradoGuarda implements CanActivate {
  private readonly logger = new Logger(GoogleConfiguradoGuarda.name);

  canActivate(): boolean {
    if (configuracao.google.configurado) return true;

    this.logger.warn(
      'Rota do Google chamada sem GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET no ambiente.',
    );
    throw new HttpException(erro('GOOGLE_UNAVAILABLE'), HttpStatus.SERVICE_UNAVAILABLE);
  }
}
