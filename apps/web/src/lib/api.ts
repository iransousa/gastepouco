import { mensagemDoErro } from '@gastemenos/shared';

/**
 * Cliente da API.
 *
 * `credentials: 'include'` é obrigatório: o refresh token vive em cookie
 * httpOnly (docs/04-API.md), então toda chamada precisa levar o cookie junto.
 *
 * Todo erro sai daqui como `ErroDaApi`, com uma frase pronta em português —
 * nenhuma tela deve inventar texto de erro.
 */

export class ErroDaApi extends Error {
  constructor(
    readonly code: string,
    readonly paraOUsuario: string,
    readonly status: number,
  ) {
    super(paraOUsuario);
    this.name = 'ErroDaApi';
  }
}

const BASE = '/v1';

export async function chamar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let resposta: Response;

  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      ...opcoes,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...opcoes.headers,
      },
    });
  } catch {
    // Falha de rede não tem corpo para ler: é o caso "sem conexão".
    throw new ErroDaApi('OFFLINE', mensagemDoErro('OFFLINE'), 0);
  }

  if (resposta.status === 204) return undefined as T;

  const corpo: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const code =
      corpo && typeof corpo === 'object' && typeof (corpo as { code?: unknown }).code === 'string'
        ? (corpo as { code: string }).code
        : 'INTERNAL';
    throw new ErroDaApi(code, mensagemDoErro(corpo ?? code), resposta.status);
  }

  return corpo as T;
}
