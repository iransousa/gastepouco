import { Injectable, Logger } from '@nestjs/common';
import { configuracao } from '../../comum/configuracao.js';

/**
 * Envio de e-mail.
 *
 * Sem SMTP configurado (o caso normal em desenvolvimento) o e-mail vai para o
 * log — inclusive o código de 6 dígitos, para dar para testar o cadastro sem
 * caixa postal. Em produção isso seria vazamento, então só acontece fora dela.
 *
 * O corpo nunca leva senha nem token de sessão: só o código, que expira em
 * 15 minutos, e links de uso único (docs/09-SEGURANCA-LGPD.md).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async enviarCodigoDeConfirmacao(email: string, codigo: string): Promise<void> {
    await this.enviar(
      email,
      'Seu código do GasteMenos',
      `Seu código é ${codigo}. Ele vale por 15 minutos.`,
      codigo,
    );
  }

  async enviarLinkDeNovaSenha(email: string, token: string): Promise<void> {
    const link = `${configuracao.enderecoDoApp}/recuperar-senha/nova?token=${token}`;
    await this.enviar(
      email,
      'Criar uma senha nova no GasteMenos',
      `Para criar uma senha nova, abra: ${link}\n\nSe não foi você quem pediu, ignore este e-mail.`,
      link,
    );
  }

  /** Aviso de segurança: troca de senha, aparelho novo, pedido de exclusão. */
  async avisar(email: string, assunto: string, corpo: string): Promise<void> {
    await this.enviar(email, assunto, corpo);
  }

  private async enviar(
    email: string,
    assunto: string,
    corpo: string,
    segredoParaOLog?: string,
  ): Promise<void> {
    if (!configuracao.email.smtp) {
      // Mascarar o e-mail no log: endereço é dado pessoal.
      const mascarado = email.replace(/^(.{2}).*(@.*)$/, '$1***$2');
      this.logger.log(`[e-mail não enviado, sem SMTP] para ${mascarado}: ${assunto}`);
      if (segredoParaOLog && !configuracao.ehProducao) {
        this.logger.log(`[somente desenvolvimento] ${segredoParaOLog}`);
      }
      return;
    }

    // A integração SMTP entra junto com o provedor escolhido. Até lá, falhar
    // em silêncio seria pior do que registrar que não foi enviado.
    this.logger.warn(`SMTP configurado mas o envio ainda não foi implementado: ${assunto}`);
    await Promise.resolve();
  }
}
