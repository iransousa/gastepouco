import '@testing-library/jest-dom/vitest';
import { expect, vi } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);

/**
 * O jsdom não tem canvas, e a regra de contraste do axe precisa dele para
 * medir cor. Sem este stub o console enche de "Not implemented" e some com o
 * resultado do teste.
 *
 * O que isso significa na prática: **contraste não é verificado aqui**. Ele é
 * verificado pelo Playwright, em navegador de verdade, nos três temas
 * (apps/web/playwright.config.ts). Os testes deste pacote cobrem estrutura,
 * papéis ARIA e rótulos — não cor.
 */
HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
