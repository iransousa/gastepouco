/**
 * Conserta as lojas que ficaram no centro de Brasília.
 *
 * Até 09/10/2026 toda loja criada recebia um `lat/lng` fixo — o centro de
 * Brasília — porque a geocodificação não existia. Como o geohash de 5
 * caracteres é a unidade de tudo que depende de região, isso colocou mercados
 * de qualquer estado no mesmo bloco de 5 km: a "média da sua região" de quem
 * mora em SP saía de compras do DF.
 *
 * Este script geocodifica de novo essas lojas e **preenche as observações de
 * preço que ficaram faltando**, usando o mesmo serviço e o mesmo job que rodam
 * em produção. Rodar duas vezes não duplica nada.
 *
 *   npx dotenv -e ../../.env -- npx tsx prisma/regeocodificar.mts --conferir
 *   npx dotenv -e ../../.env -- npx tsx prisma/regeocodificar.mts
 *
 * `--conferir` só mostra o que seria mexido. Sem ele, faz.
 *
 * Demora: o Nominatim aceita uma consulta por segundo, e o script respeita
 * isso. Cem lojas levam cerca de dois minutos.
 */
/* eslint-disable no-console -- script de linha de comando: a saída é a interface. */
import { PrismaClient } from '@prisma/client';
import { codificarGeohash } from '@gastemenos/shared';
import { GeocodificacaoService } from '../src/modules/notas/geocodificacao.service.js';

/** O ponto que estava chumbado no código. */
const BRASILIA = { lat: -15.7942, lng: -47.8822 };

const prisma = new PrismaClient();
const conferir = process.argv.includes('--conferir');

const suspeitas = await prisma.store.findMany({
  where: { lat: BRASILIA.lat, lng: BRASILIA.lng },
  select: { id: true, cnpj: true, name: true, address: true, city: true, uf: true },
  orderBy: { createdAt: 'asc' },
});

console.log(`${suspeitas.length} loja(s) no ponto fixo antigo.`);

if (suspeitas.length === 0) {
  await prisma.$disconnect();
  process.exit(0);
}

for (const loja of suspeitas) {
  console.log(`  ${loja.uf} · ${loja.city ?? 'sem cidade'} · ${loja.name}`);
}

if (conferir) {
  console.log('\n--conferir: nada foi alterado.');
  await prisma.$disconnect();
  process.exit(0);
}

const geo = new GeocodificacaoService();
let resolvidas = 0;

for (const loja of suspeitas) {
  const ponto = await geo.coordenadasDe(loja);

  if (!ponto) {
    // Sem região é melhor que região errada: o job noturno tenta de novo.
    await prisma.store.update({
      where: { id: loja.id },
      data: { lat: null, lng: null, geohash: null },
    });
    console.log(`  ${loja.name}: não resolveu, ficou sem região (o job tenta de novo)`);
    continue;
  }

  await prisma.store.update({
    where: { id: loja.id },
    data: { lat: ponto.lat, lng: ponto.lng, geohash: codificarGeohash(ponto.lat, ponto.lng) },
  });
  resolvidas += 1;
  console.log(`  ${loja.name}: ${ponto.lat.toFixed(4)}, ${ponto.lng.toFixed(4)}`);
}

console.log(
  `\n${resolvidas} de ${suspeitas.length} loja(s) com região nova.\n` +
    'As observações de preço das notas já lidas são preenchidas pela varredura ' +
    'noturna (stores:geocode-pending, 02h40), que também recredita os marcos de ' +
    'recompensa das pessoas afetadas.',
);

await prisma.$disconnect();
