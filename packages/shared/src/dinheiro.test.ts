import { describe, expect, it } from 'vitest';
import {
  formatarCentavos,
  lerCentavos,
  partirCentavos,
  variacaoPercentual,
} from './dinheiro.js';

/** O Intl usa espaço não separável depois do "R$"; normaliza para comparar. */
function semNbsp(texto: string): string {
  return texto.replace(new RegExp(String.fromCharCode(160), 'g'), ' ');
}

describe('formatarCentavos', () => {
  it('formata o total do mês da tela Gastos', () => {
    expect(semNbsp(formatarCentavos(128460))).toBe('R$ 1.284,60');
  });

  it('formata valores pequenos e zero', () => {
    expect(semNbsp(formatarCentavos(0))).toBe('R$ 0,00');
    expect(semNbsp(formatarCentavos(5))).toBe('R$ 0,05');
  });

  it('formata negativo (economia negativa existe)', () => {
    expect(semNbsp(formatarCentavos(-1290))).toBe('-R$ 12,90');
  });
});

describe('partirCentavos', () => {
  it('separa reais e centavos para o cartão de gastos', () => {
    expect(partirCentavos(128460)).toEqual({ reais: '1.284', centavos: '60' });
  });

  it('completa o centavo com zero à esquerda', () => {
    expect(partirCentavos(1205)).toEqual({ reais: '12', centavos: '05' });
  });
});

describe('lerCentavos', () => {
  it('lê o formato brasileiro', () => {
    expect(lerCentavos('R$ 1.284,60')).toBe(128460);
    expect(lerCentavos('12,90')).toBe(1290);
  });

  it('lê o formato com ponto decimal', () => {
    expect(lerCentavos('12.90')).toBe(1290);
  });

  it('arredonda em vez de truncar', () => {
    // 0.1 + 0.2 em float daria 1290.0000000000002 sem o round.
    expect(lerCentavos('12,905')).toBe(1291);
  });

  it('devolve null quando não dá para ler', () => {
    expect(lerCentavos('')).toBeNull();
    expect(lerCentavos('abc')).toBeNull();
  });
});

describe('variacaoPercentual', () => {
  it('calcula quanto acima ou abaixo da média a pessoa pagou', () => {
    expect(variacaoPercentual(2140, 2400)).toBe(-11);
    expect(variacaoPercentual(2640, 2400)).toBe(10);
    expect(variacaoPercentual(2400, 2400)).toBe(0);
  });

  it('não divide por zero quando a região ainda não tem média', () => {
    expect(variacaoPercentual(2140, 0)).toBe(0);
  });
});
