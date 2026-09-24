import { Logger } from '@nestjs/common';

/**
 * Configuração lida do ambiente, conferida uma vez na subida.
 *
 * Segredo faltando é erro de implantação, não de requisição: melhor o processo
 * não subir do que subir e assinar tokens com "undefined". Em produção isto
 * derruba o boot; em desenvolvimento avisa e usa um valor local.
 */
const logger = new Logger('Configuração');

function obrigatorio(nome: string, padraoDeDesenvolvimento?: string): string {
  const valor = process.env[nome];
  if (valor) return valor;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`A variável de ambiente ${nome} é obrigatória em produção.`);
  }

  if (padraoDeDesenvolvimento) {
    logger.warn(`${nome} não definida; usando valor local só para desenvolvimento.`);
    return padraoDeDesenvolvimento;
  }

  throw new Error(`A variável de ambiente ${nome} é obrigatória.`);
}

export const configuracao = {
  ambiente: process.env.NODE_ENV ?? 'development',
  get ehProducao(): boolean {
    return this.ambiente === 'production';
  },
  enderecoDoApp: process.env.APP_URL ?? 'http://127.0.0.1:5173',

  jwt: {
    get segredo(): string {
      return obrigatorio('JWT_SECRET', 'segredo-local-de-desenvolvimento-32+');
    },
    get segredoDeRefresh(): string {
      return obrigatorio('JWT_REFRESH_SECRET', 'refresh-local-de-desenvolvimento-32+');
    },
    /** Curto de propósito: o refresh rotativo é quem mantém a sessão viva. */
    validadeDoAcesso: '15m',
    validadeDoRefreshEmDias: 30,
  },

  get segredoDoHashDeUsuario(): string {
    return obrigatorio('USER_HASH_SECRET', 'hash-local-de-desenvolvimento');
  },

  /**
   * Multiplicador dos limites de requisição, só para a suíte automatizada.
   *
   * Os três projetos do Playwright rodam do mesmo IP e o limite é por IP:
   * sem isto, a segunda execução da suíte no mesmo quarto de hora falha em
   * rotas que estão funcionando. Afrouxar o limite em desenvolvimento é
   * aceitável; em produção não é, então o boot recusa.
   *
   * O limite em si é testado à parte, com o valor de produção.
   */
  get fatorDeLimite(): number {
    const bruto = Number(process.env.RATE_LIMIT_TEST_FACTOR ?? 1);
    const fator = Number.isFinite(bruto) && bruto >= 1 ? bruto : 1;

    if (fator !== 1 && process.env.NODE_ENV === 'production') {
      throw new Error('RATE_LIMIT_TEST_FACTOR não pode ser usado em produção.');
    }
    return fator;
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? 'http://127.0.0.1:3001/v1/auth/google/callback',
    get configurado(): boolean {
      return Boolean(this.clientId && this.clientSecret);
    },
  },

  email: {
    de: process.env.MAIL_FROM ?? 'GasteMenos <nao-responda@gastemenos.com.br>',
    smtp: process.env.SMTP_URL ?? '',
  },
} as const;
