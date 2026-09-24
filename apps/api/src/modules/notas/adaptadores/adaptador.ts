/**
 * Contrato dos adaptadores de NFC-e, um por estado.
 *
 * Cada UF publica a nota numa página própria, e essas páginas mudam sem aviso.
 * Por isso o adaptador é uma peça trocável, registrada pelo código IBGE da UF
 * (docs/06-NFCE-LEITURA.md): quando o DF mudar o HTML, só o adaptador do DF
 * muda, e os outros seguem funcionando.
 */

export interface ItemLido {
  rawDescription: string;
  storeCode?: string;
  gtin?: string;
  /** 3 casas decimais: hortifrúti vende 0,638 kg. */
  quantity: number;
  unit: string;
  unitPriceCents: number;
  totalCents: number;
}

export interface NotaLida {
  accessKey: string;
  store: {
    cnpj: string;
    name: string;
    address?: string;
    city?: string;
    uf: string;
  };
  /** ISO. */
  issuedAt: string;
  totalCents: number;
  discountCents?: number;
  paymentMethod?: 'PIX' | 'CREDITO' | 'DEBITO' | 'DINHEIRO' | 'VALE' | 'OUTRO';
  items: ItemLido[];
  /**
   * Se a página trazia CPF do consumidor. Guardamos o fato, nunca o número:
   * é o que permite explicar à pessoa de onde veio o dado sem armazená-lo
   * (docs/09-SEGURANCA-LGPD.md, "Minimização").
   */
  consumerCpfPresent: boolean;
}

/** Motivos de falha que a API traduz para as mensagens das telas. */
export type FalhaDeLeitura = 'NEEDS_QR' | 'PORTAL_UNAVAILABLE' | 'PARSE_FAILED';

export class ErroDeLeitura extends Error {
  constructor(
    readonly motivo: FalhaDeLeitura,
    detalhe?: string,
  ) {
    super(detalhe ?? motivo);
    this.name = 'ErroDeLeitura';
  }
}

export interface AdaptadorDeNfce {
  /** Código IBGE da UF: 53 = DF, 35 = SP. */
  readonly codigoDaUf: string;
  readonly uf: string;

  /** Monta a URL pública quando só temos a chave digitada. */
  urlDaConsulta(chave: string): string;

  /** Interpreta a página. Recebe o HTML para poder ser testado sem rede. */
  interpretar(html: string, chave: string): NotaLida;
}
