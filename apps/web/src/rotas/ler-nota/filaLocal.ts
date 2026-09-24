import { del, get, set } from 'idb-keyval';

/**
 * Fila local das leituras feitas sem internet.
 *
 * O mercado é justamente onde o sinal falha: subsolo, corredor de freezer,
 * fila do caixa. Perder a leitura ali significa perder a nota — a pessoa joga
 * o papel fora e o dado some para sempre. Por isso a leitura offline vai para
 * o IndexedDB e sobe quando a conexão voltar (docs/02-ARQUITETURA.md).
 *
 * Guardamos o mínimo: o conteúdo do QR ou a chave. Nada de dado pessoal.
 */

const CHAVE_DA_FILA = 'gastemenos:notas-pendentes';

export interface LeituraPendente {
  qrUrl?: string;
  accessKey?: string;
  source: string;
  /** Para não tentar para sempre uma leitura que a API recusa. */
  tentativas: number;
  criadaEm: number;
}

async function ler(): Promise<LeituraPendente[]> {
  try {
    return (await get<LeituraPendente[]>(CHAVE_DA_FILA)) ?? [];
  } catch {
    // Navegação privada ou armazenamento bloqueado: a fila simplesmente não
    // existe. Não é motivo para quebrar a tela de leitura.
    return [];
  }
}

async function gravar(fila: LeituraPendente[]): Promise<void> {
  try {
    if (fila.length === 0) await del(CHAVE_DA_FILA);
    else await set(CHAVE_DA_FILA, fila);
  } catch {
    // idem
  }
}

export async function guardarParaDepois(dados: {
  qrUrl?: string;
  accessKey?: string;
  source: string;
}): Promise<void> {
  const fila = await ler();

  // Mesma nota lida duas vezes offline não precisa virar duas pendências.
  const jaEsta = fila.some(
    (item) => item.qrUrl === dados.qrUrl && item.accessKey === dados.accessKey,
  );
  if (jaEsta) return;

  await gravar([...fila, { ...dados, tentativas: 0, criadaEm: Date.now() }]);
}

export async function quantasPendentes(): Promise<number> {
  return (await ler()).length;
}

/**
 * Tenta enviar o que ficou pendente.
 *
 * Desiste de uma leitura depois de 5 tentativas: se a API recusa sempre, ou a
 * chave é inválida, ou a nota já foi lida — e insistir para sempre gastaria
 * bateria e dados da pessoa sem chance de sucesso.
 */
export async function enviarPendentes(
  enviar: (dados: { qrUrl?: string; accessKey?: string; source: string }) => Promise<void>,
): Promise<{ enviadas: number; desistidas: number }> {
  const fila = await ler();
  if (fila.length === 0) return { enviadas: 0, desistidas: 0 };

  const restantes: LeituraPendente[] = [];
  let enviadas = 0;
  let desistidas = 0;

  for (const item of fila) {
    try {
      await enviar({ qrUrl: item.qrUrl, source: item.source, accessKey: item.accessKey });
      enviadas += 1;
    } catch {
      const tentativas = item.tentativas + 1;
      if (tentativas >= 5) desistidas += 1;
      else restantes.push({ ...item, tentativas });
    }
  }

  await gravar(restantes);
  return { enviadas, desistidas };
}
