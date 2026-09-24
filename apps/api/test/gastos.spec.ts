import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { GastosService } from '../src/modules/gastos/gastos.service.js';

/**
 * Aceite da Fase 4: "os números do seed batem com as telas".
 *
 * Este teste é o que liga o seed às telas de referência. Se alguém mexer num
 * preço do seed, ou num cálculo de agregação, a divergência aparece aqui — e
 * não três telas depois, quando já não se sabe qual dos dois mudou.
 *
 * Roda contra o banco semeado. Se falhar por falta de dados, rode:
 *   pnpm --filter @gastemenos/api db:seed
 */

/** Os valores que a tela Gastos mostra (referencia/telas/Gastos.dc.html). */
const TELA = {
  setembro: 128460,
  trimestre: 421290,
  ano: 1294030,
  categorias: {
    Mercearia: 53953,
    Bebidas: 23123,
    Hortifrúti: 19269,
    Limpeza: 17984,
    Higiene: 14131,
  } as Record<string, number>,
  orcamento: 160000,
};

describe('gastos — os números do seed batem com as telas', () => {
  const prisma = new PrismaClient();
  let gastos: GastosService;
  let camilaId: string;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      providers: [GastosService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    gastos = modulo.get(GastosService);

    const camila = await prisma.user.findUnique({
      where: { email: 'camila.alves@email.com' },
      select: { id: true },
    });

    if (!camila) {
      throw new Error(
        'O banco não está semeado. Rode: pnpm --filter @gastemenos/api db:seed',
      );
    }
    camilaId = camila.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('o total de setembro é R$ 1.284,60, como no cartão da tela', async () => {
    const resumo = await gastos.resumo(camilaId, 'month', '2026-09');
    expect(resumo.totalCents).toBe(TELA.setembro);
    expect(resumo.label).toBe('Total em setembro');
  });

  it('o trimestre é R$ 4.212,90', async () => {
    const resumo = await gastos.resumo(camilaId, '3months', '2026-09');
    expect(resumo.totalCents).toBe(TELA.trimestre);
    expect(resumo.label).toBe('Total de julho a setembro');
  });

  it('o ano é R$ 12.940,30', async () => {
    const resumo = await gastos.resumo(camilaId, 'year', '2026-09');
    expect(resumo.totalCents).toBe(TELA.ano);
    expect(resumo.label).toBe('Total em 2026');
  });

  it('traz o orçamento de R$ 1.600 e quanto ainda cabe', async () => {
    const resumo = await gastos.resumo(camilaId, 'month', '2026-09');
    expect(resumo.budgetCents).toBe(TELA.orcamento);
    expect(resumo.remainingCents).toBe(TELA.orcamento - TELA.setembro);
  });

  it('compara com agosto em vez de inventar variação', async () => {
    const resumo = await gastos.resumo(camilaId, 'month', '2026-09');
    expect(resumo.previousTotalCents).toBeGreaterThan(0);
    expect(resumo.changePercent).not.toBeNull();
    // A tela diz "18% menos que agosto".
    expect(resumo.changePercent).toBeLessThan(0);
  });

  it('as 5 categorias batem, uma a uma, com a legenda da rosca', async () => {
    const categorias = await gastos.porCategoria(camilaId, 'month', '2026-09');

    // Um objeto só na asserção: quando falha, o diff do Jest mostra qual
    // categoria divergiu e por quanto, em vez de parar na primeira.
    const porNome = Object.fromEntries(categorias.map((c) => [c.name, c.totalCents]));

    for (const nome of Object.keys(TELA.categorias)) {
      expect(porNome).toHaveProperty(nome);
    }
    expect(porNome).toMatchObject(TELA.categorias);
  });

  it('a maior categoria é Mercearia com 42%, como no miolo da rosca', async () => {
    const categorias = await gastos.porCategoria(camilaId, 'month', '2026-09');
    expect(categorias[0]?.name).toBe('Mercearia');
    expect(categorias[0]?.percent).toBe(42);
  });

  it('as categorias somam o total do mês', async () => {
    const categorias = await gastos.porCategoria(camilaId, 'month', '2026-09');
    const soma = categorias.reduce((total, c) => total + c.totalCents, 0);
    expect(soma).toBe(TELA.setembro);
  });

  it('as semanas somam o total do mês', async () => {
    const semanas = await gastos.porSemana(camilaId, '2026-09');
    const soma = semanas.reduce((total, s) => total + s.totalCents, 0);
    expect(soma).toBe(TELA.setembro);
  });

  it('cada semana do mês aparece, mesmo sem gasto', async () => {
    const semanas = await gastos.porSemana(camilaId, '2026-09');
    expect(semanas.length).toBeGreaterThanOrEqual(4);
    expect(semanas[0]?.label).toBe('Sem 1');
  });

  it('aponta o produto que mais pesou no mês', async () => {
    const destaques = await gastos.destaques(camilaId, '2026-09');
    expect(destaques.topProduct).not.toBeNull();
    expect(destaques.topProduct!.totalCents).toBeGreaterThan(0);
  });

  it('mês sem compra devolve zero, não erro', async () => {
    const resumo = await gastos.resumo(camilaId, 'month', '2020-01');
    expect(resumo.totalCents).toBe(0);
    // Sem período anterior não dá para comparar: null é honesto, 0% não seria.
    expect(resumo.changePercent).toBeNull();
  });
});
