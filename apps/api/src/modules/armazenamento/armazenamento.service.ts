import { Injectable, Logger } from '@nestjs/common';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { configuracao } from '../../comum/configuracao.js';

/**
 * Guarda os arquivos que a API gera — hoje, o ZIP de "Baixar meus dados".
 *
 * Dois destinos, escolhidos pelo ambiente:
 *
 * - **Disco**, em desenvolvimento e nos testes. Simples e sem credencial.
 * - **Supabase Storage**, em produção. O disco do container é efêmero: um
 *   deploy entre o pedido e o download apagaria o arquivo, e a pessoa veria
 *   "pronto" num link que não baixa nada.
 *
 * O arquivo **nunca ganha URL pública, nem assinada**. Quem baixa passa pelo
 * endpoint autenticado da API, que busca o conteúdo aqui. Link assinado é
 * portátil por natureza: circula em conversa, sobrevive à troca de senha e vale
 * para qualquer um que o receba — num arquivo que tem o histórico de compras
 * inteiro de uma pessoa, isso não é aceitável (docs/09-SEGURANCA-LGPD.md).
 *
 * Chamado só pelo servidor, com a chave de serviço, que jamais vai para o web.
 */
@Injectable()
export class ArmazenamentoService {
  private readonly logger = new Logger(ArmazenamentoService.name);

  constructor() {
    if (configuracao.ehProducao && !configuracao.armazenamento.noSupabase) {
      this.logger.warn(
        'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes: as exportações vão para o disco do ' +
          'container, e um deploy apaga o arquivo antes de a pessoa baixar.',
      );
    }
  }

  get destino(): 'supabase' | 'disco' {
    return configuracao.armazenamento.noSupabase ? 'supabase' : 'disco';
  }

  async guardar(chave: string, conteudo: Buffer, tipo = 'application/zip'): Promise<void> {
    if (this.destino === 'disco') {
      await mkdir(configuracao.armazenamento.pasta, { recursive: true });
      await writeFile(join(configuracao.armazenamento.pasta, chave), conteudo);
      return;
    }

    // `x-upsert` porque o mesmo id de exportação nunca é reaproveitado: se o
    // arquivo já existe, é reprocessamento, e sobrescrever é o certo.
    const resposta = await fetch(this.endereco(chave), {
      method: 'POST',
      headers: { ...this.cabecalhos(), 'Content-Type': tipo, 'x-upsert': 'true' },
      body: new Uint8Array(conteudo),
    });

    if (!resposta.ok) {
      throw new Error(`Storage recusou a gravação de ${chave}: ${resposta.status}`);
    }
  }

  async ler(chave: string): Promise<Buffer> {
    if (this.destino === 'disco') {
      return readFile(join(configuracao.armazenamento.pasta, chave));
    }

    const resposta = await fetch(this.endereco(chave), { headers: this.cabecalhos() });
    if (!resposta.ok) {
      throw new Error(`Storage não devolveu ${chave}: ${resposta.status}`);
    }

    return Buffer.from(await resposta.arrayBuffer());
  }

  /** Apagar é melhor esforço: o registro no banco é quem manda. */
  async apagar(chave: string): Promise<void> {
    try {
      if (this.destino === 'disco') {
        await unlink(join(configuracao.armazenamento.pasta, chave));
        return;
      }

      await fetch(this.endereco(chave), { method: 'DELETE', headers: this.cabecalhos() });
    } catch {
      this.logger.debug(`Não foi possível apagar ${chave}; o registro já foi marcado.`);
    }
  }

  private endereco(chave: string): string {
    const { url, balde } = configuracao.armazenamento;
    return `${url.replace(/\/$/, '')}/storage/v1/object/${balde}/${encodeURIComponent(chave)}`;
  }

  private cabecalhos(): Record<string, string> {
    const chave = configuracao.armazenamento.chaveDeServico;
    return { Authorization: `Bearer ${chave}`, apikey: chave };
  }
}
