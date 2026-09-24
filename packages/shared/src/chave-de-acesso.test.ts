import { describe, expect, it } from 'vitest';
import {
  calcularDigitoVerificador,
  emissaoNoFuturo,
  extrairChaveDaUrl,
  formatarChave,
  lerChaveDeAcesso,
  limparChave,
  valePontosPelaData,
} from './chave-de-acesso.js';

/** Monta uma chave válida fechando o DV, para os testes não dependerem de nota real. */
function chaveValida(opcoes: { uf?: string; aamm?: string; modelo?: string } = {}): string {
  const uf = opcoes.uf ?? '53'; // DF
  const aamm = opcoes.aamm ?? '2609';
  const cnpj = '12345678000199';
  const modelo = opcoes.modelo ?? '65';
  const serie = '001';
  const numero = '000012345';
  const tipoDeEmissao = '1';
  const codigo = '87654321';
  const base = `${uf}${aamm}${cnpj}${modelo}${serie}${numero}${tipoDeEmissao}${codigo}`;
  return base + calcularDigitoVerificador(base);
}

describe('limparChave', () => {
  it('tira espaços, pontos e traços', () => {
    expect(limparChave('5326 0912 3456 78')).toBe('53260912345678');
    expect(limparChave('53.2609-1234')).toBe('5326091234');
  });

  it('aguenta entrada vazia', () => {
    expect(limparChave('')).toBe('');
  });
});

describe('calcularDigitoVerificador', () => {
  it('fecha a chave que ele mesmo gera', () => {
    const chave = chaveValida();
    expect(calcularDigitoVerificador(chave.slice(0, 43))).toBe(Number(chave[43]));
  });

  it('devolve 0 quando o resto é 0 ou 1', () => {
    // Todos zeros somam 0 → resto 0 → dígito 0, pela regra da SEFAZ.
    expect(calcularDigitoVerificador('0'.repeat(43))).toBe(0);
  });
});

describe('lerChaveDeAcesso', () => {
  it('aceita uma chave válida e separa os campos', () => {
    const resultado = lerChaveDeAcesso(chaveValida());
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    expect(resultado.chave.uf).toBe('53');
    expect(resultado.chave.ano).toBe(2026);
    expect(resultado.chave.mes).toBe(9);
    expect(resultado.chave.cnpj).toBe('12345678000199');
    expect(resultado.chave.modelo).toBe('65');
    expect(resultado.chave.numero).toBe('000012345');
  });

  it('aceita a chave digitada com espaços', () => {
    expect(lerChaveDeAcesso(formatarChave(chaveValida())).ok).toBe(true);
  });

  it('recusa quando não tem 44 dígitos', () => {
    const resultado = lerChaveDeAcesso('123');
    expect(resultado).toEqual({ ok: false, code: 'INVALID_KEY' });
  });

  it('recusa quando o dígito verificador não fecha', () => {
    const chave = chaveValida();
    const dvErrado = (Number(chave[43]) + 1) % 10;
    const resultado = lerChaveDeAcesso(chave.slice(0, 43) + dvErrado);
    expect(resultado).toEqual({ ok: false, code: 'INVALID_KEY' });
  });

  it('recusa modelo 55 com NOT_NFCE, não com INVALID_KEY', () => {
    // A tela mostra mensagens diferentes: "chave errada" x "nota de outro tipo".
    const resultado = lerChaveDeAcesso(chaveValida({ modelo: '55' }));
    expect(resultado).toEqual({ ok: false, code: 'NOT_NFCE' });
  });

  it('recusa mês fora de 1 a 12', () => {
    expect(lerChaveDeAcesso(chaveValida({ aamm: '2613' }))).toEqual({
      ok: false,
      code: 'INVALID_KEY',
    });
  });
});

describe('datas da emissão', () => {
  const agora = new Date('2026-09-24T12:00:00Z');

  it('marca emissão no futuro', () => {
    const futura = lerChaveDeAcesso(chaveValida({ aamm: '2612' }));
    expect(futura.ok).toBe(true);
    if (!futura.ok) return;
    expect(emissaoNoFuturo(futura.chave, agora)).toBe(true);
  });

  it('nota do mês vale pontos', () => {
    const atual = lerChaveDeAcesso(chaveValida({ aamm: '2609' }));
    expect(atual.ok).toBe(true);
    if (!atual.ok) return;
    expect(valePontosPelaData(atual.chave, agora)).toBe(true);
  });

  it('nota de 6 meses ainda vale pontos, de 7 não', () => {
    const seisMeses = lerChaveDeAcesso(chaveValida({ aamm: '2603' }));
    const seteMeses = lerChaveDeAcesso(chaveValida({ aamm: '2602' }));
    expect(seisMeses.ok && valePontosPelaData(seisMeses.chave, agora)).toBe(true);
    expect(seteMeses.ok && valePontosPelaData(seteMeses.chave, agora)).toBe(false);
  });
});

describe('extrairChaveDaUrl', () => {
  it('acha a chave no formato ?p= do DF', () => {
    const chave = chaveValida();
    const url = `https://dfe.fazenda.df.gov.br/nfce/qrcode?p=${chave}|2|1|1|ABC123`;
    const resultado = extrairChaveDaUrl(url);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.chave.valor).toBe(chave);
  });

  it('acha a chave no formato ?chNFe= de outros estados', () => {
    const chave = chaveValida();
    const resultado = extrairChaveDaUrl(`https://www.fazenda.sp.gov.br/consulta?chNFe=${chave}`);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.chave.valor).toBe(chave);
  });

  it('devolve INVALID_QR quando o código não tem chave nenhuma', () => {
    expect(extrairChaveDaUrl('https://exemplo.com.br/promocao')).toEqual({
      ok: false,
      code: 'INVALID_QR',
    });
  });

  it('devolve o motivo real quando há 44 dígitos mas a chave é de outro modelo', () => {
    // Melhor dizer "nota de outro tipo" do que "não é nota fiscal".
    const url = `https://exemplo.gov.br?p=${chaveValida({ modelo: '55' })}`;
    expect(extrairChaveDaUrl(url)).toEqual({ ok: false, code: 'NOT_NFCE' });
  });
});

describe('formatarChave', () => {
  it('quebra em blocos de 4, como vem impresso na nota', () => {
    expect(formatarChave('5326091234567800019965001000012345187654321')).toBe(
      '5326 0912 3456 7800 0199 6500 1000 0123 4518 7654 321',
    );
  });
});
