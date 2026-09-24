import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button, Card, TextField, Toast } from '@gastemenos/ui';
import { TelaDeAjuste } from './TelaDeAjuste.js';
import { Erro } from '../../componentes/Erro.js';
import { api } from '../../lib/api.js';

/** `referencia/telas/DadosPessoais.dc.html` */

interface Eu {
  name: string;
  rankingName: string;
  email: string;
  phone: string | null;
  cep: string | null;
}

export function DadosPessoais(): React.ReactElement {
  const navegar = useNavigate();
  const fila = useQueryClient();

  const eu = useQuery({ queryKey: ['me'], queryFn: () => api.get<Eu>('/me') });

  const [campos, setCampos] = useState<Eu | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (eu.data && !campos) setCampos(eu.data);
  }, [campos, eu.data]);

  const salvar = useMutation({
    mutationFn: (dados: Partial<Eu>) => api.patch('/me', dados),
    onSuccess: async () => {
      setAviso('Informações salvas.');
      await fila.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (falha) => setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar.'),
  });

  const trocarEmail = useMutation({
    mutationFn: (novoEmail: string) => api.post('/me/email-change', { newEmail: novoEmail }),
    onSuccess: () => navegar('/confirmar-email', { state: { email: campos?.email, trocando: true } }),
    onError: (falha) => setErro(falha instanceof Error ? falha.message : 'Não foi possível trocar.'),
  });

  if (!campos) {
    return (
      <TelaDeAjuste titulo="Dados pessoais">
        <p role="status" className="text-body-m text-ink-muted">
          Carregando…
        </p>
      </TelaDeAjuste>
    );
  }

  const emailMudou = campos.email !== eu.data?.email;
  const outrosMudaram =
    campos.name !== eu.data?.name ||
    campos.rankingName !== eu.data?.rankingName ||
    campos.phone !== eu.data?.phone ||
    campos.cep !== eu.data?.cep;

  return (
    <TelaDeAjuste titulo="Dados pessoais">
      <TextField
        label="Nome"
        value={campos.name}
        onChange={(evento) => setCampos({ ...campos, name: evento.target.value })}
      />

      <TextField
        label="Nome no ranking"
        hint="É esse nome que outras pessoas veem na disputa."
        value={campos.rankingName}
        onChange={(evento) => setCampos({ ...campos, rankingName: evento.target.value })}
      />

      <TextField
        label="E-mail"
        type="email"
        inputMode="email"
        hint="Trocar o e-mail pede um código enviado para o endereço novo."
        value={campos.email}
        onChange={(evento) => setCampos({ ...campos, email: evento.target.value })}
      />

      <TextField
        label="Celular"
        optional
        inputMode="tel"
        hint="Usado só na verificação em duas etapas. Nunca aparece para outras pessoas."
        value={campos.phone ?? ''}
        onChange={(evento) => setCampos({ ...campos, phone: evento.target.value })}
      />

      <TextField
        label="CEP"
        inputMode="numeric"
        maxLength={9}
        hint="Define a sua região de preços. Só a região de ~5 km é usada, nunca o endereço."
        value={campos.cep ?? ''}
        onChange={(evento) => setCampos({ ...campos, cep: evento.target.value })}
      />

      <Erro mensagem={erro} />
      {aviso ? <Toast>{aviso}</Toast> : null}

      {/* Salvar só habilita com alteração: botão sempre aceso convida a tocar à toa. */}
      <Button
        fullWidth
        disabled={!outrosMudaram || salvar.isPending}
        onClick={() =>
          salvar.mutate({
            name: campos.name,
            rankingName: campos.rankingName,
            phone: campos.phone ?? '',
            cep: campos.cep ?? '',
          })
        }
      >
        {salvar.isPending ? 'Salvando…' : 'Salvar alterações'}
      </Button>

      {emailMudou ? (
        <Card tone="sunken" className="gap-3">
          <p className="text-body-s text-ink-muted">
            Para confirmar que o endereço novo é seu, enviamos um código de 6 números para ele.
          </p>
          <Button
            variant="secondary"
            fullWidth
            disabled={trocarEmail.isPending}
            onClick={() => trocarEmail.mutate(campos.email)}
          >
            {trocarEmail.isPending ? 'Enviando…' : 'Enviar código para o novo e-mail'}
          </Button>
        </Card>
      ) : null}
    </TelaDeAjuste>
  );
}
