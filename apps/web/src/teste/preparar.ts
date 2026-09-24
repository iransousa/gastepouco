import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

// `toHaveNoViolations` em todo teste: acessibilidade é critério de aceite de
// toda tela (CLAUDE.md, "Definição de pronto"), não uma verificação opcional.
expect.extend(matchers);
