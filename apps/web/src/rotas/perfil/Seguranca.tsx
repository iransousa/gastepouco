import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, IconButton, ListRow, TextField, Toast } from '@gastemenos/ui';
import { TelaDeAjuste } from './TelaDeAjuste.js';
import { Erro } from '../../componentes/Erro.js';
import { api } from '../../lib/api.js';

/** `referencia/telas/Seguranca.dc.html` e `AlterarSenha.dc.html` */

interface Aparelho {
  id: string;
  deviceLabel: string;
  city: string | null;
  lastSeenAt: string;
}

interface FormaDeEntrar {
  provider: 'PASSWORD' | 'GOOGLE' | 'APPLE';
  email: string | null;
}

const NOME_DA_FORMA: Record<FormaDeEntrar['provider'], string> = {
  PASSWORD: 'E-mail e senha',
  GOOGLE: 'Google',
  APPLE: 'Apple',
};

export function Seguranca(): React.ReactElement {
  const fila = useQueryClient();
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const aparelhos = useQuery({
    queryKey: ['aparelhos'],
    queryFn: () => api.get<Aparelho[]>('/me/sessions'),
  });
  const formas = useQuery({
    queryKey: ['formas-de-entrar'],
    queryFn: () => api.get<FormaDeEntrar[]>('/me/auth-accounts'),
  });

  const sairDeUm = useMutation({
    mutationFn: (id: string) => api.delete(`/me/sessions/${id}`),
    onSuccess: async () => {
      setAviso('Aparelho desconectado.');
      await fila.invalidateQueries({ queryKey: ['aparelhos'] });
    },
  });

  const sairDeTodos = useMutation({
    mutationFn: () => api.delete('/me/sessions'),
    onSuccess: async () => {
      setAviso('Saímos de todos os aparelhos. Você vai precisar entrar de novo.');
      await fila.invalidateQueries({ queryKey: ['aparelhos'] });
    },
  });

  const desconectar = useMutation({
    mutationFn: (provider: string) => api.delete(`/me/auth-accounts/${provider}`),
    onSuccess: async () => {
      setAviso('Forma de entrar removida.');
      await fila.invalidateQueries({ queryKey: ['formas-de-entrar'] });
    },
    onError: (falha) => setErro(falha instanceof Error ? falha.message : 'Não foi possível.'),
  });

  return (
    <TelaDeAjuste titulo="Login e segurança">
      <section aria-labelledby="formas">
        <h2 id="formas" className="mb-3 text-title-s text-ink">
          Como você entra
        </h2>
        <div className="overflow-hidden rounded-l">
          {(formas.data ?? []).map((forma) => (
            <ListRow
              key={forma.provider}
              icon={forma.provider === 'PASSWORD' ? 'lock' : 'user'}
              title={NOME_DA_FORMA[forma.provider]}
              subtitle={forma.email ?? undefined}
              trailing={
                <button
                  type="button"
                  onClick={() => desconectar.mutate(forma.provider)}
                  className="min-h-touch text-label text-danger"
                >
                  Remover
                </button>
              }
            />
          ))}
        </div>
        <p className="mt-2 text-caption text-ink-muted">
          Você precisa manter pelo menos uma forma de entrar.
        </p>
      </section>

      <Button variant="secondary" fullWidth icon="lock" href="/perfil/seguranca/senha">
        Alterar a senha
      </Button>

      <section aria-labelledby="aparelhos">
        <h2 id="aparelhos" className="mb-3 text-title-s text-ink">
          Aparelhos conectados
        </h2>

        {aparelhos.isPending ? (
          <p role="status" className="text-body-m text-ink-muted">
            Carregando…
          </p>
        ) : (
          <div className="overflow-hidden rounded-l">
            {(aparelhos.data ?? []).map((aparelho) => (
              <ListRow
                key={aparelho.id}
                icon="shield"
                title={aparelho.deviceLabel}
                subtitle={`Visto em ${new Date(aparelho.lastSeenAt).toLocaleDateString('pt-BR')}${
                  aparelho.city ? ` · ${aparelho.city}` : ''
                }`}
                trailing={
                  <IconButton
                    icon="close"
                    label={`Sair de ${aparelho.deviceLabel}`}
                    variant="ghost"
                    onClick={() => sairDeUm.mutate(aparelho.id)}
                  />
                }
              />
            ))}
          </div>
        )}

        <Button
          variant="ghost"
          fullWidth
          className="mt-3"
          onClick={() => sairDeTodos.mutate()}
          disabled={sairDeTodos.isPending}
        >
          Sair de todos os aparelhos
        </Button>
      </section>

      <Erro mensagem={erro} />
      {aviso ? <Toast>{aviso}</Toast> : null}
    </TelaDeAjuste>
  );
}

/** `referencia/telas/AlterarSenha.dc.html` */
export function AlterarSenha(): React.ReactElement {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [repetida, setRepetida] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const trocar = useMutation({
    mutationFn: () => api.post('/me/password', { current: atual, next: nova }),
    onSuccess: () => {
      setAviso('Senha alterada. Saímos dos outros aparelhos por segurança.');
      setAtual('');
      setNova('');
      setRepetida('');
    },
    onError: (falha) => setErro(falha instanceof Error ? falha.message : 'Não foi possível.'),
  });

  // As regras aparecem enquanto a pessoa digita, com o estado de cada uma —
  // dizer "senha inválida" só depois de enviar é o pior dos mundos.
  const regras = [
    { texto: 'Pelo menos 8 caracteres', ok: nova.length >= 8 },
    { texto: 'Uma letra maiúscula', ok: /[A-Z]/.test(nova) },
    { texto: 'Um número', ok: /\d/.test(nova) },
    { texto: 'As duas senhas iguais', ok: nova.length > 0 && nova === repetida },
  ];

  const podeSalvar = regras.every((regra) => regra.ok);

  return (
    <TelaDeAjuste titulo="Alterar senha" voltarPara="/perfil/seguranca">
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          setErro(null);
          trocar.mutate();
        }}
        className="flex flex-col gap-4"
        noValidate
      >
        <TextField
          label="Senha atual"
          type="password"
          autoComplete="current-password"
          hint="Deixe em branco se você entrou só com o Google e está criando a primeira senha."
          value={atual}
          onChange={(evento) => setAtual(evento.target.value)}
        />
        <TextField
          label="Nova senha"
          type="password"
          autoComplete="new-password"
          value={nova}
          onChange={(evento) => setNova(evento.target.value)}
        />
        <TextField
          label="Repita a nova senha"
          type="password"
          autoComplete="new-password"
          value={repetida}
          onChange={(evento) => setRepetida(evento.target.value)}
        />

        <Card tone="sunken">
          <ul className="flex flex-col gap-1">
            {regras.map((regra) => (
              <li key={regra.texto} className="flex items-center gap-2 text-body-s">
                {/* Palavra e símbolo, não só a cor. */}
                <span aria-hidden="true" className={regra.ok ? 'text-success' : 'text-ink-muted'}>
                  {regra.ok ? '✓' : '○'}
                </span>
                <span className={regra.ok ? 'text-ink' : 'text-ink-muted'}>
                  {regra.texto}
                  <span className="gm-sr">{regra.ok ? ' — atendido' : ' — falta'}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Erro mensagem={erro} />
        {aviso ? <Toast>{aviso}</Toast> : null}

        <Button type="submit" fullWidth disabled={!podeSalvar || trocar.isPending}>
          {trocar.isPending ? 'Salvando…' : 'Salvar nova senha'}
        </Button>
      </form>
    </TelaDeAjuste>
  );
}
