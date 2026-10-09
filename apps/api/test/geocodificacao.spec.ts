import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { apagarUsuariosDeTeste } from './limpeza.js';
import { provedoresDeRecompensa } from './provedores.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { GeocodificacaoJob } from '../src/modules/notas/geocodificacao.job.js';
import {
  GeocodificacaoService,
  type Coordenadas,
} from '../src/modules/notas/geocodificacao.service.js';

/**
 * Geocodificação de loja.
 *
 * O defeito que isto corrige era silencioso e caro: **toda loja do país recebia
 * as coordenadas do centro de Brasília**. Como o geohash de 5 caracteres é a
 * unidade de tudo que depende de região, um mercado em Pinheiros caía no mesmo
 * bloco de 5 km que um em Ceilândia — a "média da sua região" de quem mora em SP
 * saía de compras do DF, e o piso de anonimato de 5 notas/3 pessoas era atingido
 * por gente de outro estado.
 *
 * Nada aqui vai à rede: o que é exercitado é a decisão (ordem das tentativas,
 * cache, limite de uma por segundo, recusa de resposta estranha). Bater no
 * Nominatim dentro da suíte seria teste que falha por rede e rajada contra um
 * serviço mantido por doação.
 */
describe('geocodificação', () => {
  const ambienteOriginal = { ...process.env };

  /** Expõe as consultas feitas e responde o que o teste mandar. */
  class GeocodificacaoDeTeste extends GeocodificacaoService {
    consultas: string[] = [];
    resposta: (consulta: string) => Coordenadas | null = () => null;

    protected override async consultar(consulta: string): Promise<Coordenadas | null> {
      this.consultas.push(consulta);
      return Promise.resolve(this.resposta(consulta));
    }
  }

  afterEach(() => {
    process.env = { ...ambienteOriginal };
  });

  const vilaNova = {
    address: 'QNM 34 CONJUNTO B LOTE 10',
    city: 'Ceilândia',
    uf: 'DF',
  };

  it('pergunta primeiro pelo endereço completo', async () => {
    const geo = new GeocodificacaoDeTeste();
    geo.resposta = () => ({ lat: -15.8167, lng: -48.1089 });

    const ponto = await geo.coordenadasDe(vilaNova);

    expect(ponto).toEqual({ lat: -15.8167, lng: -48.1089 });
    expect(geo.consultas).toHaveLength(1);
    expect(geo.consultas[0]).toBe('QNM 34 CONJUNTO B LOTE 10, Ceilândia, DF, Brasil');
  });

  /**
   * O endereço da NFC-e vem abreviado e com ruído ("R LUIZ GOES 1500 LJ 2").
   * Cidade + UF erra por quilômetros; o centro de Brasília errava por estados.
   */
  it('não achando o endereço, tenta cidade e UF', async () => {
    const geo = new GeocodificacaoDeTeste();
    geo.resposta = (consulta) =>
      consulta.startsWith('Ceilândia') ? { lat: -15.8167, lng: -48.1089 } : null;

    const ponto = await geo.coordenadasDe(vilaNova);

    expect(ponto).not.toBeNull();
    expect(geo.consultas).toEqual([
      'QNM 34 CONJUNTO B LOTE 10, Ceilândia, DF, Brasil',
      'Ceilândia, DF, Brasil',
    ]);
  });

  it('sem achar nada, devolve null — e quem chama decide', async () => {
    const geo = new GeocodificacaoDeTeste();
    geo.resposta = () => null;

    expect(await geo.coordenadasDe(vilaNova)).toBeNull();
  });

  it('a mesma loja é consultada uma vez na vida', async () => {
    const geo = new GeocodificacaoDeTeste();
    geo.resposta = () => ({ lat: -15.8167, lng: -48.1089 });

    await geo.coordenadasDe(vilaNova);
    await geo.coordenadasDe(vilaNova);
    await geo.coordenadasDe({ ...vilaNova });

    expect(geo.consultas).toHaveLength(1);
  });

  it('endereço que falhou não é perguntado de novo', async () => {
    const geo = new GeocodificacaoDeTeste();
    geo.resposta = () => null;

    await geo.coordenadasDe(vilaNova);
    await geo.coordenadasDe(vilaNova);

    // Duas tentativas na primeira chamada, nenhuma na segunda.
    expect(geo.consultas).toHaveLength(2);
  });

  /**
   * Rajada é o que faz um IP ser bloqueado no Nominatim — e aí a
   * geocodificação para para todo mundo. Dez notas processadas juntas viram dez
   * consultas em sequência.
   */
  it('respeita uma consulta por segundo, em sequência', async () => {
    const geo = new GeocodificacaoDeTeste();
    geo.resposta = () => ({ lat: -15.8, lng: -48.1 });

    const comecou = Date.now();
    await Promise.all([
      geo.coordenadasDe({ address: 'A 1', city: 'Ceilândia', uf: 'DF' }),
      geo.coordenadasDe({ address: 'B 2', city: 'Ceilândia', uf: 'DF' }),
    ]);

    expect(geo.consultas).toHaveLength(2);
    expect(Date.now() - comecou).toBeGreaterThanOrEqual(900);
  }, 10_000);

  it('uma consulta que explode não trava a fila', async () => {
    const geo = new GeocodificacaoDeTeste();
    let primeira = true;
    geo.resposta = () => {
      if (primeira) {
        primeira = false;
        throw new Error('rede caiu');
      }
      return { lat: -15.8, lng: -48.1 };
    };

    await expect(
      geo.coordenadasDe({ address: 'A 1', city: 'Ceilândia', uf: 'DF' }),
    ).rejects.toThrow();

    const ponto = await geo.coordenadasDe({ address: 'B 2', city: 'Ceilândia', uf: 'DF' });
    expect(ponto).not.toBeNull();
  }, 10_000);

  it('desligado pela configuração, não consulta nada', async () => {
    process.env.GEOCODER_DISABLED = 'true';
    const geo = new GeocodificacaoDeTeste();
    geo.resposta = () => ({ lat: -15.8, lng: -48.1 });

    expect(await geo.coordenadasDe(vilaNova)).toBeNull();
    expect(geo.consultas).toHaveLength(0);
  });

  it('endereço curto demais não vira consulta', async () => {
    const geo = new GeocodificacaoDeTeste();
    geo.resposta = () => ({ lat: -15.8, lng: -48.1 });

    await geo.coordenadasDe({ address: null, city: null, uf: 'DF' });

    expect(geo.consultas).toHaveLength(0);
  });
});

/**
 * A faixa do Brasil, conferida no serviço de verdade (sem dublê de `consultar`,
 * com `fetch` trocado): resposta inesperada não pode virar uma loja no meio do
 * oceano, porque daí sai um geohash que ninguém nunca vai visitar e uma
 * "região" fantasma no agregado.
 */
describe('geocodificação: resposta estranha', () => {
  const fetchOriginal = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
  });

  function responder(corpo: unknown, ok = true): void {
    globalThis.fetch = (async () => ({
      ok,
      status: ok ? 200 : 503,
      json: async () => corpo,
    })) as unknown as typeof fetch;
  }

  it('aceita coordenada dentro do Brasil', async () => {
    responder([{ lat: '-23.5505', lon: '-46.6333' }]);
    const geo = new GeocodificacaoService();

    expect(await geo.coordenadasDe({ address: 'Av Paulista 1000', city: 'São Paulo', uf: 'SP' }))
      .toEqual({ lat: -23.5505, lng: -46.6333 });
  });

  it('recusa coordenada fora do Brasil', async () => {
    responder([{ lat: '48.8566', lon: '2.3522' }]);
    const geo = new GeocodificacaoService();

    expect(
      await geo.coordenadasDe({ address: 'Rue de Rivoli 1', city: 'Paris', uf: 'SP' }),
    ).toBeNull();
  });

  it('lista vazia, corpo estranho e erro do servidor viram null', async () => {
    responder([]);
    expect(await new GeocodificacaoService().coordenadasDe(
      { address: 'Rua A 1', city: 'Natal', uf: 'RN' },
    )).toBeNull();

    responder({ erro: 'sei la' });
    expect(await new GeocodificacaoService().coordenadasDe(
      { address: 'Rua B 2', city: 'Natal', uf: 'RN' },
    )).toBeNull();

    responder([{ lat: '-5.79', lon: '-35.2' }], false);
    expect(await new GeocodificacaoService().coordenadasDe(
      { address: 'Rua C 3', city: 'Natal', uf: 'RN' },
    )).toBeNull();
  }, 15_000);
});

/**
 * A segunda metade do conserto.
 *
 * Geocodificar de novo, sozinho, não serviria para nada: a observação de preço é
 * criada no instante em que a nota é concluída, e esse instante já passou. Sem
 * preencher o que faltou, a loja ganharia região e as notas já lidas nela
 * continuariam fora do agregado — e fora da conta da recompensa.
 */
describe('varredura noturna da geocodificação', () => {
  const prisma = new PrismaClient();
  const ambienteOriginal = { ...process.env };

  let job: GeocodificacaoJob;
  let pessoaId: string;
  let lojaId: string;
  let produtoId: string;
  let marca: string;

  beforeAll(async () => {
    // Um marco por nota: o que se quer provar é que o preenchimento alimenta a
    // recompensa, não a aritmética do marco (isso é recompensas.spec.ts).
    process.env.REWARD_FIRST_MILESTONE = '1';
    process.env.REWARD_MILESTONE_STEP = '1';
    process.env.REWARD_MILESTONE_CENTS = '200';

    const modulo = await Test.createTestingModule({
      providers: [
        GeocodificacaoJob,
        ...provedoresDeRecompensa(),
        {
          provide: GeocodificacaoService,
          useValue: { coordenadasDe: async () => ({ lat: -23.5505, lng: -46.6333 }) },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    job = modulo.get(GeocodificacaoJob);
  });

  beforeEach(async () => {
    marca = `${Date.now()}.${Math.random().toString(36).slice(2, 7)}`;

    const pessoa = await prisma.user.create({
      data: {
        email: `geo.${marca}@exemplo.test`,
        name: 'Pessoa Geo',
        rankingName: 'Geo',
        cep: '01310930',
        regionGeohash: '6gyf4',
        cpfHash: `hash-de-teste-${marca}`,
        emailVerifiedAt: new Date(),
        inviteCode: `G${marca.toUpperCase().slice(-7)}`,
        profile: {
          create: {
            householdSize: '2',
            storeTypes: ['super'],
            frequency: 'sem',
            monthlySpendBand: 'b',
            priorities: ['preco'],
            persona: 'Família Planejadora',
            budgetCents: 90000,
          },
        },
      },
      select: { id: true },
    });
    pessoaId = pessoa.id;

    // A loja que entrou sem região: é este o caso que o job existe para
    // consertar.
    const loja = await prisma.store.create({
      data: {
        cnpj: `${Date.now()}1`.padStart(14, '8').slice(-14),
        name: `Mercado Paulista ${marca}`,
        address: 'AV PAULISTA 1000',
        city: 'São Paulo',
        uf: 'SP',
        geohash: null,
      },
      select: { id: true },
    });
    lojaId = loja.id;

    const produto = await prisma.product.create({
      data: { normalizedName: `cafe-${marca}`, displayName: 'Café 500 g' },
      select: { id: true },
    });
    produtoId = produto.id;

    const nota = await prisma.receipt.create({
      data: {
        accessKey: `35${String(Date.now()).slice(-10)}`.padEnd(44, '7').slice(0, 44),
        userId: pessoaId,
        storeId: lojaId,
        status: 'DONE',
        source: 'qr',
        issuedAt: new Date(),
        totalCents: 2490,
        processedAt: new Date(),
      },
      select: { id: true },
    });

    await prisma.receiptItem.create({
      data: {
        receiptId: nota.id,
        productId: produtoId,
        rawDescription: 'CAFE 500G',
        quantity: 1,
        unit: 'un',
        unitPriceCents: 2490,
        totalCents: 2490,
      },
    });
  });

  afterEach(async () => {
    await prisma.priceObservation.deleteMany({ where: { storeId: lojaId } });
    await prisma.receipt.deleteMany({ where: { userId: pessoaId } });
    await prisma.rewardLedger.deleteMany({ where: { userId: pessoaId } });
    await prisma.store.deleteMany({ where: { id: lojaId } });
    await prisma.product.deleteMany({ where: { id: produtoId } });
    await apagarUsuariosDeTeste(prisma, [pessoaId]);
  });

  afterAll(async () => {
    process.env = { ...ambienteOriginal };
    await prisma.$disconnect();
  });

  it('dá região à loja pendente e preenche a observação que faltou', async () => {
    expect(await prisma.priceObservation.count({ where: { storeId: lojaId } })).toBe(0);

    await job.geocodificarPendentes();

    const loja = await prisma.store.findUniqueOrThrow({
      where: { id: lojaId },
      select: { lat: true, lng: true, geohash: true },
    });
    expect(loja.geohash).toHaveLength(5);
    expect(loja.lat).toBeCloseTo(-23.5505, 3);

    const observacao = await prisma.priceObservation.findFirstOrThrow({
      where: { storeId: lojaId },
      select: { geohash: true, unitPriceCents: true, userHash: true },
    });
    expect(observacao.geohash).toBe(loja.geohash);
    expect(observacao.unitPriceCents).toBe(2490);
    // A observação entra sem ligação com a pessoa: HMAC, nunca o id.
    expect(observacao.userHash).not.toContain(pessoaId);
  });

  it('a recompensa sai na mesma varredura, sem esperar outra noite', async () => {
    await job.geocodificarPendentes();

    const creditos = await prisma.rewardLedger.findMany({
      where: { userId: pessoaId, reason: 'MILESTONE' },
      select: { amountCents: true },
    });
    expect(creditos).toHaveLength(1);
    expect(creditos[0]!.amountCents).toBe(200);
  });

  it('rodar duas vezes não duplica observação nem crédito', async () => {
    await job.geocodificarPendentes();
    await job.geocodificarPendentes();

    expect(await prisma.priceObservation.count({ where: { storeId: lojaId } })).toBe(1);
    expect(
      await prisma.rewardLedger.count({ where: { userId: pessoaId, reason: 'MILESTONE' } }),
    ).toBe(1);
  });
});
