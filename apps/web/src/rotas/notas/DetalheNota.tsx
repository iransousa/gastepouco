import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { formatarCentavos, formatarChave, variacaoPercentual } from '@gastemenos/shared';
import { Button, Card, Chip, IconButton, PriceDelta } from '@gastemenos/ui';
import { Erro } from '../../componentes/Erro.js';
import { api } from '../../lib/api.js';

/** `referencia/telas/DetalheNota.dc.html` */

type Filtro = 'todos' | 'baratos' | 'caros';

interface ItemDaNota {
  id: string;
  productId: string | null;
  name: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
  totalCents: number;
  regionAvgCents: number | null;
}

interface NotaCompleta {
  id: string;
  status: string;
  issuedAt: string | null;
  totalCents: number | null;
  savingsCents: number | null;
  pointsAwarded: number;
  storeName: string | null;
  items: ItemDaNota[];
}

export function DetalheNota(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const fila = useQueryClient();

  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const nota = useQuery({
    queryKey: ['nota', id],
    queryFn: () => api.get<NotaCompleta>(`/receipts/${id}`),
    enabled: Boolean(id),
  });

  const excluir = useMutation({
    mutationFn: () => api.delete<void>(`/receipts/${id}`),
    onSuccess: async () => {
      // A exclusão mexe em gastos, pontos e lista de notas: invalidar tudo é
      // mais barato do que acertar cada chave e esquecer uma.
      await fila.invalidateQueries();
      navegar('/gastos', { replace: true });
    },
    onError: (falha) =>
      setErro(falha instanceof Error ? falha.message : 'Não foi possível excluir.'),
  });

  if (nota.isPending) {
    return (
      <main className="mx-auto max-w-[480px] px-5 py-8">
        <p role="status" className="text-body-m text-ink-muted">
          Carregando a nota…
        </p>
      </main>
    );
  }

  if (nota.error || !nota.data) {
    return (
      <main className="mx-auto flex max-w-[480px] flex-col gap-4 px-5 py-8">
        <h1 tabIndex={-1} className="text-title-l text-ink outline-none">
          Nota não encontrada
        </h1>
        <Button fullWidth href="/gastos">
          Ver meus gastos
        </Button>
      </main>
    );
  }

  const dados = nota.data;

  const comparados = dados.items.map((item) => ({
    ...item,
    diferenca: item.regionAvgCents
      ? variacaoPercentual(item.unitPriceCents, item.regionAvgCents)
      : null,
  }));

  const itens = comparados.filter((item) => {
    if (filtro === 'baratos') return item.diferenca !== null && item.diferenca < 0;
    if (filtro === 'caros') return item.diferenca !== null && item.diferenca > 0;
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-[480px] pb-10">
      <header className="flex items-center gap-3 px-5 pt-6">
        <IconButton icon="back" label="Voltar" onClick={() => navegar(-1)} />
        <h1 tabIndex={-1} className="flex-1 text-title-m text-ink outline-none">
          {dados.storeName ?? 'Nota fiscal'}
        </h1>
      </header>

      <main className="flex flex-col gap-5 px-5 pt-5">
        <Card tone="brand">
          <span className="text-overline">
            {dados.issuedAt
              ? new Date(dados.issuedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Data não informada'}
          </span>
          <span className="text-money-xl">{formatarCentavos(dados.totalCents ?? 0)}</span>
          <span className="text-body-s opacity-80">
            {`${dados.items.length} ${dados.items.length === 1 ? 'item' : 'itens'}`}
            {dados.pointsAwarded > 0 ? ` · ${dados.pointsAwarded} pontos` : ''}
          </span>
        </Card>

        <div className="flex gap-2" role="group" aria-label="Filtrar itens">
          <Chip selected={filtro === 'todos'} onClick={() => setFiltro('todos')}>
            Todos
          </Chip>
          <Chip selected={filtro === 'baratos'} onClick={() => setFiltro('baratos')}>
            Mais baratos
          </Chip>
          <Chip selected={filtro === 'caros'} onClick={() => setFiltro('caros')}>
            Mais caros
          </Chip>
        </div>

        <section aria-label="Itens da nota">
          {itens.length === 0 ? (
            <p className="text-body-m text-ink-muted">
              {filtro === 'todos'
                ? 'Esta nota não tem itens detalhados.'
                : 'Nenhum item nesse filtro. Ainda estamos juntando preços desta região.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {itens.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 rounded-l bg-surface-raised px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex-1 text-body-m text-ink">{item.name}</span>
                    <span className="tabular-nums text-body-m font-bold text-ink">
                      {formatarCentavos(item.totalCents)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-caption text-ink-muted">
                      {`${item.quantity} ${item.unit.toLowerCase()} · ${formatarCentavos(item.unitPriceCents)}`}
                    </span>
                    {item.diferenca !== null ? (
                      <PriceDelta percent={item.diferenca} compact />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <details className="rounded-l bg-surface-sunken px-4 py-3">
          <summary className="min-h-touch cursor-pointer text-label text-ink">
            Chave de acesso desta nota
          </summary>
          <p className="mt-2 break-all font-mono text-caption text-ink-muted">
            {formatarChave(dados.id)}
          </p>
        </details>

        <Erro mensagem={erro} />

        <Button variant="secondary" fullWidth icon="cart" href="/lista">
          Repetir itens na lista
        </Button>

        {/*
          Excluir pede confirmação escrita porque apaga dados e estorna pontos —
          ação destrutiva sempre confirma (docs/08-ACESSIBILIDADE.md).
        */}
        {confirmandoExclusao ? (
          <Card tone="offer" className="gap-3">
            <p className="text-body-m text-ink">
              Excluir apaga esta compra do seu histórico e devolve os{' '}
              {dados.pointsAwarded} pontos que ela valeu. Não dá para desfazer.
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                fullWidth
                disabled={excluir.isPending}
                onClick={() => excluir.mutate()}
              >
                {excluir.isPending ? 'Excluindo…' : 'Excluir a nota'}
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setConfirmandoExclusao(false)}>
                Manter
              </Button>
            </div>
          </Card>
        ) : (
          <Button variant="ghost" fullWidth icon="trash" onClick={() => setConfirmandoExclusao(true)}>
            Excluir esta nota
          </Button>
        )}
      </main>
    </div>
  );
}
