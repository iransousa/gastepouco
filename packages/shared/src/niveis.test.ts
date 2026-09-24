import { describe, expect, it } from 'vitest';
import { custoDoNivel, nomeDoNivel, pontosParaChegarAoNivel, situacaoDoNivel } from './niveis.js';

describe('custoDoNivel', () => {
  it('cobra 500 do nível 1 ao 12', () => {
    expect(custoDoNivel(1)).toBe(500);
    expect(custoDoNivel(12)).toBe(500);
  });

  it('cobra 100 a mais por nível a partir do 13', () => {
    expect(custoDoNivel(13)).toBe(600);
    expect(custoDoNivel(14)).toBe(700);
    expect(custoDoNivel(20)).toBe(1300);
  });
});

describe('situacaoDoNivel', () => {
  it('começa no nível 1 sem pontos', () => {
    const s = situacaoDoNivel(0);
    expect(s.nivel).toBe(1);
    expect(s.nome).toBe('Iniciante');
    expect(s.pontosNoNivel).toBe(0);
    expect(s.progresso).toBe(0);
  });

  it('reproduz a Camila do seed: nível 12 com 460 pontos no nível', () => {
    // 11 níveis de 500 = 5500 para chegar ao 12, mais 460 dentro dele.
    const s = situacaoDoNivel(pontosParaChegarAoNivel(12) + 460);
    expect(s.nivel).toBe(12);
    expect(s.nome).toBe('Caçador de Ofertas');
    expect(s.pontosNoNivel).toBe(460);
    expect(s.metaDoNivel).toBe(500);
    expect(s.pontosAteOProximo).toBe(40);
    expect(s.progresso).toBe(92);
  });

  it('sobe de nível exatamente na meta', () => {
    expect(situacaoDoNivel(500).nivel).toBe(2);
    expect(situacaoDoNivel(499).nivel).toBe(1);
  });

  it('atravessa a mudança de custo no nível 13', () => {
    const noComecoDo13 = pontosParaChegarAoNivel(13);
    expect(noComecoDo13).toBe(6000); // 12 × 500
    expect(situacaoDoNivel(noComecoDo13).nivel).toBe(13);
    expect(situacaoDoNivel(noComecoDo13).metaDoNivel).toBe(600);
    expect(situacaoDoNivel(noComecoDo13 + 599).nivel).toBe(13);
    expect(situacaoDoNivel(noComecoDo13 + 600).nivel).toBe(14);
  });

  it('trata pontos negativos como zero em vez de quebrar', () => {
    expect(situacaoDoNivel(-100).nivel).toBe(1);
  });
});

describe('nomeDoNivel', () => {
  it('usa os nomes da tabela do documento', () => {
    expect(nomeDoNivel(1)).toBe('Iniciante');
    expect(nomeDoNivel(3)).toBe('Iniciante');
    expect(nomeDoNivel(4)).toBe('Pesquisador de Preços');
    expect(nomeDoNivel(7)).toBe('Econômico');
    expect(nomeDoNivel(11)).toBe('Econômico');
    expect(nomeDoNivel(12)).toBe('Caçador de Ofertas');
    expect(nomeDoNivel(13)).toBe('Mestre da Feira');
    expect(nomeDoNivel(14)).toBe('Rei do Atacado');
    expect(nomeDoNivel(15)).toBe('Lenda da Economia');
    expect(nomeDoNivel(99)).toBe('Lenda da Economia');
  });
});
