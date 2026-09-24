import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Teste de fumaça da Fase 0: o app sobe, responde e não tem violação de axe.
 * Os fluxos de verdade (primeiro uso, ler nota, ver preço, encerrar conta)
 * entram a partir da Fase 2.
 */
test('o app abre e não tem violação de acessibilidade', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'GasteMenos' })).toBeVisible();

  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(resultado.violations).toEqual([]);
});
