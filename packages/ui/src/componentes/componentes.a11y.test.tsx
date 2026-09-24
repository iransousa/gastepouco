import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import type { ReactElement } from 'react';

import { BottomNav } from './BottomNav.js';
import { Button } from './Button.js';
import { Card } from './Card.js';
import { Chip } from './Chip.js';
import { Icon } from './Icon.js';
import { IconButton } from './IconButton.js';
import { LevelRing } from './LevelRing.js';
import { ListRow } from './ListRow.js';
import { PointsBadge } from './PointsBadge.js';
import { PriceDelta } from './PriceDelta.js';
import { ProgressBar } from './ProgressBar.js';
import { SegmentedControl } from './SegmentedControl.js';
import { SponsoredBanner } from './SponsoredBanner.js';
import { StatTile } from './StatTile.js';
import { Switch } from './Switch.js';
import { TextField } from './TextField.js';
import { Toast } from './Toast.js';

/**
 * Um caso de axe por componente é critério de aceite da Fase 1 e da definição
 * de pronto do CLAUDE.md. O resto dos testes cobre o que a acessibilidade
 * depende mas o axe não vê: se o estado sai em `aria-pressed`, se o rótulo
 * chega ao leitor, se o elemento é `button` mesmo.
 */
const CASOS: Array<[string, ReactElement]> = [
  ['Icon decorativo', <Icon key="i" name="home" />],
  ['Icon com rótulo', <Icon key="i2" name="bell" label="Notificações" />],
  ['Button', <Button key="b">Salvar alterações</Button>],
  ['Button com ícone', <Button key="b2" icon="scan" variant="lime">Ler nota fiscal</Button>],
  ['Button modo fácil', <Button key="b3" size="easy" icon="cart" fullWidth>Minha lista de compras</Button>],
  ['Button como link', <Button key="b4" href="/inicio">Voltar ao início</Button>],
  ['IconButton', <IconButton key="ib" icon="bell" label="Notificações, 3 novas" badge />],
  ['Chip', <Chip key="c" selected>Mercearia</Chip>],
  [
    'SegmentedControl',
    <SegmentedControl
      key="sc"
      label="Período"
      value="mes"
      options={[
        { value: 'mes', label: 'Mês' },
        { value: 'tri', label: '3 meses' },
        { value: 'ano', label: 'Ano' },
      ]}
    />,
  ],
  ['Switch', <Switch key="sw" label="Ler em voz alta" description="O app fala o resultado da nota." checked />],
  ['TextField', <TextField key="tf" label="CEP" hint="Só os 8 números." defaultValue="70750505" />],
  ['TextField com erro', <TextField key="tf2" label="CEP" error="Digite os 8 números do CEP." />],
  ['Card', <Card key="ca" tone="brand">Gasto do mês</Card>],
  ['ListRow estático', <ListRow key="lr" title="Supermercado Vila Nova" subtitle="24 de setembro" />],
  ['ListRow como link', <ListRow key="lr2" title="Dados pessoais" href="/perfil/dados" chevron icon="user" />],
  ['StatTile', <StatTile key="st" label="Média hoje" value="R$ 21,40" />],
  ['PriceDelta abaixo', <PriceDelta key="pd" percent={-11} />],
  ['PriceDelta acima compacto', <PriceDelta key="pd2" percent={8} compact />],
  ['ProgressBar', <ProgressBar key="pb" value={0.62} label="Gasto do mês contra o orçamento" />],
  ['PointsBadge', <PointsBadge key="pbg" points={60} />],
  ['LevelRing', <LevelRing key="lv" level={12} progress={0.92} />],
  [
    'SponsoredBanner',
    <SponsoredBanner
      key="sb"
      title="Café 500g por R$ 19,90"
      description="Válido até domingo."
      ctaLabel="Ver oferta"
      href="/ofertas"
    />,
  ],
  ['Toast', <Toast key="t">Alterações salvas.</Toast>],
  ['BottomNav', <BottomNav key="bn" active="inicio" />],
];

describe('acessibilidade dos componentes', () => {
  it.each(CASOS)('%s não tem violação de axe', async (_nome, elemento) => {
    const { container } = render(elemento);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Icon', () => {
  it('esconde o ícone decorativo do leitor de tela', () => {
    const { container } = render(<Icon name="home" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('anuncia o ícone que carrega informação', () => {
    render(<Icon name="bell" label="Notificações" />);
    expect(screen.getByRole('img', { name: 'Notificações' })).toBeInTheDocument();
  });
});

describe('Button', () => {
  it('é um button de verdade, não uma div clicável', () => {
    render(<Button>Salvar</Button>);
    expect(screen.getByRole('button', { name: 'Salvar' }).tagName).toBe('BUTTON');
  });

  it('vira link quando recebe href', () => {
    render(<Button href="/inicio">Início</Button>);
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/inicio');
  });

  it('não dispara quando desabilitado', async () => {
    const aoClicar = vi.fn();
    render(
      <Button disabled onClick={aoClicar}>
        Salvar
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(aoClicar).not.toHaveBeenCalled();
  });
});

describe('IconButton', () => {
  it('usa o label como nome acessível', () => {
    render(<IconButton icon="bell" label="Notificações, 3 novas" />);
    expect(screen.getByRole('button', { name: 'Notificações, 3 novas' })).toBeInTheDocument();
  });
});

describe('Chip', () => {
  it('expõe o estado em aria-pressed', async () => {
    render(<Chip selected>Mercearia</Chip>);
    expect(screen.getByRole('button', { name: 'Mercearia' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

describe('SegmentedControl', () => {
  it('marca só a opção escolhida e avisa a troca', async () => {
    const aoTrocar = vi.fn();
    render(
      <SegmentedControl
        label="Período"
        value="mes"
        onChange={aoTrocar}
        options={[
          { value: 'mes', label: 'Mês' },
          { value: 'ano', label: 'Ano' },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Mês' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Ano' })).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(screen.getByRole('button', { name: 'Ano' }));
    expect(aoTrocar).toHaveBeenCalledWith('ano');
  });
});

describe('Switch', () => {
  it('é um switch com estado, não um checkbox visual', async () => {
    const aoTrocar = vi.fn();
    render(<Switch label="Vibrar ao concluir" checked={false} onChange={aoTrocar} />);

    const chave = screen.getByRole('switch', { name: 'Vibrar ao concluir' });
    expect(chave).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(chave);
    expect(aoTrocar).toHaveBeenCalledWith(true);
  });
});

describe('TextField', () => {
  it('liga rótulo, dica e erro ao campo', () => {
    render(<TextField label="CEP" hint="Só os 8 números." error="Digite os 8 números do CEP." />);

    const campo = screen.getByLabelText('CEP');
    expect(campo).toHaveAttribute('aria-invalid', 'true');

    const descrito = campo.getAttribute('aria-describedby') ?? '';
    expect(descrito.split(' ')).toHaveLength(2);
    expect(screen.getByRole('alert')).toHaveTextContent('Digite os 8 números do CEP.');
  });

  it('marca o campo opcional no rótulo visível', () => {
    render(<TextField label="Celular" optional />);
    expect(screen.getByLabelText(/Celular.*opcional/)).toBeInTheDocument();
  });
});

describe('ListRow', () => {
  it('não vira elemento acionável quando só mostra informação', () => {
    render(<ListRow title="Supermercado Vila Nova" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('vira button quando tem ação', async () => {
    const aoClicar = vi.fn();
    render(<ListRow title="Sair da conta" onClick={aoClicar} />);
    await userEvent.click(screen.getByRole('button', { name: /Sair da conta/ }));
    expect(aoClicar).toHaveBeenCalledOnce();
  });
});

describe('PriceDelta', () => {
  it('diz a direção por palavra, não só por cor', () => {
    render(<PriceDelta percent={-11} />);
    expect(screen.getByText('11% abaixo da média')).toBeInTheDocument();
  });

  it('mantém a frase inteira para o leitor mesmo no modo compacto', () => {
    render(<PriceDelta percent={8} compact />);
    expect(screen.getByText('↑ 8%')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('8% acima da média')).toBeInTheDocument();
  });

  it('trata o empate sem seta', () => {
    render(<PriceDelta percent={0} />);
    expect(screen.getByText('na média')).toBeInTheDocument();
  });
});

describe('ProgressBar', () => {
  it('publica o valor para o leitor de tela', () => {
    render(<ProgressBar value={0.62} label="Gasto do mês" />);
    const barra = screen.getByRole('progressbar', { name: 'Gasto do mês' });
    expect(barra).toHaveAttribute('aria-valuenow', '62');
  });

  it('não deixa o valor sair de 0 a 100', () => {
    render(<ProgressBar value={2.5} label="Gasto do mês" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('PointsBadge', () => {
  it('escreve "pontos", nunca "XP"', () => {
    render(<PointsBadge points={60} />);
    expect(screen.getByText('+60 pontos')).toBeInTheDocument();
  });
});

describe('LevelRing', () => {
  it('descreve nível e progresso numa frase', () => {
    render(<LevelRing level={12} progress={0.92} />);
    expect(
      screen.getByRole('img', { name: 'Nível 12, 92% para o próximo nível' }),
    ).toBeInTheDocument();
  });
});

describe('SponsoredBanner', () => {
  it('sempre mostra o selo Patrocinado', () => {
    render(<SponsoredBanner title="Café 500g por R$ 19,90" />);
    expect(screen.getByText('Patrocinado')).toBeInTheDocument();
  });
});

describe('Toast', () => {
  it('anuncia sem roubar o foco', () => {
    render(<Toast>Alterações salvas.</Toast>);
    expect(screen.getByRole('status')).toHaveTextContent('Alterações salvas.');
  });
});

describe('BottomNav', () => {
  it('marca a página atual e mostra rótulo em todo ícone', () => {
    render(<BottomNav active="inicio" />);

    expect(screen.getByRole('link', { name: /Início/ })).toHaveAttribute('aria-current', 'page');
    for (const rotulo of ['Início', 'Gastos', 'Ofertas', 'Ranking', 'Ler nota']) {
      expect(screen.getByText(rotulo)).toBeInTheDocument();
    }
  });
});
