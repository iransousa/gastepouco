import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Aceite da Fase 1 (docs/11-ROADMAP-E-PROMPTS.md):
 * "/dev/ui igual às prévias; zero violações de axe; trocar tema e tamanho muda
 * tudo sem recarregar."
 *
 * Roda em navegador de verdade de propósito: é aqui que a regra de contraste do
 * axe funciona. Nos testes de unidade o jsdom não tem canvas e essa regra é
 * pulada em silêncio — quem confia só neles acha que está checando cor e não
 * está.
 */

const TEMAS = [
  { rotulo: 'Claro', atributo: 'light' },
  { rotulo: 'Escuro', atributo: 'dark' },
  { rotulo: 'Contraste', atributo: 'contraste' },
] as const;

const TAMANHOS = [
  { rotulo: 'Normal', atributo: null },
  { rotulo: 'Grande', atributo: 'grande' },
  { rotulo: 'Muito grande', atributo: 'muito-grande' },
] as const;

test.describe('design system em /dev/ui', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev/ui');
    await expect(page.getByRole('heading', { name: 'Design system', level: 1 })).toBeVisible();
  });

  for (const tema of TEMAS) {
    test(`tema ${tema.rotulo}: sem violação de acessibilidade`, async ({ page }) => {
      await page.getByRole('button', { name: tema.rotulo, exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', tema.atributo);

      const resultado = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(resultado.violations).toEqual([]);
    });
  }

  test('trocar tema muda a página sem recarregar', async ({ page }) => {
    // Marca o documento: se a página recarregar, a marca some e o teste falha.
    await page.evaluate(() => {
      (window as unknown as { __marca?: string }).__marca = 'nao-recarregou';
    });

    for (const tema of TEMAS) {
      await page.getByRole('button', { name: tema.rotulo, exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', tema.atributo);
    }

    // "Sistema" tira o atributo: sem data-theme, tokens.css segue o sistema.
    await page.getByRole('button', { name: 'Sistema', exact: true }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);

    const marca = await page.evaluate(
      () => (window as unknown as { __marca?: string }).__marca,
    );
    expect(marca).toBe('nao-recarregou');
  });

  test('trocar o tamanho do texto escala o app inteiro', async ({ page }) => {
    const tamanhoDaFonte = async (): Promise<number> =>
      page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize));

    const normal = await tamanhoDaFonte();

    for (const tamanho of TAMANHOS.slice(1)) {
      await page.getByRole('button', { name: tamanho.rotulo, exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('data-text-size', tamanho.atributo!);
    }

    // "Muito grande" é 137,5% do normal.
    const muitoGrande = await tamanhoDaFonte();
    expect(muitoGrande).toBeCloseTo(normal * 1.375, 1);

    await page.getByRole('button', { name: 'Normal', exact: true }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-text-size', /.*/);
  });

  test('a preferência sobrevive ao recarregar', async ({ page }) => {
    await page.getByRole('button', { name: 'Contraste', exact: true }).click();
    await page.getByRole('button', { name: 'Muito grande', exact: true }).click();

    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'contraste');
    await expect(page.locator('html')).toHaveAttribute('data-text-size', 'muito-grande');
  });

  test('nada corta em 320px com a letra Muito grande', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.getByRole('button', { name: 'Muito grande', exact: true }).click();

    // Rolagem horizontal é o sintoma de layout quebrado nessa combinação.
    const estouro = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(estouro).toBeLessThanOrEqual(0);
  });

  test('o selo Patrocinado aparece na oferta paga', async ({ page }) => {
    await expect(page.getByText('Patrocinado')).toBeVisible();
  });
});
