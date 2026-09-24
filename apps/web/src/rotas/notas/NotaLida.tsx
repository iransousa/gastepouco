import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatarCentavos, mensagemDoErro } from '@gastemenos/shared';
import {
  Button,
  Card,
  ConfettiBurst,
  Icon,
  PointsBadge,
  PriceDelta,
  StatTile,
} from '@gastemenos/ui';
import { api } from '../../lib/api.js';

/**
 * `referencia/telas/NotaLida.dc.html`
 *
 * A leitura é assíncrona (a API consulta o portal da SEFAZ), então esta tela
 * começa esperando. Acompanha por SSE, com polling de reserva: SSE morre em
 * proxy corporativo e em algumas operadoras móveis, e ficar preso em
 * "Buscando…" para sempre seria pior do que gastar algumas requisições.
 */

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

interface NotaDaApi {
  id: string;
  status: string;
  failureReason: string | null;
  totalCents: number | null;
  savingsCents: number | null;
  pointsAwarded: number;
  storeName: string | null;
  items: ItemDaNota[];
}

export function NotaLida(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();

  const [nota, setNota] = useState<NotaDaApi | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let vivo = true;
    let fonte: EventSource | null = null;
    let pulso: ReturnType<typeof setInterval> | null = null;

    function receber(dados: NotaDaApi): void {
      if (!vivo) return;
      setNota(dados);

      if (dados.status === 'PENDING') return;

      fonte?.close();
      if (pulso) clearInterval(pulso);

      if (dados.status !== 'DONE') {
        setErro(mensagemDoErro(dados.failureReason ?? 'PARSE_FAILED'));
      }
    }

    // Caminho principal: SSE.
    try {
      fonte = new EventSource(`/v1/receipts/${id}/events`, { withCredentials: true });
      fonte.onmessage = (evento) => receber(JSON.parse(evento.data as string) as NotaDaApi);
      fonte.onerror = () => fonte?.close();
    } catch {
      // Sem EventSource, o polling abaixo resolve sozinho.
    }

    // Reserva: 1,5 s por até 30 s, como docs/02-ARQUITETURA.md.
    let ciclos = 0;
    pulso = setInterval(() => {
      ciclos += 1;
      if (ciclos > 20) {
        if (pulso) clearInterval(pulso);
        if (vivo && !nota) setErro(mensagemDoErro('PORTAL_UNAVAILABLE'));
        return;
      }
      void api
        .get<NotaDaApi>(`/receipts/${id}`)
        .then(receber)
        .catch(() => undefined);
    }, 1500);

    return () => {
      vivo = false;
      fonte?.close();
      if (pulso) clearInterval(pulso);
    };
    // `nota` de propósito fora: o efeito monta a escuta uma vez só.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!nota || nota.status === 'PENDING') {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col items-center justify-center gap-4 px-5">
        <Icon name="receipt" size={48} />
        <h1 tabIndex={-1} className="text-title-l text-ink outline-none">
          Buscando sua nota
        </h1>
        <p role="status" className="text-center text-body-m text-ink-muted">
          Estamos consultando a Secretaria da Fazenda. Leva alguns segundos.
        </p>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col justify-center gap-4 px-5">
        <h1 tabIndex={-1} className="text-title-l text-ink outline-none">
          Não conseguimos ler essa nota
        </h1>
        <p role="alert" className="text-body-l text-ink-muted">
          {erro}
        </p>
        <Button fullWidth onClick={() => navegar('/ler-nota')}>
          Tentar outra nota
        </Button>
        <Button variant="ghost" fullWidth onClick={() => navegar('/inicio')}>
          Ir para o início
        </Button>
      </main>
    );
  }

  const economia = nota.savingsCents ?? 0;
  const maisBaratos = nota.items.filter(
    (item) => item.regionAvgCents && item.unitPriceCents < item.regionAvgCents,
  );

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col px-5 pb-10 pt-8">
      <ConfettiBurst />

      {/* `role="status"` anuncia a conclusão sem roubar o foco. */}
      <p role="status" className="gm-sr">
        Nota registrada. Você ganhou {nota.pointsAwarded} pontos.
      </p>

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-soft text-success">
          <Icon name="check" size={36} strokeWidth={3} />
        </span>
        <h1 tabIndex={-1} className="text-title-xl text-ink outline-none">
          Nota registrada
        </h1>
        <p className="text-body-l text-ink-muted">{nota.storeName}</p>
        {nota.pointsAwarded > 0 ? <PointsBadge points={nota.pointsAwarded} size="l" /> : null}
      </div>

      <Card tone="brand" className="mt-8 items-center">
        <span className="text-overline">TOTAL DA COMPRA</span>
        <span className="text-money-xl">{formatarCentavos(nota.totalCents ?? 0)}</span>
      </Card>

      <div className="mt-4 flex gap-3">
        <StatTile label="Itens" value={String(nota.items.length)} />
        {economia > 0 ? (
          <StatTile label="Abaixo da média" value={formatarCentavos(economia)} tone="soft" />
        ) : null}
      </div>

      {maisBaratos.length > 0 ? (
        <section className="mt-8" aria-labelledby="comparados">
          <h2 id="comparados" className="text-title-s text-ink">
            Você pagou menos nestes
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {maisBaratos.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-l bg-surface-raised px-4 py-3"
              >
                <span className="flex-1 text-body-m text-ink">{item.name}</span>
                <PriceDelta
                  compact
                  percent={Math.round(
                    ((item.unitPriceCents - item.regionAvgCents!) / item.regionAvgCents!) * 100,
                  )}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-8 text-body-s text-ink-muted">
          Ainda juntando preços desta região para comparar. Cada nota lida ajuda.
        </p>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <Button fullWidth onClick={() => navegar(`/notas/${nota.id}`)}>
          Ver todos os itens
        </Button>
        <Button variant="ghost" fullWidth onClick={() => navegar('/inicio')}>
          Continuar
        </Button>
      </div>
    </main>
  );
}
