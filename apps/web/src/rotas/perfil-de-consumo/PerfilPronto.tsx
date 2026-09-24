import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatarCentavos } from '@gastemenos/shared';
import { Button, Card, Chip, PointsBadge } from '@gastemenos/ui';
import { TelaDeAcesso } from '../../componentes/TelaDeAcesso.js';
import { Erro } from '../../componentes/Erro.js';
import { api } from '../../lib/api.js';
import { rotuloDaOpcao } from './perguntas.js';

/** `referencia/telas/PerfilPronto.dc.html` */

interface PerfilSalvo {
  householdSize: string;
  storeTypes: string[];
  frequency: string;
  monthlySpendBand: string;
  priorities: string[];
  persona: string;
  budgetCents: number;
}

export function PerfilPronto(): React.ReactElement {
  const navegar = useNavigate();

  const { data, isPending, error } = useQuery({
    queryKey: ['perfil-de-consumo'],
    queryFn: () => api.get<PerfilSalvo | null>('/me/profile'),
  });

  if (isPending) {
    return (
      <TelaDeAcesso titulo="Montando seu perfil…">
        <p role="status" className="mt-4 text-body-m text-ink-muted">
          Um instante.
        </p>
      </TelaDeAcesso>
    );
  }

  if (error || !data) {
    return (
      <TelaDeAcesso
        titulo="Não conseguimos carregar seu perfil"
        rodape={
          <Button fullWidth onClick={() => navegar('/perfil-de-consumo')}>
            Responder de novo
          </Button>
        }
      >
        <Erro mensagem={error instanceof Error ? error.message : 'Tente de novo.'} />
      </TelaDeAcesso>
    );
  }

  const respostas = [
    rotuloDaOpcao('householdSize', data.householdSize),
    rotuloDaOpcao('frequency', data.frequency),
    ...data.storeTypes.map((id) => rotuloDaOpcao('storeTypes', id)),
    ...data.priorities.map((id) => rotuloDaOpcao('priorities', id)),
  ];

  return (
    <TelaDeAcesso
      acimaDoTitulo={
        <div className="mb-6">
          <PointsBadge points={100} size="l" />
        </div>
      }
      titulo={data.persona}
      rodape={
        <>
          <Button fullWidth icon="scan" onClick={() => navegar('/ler-nota')}>
            Ler minha primeira nota
          </Button>
          <p className="text-center text-caption text-ink-muted">
            Vale <PointsBadge points={60} /> na primeira leitura.
          </p>
          <Button variant="ghost" fullWidth onClick={() => navegar('/inicio')}>
            Ir para o início
          </Button>
        </>
      }
    >
      <p className="mt-1 text-overline text-ink-muted">SEU PERFIL</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {respostas.map((rotulo) => (
          <Chip key={rotulo} aria-disabled="true">
            {rotulo}
          </Chip>
        ))}
      </div>

      <Button
        variant="ghost"
        size="m"
        className="mt-3 self-start"
        onClick={() => navegar('/perfil-de-consumo?p=1')}
      >
        Editar respostas
      </Button>

      <Card tone="brand" className="mt-8">
        <span className="text-overline">ORÇAMENTO SUGERIDO PARA O MÊS</span>
        <span className="text-money-xl">{formatarCentavos(data.budgetCents)}</span>
        <p className="text-body-s opacity-80">
          Baseado em casas parecidas com a sua que gastam na mesma faixa. Você pode ajustar depois.
        </p>
      </Card>
    </TelaDeAcesso>
  );
}
