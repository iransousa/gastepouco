import { Injectable, Logger } from '@nestjs/common';

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface EnderecoDaLoja {
  address?: string | null;
  city?: string | null;
  uf: string;
}

const UM_SEGUNDO = 1000;

/**
 * Geocodificação de loja (Nominatim / OpenStreetMap).
 *
 * Antes disto, **toda loja do país recebia as coordenadas do centro de
 * Brasília** — um `lat/lng` fixo no código. O efeito não era "menos preciso": o
 * geohash de 5 caracteres é a unidade de tudo que depende de região, então um
 * mercado em Pinheiros entrava no mesmo bloco de 5 km que um em Ceilândia. A
 * "média da sua região" de quem mora em SP era calculada com compras do DF, e o
 * piso de anonimato de 5 notas/3 pessoas era atingido por gente de outro
 * estado. Dado errado, não dado impreciso.
 *
 * Quatro regras que o serviço segue, e todas vêm da política de uso do
 * Nominatim — é um serviço público, mantido por doação:
 *
 * 1. **Uma requisição por segundo, no máximo**, serializadas. Rajada é o que
 *    faz um IP ser bloqueado, e aí a geocodificação para para todo mundo.
 * 2. **User-Agent que identifica o projeto**, com endereço de contato.
 * 3. **Cache**: a mesma loja é consultada uma vez na vida. Quem chama já
 *    pergunta só por CNPJ novo, e aqui há cache por endereço para o caso de
 *    duas filiais no mesmo lugar.
 * 4. **Nunca estourar.** Portal fora do ar, resposta estranha, tempo esgotado:
 *    devolve `null`. Quem chama decide o que fazer — e a decisão tomada em
 *    `notas.service` é deixar a loja **sem região** em vez de inventar uma.
 *
 * A segunda tentativa, por cidade e UF, existe porque o endereço da NFC-e vem
 * abreviado e com ruído ("R LUIZ GOES 1500 LJ 2"); cidade + UF quase sempre
 * resolve, e erra por quilômetros em vez de por estados.
 */
@Injectable()
export class GeocodificacaoService {
  private readonly logger = new Logger(GeocodificacaoService.name);
  private readonly cache = new Map<string, Coordenadas | null>();
  private ultimaConsulta = 0;
  private fila: Promise<unknown> = Promise.resolve();

  private get endereco(): string {
    return process.env.GEOCODER_URL ?? 'https://nominatim.openstreetmap.org/search';
  }

  private get identificacao(): string {
    return (
      process.env.GEOCODER_USER_AGENT ?? 'GasteMenos/0.1 (contato@gastemenos.com.br)'
    );
  }

  /** Desligar é uma opção legítima: sem rede, a leitura de nota continua. */
  private get ligado(): boolean {
    return process.env.GEOCODER_DISABLED !== 'true';
  }

  async coordenadasDe(loja: EnderecoDaLoja): Promise<Coordenadas | null> {
    if (!this.ligado) return null;

    // Só a UF não serve: "DF, Brasil" devolve o centro do Distrito Federal, uma
    // região onde ninguém compra — é o mesmo erro do centro de Brasília com
    // outro nome. Sem endereço nem cidade, a loja fica sem região.
    if (!loja.address?.trim() && !loja.city?.trim()) return null;

    const tentativas = [
      [loja.address, loja.city, loja.uf, 'Brasil'].filter(Boolean).join(', '),
      [loja.city, loja.uf, 'Brasil'].filter(Boolean).join(', '),
    ].filter(
      (consulta, indice, todas) => Boolean(consulta) && todas.indexOf(consulta) === indice,
    );

    for (const consulta of tentativas) {
      if (this.cache.has(consulta)) {
        const guardada = this.cache.get(consulta) ?? null;
        if (guardada) return guardada;
        continue;
      }

      const achada = await this.consultarNaFila(consulta);
      this.cache.set(consulta, achada);
      if (achada) return achada;
    }

    return null;
  }

  /**
   * Serializa as consultas e espera um segundo entre elas.
   *
   * A fila é uma corrente de promessas: cada chamada entra atrás da anterior,
   * então dez notas processadas ao mesmo tempo viram dez consultas em sequência
   * — e não dez simultâneas que derrubariam o limite do serviço.
   */
  private async consultarNaFila(consulta: string): Promise<Coordenadas | null> {
    const minha = this.fila.then(async () => {
      const desdeAUltima = Date.now() - this.ultimaConsulta;
      if (desdeAUltima < UM_SEGUNDO) {
        await new Promise((pronto) => setTimeout(pronto, UM_SEGUNDO - desdeAUltima));
      }
      this.ultimaConsulta = Date.now();
      return this.consultar(consulta);
    });

    // A fila nunca guarda rejeição: se uma consulta falhar, a seguinte anda.
    this.fila = minha.catch(() => null);
    return minha;
  }

  protected async consultar(consulta: string): Promise<Coordenadas | null> {
    const url = new URL(this.endereco);
    url.searchParams.set('q', consulta);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'br');

    try {
      const resposta = await fetch(url, {
        headers: { 'User-Agent': this.identificacao, 'Accept-Language': 'pt-BR' },
        signal: AbortSignal.timeout(5000),
      });

      if (!resposta.ok) {
        this.logger.warn(`Nominatim respondeu ${resposta.status} para "${consulta}".`);
        return null;
      }

      const corpo = (await resposta.json()) as Array<{ lat?: string; lon?: string }>;
      const primeiro = Array.isArray(corpo) ? corpo[0] : undefined;
      if (!primeiro?.lat || !primeiro.lon) return null;

      const lat = Number(primeiro.lat);
      const lng = Number(primeiro.lon);

      // Fora do Brasil não serve: `countrycodes` já filtra, mas resposta
      // inesperada não pode virar uma loja no meio do oceano.
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      if (lat > 6 || lat < -34 || lng > -34 || lng < -74) {
        this.logger.warn(`Coordenada fora do Brasil para "${consulta}"; ignorada.`);
        return null;
      }

      return { lat, lng };
    } catch (falha) {
      const motivo = falha instanceof Error ? falha.message : String(falha);
      this.logger.warn(`Geocodificação de "${consulta}" falhou: ${motivo}`);
      return null;
    }
  }
}
