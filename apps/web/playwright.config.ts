import { defineConfig, devices } from '@playwright/test';

/**
 * Os fluxos principais rodam nas 3 combinações exigidas por
 * docs/08-ACESSIBILIDADE.md: (claro, Normal, 390px), (escuro, Grande, 390px) e
 * (contraste, Muito grande, 320px). A largura de 320 é a que quebra layout —
 * por isso ela está aqui desde o começo, e não no fim do projeto.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.APP_URL ?? 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    {
      name: 'claro-normal-390',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, colorScheme: 'light' },
    },
    {
      name: 'escuro-grande-390',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, colorScheme: 'dark' },
    },
    {
      name: 'contraste-muito-grande-320',
      use: { ...devices['Pixel 7'], viewport: { width: 320, height: 844 } },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
