import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Icon, TextField } from '@gastemenos/ui';
import { TelaDeAjuste } from './TelaDeAjuste.js';
import { Erro } from '../../componentes/Erro.js';
import { api } from '../../lib/api.js';
import { useSessao } from '../../app/sessao.js';

/** `referencia/telas/PausarConta.dc.html` */

const PRAZOS = [
  { rotulo: '1 semana', dias: 7 },
  { rotulo: '1 mês', dias: 30 },
  { rotulo: '3 meses', dias: 90 },
  { rotulo: 'Sem data', dias: null },
] as const;

export function PausarConta(): React.ReactElement {
  const fila = useQueryClient();
  const [erro, setErro] = useState<string | null>(null);

  const eu = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ status: string; pausedUntil: string | null }>('/me'),
  });

  const pausar = useMutation({
    mutationFn: (dias: number | null) =>
      api.post('/me/pause', {
        until: dias === null ? undefined : new Date(Date.now() + dias * 86_400_000).toISOString(),
      }),
    onSuccess: () => fila.invalidateQueries({ queryKey: ['me'] }),
    onError: (falha) => setErro(falha instanceof Error ? falha.message : 'Não foi possível.'),
  });

  const reativar = useMutation({
    mutationFn: () => api.post('/me/resume'),
    onSuccess: () => fila.invalidateQueries({ queryKey: ['me'] }),
  });

  if (eu.data?.status === 'PAUSED') {
    return (
      <TelaDeAjuste titulo="Conta pausada">
        <Card tone="soft" className="items-center gap-3 py-8 text-center">
          <Icon name="pause" size={40} />
          <p className="text-title-s text-ink">Sua conta está pausada</p>
          <p className="text-body-m text-ink-muted">
            Você sumiu do ranking, as notificações pararam e sua sequência está congelada. Seus
            dados continuam todos aqui.
          </p>
          {eu.data.pausedUntil ? (
            <p className="text-body-s text-ink-muted">
              {`Reativa sozinha em ${new Date(eu.data.pausedUntil).toLocaleDateString('pt-BR')}.`}
            </p>
          ) : null}
        </Card>

        <Button fullWidth onClick={() => reativar.mutate()} disabled={reativar.isPending}>
          {reativar.isPending ? 'Reativando…' : 'Reativar minha conta'}
        </Button>
      </TelaDeAjuste>
    );
  }

  return (
    <TelaDeAjuste
      titulo="Pausar conta"
      descricao="Some do ranking e para de receber notificações, sem perder nada. Volta quando você quiser."
    >
      <Card tone="sunken" className="gap-2">
        <span className="text-label text-ink">O que a pausa faz</span>
        <ul className="flex flex-col gap-1 text-body-s text-ink-muted">
          <li>Você sai do ranking, de amigos e da região</li>
          <li>As notificações param</li>
          <li>Sua sequência de semanas congela, não zera</li>
          <li>Suas notas, listas, pontos e selos ficam intactos</li>
        </ul>
      </Card>

      <h2 className="text-title-s text-ink">Por quanto tempo?</h2>
      <div className="flex flex-col gap-3">
        {PRAZOS.map((prazo) => (
          <Button
            key={prazo.rotulo}
            variant="secondary"
            fullWidth
            disabled={pausar.isPending}
            onClick={() => pausar.mutate(prazo.dias)}
          >
            {prazo.rotulo}
          </Button>
        ))}
      </div>

      <Erro mensagem={erro} />
    </TelaDeAjuste>
  );
}

/** `referencia/telas/EncerrarConta.dc.html` */
export function EncerrarConta(): React.ReactElement {
  const navegar = useNavigate();
  const fila = useQueryClient();
  const { sair } = useSessao();

  const [confirmacao, setConfirmacao] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const eu = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ status: string; deletionAt: string | null }>('/me'),
  });

  const encerrar = useMutation({
    mutationFn: () =>
      api.post<{ deletionAt: string }>('/me/delete', {
        confirm: confirmacao,
        reason: motivo || undefined,
      }),
    onSuccess: () => fila.invalidateQueries({ queryKey: ['me'] }),
    onError: (falha) => setErro(falha instanceof Error ? falha.message : 'Não foi possível.'),
  });

  const cancelar = useMutation({
    mutationFn: () => api.post('/me/delete/cancel'),
    onSuccess: () => fila.invalidateQueries({ queryKey: ['me'] }),
  });

  // Pedido já feito: a tela vira o caminho de volta.
  if (eu.data?.status === 'PENDING_DELETION' && eu.data.deletionAt) {
    return (
      <TelaDeAjuste titulo="Pedido recebido">
        <Card tone="offer" className="gap-3">
          <p className="text-body-l text-ink">
            {`Sua conta será encerrada em ${new Date(eu.data.deletionAt).toLocaleDateString('pt-BR')}.`}
          </p>
          <p className="text-body-s text-ink">
            Até lá nada foi apagado. Se mudar de ideia, é só cancelar aqui ou simplesmente entrar
            no aplicativo de novo.
          </p>
        </Card>

        <Button fullWidth onClick={() => cancelar.mutate()} disabled={cancelar.isPending}>
          {cancelar.isPending ? 'Cancelando…' : 'Cancelar o encerramento'}
        </Button>

        <Button
          variant="ghost"
          fullWidth
          onClick={() => void sair().then(() => navegar('/entrar'))}
        >
          Sair do aplicativo
        </Button>
      </TelaDeAjuste>
    );
  }

  return (
    <TelaDeAjuste titulo="Encerrar conta">
      <Card tone="offer" className="gap-2">
        <span className="text-label text-ink">O que você perde</span>
        <ul className="flex flex-col gap-1 text-body-s text-ink">
          <li>O histórico de todas as suas compras</li>
          <li>Suas listas, seus pontos, seus selos e seu nível</li>
          <li>Sua posição no ranking com os amigos</li>
        </ul>
      </Card>

      {/* A alternativa vem antes do formulário: quem quer só sumir por um tempo
          não precisa apagar nada (docs/08-ACESSIBILIDADE.md). */}
      <Card tone="sunken" className="gap-3">
        <p className="text-body-m text-ink">
          Se você só quer um tempo longe, pausar some do ranking e para as notificações sem apagar
          nada.
        </p>
        <Button variant="secondary" fullWidth icon="pause" href="/perfil/pausar">
          Pausar em vez de encerrar
        </Button>
      </Card>

      <TextField
        label="Por que está saindo?"
        optional
        hint="Ajuda a gente a melhorar. Não é obrigatório."
        value={motivo}
        onChange={(evento) => setMotivo(evento.target.value)}
      />

      <TextField
        label="Digite ENCERRAR para confirmar"
        hint="Em letras maiúsculas. É assim que temos certeza de que não foi sem querer."
        value={confirmacao}
        onChange={(evento) => setConfirmacao(evento.target.value)}
        autoCapitalize="characters"
      />

      <Erro mensagem={erro} />

      <p className="text-body-s text-ink-muted">
        Seus dados ficam guardados por 30 dias. Nesse prazo, basta entrar no aplicativo para
        cancelar o encerramento.
      </p>

      <Button
        variant="danger"
        fullWidth
        disabled={confirmacao !== 'ENCERRAR' || encerrar.isPending}
        onClick={() => encerrar.mutate()}
      >
        {encerrar.isPending ? 'Enviando…' : 'Encerrar minha conta'}
      </Button>
    </TelaDeAjuste>
  );
}
