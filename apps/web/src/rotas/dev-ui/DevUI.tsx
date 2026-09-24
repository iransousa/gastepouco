import { useState } from 'react';
import {
  BottomNav,
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  LevelRing,
  ListRow,
  NOMES_DE_ICONE,
  PointsBadge,
  PriceDelta,
  ProgressBar,
  SegmentedControl,
  SponsoredBanner,
  StatTile,
  Switch,
  TextField,
  Toast,
  useAparencia,
  type TamanhoDeTexto,
  type Tema,
} from '@gastemenos/ui';

/**
 * Página de conferência do design system.
 *
 * Existe para comparar o que o código produz com as prévias aprovadas, nos 3
 * temas e nos 3 tamanhos de texto. Quem muda um componente abre esta página
 * antes de abrir um PR.
 *
 * Só em desenvolvimento: a rota não entra no build de produção (ver rotas.tsx).
 */

const TEMAS: Array<{ value: Tema; label: string }> = [
  { value: 'sistema', label: 'Sistema' },
  { value: 'claro', label: 'Claro' },
  { value: 'escuro', label: 'Escuro' },
  { value: 'contraste', label: 'Contraste' },
];

const TAMANHOS: Array<{ value: TamanhoDeTexto; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'grande', label: 'Grande' },
  { value: 'muito-grande', label: 'Muito grande' },
];

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <h2 className="text-title-s" style={{ margin: 0, color: 'var(--ink)' }}>
        {titulo}
      </h2>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          alignItems: 'center',
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function DevUI(): React.ReactElement {
  const aparencia = useAparencia();

  const [periodo, setPeriodo] = useState('mes');
  const [categoria, setCategoria] = useState('mercearia');
  const [voz, setVoz] = useState(true);
  const [vibrar, setVibrar] = useState(false);
  const [cep, setCep] = useState('70750-505');

  return (
    <main
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: 'var(--space-5)',
        paddingBottom: 140,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-8)',
      }}
    >
      <header style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h1 className="text-title-l" style={{ margin: 0, color: 'var(--ink)' }} tabIndex={-1}>
          Design system
        </h1>
        <p className="text-body-s" style={{ margin: 0, color: 'var(--ink-muted)' }}>
          Trocar tema ou tamanho muda a página inteira sem recarregar.
        </p>

        <SegmentedControl
          label="Tema"
          value={aparencia.tema}
          options={TEMAS}
          onChange={(valor) => aparencia.definir({ tema: valor as Tema })}
        />
        <SegmentedControl
          label="Tamanho do texto"
          value={aparencia.tamanhoDeTexto}
          options={TAMANHOS}
          onChange={(valor) => aparencia.definir({ tamanhoDeTexto: valor as TamanhoDeTexto })}
        />
        <Switch
          label="Reduzir movimento"
          description="Sem confete, sem pulsar, transições instantâneas."
          checked={aparencia.reduzirMovimento}
          onChange={(proximo) => aparencia.definir({ reduzirMovimento: proximo })}
        />
      </header>

      <Secao titulo="Tipografia">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
          <span className="text-money-xl" style={{ color: 'var(--ink)' }}>
            R$ 1.284,60
          </span>
          <span className="text-title-xl" style={{ color: 'var(--ink)' }}>
            Leia a nota, o app faz o resto
          </span>
          <span className="text-title-l" style={{ color: 'var(--ink)' }}>
            Seus gastos
          </span>
          <span className="text-title-m" style={{ color: 'var(--ink)' }}>
            Caçador de Ofertas
          </span>
          <span className="text-title-s" style={{ color: 'var(--ink)' }}>
            Últimas notas
          </span>
          <span className="text-body-l" style={{ color: 'var(--ink)' }}>
            Corpo grande, 16px
          </span>
          <span className="text-body-m" style={{ color: 'var(--ink)' }}>
            Corpo padrão, 15px
          </span>
          <span className="text-body-s" style={{ color: 'var(--ink-muted)' }}>
            Corpo pequeno, 14px
          </span>
          <span className="text-label" style={{ color: 'var(--ink)' }}>
            Rótulo de campo
          </span>
          <span className="text-caption" style={{ color: 'var(--ink-muted)' }}>
            Legenda
          </span>
          <span className="text-overline" style={{ color: 'var(--ink-muted)' }}>
            SOBRELINHA
          </span>
        </div>
      </Secao>

      <Secao titulo="Botões">
        <Button>Salvar alterações</Button>
        <Button variant="secondary">Cancelar</Button>
        <Button variant="ghost">Pular</Button>
        <Button variant="lime" icon="scan">
          Ler nota
        </Button>
        <Button variant="danger" icon="trash">
          Excluir
        </Button>
        <Button size="m">Tamanho médio</Button>
        <Button disabled>Desabilitado</Button>
        <Button fullWidth icon="check" iconEnd="next">
          Largura total
        </Button>
        <Button size="easy" icon="scan" fullWidth>
          Ler nota fiscal
        </Button>
        <Button size="easy" variant="secondary" icon="cart" fullWidth>
          Minha lista de compras
        </Button>
      </Secao>

      <Secao titulo="Botões de ícone">
        <IconButton icon="bell" label="Notificações, 3 novas" badge />
        <IconButton icon="back" label="Voltar" />
        <IconButton icon="share" label="Compartilhar" variant="solid" />
        <IconButton icon="help" label="Ajuda" variant="ghost" />
      </Secao>

      <Secao titulo="Chips e segmentos">
        <Chip selected={categoria === 'mercearia'} onClick={() => setCategoria('mercearia')}>
          Mercearia
        </Chip>
        <Chip selected={categoria === 'bebidas'} onClick={() => setCategoria('bebidas')}>
          Bebidas
        </Chip>
        <Chip icon="flash" selected={categoria === 'ofertas'} onClick={() => setCategoria('ofertas')}>
          Em oferta
        </Chip>
        <div style={{ width: '100%' }}>
          <SegmentedControl
            label="Período dos gastos"
            value={periodo}
            onChange={setPeriodo}
            options={[
              { value: 'mes', label: 'Mês' },
              { value: 'tri', label: '3 meses' },
              { value: 'ano', label: 'Ano' },
            ]}
          />
        </div>
      </Secao>

      <Secao titulo="Campos e interruptores">
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <TextField
            label="CEP"
            hint="Só os 8 números."
            value={cep}
            onChange={(evento) => setCep(evento.target.value)}
          />
          <TextField label="E-mail" error="Digite um e-mail válido." defaultValue="camila@" />
          <TextField label="Celular" optional placeholder="(61) 90000-0000" />
          <div style={{ borderRadius: 'var(--radius-l)', overflow: 'hidden' }}>
            <Switch
              label="Ler em voz alta"
              description="O app fala o resultado da nota."
              checked={voz}
              onChange={setVoz}
            />
            <Switch label="Vibrar ao concluir" checked={vibrar} onChange={setVibrar} />
          </div>
        </div>
      </Secao>

      <Secao titulo="Cartões">
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Card tone="brand">
            <span className="text-overline">SETEMBRO</span>
            <span className="text-money-xl">R$ 1.284,60</span>
            <ProgressBar
              value={0.8}
              label="Gasto do mês contra o orçamento"
              tone="lime"
              onDark
            />
          </Card>
          <Card>Cartão padrão</Card>
          <Card tone="soft">Cartão suave</Card>
          <Card tone="points">Cartão de pontos</Card>
          <Card tone="offer">Cartão de oferta</Card>
          <Card tone="sunken">Cartão rebaixado</Card>
        </div>
      </Secao>

      <Secao titulo="Linhas de lista">
        <div style={{ width: '100%', borderRadius: 'var(--radius-l)', overflow: 'hidden' }}>
          <ListRow
            icon="receipt"
            iconTone="brand"
            title="Supermercado Vila Nova"
            subtitle="24 de setembro · 12 itens"
            trailing={<span>R$ 187,40</span>}
            href="/notas/1"
          />
          <ListRow
            icon="user"
            title="Dados pessoais"
            subtitle="Nome, e-mail, CEP"
            chevron
            href="/perfil/dados"
          />
          <ListRow
            icon="star"
            iconTone="points"
            title="Conquistas"
            trailing={<PointsBadge points={60} />}
            onClick={() => undefined}
          />
          <ListRow icon="tag" iconTone="offer" title="Sem ação, só informação" />
        </div>
      </Secao>

      <Secao titulo="Números e progresso">
        <StatTile label="Média hoje" value="R$ 21,40" />
        <StatTile label="Você pagou" value="R$ 19,90" tone="soft" />
        <StatTile label="Pontos" value="5.960" tone="points" />
        <StatTile label="Economia" value="R$ 138,20" tone="offer" />
        <PriceDelta percent={-11} />
        <PriceDelta percent={8} />
        <PriceDelta percent={0} />
        <PriceDelta percent={-11} compact />
        <PointsBadge points={60} />
        <PointsBadge points={100} size="l" />
        <LevelRing level={12} progress={0.92} />
        <LevelRing level={3} progress={0.25} size={88} />
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <ProgressBar value={0.92} label="Pontos até o próximo nível" />
          <ProgressBar value={0.62} label="Gasto do mês" tone="brand" />
        </div>
      </Secao>

      <Secao titulo="Oferta e aviso">
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <SponsoredBanner
            title="Café 500g por R$ 19,90"
            description="No Atacarejo Planalto, até domingo."
            ctaLabel="Ver oferta"
            href="/ofertas"
          />
          <Toast>Alterações salvas.</Toast>
        </div>
      </Secao>

      <Secao titulo={`Ícones (${NOMES_DE_ICONE.length})`}>
        {NOMES_DE_ICONE.map((nome) => (
          <span
            key={nome}
            title={nome}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              width: 64,
              color: 'var(--ink)',
            }}
          >
            <Icon name={nome} />
            <span className="text-caption" style={{ color: 'var(--ink-muted)', fontSize: 11 }}>
              {nome}
            </span>
          </span>
        ))}
      </Secao>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        <BottomNav active="inicio" />
      </div>
    </main>
  );
}
