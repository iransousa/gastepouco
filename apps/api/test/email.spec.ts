import type { Transporter } from 'nodemailer';
import { EmailService } from '../src/modules/email/email.service.js';

/**
 * Envio de e-mail.
 *
 * O que está fixado aqui é o que custou caro antes de existir: **em produção
 * sem SMTP, nenhum código era enviado e nenhum aparecia no log** — ninguém
 * conseguiria criar conta, e o deploy pareceria saudável.
 *
 * Nada aqui abre conexão: o transporte é substituído por um dublê. Teste de
 * e-mail que depende de SMTP de verdade é teste que falha na máquina de quem
 * não tem credencial — foi o que já aconteceu com o ZIP e o Supabase.
 */
describe('e-mail', () => {
  const ambienteOriginal = { ...process.env };

  /** Expõe o dublê e guarda o que foi "enviado". */
  class EmailDeTeste extends EmailService {
    enviados: Array<{ to: string; subject: string; text: string; from: string }> = [];
    falhar = false;

    protected override criarTransporte(): Transporter {
      return {
        sendMail: async (opcoes: Record<string, string>) => {
          if (this.falhar) throw new Error('Connection timeout');
          this.enviados.push({
            to: opcoes.to!,
            subject: opcoes.subject!,
            text: opcoes.text!,
            from: opcoes.from!,
          });
          return { messageId: 'teste' };
        },
      } as unknown as Transporter;
    }
  }

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  describe('com SMTP configurado', () => {
    function servico(): EmailDeTeste {
      process.env.SMTP_URL = 'smtps://usuario:senha@smtp.exemplo.test';
      process.env.MAIL_FROM = 'GasteMenos <nao-responda@gastemenos.com.br>';
      return new EmailDeTeste();
    }

    it('envia o código com o remetente configurado', async () => {
      const email = servico();
      await email.enviarCodigoDeConfirmacao('camila@exemplo.test', '123456');

      expect(email.enviados).toHaveLength(1);
      expect(email.enviados[0]).toMatchObject({
        to: 'camila@exemplo.test',
        subject: 'Seu código do GasteMenos',
        from: 'GasteMenos <nao-responda@gastemenos.com.br>',
      });
      expect(email.enviados[0]!.text).toContain('123456');
      expect(email.enviados[0]!.text).toContain('15 minutos');
    });

    it('reaproveita o mesmo transporte entre envios', async () => {
      const email = servico();
      const criar = jest.spyOn(
        email as unknown as { criarTransporte: () => Transporter },
        'criarTransporte',
      );

      await email.enviarCodigoDeConfirmacao('a@exemplo.test', '111111');
      await email.enviarCodigoDeConfirmacao('b@exemplo.test', '222222');

      expect(criar).toHaveBeenCalledTimes(1);
      expect(email.enviados).toHaveLength(2);
    });

    it('o link de senha nova aponta para o endereço do app', async () => {
      process.env.APP_URL = 'https://gastepouco.example';
      const email = servico();
      await email.enviarLinkDeNovaSenha('camila@exemplo.test', 'token-de-uso-unico');

      expect(email.enviados[0]!.text).toContain(
        'https://gastepouco.example/recuperar-senha/nova?token=token-de-uso-unico',
      );
    });

    /**
     * Código que não sai deixa a conta sem como ser confirmada: a falha tem de
     * chegar à tela, não ao vazio.
     */
    it('falha no envio do código estoura, para a pessoa poder tentar de novo', async () => {
      const email = servico();
      email.falhar = true;

      await expect(email.enviarCodigoDeConfirmacao('camila@exemplo.test', '123456')).rejects.toThrow();
    });

    /** Aviso é o contrário: não pode derrubar a ação que o originou. */
    it('falha num aviso não estoura', async () => {
      const email = servico();
      email.falhar = true;

      await expect(
        email.avisar('camila@exemplo.test', 'Sua senha mudou', 'Se não foi você, troque agora.'),
      ).resolves.toBeUndefined();
    });
  });

  describe('sem SMTP', () => {
    it('em desenvolvimento, o código vai para o log', async () => {
      delete process.env.SMTP_URL;
      process.env.NODE_ENV = 'development';

      const email = new EmailDeTeste();
      const log = jest.spyOn(email['logger'], 'log').mockImplementation(() => undefined);

      await email.enviarCodigoDeConfirmacao('camila@exemplo.test', '123456');

      const linhas = log.mock.calls.map((c) => String(c[0]));
      expect(linhas.join('\n')).toContain('123456');
      // E o endereço vai mascarado mesmo em desenvolvimento.
      expect(linhas.join('\n')).toContain('ca***@exemplo.test');
      expect(linhas.join('\n')).not.toContain('camila@exemplo.test');
    });

    /**
     * O defeito que este arquivo existe para impedir: produção sem SMTP ficava
     * em silêncio, o cadastro "dava certo" e o código não chegava a lugar
     * nenhum — nem ao log.
     */
    it('em produção, estoura e não escreve o código no log', async () => {
      delete process.env.SMTP_URL;
      process.env.NODE_ENV = 'production';

      const email = new EmailDeTeste();
      const log = jest.spyOn(email['logger'], 'log').mockImplementation(() => undefined);
      const erroLog = jest.spyOn(email['logger'], 'error').mockImplementation(() => undefined);

      await expect(
        email.enviarCodigoDeConfirmacao('camila@exemplo.test', '123456'),
      ).rejects.toThrow();

      const tudo = [...log.mock.calls, ...erroLog.mock.calls].map((c) => String(c[0])).join('\n');
      expect(tudo).not.toContain('123456');
      expect(tudo).toContain('SMTP não configurado');
      expect(email.enviados).toHaveLength(0);
    });

    it('em produção, aviso não estoura — mas registra o erro', async () => {
      delete process.env.SMTP_URL;
      process.env.NODE_ENV = 'production';

      const email = new EmailDeTeste();
      const erroLog = jest.spyOn(email['logger'], 'error').mockImplementation(() => undefined);

      await expect(
        email.avisar('camila@exemplo.test', 'Sua senha mudou', 'corpo'),
      ).resolves.toBeUndefined();
      expect(erroLog).toHaveBeenCalled();
    });
  });
});
