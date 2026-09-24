import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, IconButton, TextField } from '@gastemenos/ui';
import { TelaDeAcesso } from '../../componentes/TelaDeAcesso.js';
import { Erro } from '../../componentes/Erro.js';
import { ErroDaApi } from '../../lib/api.js';
import { useSessao } from '../../app/sessao.js';

/** `referencia/telas/Entrar.dc.html` */
export function Entrar(): React.ReactElement {
  const { entrar } = useSessao();
  const navegar = useNavigate();
  const local = useLocation();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent): Promise<void> {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      await entrar(email, senha);
      const de = (local.state as { de?: string } | null)?.de;
      navegar(de ?? '/inicio', { replace: true });
    } catch (falha) {
      if (falha instanceof ErroDaApi && falha.code === 'EMAIL_NOT_VERIFIED') {
        // Conta existe mas falta confirmar: levar direto para a tela do código
        // é melhor do que mostrar um erro e deixar a pessoa procurar o caminho.
        navegar('/confirmar-email', { state: { email } });
        return;
      }
      setErro(falha instanceof Error ? falha.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaDeAcesso
      titulo={
        <>
          Que bom te ver
          <br />
          de novo
        </>
      }
      descricao="Entre para continuar sua sequência de 5 semanas."
    >
      <form onSubmit={enviar} className="mt-8 flex flex-col gap-4" noValidate>
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
        />

        <TextField
          label="Senha"
          type={mostrarSenha ? 'text' : 'password'}
          autoComplete="current-password"
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

        <Link to="/recuperar-senha" className="self-start text-label text-brand underline">
          Esqueci minha senha
        </Link>

        <Erro mensagem={erro} />

        <Button type="submit" fullWidth disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-8 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-caption text-ink-muted">ou entre com</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Button variant="secondary" fullWidth href="/entrar/google">
          Google
        </Button>
      </div>

      <p className="mt-8 text-center text-body-s text-ink-muted">
        Ainda não tem conta?{' '}
        <Link to="/criar-conta" className="text-brand underline">
          Criar conta
        </Link>
      </p>
    </TelaDeAcesso>
  );
}
