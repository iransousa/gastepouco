import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card, IconButton, TextField } from '@gastemenos/ui';
import { TelaDeAcesso } from '../../componentes/TelaDeAcesso.js';
import { Erro } from '../../componentes/Erro.js';
import { api } from '../../lib/api.js';

/**
 * `referencia/telas/RecuperarSenha.dc.html` — quatro estados numa rota só.
 *
 * O estado "link enviado" nunca diz se a conta existe. A API responde 204 dos
 * dois jeitos e a tela repete isso em português ("Se existir uma conta com
 * esse e-mail…"): dizer "não encontramos esse e-mail" transformaria a tela num
 * verificador de quem tem conta aqui (docs/09-SEGURANCA-LGPD.md).
 */

type Etapa = 'pedir' | 'enviado' | 'nova' | 'pronto';

export function RecuperarSenha(): React.ReactElement {
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const token = parametros.get('token');

  const [etapa, setEtapa] = useState<Etapa>(token ? 'nova' : 'pedir');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [repetida, setRepetida] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function pedirLink(evento: React.FormEvent): Promise<void> {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setEtapa('enviado');
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível enviar.');
    } finally {
      setEnviando(false);
    }
  }

  async function salvarSenha(evento: React.FormEvent): Promise<void> {
    evento.preventDefault();
    setErro(null);

    if (senha !== repetida) {
      setErro('As duas senhas precisam ser iguais.');
      return;
    }

    setEnviando(true);
    try {
      await api.post('/auth/reset-password', { token, password: senha });
      setEtapa('pronto');
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar.');
    } finally {
      setEnviando(false);
    }
  }

  if (etapa === 'enviado') {
    return (
      <TelaDeAcesso
        titulo="Confira seu e-mail"
        descricao="Se existir uma conta com esse e-mail, o link chega em alguns minutos. Ele vale por 1 hora."
        rodape={
          <>
            <Button fullWidth onClick={() => navegar('/entrar')}>
              Abri o link
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setEtapa('pedir')}>
              Reenviar e-mail
            </Button>
          </>
        }
      />
    );
  }

  if (etapa === 'pronto') {
    return (
      <TelaDeAcesso
        titulo="Senha alterada"
        descricao="Por segurança, saímos da sua conta nos outros aparelhos."
        rodape={
          <Button fullWidth onClick={() => navegar('/entrar')}>
            Entrar
          </Button>
        }
      />
    );
  }

  if (etapa === 'nova') {
    return (
      <TelaDeAcesso
        titulo="Crie uma nova senha"
        descricao="Use pelo menos 8 caracteres, com um número e uma letra maiúscula."
      >
        <form onSubmit={salvarSenha} className="mt-8 flex flex-col gap-4" noValidate>
          <TextField
            label="Nova senha"
            type={mostrarSenha ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            trailing={
              <IconButton
                icon={mostrarSenha ? 'eyeOff' : 'eye'}
                label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
                onClick={() => setMostrarSenha((atual) => !atual)}
              />
            }
          />
          <TextField
            label="Repita a nova senha"
            type={mostrarSenha ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={repetida}
            onChange={(evento) => setRepetida(evento.target.value)}
          />

          <Erro mensagem={erro} />

          <Button type="submit" fullWidth disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar nova senha'}
          </Button>
        </form>
      </TelaDeAcesso>
    );
  }

  return (
    <TelaDeAcesso
      titulo="Esqueceu a senha?"
      descricao="Acontece. Informe seu e-mail e enviamos um link para criar uma nova."
    >
      <form onSubmit={pedirLink} className="mt-8 flex flex-col gap-4" noValidate>
        <TextField
          label="E-mail da conta"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
        />

        <Card tone="sunken">
          <p className="text-body-s text-ink-muted">
            Entrou com Google? Use o botão Google na tela de login. Não há senha para recuperar.
          </p>
        </Card>

        <Erro mensagem={erro} />

        <Button type="submit" fullWidth disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar link'}
        </Button>

        <Link to="/entrar" className="mt-2 text-center text-body-s text-brand underline">
          Voltar para entrar
        </Link>
      </form>
    </TelaDeAcesso>
  );
}
