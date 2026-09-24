/**
 * Chave de acesso da NFC-e (44 dígitos).
 *
 * Mora aqui, e não no web nem na API, porque as duas pontas precisam dar a
 * mesma resposta: o web valida ao digitar (retorno imediato, sem rede) e a API
 * valida de novo ao receber (nunca confie no cliente). Se as regras morassem
 * em dois lugares, um dia divergiriam.
 *
 * Layout (docs/06-NFCE-LEITURA.md):
 *   1–2   UF (código IBGE, 53 = DF)      3–6   AAMM da emissão
 *   7–20  CNPJ do emitente               21–22 modelo (65 = NFC-e)
 *   23–25 série                          26–34 número
 *   35    tipo de emissão                36–43 código numérico
 *   44    dígito verificador (módulo 11)
 */

export const MODELO_NFCE = '65';

/** Meses de validade para a nota valer pontos (docs/07-GAMIFICACAO.md). */
export const MESES_PARA_PONTOS = 6;

export type CodigoDeErroDaChave = 'INVALID_KEY' | 'NOT_NFCE';
/** Ler da URL do QR tem um erro a mais: o código lido não é de nota fiscal. */
export type CodigoDeErroDoQr = CodigoDeErroDaChave | 'INVALID_QR';

export interface ChaveDeAcesso {
  readonly valor: string;
  readonly uf: string;
  readonly ano: number;
  readonly mes: number;
  readonly cnpj: string;
  readonly modelo: string;
  readonly serie: string;
  readonly numero: string;
  readonly tipoDeEmissao: string;
  readonly codigoNumerico: string;
  readonly digitoVerificador: number;
}

export type ResultadoDaChave =
  | { ok: true; chave: ChaveDeAcesso }
  | { ok: false; code: CodigoDeErroDaChave };

export type ResultadoDoQr =
  | { ok: true; chave: ChaveDeAcesso }
  | { ok: false; code: CodigoDeErroDoQr };

/** Tira espaços, pontos e traços: a pessoa pode digitar em blocos de 4. */
export function limparChave(entrada: string): string {
  return (entrada ?? '').replace(/\D/g, '');
}

/**
 * Dígito verificador por módulo 11.
 *
 * Pesos 2 a 9 ciclando da direita para a esquerda sobre os 43 primeiros
 * dígitos. Resto 0 ou 1 resulta em dígito 0 — é a regra da SEFAZ, não um
 * arredondamento nosso.
 */
export function calcularDigitoVerificador(primeiros43: string): number {
  let soma = 0;
  let peso = 2;

  for (let i = primeiros43.length - 1; i >= 0; i--) {
    soma += Number(primeiros43[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }

  const resto = soma % 11;
  return resto === 0 || resto === 1 ? 0 : 11 - resto;
}

/** Interpreta e valida a chave. Não decide sobre pontos — só sobre validade. */
export function lerChaveDeAcesso(entrada: string): ResultadoDaChave {
  const valor = limparChave(entrada);

  if (valor.length !== 44) return { ok: false, code: 'INVALID_KEY' };

  const modelo = valor.slice(20, 22);
  // Modelo errado é uma nota de outro tipo (55 = NF-e de mercadoria), não uma
  // chave malformada. A tela mostra mensagens diferentes para os dois casos.
  if (modelo !== MODELO_NFCE) return { ok: false, code: 'NOT_NFCE' };

  const digitoVerificador = Number(valor[43]);
  if (calcularDigitoVerificador(valor.slice(0, 43)) !== digitoVerificador) {
    return { ok: false, code: 'INVALID_KEY' };
  }

  const ano = 2000 + Number(valor.slice(2, 4));
  const mes = Number(valor.slice(4, 6));
  if (mes < 1 || mes > 12) return { ok: false, code: 'INVALID_KEY' };

  return {
    ok: true,
    chave: {
      valor,
      uf: valor.slice(0, 2),
      ano,
      mes,
      cnpj: valor.slice(6, 20),
      modelo,
      serie: valor.slice(22, 25),
      numero: valor.slice(25, 34),
      tipoDeEmissao: valor.slice(34, 35),
      codigoNumerico: valor.slice(35, 43),
      digitoVerificador,
    },
  };
}

/** Emissão no futuro não existe; nota velha entra sem pontos, não é recusada. */
export function emissaoNoFuturo(chave: ChaveDeAcesso, agora = new Date()): boolean {
  const anoAtual = agora.getUTCFullYear();
  const mesAtual = agora.getUTCMonth() + 1;
  return chave.ano > anoAtual || (chave.ano === anoAtual && chave.mes > mesAtual);
}

/** `false` marca `pointsEligible = false`: a nota entra no histórico, sem pontos. */
export function valePontosPelaData(chave: ChaveDeAcesso, agora = new Date()): boolean {
  if (emissaoNoFuturo(chave, agora)) return false;
  const meses =
    (agora.getUTCFullYear() - chave.ano) * 12 + (agora.getUTCMonth() + 1 - chave.mes);
  return meses <= MESES_PARA_PONTOS;
}

/** "5324 0112 ..." — em blocos de 4, que é como a chave vem impressa na nota. */
export function formatarChave(entrada: string): string {
  return (limparChave(entrada).match(/.{1,4}/g) ?? []).join(' ');
}

/**
 * Acha a chave dentro da URL do QR code.
 *
 * Cada estado monta a URL de um jeito: alguns usam `?p=<chave>|<versão>|...`,
 * outros `?chNFe=<chave>`. Em vez de uma regra por estado, procuramos a
 * primeira sequência de 44 dígitos que passa na validação — isso funciona para
 * todos e não quebra quando um portal muda o nome do parâmetro.
 */
export function extrairChaveDaUrl(url: string): ResultadoDoQr {
  const candidatos = (url ?? '').match(/\d{44}/g) ?? [];

  for (const candidato of candidatos) {
    const resultado = lerChaveDeAcesso(candidato);
    if (resultado.ok) return resultado;
  }

  // Nenhum candidato passou. Se havia 44 dígitos, o problema é a chave em si —
  // devolvemos o motivo real (DV errado, modelo errado) em vez de "não é nota".
  const primeiro = candidatos[0];
  if (primeiro) return lerChaveDeAcesso(primeiro);

  return { ok: false, code: 'INVALID_QR' };
}
