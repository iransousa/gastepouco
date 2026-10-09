import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { erro } from '@gastemenos/shared';
import { configuracao } from '../../comum/configuracao.js';

/**
 * Envio de e-mail.
 *
 * Três decisões que valem explicar:
 *
 * 1. **SMTP, e não a API de um provedor.** `SMTP_URL` serve Resend, Brevo, SES,
 *    Postmark e o relay do próprio servidor sem uma linha de código nova.
 *    Amarrar a um provedor por HTTP seria uma dependência a mais para ganhar
 *    nada.
 *
 * 2. **E-mail com código é crítico; aviso não é.** Se o código de confirmação
 *    não sai, a conta nasce sem como ser confirmada — então a falha sobe e a
 *    pessoa lê "tente de novo", em vez de esperar um e-mail que nunca vem. Já um
 *    aviso de segurança ou o "seus dados estão prontos" não pode derrubar a ação
 *    que o originou: a senha foi trocada, o ZIP foi gerado, e isso vale mais que
 *    o e-mail. Falha ali fica no log.
 *
 * 3. **Sem SMTP, o e-mail vai para o log** — inclusive o código, para dar para
 *    testar o cadastro sem caixa postal. **Em produção o segredo nunca é
 *    registrado**, e o log sai como erro: produção sem SMTP é defeito de
 *    implantação, não modo de operação.
 *
 * O corpo nunca leva senha nem token de sessão: só o código, que expira em
 * 15 minutos, e links de uso único (docs/09-SEGURANCA-LGPD.md).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporte: Transporter | null = null;

  async enviarCodigoDeConfirmacao(email: string, codigo: string): Promise<void> {
    await this.enviar({
      email,
      assunto: 'Seu código do GasteMenos',
      corpo: `Seu código é ${codigo}. Ele vale por 15 minutos.`,
      segredoParaOLog: codigo,
      critico: true,
    });
  }

  async enviarLinkDeNovaSenha(email: string, token: string): Promise<void> {
    const link = `${configuracao.enderecoDoApp}/recuperar-senha/nova?token=${token}`;
    await this.enviar({
      email,
      assunto: 'Criar uma senha nova no GasteMenos',
      corpo: `Para criar uma senha nova, abra: ${link}\n\nSe não foi você quem pediu, ignore este e-mail.`,
      segredoParaOLog: link,
      critico: true,
    });
  }

  /** Aviso de segurança: troca de senha, aparelho novo, pedido de exclusão. */
  async avisar(email: string, assunto: string, corpo: string): Promise<void> {
    await this.enviar({ email, assunto, corpo, critico: false });
  }

  /**
   * O transporte é criado na primeira vez que se envia, e reaproveitado.
   *
   * Criar na subida obrigaria o processo a conhecer o SMTP para existir — e a
   * API tem de subir mesmo com o e-mail fora do ar. `pool: true` mantém a
   * conexão aberta: cadastros em sequência não reabrem TLS a cada código.
   *
   * Os tempos limite existem porque provedor lento não pode prender a
   * requisição de cadastro de quem está esperando a tela responder.
   *
   * `protected` para o teste trocar por um dublê, sem rede.
   */
  protected criarTransporte(): Transporter {
    const bruto = configuracao.email.smtp;

    // As opções entram na própria URL de conexão: no nodemailer 10 o segundo
    // argumento de `createTransport` são valores padrão da mensagem, não do
    // transporte. URL quebrada não derruba o envio — vai como veio, e quem
    // erra a variável lê o motivo no erro do provedor.
    try {
      const url = new URL(bruto);
      url.searchParams.set('pool', 'true');
      url.searchParams.set('maxConnections', '2');
      url.searchParams.set('connectionTimeout', '10000');
      url.searchParams.set('greetingTimeout', '10000');
      url.searchParams.set('socketTimeout', '20000');
      return createTransport(url.toString());
    } catch {
      return createTransport(bruto);
    }
  }

  private async enviar({
    email,
    assunto,
    corpo,
    segredoParaOLog,
    critico,
  }: {
    email: string;
    assunto: string;
    corpo: string;
    segredoParaOLog?: string;
    critico: boolean;
  }): Promise<void> {
    // Endereço é dado pessoal: no log vai mascarado, sempre.
    const mascarado = email.replace(/^(.{2}).*(@.*)$/, '$1***$2');

    if (!configuracao.email.smtp) {
      if (configuracao.ehProducao) {
        // Nem o código nem o link entram no log de produção: quem lê log não
        // precisa poder entrar na conta de ninguém.
        this.logger.error(
          `SMTP não configurado: "${assunto}" para ${mascarado} não foi enviado. ` +
            'Em produção isto impede confirmar e-mail e recuperar senha.',
        );
        if (critico) throw new HttpException(erro('EMAIL_SEND_FAILED'), HttpStatus.BAD_GATEWAY);
        return;
      }

      this.logger.log(`[e-mail não enviado, sem SMTP] para ${mascarado}: ${assunto}`);
      if (segredoParaOLog) {
        this.logger.log(`[somente desenvolvimento] ${segredoParaOLog}`);
      }
      return;
    }

    this.transporte ??= this.criarTransporte();

    try {
      await this.transporte.sendMail({
        from: configuracao.email.de,
        to: email,
        subject: assunto,
        // Só texto. HTML renderizaria diferente em cada cliente, cairia mais em
        // spam e não acrescenta nada a um código de seis dígitos.
        text: corpo,
      });
      this.logger.log(`E-mail enviado para ${mascarado}: ${assunto}`);
    } catch (falha) {
      const motivo = falha instanceof Error ? falha.message : String(falha);
      this.logger.error(`Falha ao enviar "${assunto}" para ${mascarado}: ${motivo}`);

      if (critico) throw new HttpException(erro('EMAIL_SEND_FAILED'), HttpStatus.BAD_GATEWAY);
    }
  }
}
