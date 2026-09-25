import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { configuracao } from '../../../comum/configuracao.js';

/**
 * Guarda o `state` e o verificador do PKCE entre a ida e a volta do Google.
 *
 * O `passport-oauth2` guarda isso em `req.session`, o que exigiria
 * `express-session` — um armazenamento de sessão no servidor só para os
 * segundos de um redirecionamento, que ainda precisaria ser compartilhado entre
 * instâncias. A API não tem sessão de servidor em lugar nenhum e não é para ter:
 * a sessão da pessoa é o cookie de refresh, e nada mais.
 *
 * Então o estado vai num cookie httpOnly assinado com HMAC:
 *
 * - **Assinado**, para não ser forjado. Sem isso, um atacante escolheria o
 *   `state` e a proteção contra CSRF no retorno deixaria de valer.
 * - **httpOnly**, para o javascript da página não ler o verificador do PKCE.
 * - **10 minutos**, que é folga de sobra para um login e pouco tempo de janela.
 * - **`SameSite=Lax`**, que é o que permite o cookie voltar na navegação vinda
 *   do Google (ela é um GET de topo). `Strict` derrubaria o login.
 *
 * O cookie é apagado na verificação: cada tentativa vale uma vez.
 */

const COOKIE = 'gm_oauth';
const VALIDADE_EM_MS = 10 * 60 * 1000;

interface Guardado {
  /** O que vai para o Google como `state` e volta de lá. */
  handle: string;
  /** `code_verifier` do PKCE. */
  verifier: string;
  criadoEm: number;
}

function assinar(dados: string): string {
  return createHmac('sha256', configuracao.jwt.segredo).update(dados).digest('base64url');
}

function empacotar(guardado: Guardado): string {
  const corpo = Buffer.from(JSON.stringify(guardado)).toString('base64url');
  return `${corpo}.${assinar(corpo)}`;
}

function desempacotar(valor: string): Guardado | null {
  const [corpo, assinatura] = valor.split('.');
  if (!corpo || !assinatura) return null;

  const esperada = Buffer.from(assinar(corpo));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;

  try {
    const guardado = JSON.parse(Buffer.from(corpo, 'base64url').toString()) as Guardado;
    if (Date.now() - guardado.criadoEm > VALIDADE_EM_MS) return null;
    return guardado;
  } catch {
    return null;
  }
}

/**
 * Implementa a interface de `store` do `passport-oauth2`.
 *
 * As assinaturas são as que a biblioteca escolhe pela **quantidade de
 * parâmetros** (`store.length`): cinco é a variante com PKCE, que é a nossa.
 * Mudar a lista de parâmetros muda o contrato — por isso ela está fixada aqui
 * junto com o teste em `test/estado-em-cookie.spec.ts`.
 */
export class EstadoEmCookie {
  store(
    req: Request,
    verifier: string,
    state: unknown,
    meta: unknown,
    callback: (erro: Error | null, handle?: string) => void,
  ): void {
    const resposta = req.res as Response | undefined;
    if (!resposta) {
      callback(new Error('Sem resposta para gravar o cookie do OAuth.'));
      return;
    }

    const guardado: Guardado = {
      handle: randomBytes(18).toString('base64url'),
      verifier,
      criadoEm: Date.now(),
    };

    resposta.cookie(COOKIE, empacotar(guardado), {
      httpOnly: true,
      secure: configuracao.ehProducao,
      sameSite: 'lax',
      path: '/v1/auth',
      maxAge: VALIDADE_EM_MS,
    });

    callback(null, guardado.handle);
  }

  verify(
    req: Request,
    stateRecebido: string,
    callback: (erro: Error | null, ok?: string | false, info?: unknown) => void,
  ): void {
    const cru = (req.cookies as Record<string, string> | undefined)?.[COOKIE];
    (req.res as Response | undefined)?.clearCookie(COOKIE, { path: '/v1/auth' });

    if (!cru) {
      callback(null, false, { message: 'Não foi possível conferir o retorno do Google.' });
      return;
    }

    const guardado = desempacotar(cru);
    if (!guardado) {
      callback(null, false, { message: 'O retorno do Google expirou. Tente entrar de novo.' });
      return;
    }

    const esperado = Buffer.from(guardado.handle);
    const recebido = Buffer.from(stateRecebido ?? '');
    if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) {
      callback(null, false, { message: 'Retorno do Google não confere com o pedido.' });
      return;
    }

    // Segundo argumento é o `code_verifier`, que a biblioteca manda ao Google.
    callback(null, guardado.verifier);
  }
}
