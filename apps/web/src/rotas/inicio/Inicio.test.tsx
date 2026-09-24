import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { Inicio } from './Inicio.js';

describe('Inicio', () => {
  it('mostra o título da tela', () => {
    render(<Inicio />);
    expect(screen.getByRole('heading', { name: 'GasteMenos' })).toBeInTheDocument();
  });

  it('formata o total de setembro como na tela Gastos', () => {
    render(<Inicio />);
    expect(screen.getByText(/1\.284,60/)).toBeInTheDocument();
  });

  it('não tem violação de acessibilidade', async () => {
    const { container } = render(<Inicio />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
