/**
 * Confere que o que o gerador produz é igual ao design system aprovado.
 *
 * Roda no CI. Se alguém editar tokens.css à mão, ou mudar tokens.json sem
 * regenerar, isto falha — que é o único jeito de "nenhuma cor fora dos tokens"
 * continuar verdadeiro depois da terceira semana de projeto.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const raizDoRepo = resolve(aqui, '../../..');
const pacote = resolve(aqui, '..');

const pares: Array<[string, string]> = [
  [resolve(pacote, 'tokens.css'), resolve(raizDoRepo, 'design-system/tokens.css')],
  [resolve(pacote, 'tailwind-preset.ts'), resolve(raizDoRepo, 'design-system/tailwind-preset.ts')],
];

let falhou = false;

for (const [gerado, referencia] of pares) {
  const a = readFileSync(gerado, 'utf8').replace(/\r\n/g, '\n');
  const b = readFileSync(referencia, 'utf8').replace(/\r\n/g, '\n');
  const nome = gerado.split(/[\\/]/).pop();

  if (a === b) {
    // eslint-disable-next-line no-console
    console.log(`  OK    ${nome} igual ao design system`);
    continue;
  }

  falhou = true;
  const linhasA = a.split('\n');
  const linhasB = b.split('\n');
  const total = Math.max(linhasA.length, linhasB.length);
  console.error(` FALHA ${nome} diverge de design-system/`);
  let mostradas = 0;
  for (let i = 0; i < total && mostradas < 5; i++) {
    if (linhasA[i] !== linhasB[i]) {
      console.error(`   linha ${i + 1}`);
      console.error(`     gerado:     ${linhasA[i] ?? '(fim do arquivo)'}`);
      console.error(`     referência: ${linhasB[i] ?? '(fim do arquivo)'}`);
      mostradas++;
    }
  }
}

if (falhou) {
  console.error('\nRode `pnpm tokens:build` e confira o que mudou.');
  process.exit(1);
}
