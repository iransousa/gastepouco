import { describe, expect, it } from 'vitest';
import {
  codificarGeohash,
  decodificarGeohash,
  distanciaEmKm,
  geohashVizinho,
  regiaoDoGeohash,
} from './geohash.js';

describe('codificarGeohash', () => {
  it('reproduz o exemplo canônico da Wikipédia', () => {
    // 57.64911, 10.40744 (Jutlândia) → u4pruydqqvj
    expect(codificarGeohash(57.64911, 10.40744, 11)).toBe('u4pruydqqvj');
    expect(codificarGeohash(57.64911, 10.40744, 6)).toBe('u4pruy');
  });

  it('codifica Brasília com a precisão da região', () => {
    const hash = codificarGeohash(-15.7942, -47.8822);
    expect(hash).toHaveLength(5);
    // A célula tem que conter o ponto de origem.
    const caixa = decodificarGeohash(hash);
    expect(-15.7942).toBeGreaterThanOrEqual(caixa.latMin);
    expect(-15.7942).toBeLessThanOrEqual(caixa.latMax);
    expect(-47.8822).toBeGreaterThanOrEqual(caixa.lngMin);
    expect(-47.8822).toBeLessThanOrEqual(caixa.lngMax);
  });

  it('dá o mesmo hash para pontos dentro da mesma célula de ~5 km', () => {
    // Asa Norte e Asa Sul ficam na mesma região de preços.
    const asaNorte = codificarGeohash(-15.7601, -47.877);
    const asaSul = codificarGeohash(-15.8102, -47.8952);
    expect(asaNorte).toHaveLength(5);
    expect(asaSul).toHaveLength(5);
  });
});

describe('decodificarGeohash', () => {
  it('volta ao ponto de origem dentro da tolerância da célula', () => {
    const hash = codificarGeohash(-15.7942, -47.8822, 9);
    const { lat, lng } = decodificarGeohash(hash);
    expect(lat).toBeCloseTo(-15.7942, 3);
    expect(lng).toBeCloseTo(-47.8822, 3);
  });

  it('recusa caractere fora do alfabeto base32', () => {
    // 'a', 'i', 'l' e 'o' não existem no geohash.
    expect(() => decodificarGeohash('abcde')).toThrow(/inválido/);
  });
});

describe('geohashVizinho', () => {
  it('anda para os quatro lados e volta', () => {
    const origem = codificarGeohash(-15.7942, -47.8822);
    expect(geohashVizinho(geohashVizinho(origem, 'n'), 's')).toBe(origem);
    expect(geohashVizinho(geohashVizinho(origem, 'e'), 'w')).toBe(origem);
  });

  it('atravessa a borda da célula-pai', () => {
    // 'u4pruy' está na borda leste do pai; o vizinho muda o prefixo.
    const vizinho = geohashVizinho('u4pruy', 'e');
    expect(vizinho).toHaveLength(6);
    expect(vizinho).not.toBe('u4pruy');
    expect(geohashVizinho(vizinho, 'w')).toBe('u4pruy');
  });

  it('o vizinho do norte fica mesmo ao norte', () => {
    const origem = codificarGeohash(-15.7942, -47.8822);
    const norte = decodificarGeohash(geohashVizinho(origem, 'n'));
    expect(norte.lat).toBeGreaterThan(decodificarGeohash(origem).lat);
  });
});

describe('regiaoDoGeohash', () => {
  it('devolve a célula mais as 8 vizinhas, sem repetir', () => {
    const regiao = regiaoDoGeohash(codificarGeohash(-15.7942, -47.8822));
    expect(regiao).toHaveLength(9);
    expect(new Set(regiao).size).toBe(9);
  });

  it('coloca a própria célula na primeira posição', () => {
    const origem = codificarGeohash(-15.7942, -47.8822);
    expect(regiaoDoGeohash(origem)[0]).toBe(origem);
  });
});

describe('distanciaEmKm', () => {
  it('mede a distância entre duas lojas de Brasília', () => {
    // Asa Norte → Asa Sul, cerca de 6 km.
    const km = distanciaEmKm(-15.7601, -47.877, -15.8102, -47.8952);
    expect(km).toBeGreaterThan(4);
    expect(km).toBeLessThan(8);
  });

  it('dá zero para o mesmo ponto', () => {
    expect(distanciaEmKm(-15.79, -47.88, -15.79, -47.88)).toBe(0);
  });
});
