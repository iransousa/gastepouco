import { Injectable } from '@nestjs/common';
import type { AdaptadorDeNfce, NotaLida } from './adaptador.js';
import { interpretarPagina } from './nfce.parser.js';

/**
 * Distrito Federal — a primeira UF atendida (docs/06-NFCE-LEITURA.md).
 *
 * O portal do DF usa o modelo padrão da SEFAZ, então a leitura fica toda no
 * parser compartilhado. O que é próprio do DF é só o endereço da consulta.
 *
 * A consulta pela chave digitada às vezes pede captcha; quando isso acontece,
 * o processador marca a nota como `NEEDS_QR` e o app pede o QR code, que passa
 * direto.
 */
@Injectable()
export class AdaptadorDoDf implements AdaptadorDeNfce {
  readonly codigoDaUf = '53';
  readonly uf = 'DF';

  urlDaConsulta(chave: string): string {
    return `https://dfe.fazenda.df.gov.br/nfce/consulta?p=${chave}`;
  }

  interpretar(html: string, chave: string): NotaLida {
    return interpretarPagina(html, chave, this.uf);
  }
}
