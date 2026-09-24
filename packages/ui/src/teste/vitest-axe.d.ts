/**
 * `toHaveNoViolations` vem de vitest-axe, que só declara o matcher no namespace
 * `Vi` (legado). O Vitest 2 lê a augmentação do módulo 'vitest'. Sem isto, todo
 * teste de acessibilidade quebra o typecheck — e a regra é que toda tela tenha
 * um (docs/08-ACESSIBILIDADE.md).
 */
import 'vitest';
import type { AxeMatchers } from 'vitest-axe/matchers';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
