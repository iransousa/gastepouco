import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Icon, LevelRing, PriceDelta, PointsBadge, StatTile } from '@gastemenos/ui';
import { TelaDeAcesso } from '../../componentes/TelaDeAcesso.js';

/**
 * As três telas de boas-vindas (`referencia/telas/Onboarding1-3.dc.html`).
 *
 * Uma rota só com o passo na URL: os três passos compartilham cabeçalho,
 * "Pular" e rodapé, e separá-los em três arquivos triplicaria isso sem ganho.
 *
 * "Pular" existe em todas: ninguém é obrigado a ler três telas para usar o app
 * (docs/08-ACESSIBILIDADE.md, "Nenhum gesto obrigatório").
 */

const TOTAL = 3;

function IlustracaoDaLeitura(): React.ReactElement {
  return (
    <Card tone="sunken" className="mt-8 items-center gap-4 py-8">
      <span className="flex h-24 w-24 items-center justify-center rounded-xl bg-brand text-lime">
        <Icon name="scan" size={56} strokeWidth={1.8} />
      </span>
      <span className="flex items-center gap-2">
        <PointsBadge points={60} />
        <span className="text-body-s text-ink-muted">23 itens lidos</span>
      </span>
    </Card>
  );
}

function IlustracaoDosPrecos(): React.ReactElement {
  return (
    <Card tone="sunken" className="mt-8 gap-3 py-6">
      <span className="text-title-s text-ink">Café 500g</span>
      <span className="text-caption text-ink-muted">6 meses</span>
      <div className="flex items-center gap-2">
        <StatTile label="Menor preço hoje" value="R$ 17,98" tone="soft" />
        <PriceDelta percent={-16} />
      </div>
    </Card>
  );
}

function IlustracaoDoRanking(): React.ReactElement {
  return (
    <Card tone="sunken" className="mt-8 items-center gap-4 py-8">
      <LevelRing level={3} progress={0.7} size={96} />
      <ol className="flex items-end gap-3" aria-label="Exemplo de pódio">
        {[2, 1, 3].map((posicao) => (
          <li
            key={posicao}
            className="flex flex-col items-center gap-1 text-caption text-ink-muted"
          >
            <span
              className={`w-10 rounded-s bg-brand-soft ${
                posicao === 1 ? 'h-14' : posicao === 2 ? 'h-10' : 'h-8'
              }`}
              aria-hidden="true"
            />
            {posicao}
          </li>
        ))}
      </ol>
    </Card>
  );
}

const PASSOS = [
  {
    titulo: 'Leia a nota, o app faz o resto',
    descricao:
      'Aponte a câmera para o QR code da nota fiscal. Itens, preços e mercado entram no seu histórico, sem digitar nada.',
    ilustracao: <IlustracaoDaLeitura />,
    observacao: null,
  },
  {
    titulo: 'Saiba onde está mais barato',
    descricao:
      'Cada nota lida pela comunidade atualiza os preços da sua região. Quanto mais gente usa, mais certeiro fica.',
    ilustracao: <IlustracaoDosPrecos />,
    observacao: 'Os preços são compartilhados de forma anônima.',
  },
  {
    titulo: 'Economize e suba no ranking',
    descricao:
      'Cada nota vale pontos. Suba de nível, ganhe selos e dispute com amigos quem mais economizou no mês.',
    ilustracao: <IlustracaoDoRanking />,
    observacao: null,
  },
] as const;

export function BoasVindas(): React.ReactElement {
  const { passo } = useParams<{ passo: string }>();
  const navegar = useNavigate();

  const indice = Math.min(Math.max(Number(passo) || 1, 1), TOTAL) - 1;
  const atual = PASSOS[indice]!;
  const ehUltimo = indice === TOTAL - 1;

  return (
    <TelaDeAcesso
      acimaDoTitulo={
        <div className="mb-8 flex items-center justify-between">
          <span className="text-overline text-ink-muted">{`${indice + 1} DE ${TOTAL}`}</span>
          <Button variant="ghost" size="m" onClick={() => navegar('/entrar')}>
            Pular
          </Button>
        </div>
      }
      titulo={atual.titulo}
      descricao={atual.descricao}
      rodape={
        ehUltimo ? (
          <>
            <Button fullWidth onClick={() => navegar('/criar-conta')}>
              Criar minha conta
            </Button>
            <Button variant="ghost" fullWidth onClick={() => navegar('/entrar')}>
              Já tenho conta
            </Button>
          </>
        ) : (
          <Button fullWidth onClick={() => navegar(`/boas-vindas/${indice + 2}`)}>
            Continuar
          </Button>
        )
      }
    >
      {atual.ilustracao}
      {atual.observacao ? (
        <p className="mt-4 text-caption text-ink-muted">{atual.observacao}</p>
      ) : null}

      <ol className="mt-auto flex justify-center gap-2 pt-8" aria-label="Progresso das boas-vindas">
        {PASSOS.map((_, i) => (
          <li
            key={i}
            aria-current={i === indice ? 'step' : undefined}
            className={`h-2 rounded-pill ${i === indice ? 'w-6 bg-brand' : 'w-2 bg-line'}`}
          >
            <span className="gm-sr">{`Passo ${i + 1} de ${TOTAL}`}</span>
          </li>
        ))}
      </ol>
    </TelaDeAcesso>
  );
}
