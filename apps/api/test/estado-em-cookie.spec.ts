import type { Request } from 'express';
import { EstadoEmCookie } from '../src/modules/auth/estrategias/estado-em-cookie.js';

/**
 * O estado do OAuth vive num cookie assinado porque a API não tem sessão de
 * servidor. Este teste existe por dois motivos:
 *
 * 1. O `passport-oauth2` escolhe a variante do `store` pela **quantidade de
 *    parâmetros** da função. Um parâmetro a mais ou a menos muda em silêncio o
 *    que a biblioteca chama, e o login só quebra em produção.
 * 2. Cookie forjado ou vencido não pode passar — é ele que sustenta a proteção
 *    contra CSRF no retorno do Google.
 */
describe('estado do OAuth em cookie', () => {
  interface CookieGravado {
    nome: string;
    valor: string;
  }

  function requisicaoFalsa(cookies: Record<string, string> = {}) {
    const gravados: CookieGravado[] = [];
    const apagados: string[] = [];
    const req = {
      cookies,
      res: {
        cookie: (nome: string, valor: string) => gravados.push({ nome, valor }),
        clearCookie: (nome: string) => apagados.push(nome),
      },
    } as unknown as Request;

    return { req, gravados, apagados };
  }

  const estado = new EstadoEmCookie();

  /** Faz a ida: devolve o `state` que vai ao Google e o cookie gravado. */
  function ida(verifier = 'verificador-do-pkce') {
    const { req, gravados } = requisicaoFalsa();
    let handle = '';
    estado.store(req, verifier, undefined, undefined, (erro, valor) => {
      expect(erro).toBeNull();
      handle = valor ?? '';
    });

    return { handle, cookie: gravados[0]!.valor, nome: gravados[0]!.nome };
  }

  it('a assinatura da função é a que o passport-oauth2 espera com PKCE', () => {
    expect(estado.store.length).toBe(5);
    expect(estado.verify.length).toBe(3);
  });

  it('ida e volta devolve o verificador do PKCE', () => {
    const { handle, cookie, nome } = ida();

    const { req, apagados } = requisicaoFalsa({ [nome]: cookie });
    estado.verify(req, handle, (erro, ok) => {
      expect(erro).toBeNull();
      expect(ok).toBe('verificador-do-pkce');
    });

    // Cada tentativa vale uma vez.
    expect(apagados).toContain(nome);
  });

  it('state diferente do gravado não passa', () => {
    const { cookie, nome } = ida();

    const { req } = requisicaoFalsa({ [nome]: cookie });
    estado.verify(req, 'state-de-outra-pessoa', (erro, ok) => {
      expect(erro).toBeNull();
      expect(ok).toBe(false);
    });
  });

  it('cookie adulterado não passa', () => {
    const { handle, cookie, nome } = ida();

    // Troca o conteúdo, mantém a assinatura.
    const [, assinatura] = cookie.split('.');
    const forjado = Buffer.from(
      JSON.stringify({ handle, verifier: 'verificador-do-atacante', criadoEm: Date.now() }),
    ).toString('base64url');

    const { req } = requisicaoFalsa({ [nome]: `${forjado}.${assinatura}` });
    estado.verify(req, handle, (erro, ok) => {
      expect(erro).toBeNull();
      expect(ok).toBe(false);
    });
  });

  it('sem cookie nenhum não passa', () => {
    const { req } = requisicaoFalsa();
    estado.verify(req, 'qualquer-state', (erro, ok) => {
      expect(erro).toBeNull();
      expect(ok).toBe(false);
    });
  });

  it('depois de 10 minutos não vale mais', () => {
    jest.useFakeTimers();
    try {
      const { handle, cookie, nome } = ida();

      jest.advanceTimersByTime(11 * 60 * 1000);

      const { req } = requisicaoFalsa({ [nome]: cookie });
      estado.verify(req, handle, (erro, ok) => {
        expect(erro).toBeNull();
        expect(ok).toBe(false);
      });
    } finally {
      jest.useRealTimers();
    }
  });
});
