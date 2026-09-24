/**
 * Build duplo: CommonJS para a API (NestJS compila para CJS) e ESM para o web
 * (Vite/Rollup precisa enxergar os exports nomeados estaticamente).
 *
 * Cada pasta ganha um package.json com o seu "type". Sem isso o Node trataria
 * os .js de dist/esm como CommonJS, porque o pacote raiz não declara type.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

for (const [config, tipo] of [
  ['tsconfig.build.cjs.json', 'commonjs'],
  ['tsconfig.build.esm.json', 'module'],
]) {
  execFileSync('tsc', ['-p', config], { stdio: 'inherit', shell: true });
  const pasta = tipo === 'commonjs' ? 'dist/cjs' : 'dist/esm';
  mkdirSync(pasta, { recursive: true });
  writeFileSync(`${pasta}/package.json`, JSON.stringify({ type: tipo }, null, 2) + '\n');
}

console.log('shared: dist/cjs (API) e dist/esm (web) gerados');
