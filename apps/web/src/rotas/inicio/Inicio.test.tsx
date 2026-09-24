import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppearanceProvider } from '@gastemenos/ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { Inicio } from './Inicio.js';

/**
 * A tela busca três coisas da API. Aqui interceptamos o `fetch` em vez de
 * montar um servidor: o que se quer provar é que a tela mostra o que a API
 * devolveu, não que a rede funciona — isso é trabalho do Playwright.
 */
const RESPOSTAS: Record<string, unknown> = {
  '/v1/me': {
    name: 'Camila Alves',
    level: 12,
    levelName: 'Caçador de Ofertas',
    points: 460,
    levelTarget: 500,
    progress: 92,
    streakWeeks: 5,
  },
  '/v1/spending/summary?period=month': {
    label: 'Total em setembro',
    totalCents: 128460,
    changePercent: -18,
    budgetCents: 160000,
    remainingCents: 31540,
  },
  '/v1/receipts?limit=2': [
    {
      id: 'n1',
      storeName: 'Supermercado Vila Nova',
      issuedAt: '2026-09-24T18:00:00.000Z',
      totalCents: 18740,
      itemCount: 12,
    },
  ],
};

function montar() {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <AppearanceProvider>
      <QueryClientProvider client={cliente}>
        <MemoryRouter>
          <Inicio />
        </MemoryRouter>
      </QueryClientProvider>
    </AppearanceProvider>,
  );
}

describe('Início', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        const corpo = RESPOSTAS[url.replace(/^https?:\/\/[^/]+/, '')];
        return Promise.resolve({
          ok: corpo !== undefined,
          status: corpo === undefined ? 404 : 200,
          json: () => Promise.resolve(corpo ?? { code: 'NOT_FOUND' }),
        } as Response);
      }),
    );
  });

  it('mostra o gasto do mês com os centavos menores', async () => {
    montar();
    // R$ 1.284,60 — o mesmo número da tela Gastos e do seed.
    await waitFor(() => expect(screen.getByText('1.284')).toBeInTheDocument());
    expect(screen.getByText(',60')).toBeInTheDocument();
  });

  it('diz quanto ainda cabe no orçamento, não só o quanto já foi', async () => {
    montar();
    await waitFor(() => expect(screen.getByText(/Ainda cabem/)).toBeInTheDocument());
    expect(screen.getByText(/315,40/)).toBeInTheDocument();
  });

  it('descreve o nível e a sequência em texto', async () => {
    montar();
    await waitFor(() =>
      expect(screen.getByText('Caçador de Ofertas')).toBeInTheDocument(),
    );
    expect(screen.getByText(/5 semanas seguidas/)).toBeInTheDocument();
    // O anel é decoração; a frase é o que o leitor de tela recebe.
    expect(
      screen.getByRole('img', { name: /Nível 12, 92% para o próximo nível/ }),
    ).toBeInTheDocument();
  });

  it('não tem violação de acessibilidade', async () => {
    const { container } = montar();
    await waitFor(() => expect(screen.getByText('1.284')).toBeInTheDocument());
    expect(await axe(container)).toHaveNoViolations();
  });
});
