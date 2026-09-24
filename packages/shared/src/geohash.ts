/**
 * Geohash: como o app define "a sua região".
 *
 * Um geohash de 5 caracteres é uma célula de cerca de 5 km — o raio que as
 * telas prometem. A região de uma pessoa é a célula do CEP dela mais as 8
 * vizinhas, senão quem mora na borda da célula nunca veria a loja do outro
 * lado da rua (docs/02-ARQUITETURA.md).
 *
 * Guardar geohash em vez de latitude/longitude também é decisão de
 * privacidade: 5 caracteres não localizam ninguém, e é o único dado de lugar
 * que sai nas observações de preço (docs/09-SEGURANCA-LGPD.md).
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/** Precisão padrão da região. 5 caracteres ≈ 4,9 km × 4,9 km. */
export const PRECISAO_DA_REGIAO = 5;

/** Latitude/longitude → geohash. */
export function codificarGeohash(lat: number, lng: number, precisao = PRECISAO_DA_REGIAO): string {
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;

  let hash = '';
  let bits = 0;
  let valor = 0;
  let ehLongitude = true;

  while (hash.length < precisao) {
    if (ehLongitude) {
      const meio = (lngMin + lngMax) / 2;
      if (lng >= meio) {
        valor = (valor << 1) + 1;
        lngMin = meio;
      } else {
        valor = valor << 1;
        lngMax = meio;
      }
    } else {
      const meio = (latMin + latMax) / 2;
      if (lat >= meio) {
        valor = (valor << 1) + 1;
        latMin = meio;
      } else {
        valor = valor << 1;
        latMax = meio;
      }
    }

    ehLongitude = !ehLongitude;

    if (++bits === 5) {
      hash += BASE32[valor];
      bits = 0;
      valor = 0;
    }
  }

  return hash;
}

export interface CaixaDoGeohash {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
  lat: number;
  lng: number;
}

/** Geohash → a caixa que ele representa, e o centro dela. */
export function decodificarGeohash(hash: string): CaixaDoGeohash {
  let latMin = -90;
  let latMax = 90;
  let lngMin = -180;
  let lngMax = 180;
  let ehLongitude = true;

  for (const caractere of hash.toLowerCase()) {
    const indice = BASE32.indexOf(caractere);
    if (indice === -1) throw new Error(`Geohash inválido: "${hash}"`);

    for (let bit = 4; bit >= 0; bit--) {
      const ligado = (indice >> bit) & 1;
      if (ehLongitude) {
        const meio = (lngMin + lngMax) / 2;
        if (ligado) lngMin = meio;
        else lngMax = meio;
      } else {
        const meio = (latMin + latMax) / 2;
        if (ligado) latMin = meio;
        else latMax = meio;
      }
      ehLongitude = !ehLongitude;
    }
  }

  return {
    latMin,
    latMax,
    lngMin,
    lngMax,
    lat: (latMin + latMax) / 2,
    lng: (lngMin + lngMax) / 2,
  };
}

type Direcao = 'n' | 's' | 'e' | 'w';

const VIZINHOS: Record<Direcao, [string, string]> = {
  n: ['p0r21436x8zb9dcf5h7kjnmqesgutwvy', 'bc01fg45238967deuvhjyznpkmstqrwx'],
  s: ['14365h7k9dcfesgujnmqp0r2twvyx8zb', '238967debc01fg45kmstqrwxuvhjyznp'],
  e: ['bc01fg45238967deuvhjyznpkmstqrwx', 'p0r21436x8zb9dcf5h7kjnmqesgutwvy'],
  w: ['238967debc01fg45kmstqrwxuvhjyznp', '14365h7k9dcfesgujnmqp0r2twvyx8zb'],
};

const BORDAS: Record<Direcao, [string, string]> = {
  n: ['prxz', 'bcfguvyz'],
  s: ['028b', '0145hjnp'],
  e: ['bcfguvyz', 'prxz'],
  w: ['0145hjnp', '028b'],
};

/** A célula ao lado, numa das quatro direções. */
export function geohashVizinho(hash: string, direcao: Direcao): string {
  const minusculo = hash.toLowerCase();
  const ultimo = minusculo.at(-1);
  if (!ultimo) throw new Error('Geohash vazio');

  let base = minusculo.slice(0, -1);
  const par = minusculo.length % 2 === 0 ? 0 : 1;

  // Na borda da célula-pai, o vizinho está na célula-pai ao lado: sobe um nível.
  if (BORDAS[direcao][par].includes(ultimo) && base !== '') {
    base = geohashVizinho(base, direcao);
  }

  const indice = VIZINHOS[direcao][par].indexOf(ultimo);
  if (indice === -1) throw new Error(`Geohash inválido: "${hash}"`);

  return base + BASE32[indice];
}

/**
 * A célula mais as 8 ao redor — é isto que o app chama de "região".
 *
 * Sempre 9 valores, com a própria célula na primeira posição, para as
 * consultas de preço usarem `WHERE geohash IN (...)`.
 */
export function regiaoDoGeohash(hash: string): string[] {
  const norte = geohashVizinho(hash, 'n');
  const sul = geohashVizinho(hash, 's');

  return [
    hash,
    norte,
    sul,
    geohashVizinho(hash, 'e'),
    geohashVizinho(hash, 'w'),
    geohashVizinho(norte, 'e'),
    geohashVizinho(norte, 'w'),
    geohashVizinho(sul, 'e'),
    geohashVizinho(sul, 'w'),
  ];
}

/** Distância em km entre dois pontos (Haversine), para "a 1,2 km de você". */
export function distanciaEmKm(
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
): number {
  const RAIO_DA_TERRA_KM = 6371;
  const paraRadianos = (grau: number): number => (grau * Math.PI) / 180;

  const dLat = paraRadianos(latB - latA);
  const dLng = paraRadianos(lngB - lngA);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRadianos(latA)) * Math.cos(paraRadianos(latB)) * Math.sin(dLng / 2) ** 2;

  return RAIO_DA_TERRA_KM * 2 * Math.asin(Math.sqrt(a));
}
