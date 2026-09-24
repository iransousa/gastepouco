import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AdaptadorDoDf } from '../src/modules/notas/adaptadores/df.adaptador.js';
import { ErroDeLeitura } from '../src/modules/notas/adaptadores/adaptador.js';
import {
  extrairEmissao,
  interpretarPagina,
  itemPorTexto,
  paraCentavos,
  paraQuantidade,
} from '../src/modules/notas/adaptadores/nfce.parser.js';

/**
 * Testes do parser da NFC-e.
 *
 * ATENÇÃO: a fixture é sintética, não uma captura real — veja
 * `test/fixtures/nfce/df/README.md`. Estes testes provam que o parser é
 * consistente com a estrutura do modelo padrão da SEFAZ; **não** provam que
 * ele lê o portal do DF. Isso só uma captura real prova.
 */

const CHAVE = '53260908376451000129650010000001231100000011';

function fixture(nome: string): string {
  return readFileSync(join(__dirname, 'fixtures/nfce/df', nome), 'utf8');
}

describe('paraCentavos', () => {
  it('lê o formato brasileiro com separador de milhar', () => {
    expect(paraCentavos('1.284,60')).toBe(128460);
    expect(paraCentavos('R$ 28,90')).toBe(2890);
    expect(paraCentavos('0,05')).toBe(5);
  });

  it('não confunde ponto decimal com separador de milhar', () => {
    expect(paraCentavos('28.90')).toBe(2890);
    expect(paraCentavos('1.234')).toBe(123400);
  });

  it('devolve 0 no que não é número, em vez de NaN', () => {
    // "Troco: NaN" existe na página real.
    expect(paraCentavos('NaN')).toBe(0);
    expect(paraCentavos('')).toBe(0);
    expect(paraCentavos('---')).toBe(0);
  });
});

describe('paraQuantidade', () => {
  it('lê quantidade com 3 casas, como hortifrúti vendido a peso', () => {
    expect(paraQuantidade('0,638')).toBeCloseTo(0.638, 3);
    expect(paraQuantidade('2,5')).toBe(2.5);
  });

  it('assume 1 quando a quantidade não veio', () => {
    // Melhor 1 do que 0: 0 zeraria o item inteiro no histórico.
    expect(paraQuantidade('')).toBe(1);
    expect(paraQuantidade('0')).toBe(1);
  });
});

describe('extrairEmissao', () => {
  it('lê a data com fuso e devolve em UTC', () => {
    const iso = extrairEmissao('Emissão: 24/09/2026 18:32:11-03:00');
    expect(iso).toBe('2026-09-24T21:32:11.000Z');
  });

  it('assume Brasília quando a página não traz fuso', () => {
    expect(extrairEmissao('Emissão: 24/09/2026')).toBe('2026-09-24T15:00:00.000Z');
  });

  it('devolve null quando não acha data', () => {
    expect(extrairEmissao('<html>sem data</html>')).toBeNull();
  });
});

describe('itemPorTexto (caminho de segurança)', () => {
  it('lê a linha pelo texto corrido, sem depender de classe CSS', () => {
    const item = itemPorTexto(
      'CARNE MOIDA PATINHO(Código: 000000000001000064 )Qtde.:0,638 UN: KGVl. Unit.: 65,90Vl. Total42,04',
    );

    expect(item).not.toBeNull();
    expect(item!.rawDescription).toBe('CARNE MOIDA PATINHO');
    expect(item!.quantity).toBeCloseTo(0.638, 3);
    expect(item!.unit).toBe('KG');
    expect(item!.unitPriceCents).toBe(6590);
    expect(item!.totalCents).toBe(4204);
  });

  it('ignora linha que não é item', () => {
    expect(itemPorTexto('Qtd. total de itens 6')).toBeNull();
  });
});

describe('leitura da nota do DF', () => {
  const adaptador = new AdaptadorDoDf();
  const nota = adaptador.interpretar(fixture('nota-sintetica.html'), CHAVE);

  it('identifica a loja pelo CNPJ, sem pontuação', () => {
    expect(nota.store.cnpj).toBe('08376451000129');
    expect(nota.store.name).toBe('SUPERMERCADO VILA NOVA LTDA');
    expect(nota.store.uf).toBe('DF');
  });

  it('lê todos os itens', () => {
    expect(nota.items).toHaveLength(6);
  });

  it('prefere "Valor a pagar" a "Valor total"', () => {
    // A página real diverge nesses dois campos; "Valor a pagar" é o que vale.
    // A fixture põe 1.210,89 em "Valor total" justamente para pegar a troca.
    expect(nota.totalCents).toBe(21089);
  });

  it('o total bate com a soma dos itens', () => {
    const soma = nota.items.reduce((total, item) => total + item.totalCents, 0);
    expect(soma).toBe(nota.totalCents);
  });

  it('lê item vendido a peso com a quantidade decimal certa', () => {
    const carne = nota.items.find((i) => i.rawDescription.includes('CARNE MOIDA'));
    expect(carne).toBeDefined();
    expect(carne!.quantity).toBeCloseTo(0.638, 3);
    expect(carne!.unit).toBe('KG');
    expect(carne!.totalCents).toBe(4204);
  });

  it('guarda GTIN só quando o código tem cara de GTIN', () => {
    const arroz = nota.items.find((i) => i.rawDescription.includes('ARROZ'));
    const detergente = nota.items.find((i) => i.rawDescription.includes('DETERGENTE'));

    expect(arroz!.gtin).toBe('7896006711056');
    // "001234" é código interno da loja, não código de barras.
    expect(detergente!.gtin).toBeUndefined();
    expect(detergente!.storeCode).toBe('001234');
  });

  it('lê a forma de pagamento', () => {
    expect(nota.paymentMethod).toBe('CREDITO');
  });

  it('lê a data de emissão', () => {
    expect(nota.issuedAt).toBe('2026-09-24T21:32:11.000Z');
  });

  it('registra que havia CPF, mas não devolve o número em lugar nenhum', () => {
    expect(nota.consumerCpfPresent).toBe(true);

    // A garantia que importa: o CPF da página não pode aparecer no resultado.
    const tudoQueSai = JSON.stringify(nota);
    expect(tudoQueSai).not.toContain('123.456.789-00');
    expect(tudoQueSai).not.toContain('12345678900');
  });
});

describe('páginas que não são nota', () => {
  it('falha alto quando a página não tem item nem total', () => {
    // Melhor falhar do que gravar uma compra vazia no histórico de alguém.
    expect(() => interpretarPagina('<html><body>Erro 500</body></html>', CHAVE, 'DF')).toThrow(
      ErroDeLeitura,
    );
  });

  it('a falha diz PARSE_FAILED, que é a mensagem certa para a tela', () => {
    try {
      interpretarPagina('<html></html>', CHAVE, 'DF');
      fail('deveria ter lançado');
    } catch (erro) {
      expect(erro).toBeInstanceOf(ErroDeLeitura);
      expect((erro as ErroDeLeitura).motivo).toBe('PARSE_FAILED');
    }
  });
});
