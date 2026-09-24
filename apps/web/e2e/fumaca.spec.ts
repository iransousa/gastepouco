import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Teste de fumaça: o app sobe, a raiz leva ao primeiro uso e não há violação
 * de axe. Os fluxos completos ficam em primeiro-uso.spec.ts.
 */
test('a raiz leva às boas-vindas e não tem violação de acessibilidade', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/boas-vindas\/1$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Leia a nota');

  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(resultado.violations).toEqual([]);
});
