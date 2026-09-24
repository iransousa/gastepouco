import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { apagarUsuarioDeTeste } from './limpeza.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SessoesService } from '../src/modules/auth/sessoes.service.js';

/**
 * Rotação de refresh: as duas metades da regra.
 *
 * O caso da "renovação perdida" não veio de teoria. Ele apareceu no e2e da
 * Fase 7: cada carregamento de página renova a sessão, uma navegação cancelou
 * a resposta no meio do caminho, o cookie ficou com o token antigo e a
 * detecção de reutilização derrubou a sessão inteira de uma pessoa que não
 * tinha feito nada de errado.
 */
describe('sessões', () => {
  const prisma = new PrismaClient();
  let sessoes: SessoesService;
  let pessoa: string;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      providers: [SessoesService, JwtService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    sessoes = modulo.get(SessoesService);
  });

  beforeEach(async () => {
    const usuario = await prisma.user.create({
      data: {
        email: `sessao.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@exemplo.test`,
        name: 'Pessoa de Teste',
        rankingName: 'Pessoa T.',
        emailVerifiedAt: new Date(),
        inviteCode: `S${Date.now().toString(36).toUpperCase().slice(-7)}`,
        regionGeohash: '6vjyq',
      },
      select: { id: true },
    });
    pessoa = usuario.id;
  });

  afterEach(async () => {
    await apagarUsuarioDeTeste(prisma, pessoa);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function sessoesVivas(): Promise<number> {
    return prisma.session.count({ where: { userId: pessoa, revokedAt: null } });
  }

  it('renova e queima o token anterior', async () => {
    const primeiro = await sessoes.criar(pessoa, 'pessoa@exemplo.test', 'Este celular');
    const segundo = await sessoes.rotacionar(primeiro.refresh);

    expect(segundo).not.toBeNull();
    expect(segundo!.refresh).not.toBe(primeiro.refresh);
    expect(await sessoesVivas()).toBe(1);
  });

  it('a resposta perdida não derruba a sessão: o token antigo vale de novo', async () => {
    const primeiro = await sessoes.criar(pessoa, 'pessoa@exemplo.test', 'Este celular');

    // A renovação aconteceu no servidor, mas a resposta não chegou ao cliente.
    const perdido = await sessoes.rotacionar(primeiro.refresh);
    expect(perdido).not.toBeNull();

    // O cliente volta com o token que ainda tem: o antigo.
    const segundaChance = await sessoes.rotacionar(primeiro.refresh);

    expect(segundaChance).not.toBeNull();
    expect(segundaChance!.refresh).not.toBe(perdido!.refresh);
    expect(await sessoesVivas()).toBe(1);
  });

  it('mas o token antigo só vale enquanto o novo não foi usado', async () => {
    const primeiro = await sessoes.criar(pessoa, 'pessoa@exemplo.test', 'Este celular');
    const segundo = await sessoes.rotacionar(primeiro.refresh);

    // Desta vez o cliente recebeu e usou o token novo.
    const terceiro = await sessoes.rotacionar(segundo!.refresh);
    expect(terceiro).not.toBeNull();

    // O primeiro reaparecendo agora são duas partes com token na mão.
    const reutilizado = await sessoes.rotacionar(primeiro.refresh);

    expect(reutilizado).toBeNull();
    expect(await sessoesVivas()).toBe(0);
  });

  it('token desconhecido não revoga nada', async () => {
    await sessoes.criar(pessoa, 'pessoa@exemplo.test', 'Este celular');

    expect(await sessoes.rotacionar('token-que-nunca-existiu')).toBeNull();
    expect(await sessoesVivas()).toBe(1);
  });

  it('sair de um aparelho não derruba os outros', async () => {
    const celular = await sessoes.criar(pessoa, 'pessoa@exemplo.test', 'Este celular');
    const computador = await sessoes.criar(pessoa, 'pessoa@exemplo.test', 'Navegador no computador');

    await sessoes.revogar(celular.refresh);

    expect(await sessoes.rotacionar(computador.refresh)).not.toBeNull();
  });
});
