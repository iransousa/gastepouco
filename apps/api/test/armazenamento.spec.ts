import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ArmazenamentoService } from '../src/modules/armazenamento/armazenamento.service.js';

/**
 * O destino é escolhido pelo ambiente, e errar essa escolha é caro dos dois
 * lados: em produção, arquivo no disco efêmero some no deploy seguinte; em
 * desenvolvimento, uma chamada ao Supabase quebra a suíte de quem não tem
 * credencial. Por isso a escolha tem teste.
 */
describe('armazenamento', () => {
  const ambienteOriginal = { ...process.env };
  let pasta: string;

  beforeEach(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'gastemenos-'));
    process.env.EXPORT_DIR = pasta;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(async () => {
    process.env = { ...ambienteOriginal };
    await rm(pasta, { recursive: true, force: true });
  });

  it('sem credencial, grava e lê no disco', async () => {
    const armazenamento = new ArmazenamentoService();
    expect(armazenamento.destino).toBe('disco');

    await armazenamento.guardar('exemplo.zip', Buffer.from('conteúdo'));

    expect(await readFile(join(pasta, 'exemplo.zip'), 'utf8')).toBe('conteúdo');
    expect((await armazenamento.ler('exemplo.zip')).toString()).toBe('conteúdo');

    await armazenamento.apagar('exemplo.zip');
    await expect(armazenamento.ler('exemplo.zip')).rejects.toThrow();
  });

  it('apagar o que não existe não explode: o registro no banco é quem manda', async () => {
    const armazenamento = new ArmazenamentoService();
    await expect(armazenamento.apagar('nunca-existiu.zip')).resolves.toBeUndefined();
  });

  it('com as duas credenciais, o destino passa a ser o Supabase', () => {
    process.env.SUPABASE_URL = 'https://exemplo.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_exemplo';

    expect(new ArmazenamentoService().destino).toBe('supabase');
  });

  it('o nome antigo da variável continua valendo', () => {
    process.env.SUPABASE_URL = 'https://exemplo.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-servico-antiga';

    expect(new ArmazenamentoService().destino).toBe('supabase');
  });

  it('só a URL, sem a chave, continua no disco', () => {
    process.env.SUPABASE_URL = 'https://exemplo.supabase.co';

    expect(new ArmazenamentoService().destino).toBe('disco');
  });
});
